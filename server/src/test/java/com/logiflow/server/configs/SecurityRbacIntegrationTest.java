package com.logiflow.server.configs;

import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.utils.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc // Spring Security filter chain intentionally enabled
class SecurityRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Role ensureRole(String roleName) {
        return roleRepository.findByRoleName(roleName).orElseGet(() -> {
            Role role = new Role();
            role.setRoleName(roleName);
            role.setDescription(roleName);
            return roleRepository.save(role);
        });
    }

    private User createUser(String username, String roleName) {
        Role role = ensureRole(roleName);
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPasswordHash(passwordEncoder.encode("Pass123!"));
        user.setFullName(username);
        user.setRole(role);
        user.setIsActive(true);
        return userRepository.save(user);
    }

    @Test
    void publicLoginValidationAndAnonymousDenialWithSecurityFiltersEnabled() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.username").value("Username is required"));

        mockMvc.perform(get("/api/admin/dashboard")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/dispatch/drivers")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/driver/me/trips")).andExpect(status().isForbidden());
    }

    @Test
    void roleBasedAuthorizationEnforcedAcrossAdminDispatchDriverAndUserRoutes() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        User customer = createUser("rbac_cust_" + suffix, "CUSTOMER");
        User driverUser = createUser("rbac_drv_" + suffix, "DRIVER");
        Driver driver = new Driver();
        driver.setUser(driverUser);
        driver.setLicenseType("C");
        driver.setYearsExperience(3);
        driverRepository.save(driver);

        User dispatcher = createUser("rbac_disp_" + suffix, "DISPATCHER");
        User admin = createUser("rbac_adm_" + suffix, "ADMIN");

        String customerJwt = jwtUtils.generateToken(customer.getUsername(), "CUSTOMER");
        String driverJwt = jwtUtils.generateToken(driverUser.getUsername(), "DRIVER");
        String dispatcherJwt = jwtUtils.generateToken(dispatcher.getUsername(), "DISPATCHER");
        String adminJwt = jwtUtils.generateToken(admin.getUsername(), "ADMIN");

        // CUSTOMER forbidden from admin, dispatch, driver, and admin-only user profile lookup
        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/dispatch/drivers").header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/driver/me/trips").header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/user/profile/" + driverUser.getUserId()).header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isForbidden());

        // DRIVER allowed on /api/driver/me/**, forbidden from /api/admin/** and /api/dispatch/**
        mockMvc.perform(get("/api/driver/me/trips").header("Authorization", "Bearer " + driverJwt))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + driverJwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/dispatch/drivers").header("Authorization", "Bearer " + driverJwt))
                .andExpect(status().isForbidden());

        // DISPATCHER allowed on /api/dispatch/**, forbidden from /api/admin/** and /api/driver/**
        mockMvc.perform(get("/api/dispatch/drivers").header("Authorization", "Bearer " + dispatcherJwt))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + dispatcherJwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/driver/me/trips").header("Authorization", "Bearer " + dispatcherJwt))
                .andExpect(status().isForbidden());

        // ADMIN allowed on /api/admin/** and /api/user/profile/{id}
        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/user/profile/" + customer.getUserId()).header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }
}
