package com.logiflow.server.websocket;

import com.logiflow.server.controllers.auth.AuthController;
import com.logiflow.server.utils.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(JwtHandshakeInterceptor.class);
    private final JwtUtils jwtUtils;

    public JwtHandshakeInterceptor(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    static boolean isAllowedRole(String role) {
        return role != null && (role.equalsIgnoreCase("DRIVER")
                || role.equalsIgnoreCase("CUSTOMER")
                || role.equalsIgnoreCase("ADMIN")
                || role.equalsIgnoreCase("DISPATCHER"));
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        // Optional query-param JWT fallback (?token=...); STOMP CONNECT Authorization header is also enforced by StompAuthChannelInterceptor
        String query = request.getURI().getRawQuery();
        String token = extractTokenParam(query);
        if (token == null) {
            String cookieToken = extractCookieToken(request.getHeaders());
            if (cookieToken == null || cookieToken.isBlank()) {
                return true;
            }
            token = cookieToken;
        } else {
            if (token.isEmpty()) {
                return false;
            }
            token = java.net.URLDecoder.decode(token, java.nio.charset.StandardCharsets.UTF_8);
        }
        try {
            String userId = jwtUtils.extractUsername(token);
            String role = jwtUtils.extractRole(token);
            if (userId != null && !userId.isBlank()
                    && jwtUtils.validateToken(token, userId)
                    && isAllowedRole(role)) {
                attributes.put("userId", userId);
                attributes.put("userRole", role.trim().toUpperCase());
                return true;
            }
        } catch (Exception e) {
            logger.warn("Invalid JWT in WebSocket handshake: {}", e.getMessage());
        }
        return false;
    }

    private static String extractCookieToken(HttpHeaders headers) {
        if (headers == null) {
            return null;
        }
        java.util.List<String> cookieHeaders = headers.get(HttpHeaders.COOKIE);
        if (cookieHeaders == null) {
            return null;
        }
        String prefix = AuthController.AUTH_COOKIE_NAME + "=";
        for (String header : cookieHeaders) {
            for (String part : header.split(";")) {
                String trimmed = part.trim();
                if (trimmed.startsWith(prefix)) {
                    return trimmed.substring(prefix.length()).trim();
                }
            }
        }
        return null;
    }

    private static String extractTokenParam(String rawQuery) {
        if (rawQuery == null || rawQuery.isEmpty()) {
            return null;
        }
        for (String param : rawQuery.split("&")) {
            if (param.startsWith("token=")) {
                return param.substring("token=".length());
            }
        }
        return null;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                              WebSocketHandler wsHandler, Exception exception) {
        // No-op
    }
}
