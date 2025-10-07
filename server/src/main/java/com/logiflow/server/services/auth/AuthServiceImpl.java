package com.logiflow.server.services.auth;

import com.logiflow.server.dtos.auth.AuthResponse;
import com.logiflow.server.dtos.auth.LoginRequest;
import com.logiflow.server.dtos.auth.RegisterRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
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

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole() != null ? user.getRole().getRoleName() : "");

        return new AuthResponse(token, user.getUsername(), user.getRole().getRoleName(), "Login successful");
    }

    @Override
    public AuthResponse register(RegisterRequest registerRequest) {
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());

        // Default role, perhaps USER
        Role userRole = roleRepository.findByRoleName("USER").orElseThrow(() -> new RuntimeException("Default role USER not found"));
        user.setRole(userRole);

        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole().getRoleName());

        return new AuthResponse(token, user.getUsername(), user.getRole().getRoleName(), "Registration successful");
    }
}
