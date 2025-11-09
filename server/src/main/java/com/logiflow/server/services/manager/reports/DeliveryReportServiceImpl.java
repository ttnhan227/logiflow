package com.logiflow.server.services.manager.reports;

import com.logiflow.server.dtos.manager.reports.DeliveryReportRowDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.repositories.manager.reports.DeliveryReportRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DeliveryReportServiceImpl implements DeliveryReportService {

    private final DeliveryReportRepository deliveryReportRepository;

    public DeliveryReportServiceImpl(DeliveryReportRepository deliveryReportRepository) {
        this.deliveryReportRepository = deliveryReportRepository;
    }

    private LocalDateTime startOf(LocalDate d) {
        return d == null ? null : d.atStartOfDay();
    }

    private LocalDateTime endOf(LocalDate d) {
        return d == null ? null : d.atTime(LocalTime.MAX);
    }

    @Override
    public List<DeliveryReportRowDto> preview(LocalDate start, LocalDate end, Order.OrderStatus status) {
        List<Order> orders = deliveryReportRepository.findForReport(startOf(start), endOf(end), status);
        List<DeliveryReportRowDto> rows = new ArrayList<>(orders.size());
        for (Order o : orders) {
            DeliveryReportRowDto row = new DeliveryReportRowDto(
                    o.getOrderId(),
                    o.getCustomerName(),
                    o.getPickupAddress(),
                    o.getDeliveryAddress(),
                    o.getPriorityLevel() == null ? null : o.getPriorityLevel().name(),
                    o.getOrderStatus() == null ? null : o.getOrderStatus().name(),
                    o.getCreatedAt()
            );
            rows.add(row);
        }
        return rows;
    }

    @Override
    public byte[] exportCsv(LocalDate start, LocalDate end, Order.OrderStatus status) {
        List<DeliveryReportRowDto> data = preview(start, end, status);
        StringBuilder sb = new StringBuilder();
        sb.append("orderId,customerName,pickup,delivery,priority,status,createdAt\n");
        for (DeliveryReportRowDto r : data) {
            sb.append(r.getOrderId()).append(',')
                    .append(csv(r.getCustomerName())).append(',')
                    .append(csv(r.getPickupAddress())).append(',')
                    .append(csv(r.getDeliveryAddress())).append(',')
                    .append(r.getPriority() == null ? "" : r.getPriority()).append(',')
                    .append(r.getStatus() == null ? "" : r.getStatus()).append(',')
                    .append(r.getCreatedAt() == null ? "" : r.getCreatedAt()).append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csv(String s) {
        if (s == null) return "";
        boolean needQuote = s.contains(",") || s.contains("\n") || s.contains("\"");
        String v = s.replace("\"", "\"\"");
        return needQuote ? ("\"" + v + "\"") : v;
    }
}
