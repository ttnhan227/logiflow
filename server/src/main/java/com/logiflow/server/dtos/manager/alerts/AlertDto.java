package com.logiflow.server.dtos.manager.alerts;

import java.time.LocalDateTime;

public class AlertDto {

    public enum Level {INFO, WARNING, CRITICAL}

    private Level level;
    private String message;
    private LocalDateTime createdAt;

    public AlertDto() {
    }

    public AlertDto(Level level, String message, LocalDateTime createdAt) {
        this.level = level;
        this.message = message;
        this.createdAt = createdAt;
    }

    public Level getLevel() {
        return level;
    }

    public void setLevel(Level level) {
        this.level = level;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
