package com.logiflow.server.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue"); // For broadcasting to clients and personal queues
        config.setApplicationDestinationPrefixes("/app"); // For client-to-server messages
        config.setUserDestinationPrefix("/user"); // For user-specific destinations
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Driver tracking endpoint
        registry.addEndpoint("/ws/tracking")
                .setAllowedOriginPatterns("*")
                .withSockJS();
        
        // Admin notifications endpoint - Allow direct WebSocket for mobile first
        registry.addEndpoint("/ws/notifications")
                .setAllowedOriginPatterns("*");
    }
}
