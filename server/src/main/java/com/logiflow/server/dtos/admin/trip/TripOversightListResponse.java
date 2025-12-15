package com.logiflow.server.dtos.admin.trip;

import com.logiflow.server.dtos.admin.trip.TripOversightDto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripOversightListResponse {
    private List<TripOversightDto> trips; // Changed from orders to trips
    private int currentPage;
    private int pageSize;
    private long totalItems;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
}
