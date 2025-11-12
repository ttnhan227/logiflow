package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.audit.AuditLogDto;
import com.logiflow.server.models.AuditLog;
import com.logiflow.server.repositories.audit.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class AuditLogServiceImpl implements AuditLogService {
    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void log(String action, String username, String role, String details) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setUsername(username);
        log.setRole(role);
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogDto> searchLogs(String username, String role, String action, LocalDateTime from, LocalDateTime to) {
        Stream<AuditLog> stream = auditLogRepository.searchLogsBase(username, role, action).stream();
        if (from != null) {
            stream = stream.filter(a -> !a.getTimestamp().isBefore(from));
        }
        if (to != null) {
            stream = stream.filter(a -> !a.getTimestamp().isAfter(to));
        }
        return stream
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private AuditLogDto toDto(AuditLog log) {
        return AuditLogDto.builder()
                .id(log.getId())
                .action(log.getAction())
                .username(log.getUsername())
                .role(log.getRole())
                .details(log.getDetails())
                .timestamp(log.getTimestamp())
                .build();
    }
}
