package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.audit.AuditLogDto;
import com.logiflow.server.models.AuditLog;
import com.logiflow.server.repositories.audit.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class AuditLogServiceImpl implements AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public void log(String action, String username, String role, String details) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setUsername(username);
        log.setRole(role);
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());
        log.setSuccess(true);
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

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableRoles() {
        return Arrays.asList("ADMIN", "DISPATCHER", "DRIVER", "MANAGER", "USER");
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAvailableActions() {
        return Arrays.asList(
            "LOGIN", "LOGOUT", "PASSWORD_CHANGE",
            "CREATE_USER", "UPDATE_USER", "TOGGLE_USER_STATUS",
            "CREATE_SETTING", "UPDATE_SETTING", "DELETE_SETTING",
            "CREATE_VEHICLE", "UPDATE_VEHICLE", "DELETE_VEHICLE",
            "CREATE_ROUTE", "UPDATE_ROUTE", "DELETE_ROUTE",
            "APPROVE_REGISTRATION", "REJECT_REGISTRATION",
            "UPDATE_REGISTRATION_REQUEST",
            // Trip management
            "TRIP_ASSIGNED", "TRIP_CANCELLED", "ADMIN_UPDATE_TRIP_STATUS",
            // Critical override actions
            "FORCE_DISPATCH_REST_VIOLATION", "MANUAL_SLA_EXTENSION",
            "OVERRIDE_TRIP_ASSIGNMENT", "BYPASS_COMPLIANCE_CHECK"
        );
    }

    private AuditLogDto toDto(AuditLog log) {
        return AuditLogDto.builder()
                .id(log.getId())
                .action(log.getAction())
                .username(log.getUsername())
                .role(log.getRole())
                .details(log.getDetails())
                .timestamp(log.getTimestamp())
                .success(log.getSuccess())
                .build();
    }
}
