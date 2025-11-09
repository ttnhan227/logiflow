package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.reports.DeliveryReportRowDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.services.manager.reports.DeliveryReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager/reports")
public class ReportsController {

    private final DeliveryReportService deliveryReportService;

    public ReportsController(DeliveryReportService deliveryReportService) {
        this.deliveryReportService = deliveryReportService;
    }

    // 6) Xuất báo cáo giao hàng: format=csv|pdf
    // - csv: trả file đính kèm
    // - pdf: tạm thời trả JSON preview (hook thêm exporter PDF sau)
    @GetMapping("/deliveries")
    public ResponseEntity<?> deliveries(
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Order.OrderStatus status,
            @RequestParam(defaultValue = "csv") String format
    ) {
        if ("csv".equalsIgnoreCase(format)) {
            byte[] file = deliveryReportService.exportCsv(startDate, endDate, status);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=deliveries.csv")
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(file);
        } else if ("pdf".equalsIgnoreCase(format)) {
            List<DeliveryReportRowDto> preview = deliveryReportService.preview(startDate, endDate, status);
            return ResponseEntity.ok(preview);
        } else {
            return ResponseEntity.badRequest().body("Unsupported format. Use csv|pdf");
        }
    }
}
