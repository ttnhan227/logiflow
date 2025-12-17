package com.logiflow.server.services.chat;

import com.logiflow.server.dtos.chat.ChatMessageDto;
import com.logiflow.server.models.ChatMessage;
import com.logiflow.server.models.Trip;
import com.logiflow.server.repositories.chat.ChatMessageRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;

    public ChatServiceImpl(ChatMessageRepository chatMessageRepository,
                           TripRepository tripRepository,
                           NotificationService notificationService) {
        this.chatMessageRepository = chatMessageRepository;
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getTripMessages(Integer tripId) {
        return chatMessageRepository.findByTripId(tripId).stream()
                .map(ChatMessageDto::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public ChatMessageDto sendToTripDriver(Integer tripId, String senderUsername, String senderRole, String content) {
        Trip trip = tripRepository.findByIdWithRelations(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));

        Integer driverId = null;
        String driverUsername = null;
        if (trip.getTripAssignments() != null && !trip.getTripAssignments().isEmpty()) {
            var assignment = trip.getTripAssignments().stream()
                    .filter(ta -> ta.getDriver() != null)
                    .findFirst()
                    .orElse(null);
            if (assignment != null) {
                driverId = assignment.getDriver().getDriverId();
                if (assignment.getDriver().getUser() != null) {
                    driverUsername = assignment.getDriver().getUser().getUsername();
                }
            }
        }

        if (driverId == null) {
            throw new RuntimeException("Trip has no assigned driver");
        }

        ChatMessage msg = new ChatMessage();
        msg.setTripId(tripId);
        msg.setSenderUsername(senderUsername);
        msg.setSenderRole(senderRole);
        msg.setRecipientDriverId(driverId);
        msg.setContent(content);
        msg.setCreatedAt(LocalDateTime.now());

        ChatMessage saved = chatMessageRepository.save(msg);

        // Real-time delivery (driver + dispatcher topic)
        // Driver listens: /topic/driver/{driverId}/chat
        // Dispatch listens: /topic/dispatch/trips/{tripId}/chat
        try {
            if (driverUsername != null && !driverUsername.isEmpty()) {
                notificationService.sendDriverNotificationByUsername(driverUsername, "CHAT", content);
            } else {
                notificationService.sendDriverNotification(driverId, "CHAT", content);
            }
        } catch (Exception ignored) {
        }

        // Only broadcast notification to dispatchers if message is from driver
        // Avoid notifying dispatchers when they send messages to each other
        // Handle both "DRIVER" and "ROLE_DRIVER" formats
        if (senderRole != null &&
                (senderRole.equalsIgnoreCase("DRIVER") || senderRole.equalsIgnoreCase("ROLE_DRIVER"))) {
            try {
                // Send to dispatchers via websocket and persist in DB
                notificationService.broadcastToDispatchers(
                        "TRIP_CHAT",
                        "INFO",
                        "New chat message",
                        "Trip #" + tripId + ": " + content,
                        "/dispatch/trips/" + tripId,
                        "Open Trip",
                        tripId
                );
            } catch (Exception ignored) {
            }
        }

        return ChatMessageDto.fromEntity(saved);
    }
}
