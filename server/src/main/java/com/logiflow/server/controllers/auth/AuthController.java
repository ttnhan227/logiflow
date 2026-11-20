package com.logiflow.server.controllers.auth;

import com.logiflow.server.dtos.auth.AuthResponse;
import com.logiflow.server.dtos.auth.LoginRequest;
import com.logiflow.server.dtos.auth.RegisterRequest;
import com.logiflow.server.services.auth.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public static final String AUTH_COOKIE_NAME = "logiflow_token";
    public static final String CSRF_COOKIE_NAME = "XSRF-TOKEN";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private static String resolveSameSite() {
        String configured = System.getenv("AUTH_COOKIE_SAMESITE");
        return "None".equalsIgnoreCase(configured) ? "None" : "Lax";
    }

    private static boolean resolveSecure(HttpServletRequest request, String sameSite) {
        if ("None".equalsIgnoreCase(sameSite) || request.isSecure()) {
            return true;
        }
        String proto = request.getHeader("X-Forwarded-Proto");
        return "https".equalsIgnoreCase(proto);
    }

    private static String generateCsrfToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void setAuthCookies(HttpServletRequest request, HttpServletResponse response, String jwtToken) {
        String sameSite = resolveSameSite();
        boolean secure = resolveSecure(request, sameSite);

        ResponseCookie authCookie = ResponseCookie.from(AUTH_COOKIE_NAME, jwtToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ofDays(1))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, authCookie.toString());

        ensureCsrfCookie(request, response, sameSite, secure);
    }

    private void ensureCsrfCookie(HttpServletRequest request, HttpServletResponse response, String sameSite, boolean secure) {
        ResponseCookie csrfCookie = ResponseCookie.from(CSRF_COOKIE_NAME, generateCsrfToken())
                .httpOnly(false)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ofDays(1))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, csrfCookie.toString());
    }

    private void clearAuthCookies(HttpServletRequest request, HttpServletResponse response) {
        String sameSite = resolveSameSite();
        boolean secure = resolveSecure(request, sameSite);

        ResponseCookie clearAuth = ResponseCookie.from(AUTH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();
        ResponseCookie clearCsrf = ResponseCookie.from(CSRF_COOKIE_NAME, "")
                .httpOnly(false)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearAuth.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearCsrf.toString());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse httpResponse) {
        try {
            AuthResponse response = authService.login(loginRequest);
            if (response.getToken() != null && !response.getToken().isBlank()) {
                setAuthCookies(request, httpResponse, response.getToken());
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Return the specific error message (rejection, pending, etc.)
            return ResponseEntity.badRequest().body(new AuthResponse(null, null, null, null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, null, null, null, "Invalid credentials"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest registerRequest,
            HttpServletRequest request,
            HttpServletResponse httpResponse) {
        try {
            AuthResponse response = authService.register(registerRequest);
            if (response.getToken() != null && !response.getToken().isBlank()) {
                setAuthCookies(request, httpResponse, response.getToken());
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, null, null, null, e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestParam(required = false) String username,
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        String targetUser = (username != null && !username.isBlank())
                ? username
                : (authentication != null ? authentication.getName() : null);
        if (targetUser != null && !targetUser.isBlank()) {
            authService.logout(targetUser);
        }
        clearAuthCookies(request, response);
        response.setHeader("Clear-Site-Data", "\"cookies\", \"storage\"");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            AuthResponse profile = authService.getCurrentUser(authentication.getName());
            boolean hasAuthCookie = false;
            boolean hasCsrfCookie = false;
            if (request.getCookies() != null) {
                for (Cookie c : request.getCookies()) {
                    if (AUTH_COOKIE_NAME.equals(c.getName())) hasAuthCookie = true;
                    if (CSRF_COOKIE_NAME.equals(c.getName())) hasCsrfCookie = true;
                }
            }
            if (hasAuthCookie && !hasCsrfCookie) {
                String sameSite = resolveSameSite();
                ensureCsrfCookie(request, response, sameSite, resolveSecure(request, sameSite));
            }
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
