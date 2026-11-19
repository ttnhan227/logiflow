package com.logiflow.server.websocket;

import com.logiflow.server.utils.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
            return true;
        }
        if (token.isEmpty()) {
            return false;
        }
        try {
            token = java.net.URLDecoder.decode(token, java.nio.charset.StandardCharsets.UTF_8);
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
