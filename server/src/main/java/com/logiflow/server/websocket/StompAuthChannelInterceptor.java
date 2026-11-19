package com.logiflow.server.websocket;

import com.logiflow.server.utils.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(StompAuthChannelInterceptor.class);

    private final JwtUtils jwtUtils;

    public StompAuthChannelInterceptor(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticateConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())
                || StompCommand.SEND.equals(accessor.getCommand())) {
            if (!isAuthenticatedSession(accessor)) {
                throw new MessageDeliveryException("Unauthenticated STOMP session");
            }
        }

        return message;
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }

        if (authHeader != null && !authHeader.isBlank()) {
            if (!authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
                throw new MessageDeliveryException("Invalid STOMP Authorization header");
            }

            String token = authHeader.substring(7).trim();
            try {
                String username = jwtUtils.extractUsername(token);
                String role = jwtUtils.extractRole(token);
                if (username != null && !username.isBlank()
                        && jwtUtils.validateToken(token, username)
                        && JwtHandshakeInterceptor.isAllowedRole(role)) {
                    setAuthenticatedUser(accessor, username, role);
                    return;
                }
            } catch (Exception e) {
                logger.warn("Rejected STOMP CONNECT with invalid JWT: {}", e.getMessage());
            }
            throw new MessageDeliveryException("Unauthorized STOMP CONNECT token");
        }

        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null) {
            Object username = attrs.get("userId");
            Object role = attrs.get("userRole");
            if (username instanceof String u && !u.isBlank()
                    && role instanceof String r && JwtHandshakeInterceptor.isAllowedRole(r)) {
                setAuthenticatedUser(accessor, u, r);
                return;
            }
        }

        throw new MessageDeliveryException("Missing JWT authentication for STOMP CONNECT");
    }

    private static boolean isAuthenticatedSession(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return true;
        }
        Map<String, Object> attrs = accessor.getSessionAttributes();
        return attrs != null
                && attrs.get("userId") instanceof String u && !u.isBlank()
                && attrs.get("userRole") instanceof String r && JwtHandshakeInterceptor.isAllowedRole(r);
    }

    private static void setAuthenticatedUser(StompHeaderAccessor accessor, String username, String role) {
        String normalizedRole = role.trim().toUpperCase();
        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null) {
            attrs.put("userId", username);
            attrs.put("userRole", normalizedRole);
        }
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                username,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole))));
    }
}
