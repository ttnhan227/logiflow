package com.logiflow.server.services.chat;

import com.logiflow.server.dtos.chat.ChatMessageDto;
import com.logiflow.server.dtos.notification.DispatcherNotificationDto;
import com.logiflow.server.models.ChatMessage;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Trip;
import com.logiflow.server.repositories.chat.ChatMessageRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final TripRepository tripRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    public ChatServiceImpl(ChatMessageRepository chatMessageRepository,
                           TripRepository tripRepository,
                           OrderRepository orderRepository,
                           NotificationService notificationService) {
        this.chatMessageRepository = chatMessageRepository;
        this.tripRepository = tripRepository;
        this.orderRepository = orderRepository;
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

        try {
            if (driverUsername != null && !driverUsername.isEmpty()) {
                notificationService.sendDriverNotificationByUsername(driverUsername, "CHAT", content);
            } else {
                notificationService.sendDriverNotification(driverId, "CHAT", content);
            }
        } catch (Exception ignored) {
        }

        if (senderRole != null &&
                (senderRole.equalsIgnoreCase("DRIVER") || senderRole.equalsIgnoreCase("ROLE_DRIVER"))) {
            try {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("tripId", tripId);

                DispatcherNotificationDto dto = DispatcherNotificationDto.of(
                        "TRIP_CHAT",
                        "INFO",
                        "New chat message",
                        "Trip #" + tripId + ": " + content,
                        "/dispatch/trips/" + tripId,
                        "Open Trip"
                );
                dto.setMetadata(metadata);
                notificationService.sendDispatcherNotification(dto);
            } catch (Exception ignored) {
            }
        }

        return ChatMessageDto.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getOrderMessages(Integer orderId) {
        return chatMessageRepository.findByOrderId(orderId).stream()
                .map(ChatMessageDto::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public ChatMessageDto sendToOrderCustomer(Integer orderId, String senderUsername, String senderRole, String content) {
        Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        Integer customerId = order.getCustomer() != null ? order.getCustomer().getUserId() : null;
        if (customerId == null) {
            throw new RuntimeException("Order has no associated customer");
        }

        ChatMessage msg = new ChatMessage();
        msg.setOrderId(orderId);
        msg.setSenderUsername(senderUsername);
        msg.setSenderRole(senderRole);
        msg.setRecipientCustomerId(customerId);
        msg.setContent(content);
        msg.setCreatedAt(LocalDateTime.now());

        ChatMessage saved = chatMessageRepository.save(msg);

        try {
            String orderStatus = order.getOrderStatus() != null ? order.getOrderStatus().name() : null;
            notificationService.sendOrderNotification(customerId, orderId, "ORDER_CHAT", content, orderStatus);
        } catch (Exception ignored) {
        }

        if (senderRole != null &&
                (senderRole.equalsIgnoreCase("CUSTOMER") || senderRole.equalsIgnoreCase("ROLE_CUSTOMER"))) {
            try {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("orderId", orderId);

                DispatcherNotificationDto dto = DispatcherNotificationDto.of(
                        "ORDER_CHAT",
                        "INFO",
                        "New customer chat message",
                        "Order #" + orderId + ": " + content,
                        "/dispatch/orders/" + orderId,
                        "Open Order"
                );
                dto.setMetadata(metadata);
                notificationService.sendDispatcherNotification(dto);
            } catch (Exception ignored) {
            }
        }

        return ChatMessageDto.fromEntity(saved);
    }
}
