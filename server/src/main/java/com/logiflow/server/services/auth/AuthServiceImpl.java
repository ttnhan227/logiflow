package com.logiflow.server.services.auth;

import com.logiflow.server.constants.AuditActions;
import com.logiflow.server.dtos.auth.AuthResponse;
import com.logiflow.server.dtos.auth.LoginRequest;
import com.logiflow.server.dtos.auth.RegisterRequest;
import com.logiflow.server.models.Customer;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.customer.CustomerRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.admin.AuditLogService;
import com.logiflow.server.utils.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_PUBLIC_REGISTRATION_ROLE = "CUSTOMER";

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            JwtUtils jwtUtils,
            UserRepository userRepository,
            CustomerRepository customerRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        // Proceed with normal authentication
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsernameWithRole(loginRequest.getUsername()).orElseThrow();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Audit log the login
        auditLogService.log(
            AuditActions.LOGIN,
            user.getUsername(),
            user.getRole() != null ? user.getRole().getRoleName() : "",
            "User logged in from IP (not captured)"
        );

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole() != null ? user.getRole().getRoleName() : "");

        return new AuthResponse(token, user.getUsername(), user.getRole().getRoleName(), user.getProfilePictureUrl(), "Login successful");
    }

    @Override
    public AuthResponse register(RegisterRequest registerRequest) {
        if (registerRequest.getRoleId() != null
                || hasText(registerRequest.getRoleName())
                || hasText(registerRequest.getRole())) {
            throw new IllegalArgumentException("Role assignment is not allowed during public registration");
        }

        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByRoleName(DEFAULT_PUBLIC_REGISTRATION_ROLE)
                .orElseThrow(() -> new IllegalStateException("Default CUSTOMER role is not configured"));

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

        Customer customer = new Customer();
        customer.setUser(user);
        customer.setDefaultDeliveryAddress(""); // Start empty, can be set later
        customerRepository.save(customer);

        String token = jwtUtils.generateToken(user.getUsername(), role.getRoleName());

        return new AuthResponse(token, user.getUsername(), role.getRoleName(),
                user.getProfilePictureUrl(), "Registration successful");
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    @Override
    public void logout(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            // Audit log the logout
            auditLogService.log(
                AuditActions.LOGOUT,
                username,
                user.getRole() != null ? user.getRole().getRoleName() : "",
                "User logged out"
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse getCurrentUser(String username) {
        User user = userRepository.findByUsernameWithRole(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        return new AuthResponse(null, user.getUsername(), roleName, user.getProfilePictureUrl(), null);
    }
}
