package com.logiflow.server.dtos.dispatch;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderImportResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<OrderDto> createdOrders;
    private List<String> errors; // List of error messages with row numbers
}

