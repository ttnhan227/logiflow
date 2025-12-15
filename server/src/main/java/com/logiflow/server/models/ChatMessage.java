package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_trip_id_created_at", columnList = "trip_id, created_at")
})
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "trip_id", nullable = false)
    private Integer tripId;

    @Column(name = "sender_username", nullable = false, length = 100)
    private String senderUsername;

    @Column(name = "sender_role", nullable = true, length = 50)
    private String senderRole;

    @Column(name = "recipient_driver_id", nullable = true)
    private Integer recipientDriverId;

    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
