package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.AvailableDriverDto;
import com.logiflow.server.models.Driver;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DispatchDriverServiceImpl implements DispatchDriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private DriverWorkLogRepository driverWorkLogRepository;

    @Override
    public List<AvailableDriverDto> getAvailableDrivers(LocalDateTime at) {
        List<Driver> candidates = driverRepository.findAvailableDrivers();

        return candidates.stream().map(d -> {
            BigDecimal hours = driverWorkLogRepository.sumHoursWorkedByDriverId(d.getDriverId());
            BigDecimal restRequired = hours != null && hours.compareTo(new BigDecimal("8.00")) >= 0
                    ? new BigDecimal("8.00")
                    : BigDecimal.ZERO;
            LocalDateTime nextAvailable = driverWorkLogRepository.findLatestNextAvailableTimeByDriverId(d.getDriverId());

            boolean availableNow = true;
            if (nextAvailable != null && at != null && at.isBefore(nextAvailable)) {
                availableNow = false;
            }

            if (!availableNow) {
                return null; // filter out not available at 'at'
            }

            AvailableDriverDto dto = new AvailableDriverDto();
            dto.setDriverId(d.getDriverId());
            dto.setFullName(d.getFullName());
            dto.setPhone(d.getPhone());
            dto.setLicenseType(d.getLicenseType());
            dto.setYearsExperience(d.getYearsExperience());
            dto.setHealthStatus(d.getHealthStatus());
            dto.setStatus(d.getStatus());
            dto.setRestRequiredHours(restRequired);
            dto.setNextAvailableTime(nextAvailable);
            return dto;
        }).filter(java.util.Objects::nonNull).collect(Collectors.toList());
    }
}
