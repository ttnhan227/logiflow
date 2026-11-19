package com.logiflow.server.controllers.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.customer.CustomerRepository;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.utils.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc // Keep Spring Security filter chain enabled
class AuthRegistrationSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RegistrationRequestRepository registrationRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private Role adminRole;
    private Role dispatcherRole;
    private Role driverRole;
    private Role customerRole;

    @BeforeEach
    void ensureSeededRoles() {
        adminRole = ensureRole("ADMIN", "System administrator with full access");
        dispatcherRole = ensureRole("DISPATCHER", "Manages trip assignments and routing");
        driverRole = ensureRole("DRIVER", "Vehicle driver");
        customerRole = ensureRole("CUSTOMER", "Customer who places delivery orders");
    }

    private Role ensureRole(String name, String description) {
        return roleRepository.findByRoleName(name).orElseGet(() -> {
            Role role = new Role();
            role.setRoleName(name);
            role.setDescription(description);
            return roleRepository.save(role);
        });
    }

    private String uniqueSuffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void anonymousUserCannotRegisterAsAdminByRoleId() throws Exception {
        String suffix = uniqueSuffix();
        String username = "sec_admin_" + suffix;
        String email = username + "@example.com";

        String payload = objectMapper.writeValueAsString(Map.of(
                "username", username,
                "email", email,
                "password", "Password123!",
                "fullName", "Attempted Admin",
                "roleId", adminRole.getRoleId()
        ));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.role").doesNotExist())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.path("token").isNull()).isTrue();
        assertThat(userRepository.findByUsername(username)).isEmpty();
        assertThat(userRepository.findByEmail(email)).isEmpty();
        assertThat(registrationRequestRepository.findByEmail(email)).isEmpty();
    }

    @Test
    void anonymousUserCannotRegisterAsDispatcherByRoleId() throws Exception {
        String suffix = uniqueSuffix();
        String username = "sec_disp_" + suffix;
        String email = username + "@example.com";

        String payload = objectMapper.writeValueAsString(Map.of(
                "username", username,
                "email", email,
                "password", "Password123!",
                "fullName", "Attempted Dispatcher",
                "roleId", dispatcherRole.getRoleId()
        ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.role").doesNotExist());

        assertThat(userRepository.findByUsername(username)).isEmpty();
        assertThat(userRepository.findByEmail(email)).isEmpty();
        assertThat(registrationRequestRepository.findByEmail(email)).isEmpty();
    }

    @Test
    void supplyingClientRoleNameOrDriverRoleIdIsRejectedWithoutCreatingPrivilegedAccountOrJwt() throws Exception {
        String suffix = uniqueSuffix();
        String driverUsername = "sec_drv_" + suffix;
        String roleNameUsername = "sec_rname_" + suffix;

        String driverRoleIdPayload = objectMapper.writeValueAsString(Map.of(
                "username", driverUsername,
                "email", driverUsername + "@example.com",
                "password", "Password123!",
                "roleId", driverRole.getRoleId()
        ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(driverRoleIdPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.token").doesNotExist());

        assertThat(userRepository.findByUsername(driverUsername)).isEmpty();
        assertThat(registrationRequestRepository.findByEmail(driverUsername + "@example.com")).isEmpty();

        String roleNamePayload = objectMapper.writeValueAsString(Map.of(
                "username", roleNameUsername,
                "email", roleNameUsername + "@example.com",
                "password", "Password123!",
                "roleName", "ADMIN"
        ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(roleNamePayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.token").doesNotExist());

        assertThat(userRepository.findByUsername(roleNameUsername)).isEmpty();

        String roleFieldUsername = "sec_role_" + suffix;
        String roleFieldPayload = objectMapper.writeValueAsString(Map.of(
                "username", roleFieldUsername,
                "email", roleFieldUsername + "@example.com",
                "password", "Password123!",
                "role", "DISPATCHER"
        ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(roleFieldPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.token").doesNotExist());

        assertThat(userRepository.findByUsername(roleFieldUsername)).isEmpty();
    }

    @Test
    void normalRegistrationAssignsCustomerRoleOnlyAndCannotAccessPrivilegedEndpoints() throws Exception {
        String suffix = uniqueSuffix();
        String username = "cust_" + suffix;
        String email = username + "@example.com";

        String payload = objectMapper.writeValueAsString(Map.of(
                "username", username,
                "email", email,
                "password", "Password123!",
                "fullName", "Normal Customer",
                "phone", "0901234567"
        ));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = body.get("token").asText();
        assertThat(jwtUtils.extractUsername(token)).isEqualTo(username);
        assertThat(jwtUtils.extractRole(token)).isEqualTo("CUSTOMER");

        User savedUser = userRepository.findByUsernameWithRole(username).orElseThrow();
        assertThat(savedUser.getRole().getRoleId()).isEqualTo(customerRole.getRoleId());
        assertThat(savedUser.getIsActive()).isTrue();
        assertThat(customerRepository.existsByUser_UserId(savedUser.getUserId())).isTrue();

        // Real Spring Security filter check: CUSTOMER token must be denied admin/dispatch routes
        mockMvc.perform(get("/api/admin/user-management")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/dispatch/trips")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Login with the newly registered account continues to work
        String loginPayload = objectMapper.writeValueAsString(Map.of(
                "username", username,
                "password", "Password123!"
        ));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void trustedAdminProvisioningStillWorksWhileAnonymousAndCustomerAreBlocked() throws Exception {
        String suffix = uniqueSuffix();
        String adminUsername = "seeded_admin_" + suffix;
        User adminUser = new User();
        adminUser.setUsername(adminUsername);
        adminUser.setEmail(adminUsername + "@example.com");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminPass123!"));
        adminUser.setFullName("Seeded Admin");
        adminUser.setRole(adminRole);
        adminUser.setIsActive(true);
        userRepository.save(adminUser);

        String loginPayload = objectMapper.writeValueAsString(Map.of(
                "username", adminUsername,
                "password", "AdminPass123!"
        ));
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn();

        String adminToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();

        String newStaffUsername = "staff_disp_" + suffix;
        String createUserPayload = objectMapper.writeValueAsString(Map.of(
                "username", newStaffUsername,
                "email", newStaffUsername + "@example.com",
                "password", "StaffPass123!",
                "fullName", "Managed Dispatcher",
                "roleId", dispatcherRole.getRoleId()
        ));

        // Anonymous caller cannot access admin provisioning
        mockMvc.perform(post("/api/admin/user-management")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserPayload))
                .andExpect(status().isForbidden());

        // Authenticated ADMIN can provision privileged roles via admin endpoint
        mockMvc.perform(post("/api/admin/user-management")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value(newStaffUsername));

        User createdStaff = userRepository.findByUsernameWithRole(newStaffUsername).orElseThrow();
        assertThat(createdStaff.getRole().getRoleName()).isEqualTo("DISPATCHER");
    }
}
