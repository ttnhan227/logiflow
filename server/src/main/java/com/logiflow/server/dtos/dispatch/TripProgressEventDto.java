package com.logiflow.server.dtos.dispatch;

import com.logiflow.server.models.TripProgressEvent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripProgressEventDto {
    private Integer eventId;
    private String eventType;
    private String message;
    private String metadata;
    private LocalDateTime createdAt;

    public static TripProgressEventDto fromEntity(TripProgressEvent e) {
        TripProgressEventDto dto = new TripProgressEventDto();
        dto.setEventId(e.getEventId());
        dto.setEventType(e.getEventType() != null ? e.getEventType().name() : null);
        dto.setMessage(e.getMessage());
        dto.setMetadata(e.getMetadata());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }
}
