package com.logiflow.server.services.manager.compliance;

import com.logiflow.server.dtos.manager.compliance.ComplianceCheckDto;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.DriverWorkLog;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.manager.compliance.ComplianceRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ComplianceServiceImpl implements ComplianceService {

    private final DriverRepository driverRepository;
    private final ComplianceRepository complianceRepository;

    public ComplianceServiceImpl(DriverRepository driverRepository,
                                 ComplianceRepository complianceRepository) {
        this.driverRepository = driverRepository;
        this.complianceRepository = complianceRepository;
    }

    @Override
    public ComplianceCheckDto check() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<String> violations = new ArrayList<>();

        List<Driver> drivers = driverRepository.findAll();
        for (Driver d : drivers) {
            double hours24 = 0.0;

            List<DriverWorkLog> logs = complianceRepository.findDriverLogsAfter(d.getDriverId(), since);
            for (DriverWorkLog l : logs) {
                if (l.getHoursWorked() != null) {
                    // hoursWorked là BigDecimal -> đổi sang double
                    hours24 += l.getHoursWorked().doubleValue();
                } else if (l.getStartTime() != null && l.getEndTime() != null) {
                    Duration dur = Duration.between(l.getStartTime(), l.getEndTime());
                    hours24 += dur.toMinutes() / 60.0;
                }
            }

            if (hours24 > 10.0) {
                double shown = Math.round(hours24 * 10.0) / 10.0;
                violations.add("Tài xế " + d.getFullName() + " vượt 10h/24h (" + shown + "h)");
            }
        }

        boolean ok = violations.isEmpty();
        return new ComplianceCheckDto(ok, violations);
    }
}
