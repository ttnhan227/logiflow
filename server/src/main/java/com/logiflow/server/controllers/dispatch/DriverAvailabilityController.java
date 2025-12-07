package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.AvailableDriverDto;
import com.logiflow.server.services.dispatch.DispatchDriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/dispatch")
public class DriverAvailabilityController {

    @Autowired
    private DispatchDriverService dispatchDriverService;

    @GetMapping("/drivers/availability")
    public ResponseEntity<List<AvailableDriverDto>> getAvailableDrivers(
            @RequestParam(name = "datetime", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime datetime
    ) {
        List<AvailableDriverDto> result = dispatchDriverService.getAvailableDrivers(datetime != null ? datetime : LocalDateTime.now());
        return ResponseEntity.ok(result);
    }
}
