package com.logiflow.server.dtos.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderChatSendMessageRequest {

    @NotNull
    private Integer orderId;

    @NotBlank
    private String content;
}
