package com.logiflow.server.configs;

import com.logiflow.server.controllers.auth.AuthController;
import com.logiflow.server.filters.JwtAuthenticationFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter, UserDetailsService userDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(
                        (authorize) -> authorize
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                .requestMatchers("/error").permitAll()
                                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                                .requestMatchers("/api/auth/**").permitAll()
                                .requestMatchers("/api/registration/**").permitAll()
                                .requestMatchers("/api/maps/gps/**").authenticated()
                                .requestMatchers("/api/maps/**").permitAll()
                                .requestMatchers("/ws/tracking", "/ws/tracking/**").permitAll()
                                .requestMatchers("/ws/notifications", "/ws/notifications/**").permitAll()
                                .requestMatchers("/ws/notifications-native", "/ws/notifications-native/**").permitAll()
                                .requestMatchers("/api/uploads/license-image").permitAll()
                                .requestMatchers("/api/uploads/cv").permitAll()
                                .requestMatchers("/api/uploads/business-license").permitAll()
                                .requestMatchers("/api/uploads/tax-certificate").permitAll()
                                .requestMatchers("/api/uploads/**").authenticated()
                                .requestMatchers(HttpMethod.GET, "/api/payment/return", "/api/payment/cancel").permitAll()
                                .requestMatchers("/api/payment/**").authenticated()
                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                .requestMatchers("/api/dispatch/**").hasAnyRole("ADMIN", "DISPATCHER")
                                .requestMatchers("/api/driver/**").hasAnyRole("ADMIN", "DRIVER")
                                .requestMatchers(HttpMethod.GET, "/api/user/profile/*").hasRole("ADMIN")
                                .requestMatchers("/api/user/**").authenticated()
                                .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(cookieCsrfFilter(), JwtAuthenticationFilter.class);

        return http.build();
    }

    private OncePerRequestFilter cookieCsrfFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                String method = request.getMethod();
                boolean isUnsafe = !("GET".equalsIgnoreCase(method)
                        || "HEAD".equalsIgnoreCase(method)
                        || "OPTIONS".equalsIgnoreCase(method)
                        || "TRACE".equalsIgnoreCase(method));

                if (isUnsafe) {
                    String authHeader = request.getHeader("Authorization");
                    boolean usesBearer = authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7);
                    String path = request.getRequestURI();
                    boolean isPublicAuthEntry = "/api/auth/login".equals(path) || "/api/auth/register".equals(path);

                    String authCookie = null;
                    String csrfCookie = null;
                    if (request.getCookies() != null) {
                        for (Cookie cookie : request.getCookies()) {
                            if (AuthController.AUTH_COOKIE_NAME.equals(cookie.getName())) {
                                authCookie = cookie.getValue();
                            } else if (AuthController.CSRF_COOKIE_NAME.equals(cookie.getName())) {
                                csrfCookie = cookie.getValue();
                            }
                        }
                    }

                    if (!usesBearer && authCookie != null && !authCookie.isBlank() && !isPublicAuthEntry) {
                        String csrfHeader = request.getHeader("X-XSRF-TOKEN");
                        if (csrfHeader == null || csrfHeader.isBlank()) {
                            csrfHeader = request.getHeader("X-CSRF-TOKEN");
                        }
                        boolean valid = csrfCookie != null
                                && !csrfCookie.isBlank()
                                && csrfHeader != null
                                && MessageDigest.isEqual(
                                        csrfCookie.getBytes(StandardCharsets.UTF_8),
                                        csrfHeader.getBytes(StandardCharsets.UTF_8));
                        if (!valid) {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\":\"CSRF validation failed\"}");
                            return;
                        }
                    }
                }

                filterChain.doFilter(request, response);
            }
        };
    }
}
