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

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/trips/{tripId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getTripMessages(@PathVariable Integer tripId) {
        List<ChatMessageDto> messages = chatService.getTripMessages(tripId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/messages")
    public ResponseEntity<ChatMessageDto> sendMessage(@Valid @RequestBody ChatSendMessageRequest request,
                                                      Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        String role = (authentication != null && authentication.getAuthorities() != null)
                ? authentication.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse(null)
                : null;

        ChatMessageDto sent = chatService.sendToTripDriver(request.getTripId(), username, role, request.getContent());
        return ResponseEntity.ok(sent);
    }

    @GetMapping("/orders/{orderId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getOrderMessages(@PathVariable Integer orderId) {
        List<ChatMessageDto> messages = chatService.getOrderMessages(orderId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/messages/customer")
    public ResponseEntity<ChatMessageDto> sendOrderMessage(@Valid @RequestBody OrderChatSendMessageRequest request,
                                                           Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        String role = (authentication != null && authentication.getAuthorities() != null)
                ? authentication.getAuthorities().stream().findFirst().map(a -> a.getAuthority()).orElse(null)
                : null;

        ChatMessageDto sent = chatService.sendToOrderCustomer(request.getOrderId(), username, role, request.getContent());
        return ResponseEntity.ok(sent);
    }
}
