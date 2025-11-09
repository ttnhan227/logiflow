package com.logiflow.server.services.manager.reports;

import com.logiflow.server.dtos.manager.reports.DeliveryReportRowDto;
import com.logiflow.server.models.Order;

import java.time.LocalDate;
import java.util.List;

public interface DeliveryReportService {
    // JSON preview (dùng cho cả format=pdf hiện chưa hỗ trợ)
    List<DeliveryReportRowDto> preview(LocalDate start, LocalDate end, Order.OrderStatus status);

    // Export CSV trả byte[] (controller tự set content-disposition)
    byte[] exportCsv(LocalDate start, LocalDate end, Order.OrderStatus status);
}
