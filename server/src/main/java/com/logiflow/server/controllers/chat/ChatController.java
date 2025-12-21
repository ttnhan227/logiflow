package com.logiflow.server.controllers.chat;

import com.logiflow.server.dtos.chat.ChatMessageDto;
import com.logiflow.server.dtos.chat.ChatSendMessageRequest;
import com.logiflow.server.dtos.chat.OrderChatSendMessageRequest;
import com.logiflow.server.services.chat.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/trips/{tripId}/messages")
    public ResponseEntity<?> getTripMessages(@PathVariable Integer tripId) {
        try {
            List<ChatMessageDto> messages = chatService.getTripMessages(tripId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody ChatSendMessageRequest request,
                                         Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "anonymous";
            String role = (authentication != null && authentication.getAuthorities() != null)
                    ? authentication.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse(null)
                    : null;

            ChatMessageDto sent = chatService.sendToTripDriver(request.getTripId(), username, role, request.getContent());
            return ResponseEntity.ok(sent);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders/{orderId}/messages")
    public ResponseEntity<?> getOrderMessages(@PathVariable Integer orderId) {
        try {
            List<ChatMessageDto> messages = chatService.getOrderMessages(orderId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/messages/customer")
    public ResponseEntity<?> sendOrderMessage(@Valid @RequestBody OrderChatSendMessageRequest request,
                                              Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "anonymous";
            String role = (authentication != null && authentication.getAuthorities() != null)
                    ? authentication.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse(null)
                    : null;

            ChatMessageDto sent = chatService.sendToOrderCustomer(request.getOrderId(), username, role, request.getContent());
            return ResponseEntity.ok(sent);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
