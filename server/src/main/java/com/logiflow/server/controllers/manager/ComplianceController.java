package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.compliance.ComplianceCheckDto;
import com.logiflow.server.services.manager.compliance.ComplianceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/compliance")
public class ComplianceController {

    private final ComplianceService complianceService;

    public ComplianceController(ComplianceService complianceService) {
        this.complianceService = complianceService;
    }

    // 7) Kiểm tra tuân thủ
    @GetMapping("/check")
    public ResponseEntity<ComplianceCheckDto> check() {
        return ResponseEntity.ok(complianceService.check());
    }
}
