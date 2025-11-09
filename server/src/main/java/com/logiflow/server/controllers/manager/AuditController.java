package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.audit.AuditActivityDto;
import com.logiflow.server.services.manager.audit.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    // 10) Nhật ký hoạt động
    @GetMapping("/activities")
    public ResponseEntity<List<AuditActivityDto>> activities() {
        return ResponseEntity.ok(auditService.activities());
    }
}
