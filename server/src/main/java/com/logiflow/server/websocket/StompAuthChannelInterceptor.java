package com.logiflow.server.websocket;

import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(StompAuthChannelInterceptor.class);
    private static final Pattern TRIP_LOCATION_TOPIC = Pattern.compile("^/topic/trips/(\\d+)/location$");
    private static final String TOPIC_DRIVER_PREFIX = "/topic/driver/";
    private static final String TOPIC_CUSTOMER_PREFIX = "/topic/customer/";

    private final JwtUtils jwtUtils;
    private final TripAssignmentRepository tripAssignmentRepository;
    private final OrderRepository orderRepository;

    public StompAuthChannelInterceptor(
            JwtUtils jwtUtils,
            TripAssignmentRepository tripAssignmentRepository,
            OrderRepository orderRepository) {
        this.jwtUtils = jwtUtils;
        this.tripAssignmentRepository = tripAssignmentRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticateConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            SessionIdentity identity = requireAuthenticatedIdentity(accessor);
            authorizeSubscribe(identity, accessor.getDestination());
        } else if (StompCommand.SEND.equals(accessor.getCommand())) {
            SessionIdentity identity = requireAuthenticatedIdentity(accessor);
            authorizeSend(identity, accessor.getDestination());
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

    private SessionIdentity requireAuthenticatedIdentity(StompHeaderAccessor accessor) {
        Map<String, Object> attrs = accessor.getSessionAttributes();
        String username = null;
        String role = null;
        if (attrs != null) {
            if (attrs.get("userId") instanceof String u && !u.isBlank()) {
                username = u;
            }
            if (attrs.get("userRole") instanceof String r && !r.isBlank()) {
                role = r.trim().toUpperCase();
            }
        }
        if (username == null && accessor.getUser() != null) {
            username = accessor.getUser().getName();
        }
        if (role == null && accessor.getUser() instanceof Authentication auth) {
            role = auth.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .filter(a -> a.startsWith("ROLE_"))
                    .map(a -> a.substring(5).toUpperCase())
                    .findFirst()
                    .orElse(null);
        }

        if (username == null || username.isBlank() || !JwtHandshakeInterceptor.isAllowedRole(role)) {
            throw new MessageDeliveryException("Unauthenticated STOMP session");
        }
        return new SessionIdentity(username, role);
    }

    private void authorizeSubscribe(SessionIdentity identity, String destination) {
        if (destination == null || destination.isBlank() || destination.contains("..")) {
            throw new MessageDeliveryException("Invalid STOMP subscription destination");
        }

        boolean isOps = "ADMIN".equals(identity.role()) || "DISPATCHER".equals(identity.role());

        if (destination.equals("/topic/admin") || destination.startsWith("/topic/admin/")) {
            if (!"ADMIN".equals(identity.role())) {
                throw denySubscribe(identity, destination);
            }
            return;
        }

        if (destination.equals("/topic/dispatcher") || destination.startsWith("/topic/dispatcher/")) {
            if (!isOps) {
                throw denySubscribe(identity, destination);
            }
            return;
        }

        if (destination.equals("/topic/locations")) {
            if (!isOps) {
                throw denySubscribe(identity, destination);
            }
            return;
        }

        if (destination.startsWith(TOPIC_DRIVER_PREFIX)) {
            String targetUsername = destination.substring(TOPIC_DRIVER_PREFIX.length());
            if (!isSingleSegment(targetUsername)) {
                throw denySubscribe(identity, destination);
            }
            if (isOps || ("DRIVER".equals(identity.role()) && identity.username().equals(targetUsername))) {
                return;
            }
            throw denySubscribe(identity, destination);
        }

        if (destination.startsWith(TOPIC_CUSTOMER_PREFIX)) {
            String targetUsername = destination.substring(TOPIC_CUSTOMER_PREFIX.length());
            if (!isSingleSegment(targetUsername)) {
                throw denySubscribe(identity, destination);
            }
            if (isOps || ("CUSTOMER".equals(identity.role()) && identity.username().equals(targetUsername))) {
                return;
            }
            throw denySubscribe(identity, destination);
        }

        Matcher tripMatcher = TRIP_LOCATION_TOPIC.matcher(destination);
        if (tripMatcher.matches()) {
            if (isOps) {
                return;
            }
            Integer tripId = parsePositiveInt(tripMatcher.group(1));
            if (tripId == null) {
                throw denySubscribe(identity, destination);
            }
            if ("DRIVER".equals(identity.role())
                    && tripAssignmentRepository.existsActiveAssignment(identity.username(), tripId)) {
                return;
            }
            if ("CUSTOMER".equals(identity.role())
                    && orderRepository.existsByTrip_TripIdAndCustomer_Username(tripId, identity.username())) {
                return;
            }
            throw denySubscribe(identity, destination);
        }

        throw denySubscribe(identity, destination);
    }

    private void authorizeSend(SessionIdentity identity, String destination) {
        if ("/app/tracking".equals(destination) && "DRIVER".equals(identity.role())) {
            return;
        }
        logger.warn("Blocked STOMP SEND for user={} role={} destination={}",
                identity.username(), identity.role(), destination);
        throw new MessageDeliveryException("Forbidden STOMP SEND destination");
    }

    private static boolean isSingleSegment(String segment) {
        return !segment.isBlank() && !segment.contains("/");
    }

    private static Integer parsePositiveInt(String raw) {
        try {
            int val = Integer.parseInt(raw);
            return val > 0 ? val : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static MessageDeliveryException denySubscribe(SessionIdentity identity, String destination) {
        logger.warn("Blocked STOMP SUBSCRIBE for user={} role={} destination={}",
                identity.username(), identity.role(), destination);
        return new MessageDeliveryException("Forbidden STOMP SUBSCRIBE destination");
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

    private record SessionIdentity(String username, String role) {}
}
