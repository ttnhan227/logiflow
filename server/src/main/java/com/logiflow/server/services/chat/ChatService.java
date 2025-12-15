package com.logiflow.server.services.chat;

import com.logiflow.server.dtos.chat.ChatMessageDto;

import java.util.List;

public interface ChatService {
    List<ChatMessageDto> getTripMessages(Integer tripId);

    ChatMessageDto sendToTripDriver(Integer tripId, String senderUsername, String senderRole, String content);
}
