package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.audit.AuditLogDto;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogService {
    void log(String action, String username, String role, String details);
    List<AuditLogDto> searchLogs(String username, String role, String action, LocalDateTime from, LocalDateTime to);
}
