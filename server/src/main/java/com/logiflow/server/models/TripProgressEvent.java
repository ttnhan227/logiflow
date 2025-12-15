package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "trip_progress_events")
public class TripProgressEvent {

    public enum EventType {
        CREATED,
        ASSIGNED,
        STATUS_CHANGED,
        REROUTED,
        CANCELLED,
        NOTE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Integer eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", length = 30, nullable = false)
    private EventType eventType;

    @Column(name = "message", length = 500)
    private String message;

    @Column(name = "metadata", length = 2000)
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
