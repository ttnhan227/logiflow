package com.logiflow.server.websocket;

import com.logiflow.server.dtos.notification.TripNotificationDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendDriverNotification(Integer driverId, String type, String message) {
        String destination = "/topic/driver/" + driverId;
        TripNotificationDto notification = new TripNotificationDto();
        notification.setType(type);
        notification.setMessage(message);
        messagingTemplate.convertAndSend(destination, notification);
    }

    public void sendTripNotification(Integer driverId, Integer tripId, String type, String message, String tripStatus) {
        String destination = "/topic/driver/" + driverId;
        TripNotificationDto notification = new TripNotificationDto(type, message, tripId, tripStatus);
        messagingTemplate.convertAndSend(destination, notification);
    }

    public void sendTripNotificationWithData(Integer driverId, TripNotificationDto notification) {
        String destination = "/topic/driver/" + driverId;
        messagingTemplate.convertAndSend(destination, notification);
    }
}
