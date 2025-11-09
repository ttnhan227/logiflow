package com.logiflow.server.dtos.manager.audit;

import java.time.LocalDateTime;

public class AuditActivityDto {
    private String actor;
    private String action;
    private LocalDateTime at;
    private String details;

    public AuditActivityDto() {
    }

    public AuditActivityDto(String actor, String action, LocalDateTime at, String details) {
        this.actor = actor;
        this.action = action;
        this.at = at;
        this.details = details;
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public LocalDateTime getAt() {
        return at;
    }

    public void setAt(LocalDateTime at) {
        this.at = at;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
