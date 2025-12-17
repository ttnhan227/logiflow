package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.reports.DispatchDailyReportItemDto;
import com.logiflow.server.services.dispatch.DispatchReportsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatch/reports")
public class DispatchReportsController {

    private final DispatchReportsService dispatchReportsService;

    public DispatchReportsController(DispatchReportsService dispatchReportsService) {
        this.dispatchReportsService = dispatchReportsService;
    }

    @GetMapping("/daily")
        public ResponseEntity<?> getDailyReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
        ) {
        try {
            LocalDate end = parseDate(endDate);
            if (end == null) end = LocalDate.now();

            LocalDate start = parseDate(startDate);
            if (start == null) start = end.minusDays(30);

            List<DispatchDailyReportItemDto> report = dispatchReportsService.getDailyReport(start, end);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.trim().isEmpty()) return null;
        String s = raw.trim();
        try {
            return LocalDate.parse(s);
        } catch (Exception ignored) { }
        try {
            return LocalDate.parse(s, java.time.format.DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        } catch (Exception ignored) { }
        // Fallback: if unparsable, return null so service uses defaults
        return null;
    }
}
