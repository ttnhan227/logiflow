package com.logiflow.server.controllers.auth;

import com.logiflow.server.dtos.auth.AuthResponse;
import com.logiflow.server.dtos.auth.LoginRequest;
import com.logiflow.server.dtos.auth.RegisterRequest;
import com.logiflow.server.services.auth.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public static final String AUTH_COOKIE_NAME = "logiflow_token";
    public static final String CSRF_COOKIE_NAME = "XSRF-TOKEN";
    public static final String CSRF_HEADER_NAME = "X-XSRF-TOKEN";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AuthService authService;
    private final List<String> allowedOrigins;

    public AuthController(
            AuthService authService,
            @Value("${app.cors.allowed-origins:}") List<String> allowedOrigins) {
        this.authService = authService;
        this.allowedOrigins = allowedOrigins == null ? List.of() : allowedOrigins;
    }

    private String resolveSameSite(HttpServletRequest request) {
        String configured = System.getenv("AUTH_COOKIE_SAMESITE");
        if (configured != null && !configured.isBlank()) {
            if ("None".equalsIgnoreCase(configured.trim())) {
                return "None";
            }
            if ("Lax".equalsIgnoreCase(configured.trim())) {
                return "Lax";
            }
        }

        if (isHttpsRequest(request) && isAllowedCrossSiteOrigin(request)) {
            return "None";
        }
        return "Lax";
    }

    private static boolean isHttpsRequest(HttpServletRequest request) {
        if (request.isSecure()) {
            return true;
        }
        String proto = request.getHeader("X-Forwarded-Proto");
        if (proto == null || proto.isBlank()) {
            return false;
        }
        String firstProto = proto.split(",")[0].trim();
        return "https".equalsIgnoreCase(firstProto);
    }

    private boolean isAllowedCrossSiteOrigin(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            return false;
        }
        String trimmedOrigin = origin.trim();
        boolean originAllowed = allowedOrigins.stream()
                .anyMatch(allowed -> allowed != null
                        && ("*".equals(allowed.trim()) || allowed.trim().equalsIgnoreCase(trimmedOrigin)));
        if (!originAllowed) {
            return false;
        }

        String originHost = extractHostFromOrigin(trimmedOrigin);
        String requestHost = extractRequestHost(request);
        return originHost != null
                && requestHost != null
                && !originHost.equalsIgnoreCase(requestHost);
    }

    private static String extractHostFromOrigin(String origin) {
        try {
            return URI.create(origin).getHost();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String extractRequestHost(HttpServletRequest request) {
        String hostHeader = request.getHeader("Host");
        if (hostHeader != null && !hostHeader.isBlank()) {
            String firstHost = hostHeader.split(",")[0].trim();
            try {
                String parsedHost = URI.create("http://" + firstHost).getHost();
                if (parsedHost != null && !parsedHost.isBlank()) {
                    return parsedHost;
                }
            } catch (IllegalArgumentException ignored) {
                // Fall back to server name below
            }
        }
        return request.getServerName();
    }

    private static boolean resolveSecure(HttpServletRequest request, String sameSite) {
        return "None".equalsIgnoreCase(sameSite) || isHttpsRequest(request);
    }

    private static String generateCsrfToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void setAuthCookies(HttpServletRequest request, HttpServletResponse response, String jwtToken) {
        String sameSite = resolveSameSite(request);
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
        String csrfToken = generateCsrfToken();
        ResponseCookie csrfCookie = ResponseCookie.from(CSRF_COOKIE_NAME, csrfToken)
                .httpOnly(false)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ofDays(1))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, csrfCookie.toString());
        response.setHeader(CSRF_HEADER_NAME, csrfToken);
    }

    private void clearAuthCookies(HttpServletRequest request, HttpServletResponse response) {
        String sameSite = resolveSameSite(request);
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
            String csrfCookieValue = null;
            if (request.getCookies() != null) {
                for (Cookie c : request.getCookies()) {
                    if (AUTH_COOKIE_NAME.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                        hasAuthCookie = true;
                    }
                    if (CSRF_COOKIE_NAME.equals(c.getName())) {
                        csrfCookieValue = c.getValue();
                    }
                }
            }
            if (hasAuthCookie) {
                if (csrfCookieValue == null || csrfCookieValue.isBlank()) {
                    String sameSite = resolveSameSite(request);
                    ensureCsrfCookie(request, response, sameSite, resolveSecure(request, sameSite));
                } else {
                    response.setHeader(CSRF_HEADER_NAME, csrfCookieValue);
                }
            }
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
