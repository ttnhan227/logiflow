package com.logiflow.server.dtos.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatSendMessageRequest {

    @NotNull
    private Integer tripId;

    @NotBlank
    private String content;
}
