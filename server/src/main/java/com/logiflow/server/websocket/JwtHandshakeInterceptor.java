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

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        // Extract token from query param (e.g., ws://host/ws/tracking?token=...)
        String uri = request.getURI().toString();
        String token = null;
        int idx = uri.indexOf("token=");
        if (idx != -1) {
            token = uri.substring(idx + 6);
            int amp = token.indexOf('&');
            if (amp != -1) token = token.substring(0, amp);
        }
        if (token != null && !token.isEmpty()) {
            try {
                String userId = jwtUtils.extractUsername(token);
                String role = jwtUtils.extractRole(token);
                // Allow both DRIVER and CUSTOMER roles for WebSocket connections
                if (userId != null && role != null &&
                    (role.equalsIgnoreCase("DRIVER") || role.equalsIgnoreCase("CUSTOMER"))) {
                    attributes.put("userId", userId);
                    attributes.put("userRole", role);
                    return true;
                }
            } catch (Exception e) {
                logger.warn("Invalid JWT in WebSocket handshake: {}", e.getMessage());
            }
        }
        return false; // Reject connection if no/invalid token or not a driver
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                              WebSocketHandler wsHandler, Exception exception) {
        // No-op
    }
}
