package com.logiflow.server.dtos.chat;

import com.logiflow.server.models.ChatMessage;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChatMessageDto {
    private Long messageId;
    private Integer tripId;
    private Integer orderId;
    private String senderUsername;
    private String senderRole;
    private Integer recipientDriverId;
    private Integer recipientCustomerId;
    private String content;
    private LocalDateTime createdAt;

    public static ChatMessageDto fromEntity(ChatMessage m) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setMessageId(m.getMessageId());
        dto.setTripId(m.getTripId());
        dto.setOrderId(m.getOrderId());
        dto.setSenderUsername(m.getSenderUsername());
        dto.setSenderRole(m.getSenderRole());
        dto.setRecipientDriverId(m.getRecipientDriverId());
        dto.setRecipientCustomerId(m.getRecipientCustomerId());
        dto.setContent(m.getContent());
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }
}
