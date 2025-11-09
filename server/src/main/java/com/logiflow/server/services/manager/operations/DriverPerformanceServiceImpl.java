package com.logiflow.server.services.manager.operations;

import com.logiflow.server.dtos.manager.operations.DriverPerformanceDto;
import com.logiflow.server.models.Driver;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.manager.operations.DriverPerfRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DriverPerformanceServiceImpl implements DriverPerformanceService {

    private final DriverRepository driverRepository;
    private final DriverPerfRepository driverPerfRepository;

    public DriverPerformanceServiceImpl(DriverRepository driverRepository,
                                        DriverPerfRepository driverPerfRepository) {
        this.driverRepository = driverRepository;
        this.driverPerfRepository = driverPerfRepository;
    }

    @Override
    public List<DriverPerformanceDto> getDriversPerformance() {
        List<Driver> drivers = driverRepository.findAll();
        List<DriverPerformanceDto> result = new ArrayList<>(drivers.size());
        for (Driver d : drivers) {
            long assigned = driverPerfRepository.countAssignments(d.getDriverId());
            long completed = driverPerfRepository.countCompleted(d.getDriverId());
            double cr = assigned == 0 ? 0.0 : (completed * 100.0 / assigned);
            double crRounded = Math.round(cr * 10.0) / 10.0;

            DriverPerformanceDto dto = new DriverPerformanceDto(
                    d.getDriverId(),
                    d.getFullName(),
                    assigned,
                    completed,
                    crRounded
            );
            result.add(dto);
        }
        return result;
    }
}
