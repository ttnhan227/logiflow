package com.logiflow.server.controllers.manager;

import com.logiflow.server.dtos.manager.dispatch.DispatchSummaryDto;
import com.logiflow.server.services.manager.dispatch.DispatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/operations/dispatch")
public class DispatchController {

    private final DispatchService dispatchService;

    public DispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    // 5) Tổng hợp công việc điều phối
    @GetMapping("/summary")
    public ResponseEntity<DispatchSummaryDto> summary() {
        return ResponseEntity.ok(dispatchService.getSummary());
    }
}
