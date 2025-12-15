package com.logiflow.server.dtos.dispatch;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripListResponse {
    private List<TripDto> trips;

    // pagination (same shape as OrderListResponse)
    private int currentPage;
    private int pageSize;
    private long totalItems;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;

    // extra info
    private Map<String, Long> statusSummary;
}
