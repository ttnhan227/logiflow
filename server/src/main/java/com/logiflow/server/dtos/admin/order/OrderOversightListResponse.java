package com.logiflow.server.dtos.admin.order;

import com.logiflow.server.dtos.admin.order.OrderOversightDto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderOversightListResponse {
    private List<OrderOversightDto> orders;
    private int currentPage;
    private int pageSize;
    private long totalItems;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
}
