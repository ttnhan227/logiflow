package com.logiflow.server.controllers.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.cors.allowed-origins=http://localhost:5173,https://logiflow-client.onrender.com"
})
@AutoConfigureMockMvc
class AuthCookieCrossOriginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String testUsername;
    private static final String TEST_PASSWORD = "Password123!";

    @BeforeEach
    void setUpUser() {
        Role customerRole = roleRepository.findByRoleName("CUSTOMER").orElseGet(() -> {
            Role role = new Role();
            role.setRoleName("CUSTOMER");
            role.setDescription("Customer role");
            return roleRepository.save(role);
        });

        testUsername = "cookie_test_" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setUsername(testUsername);
        user.setEmail(testUsername + "@example.com");
        user.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        user.setFullName("Cookie Test User");
        user.setRole(customerRole);
        user.setIsActive(true);
        userRepository.save(user);
    }

    @Test
    void crossSiteHttpsOriginReceivesSameSiteNoneSecureAndExposedCsrfHeaderOnLogin() throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
                "username", testUsername,
                "password", TEST_PASSWORD
        ));

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .header("Origin", "https://logiflow-client.onrender.com")
                        .header("X-Forwarded-Proto", "https")
                        .header("Host", "logiflow-server.onrender.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(header().exists(AuthController.CSRF_HEADER_NAME))
                .andReturn();

        List<String> setCookies = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        String authCookieHeader = findSetCookie(setCookies, AuthController.AUTH_COOKIE_NAME);
        String csrfCookieHeader = findSetCookie(setCookies, AuthController.CSRF_COOKIE_NAME);

        assertThat(authCookieHeader).isNotNull();
        assertThat(authCookieHeader).contains("SameSite=None");
        assertThat(authCookieHeader).contains("Secure");
        assertThat(authCookieHeader).contains("HttpOnly");

        assertThat(csrfCookieHeader).isNotNull();
        assertThat(csrfCookieHeader).contains("SameSite=None");
        assertThat(csrfCookieHeader).contains("Secure");

        String csrfHeaderValue = result.getResponse().getHeader(AuthController.CSRF_HEADER_NAME);
        assertThat(csrfHeaderValue).isNotBlank();
        assertThat(csrfCookieHeader).contains(AuthController.CSRF_COOKIE_NAME + "=" + csrfHeaderValue);

        String exposedHeaders = result.getResponse().getHeader(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS);
        assertThat(exposedHeaders).isNotNull();
        assertThat(exposedHeaders).contains(AuthController.CSRF_HEADER_NAME);
    }

    @Test
    void meEndpointRefreshesMissingCsrfCookieAndSetsHeaderForCrossSiteHttps() throws Exception {
        String loginPayload = objectMapper.writeValueAsString(Map.of(
                "username", testUsername,
                "password", TEST_PASSWORD
        ));

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie(AuthController.AUTH_COOKIE_NAME);
        assertThat(authCookie).isNotNull();

        MvcResult meResult = mockMvc.perform(get("/api/auth/me")
                        .header("Origin", "https://logiflow-client.onrender.com")
                        .header("X-Forwarded-Proto", "https")
                        .header("Host", "logiflow-server.onrender.com")
                        .cookie(new Cookie(AuthController.AUTH_COOKIE_NAME, authCookie.getValue())))
                .andExpect(status().isOk())
                .andExpect(header().exists(AuthController.CSRF_HEADER_NAME))
                .andReturn();

        List<String> setCookies = meResult.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        String csrfCookieHeader = findSetCookie(setCookies, AuthController.CSRF_COOKIE_NAME);
        assertThat(csrfCookieHeader).isNotNull();
        assertThat(csrfCookieHeader).contains("SameSite=None");
        assertThat(csrfCookieHeader).contains("Secure");

        String csrfHeaderValue = meResult.getResponse().getHeader(AuthController.CSRF_HEADER_NAME);
        assertThat(csrfHeaderValue).isNotBlank();
        assertThat(csrfCookieHeader).contains(AuthController.CSRF_COOKIE_NAME + "=" + csrfHeaderValue);
    }

    @Test
    void localhostHttpOriginReceivesSameSiteLaxCookies() throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
                "username", testUsername,
                "password", TEST_PASSWORD
        ));

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Host", "localhost:8080")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(header().exists(AuthController.CSRF_HEADER_NAME))
                .andReturn();

        List<String> setCookies = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        String authCookieHeader = findSetCookie(setCookies, AuthController.AUTH_COOKIE_NAME);
        String csrfCookieHeader = findSetCookie(setCookies, AuthController.CSRF_COOKIE_NAME);

        assertThat(authCookieHeader).isNotNull();
        assertThat(authCookieHeader).contains("SameSite=Lax");
        assertThat(authCookieHeader).doesNotContain("SameSite=None");
        assertThat(authCookieHeader).doesNotContain("; Secure");

        assertThat(csrfCookieHeader).isNotNull();
        assertThat(csrfCookieHeader).contains("SameSite=Lax");
        assertThat(csrfCookieHeader).doesNotContain("SameSite=None");
        assertThat(csrfCookieHeader).doesNotContain("; Secure");
    }

    private static String findSetCookie(List<String> setCookies, String cookieName) {
        return setCookies.stream()
                .filter(header -> header.startsWith(cookieName + "="))
                .findFirst()
                .orElse(null);
    }
}
