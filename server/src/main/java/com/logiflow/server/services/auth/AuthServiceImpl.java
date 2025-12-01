package com.logiflow.server.services.auth;

import com.logiflow.server.dtos.auth.AuthResponse;
import com.logiflow.server.dtos.auth.LoginRequest;
import com.logiflow.server.dtos.auth.RegisterRequest;
import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RegistrationRequestRepository registrationRequestRepository;

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        // First check if there's a registration request for this username
        var registrationRequest = registrationRequestRepository.findByUsername(loginRequest.getUsername());
        
        if (registrationRequest.isPresent()) {
            RegistrationRequest request = registrationRequest.get();
            
            // Check if rejected
            if (request.getStatus() == RegistrationRequest.RequestStatus.REJECTED) {
                // Verify password matches before showing rejection message
                if (passwordEncoder.matches(loginRequest.getPassword(), request.getPasswordHash())) {
                    throw new RuntimeException("Your registration request has been rejected by the administrator. Please contact support for more information.");
                } else {
                    throw new RuntimeException("Invalid credentials");
                }
            }
            
            // Check if still pending
            if (request.getStatus() == RegistrationRequest.RequestStatus.PENDING) {
                // Verify password matches before showing pending message
                if (passwordEncoder.matches(loginRequest.getPassword(), request.getPasswordHash())) {
                    throw new RuntimeException("Your registration is still pending approval. Please wait for admin review.");
                } else {
                    throw new RuntimeException("Invalid credentials");
                }
            }
        }

        // If no registration request or it's approved, proceed with normal authentication
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole() != null ? user.getRole().getRoleName() : "");

        return new AuthResponse(token, user.getUsername(), user.getRole().getRoleName(), user.getProfilePictureUrl(), "Login successful");
    }

    @Override
    public AuthResponse register(RegisterRequest registerRequest) {
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Determine role - if roleId is provided, use it; otherwise default to CUSTOMER
        Integer roleId = registerRequest.getRoleId() != null ? registerRequest.getRoleId() : 5; // 5 = CUSTOMER
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Roles that require admin approval: DISPATCHER (3), DRIVER (4), MANAGER (2)
        List<Integer> rolesRequiringApproval = Arrays.asList(2, 3, 4);
        
        if (rolesRequiringApproval.contains(roleId)) {
            // Create registration request instead of direct user
            RegistrationRequest request = new RegistrationRequest();
            request.setUsername(registerRequest.getUsername());
            request.setEmail(registerRequest.getEmail());
            request.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            request.setPhone(registerRequest.getPhone());
            request.setFullName(registerRequest.getFullName());
            request.setRole(role);
            request.setStatus(RegistrationRequest.RequestStatus.PENDING);
            request.setCreatedAt(LocalDateTime.now());
            
            registrationRequestRepository.save(request);
            
            return new AuthResponse(null, null, null, null, 
                "Registration request submitted successfully. Please wait for admin approval.");
        } else {
            // For CUSTOMER and ADMIN roles, create user directly
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setEmail(registerRequest.getEmail());
            user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            user.setPhone(registerRequest.getPhone());
            user.setFullName(registerRequest.getFullName());
            user.setRole(role);
            user.setIsActive(true);
            user.setCreatedAt(LocalDateTime.now());

            userRepository.save(user);

            String token = jwtUtils.generateToken(user.getUsername(), user.getRole().getRoleName());

            return new AuthResponse(token, user.getUsername(), user.getRole().getRoleName(), 
                user.getProfilePictureUrl(), "Registration successful");
        }
    }
}
