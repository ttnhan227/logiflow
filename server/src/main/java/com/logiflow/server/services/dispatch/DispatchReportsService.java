package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.reports.DispatchDailyReportItemDto;

import java.time.LocalDate;
import java.util.List;

public interface DispatchReportsService {
    List<DispatchDailyReportItemDto> getDailyReport(LocalDate startDate, LocalDate endDate);
}
