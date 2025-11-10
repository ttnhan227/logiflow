package com.logiflow.server.websocket;

import com.logiflow.server.utils.JwtUtils;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class JwtHandshakeInterceptor implements HandshakeInterceptor {
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
                JwtUtils jwtUtils = new JwtUtils();
                String driverId = jwtUtils.extractUsername(token);
                String role = jwtUtils.extractRole(token);
                // Optionally, check role is DRIVER
                if (driverId != null && role != null && role.equalsIgnoreCase("DRIVER")) {
                    attributes.put("driverId", driverId);
                    return true;
                }
            } catch (Exception e) {
                System.err.println("Invalid JWT: " + e.getMessage());
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
