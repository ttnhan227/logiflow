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
            dto.setFullName(d.getUser().getFullName());
            dto.setPhone(d.getUser().getPhone());
            dto.setLicenseType(d.getLicenseType());
            dto.setYearsExperience(d.getYearsExperience());
            dto.setHealthStatus(d.getHealthStatus());
            dto.setStatus(d.getStatus());
            dto.setRestRequiredHours(restRequired);
            dto.setNextAvailableTime(nextAvailable);
            return dto;
        }).filter(java.util.Objects::nonNull).collect(Collectors.toList());
    }

    @Override
    public List<?> getAllDrivers() {
        return driverRepository.findAll().stream()
                .map(this::toDriverDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<?> getAvailableDriversList() {
        return driverRepository.findByStatus("available").stream()
                .map(this::toDriverDto)
                .collect(Collectors.toList());
    }

    private DriverDto toDriverDto(Driver d) {
        Long totalTrips = driverWorkLogRepository.countByDriver_DriverId(d.getDriverId());
        String email = d.getUser() != null ? d.getUser().getEmail() : null;
        String fullName = d.getUser() != null ? d.getUser().getFullName() : null;
        String phone = d.getUser() != null ? d.getUser().getPhone() : null;
        return new DriverDto(
                d.getDriverId(),
                fullName,
                phone,
                d.getLicenseType(),
                email,
                d.getLicenseNumber(),
                d.getLicenseExpiryDate(),
                d.getRating() != null ? d.getRating().doubleValue() : 0.0,
                totalTrips != null ? totalTrips : 0L,
                d.getStatus()
        );
    }

    public static class DriverDto {
        private Integer driverId;
        private String fullName;
        private String phone;
        private String licenseType;
        private String email;
        private String licenseNumber;
        private java.time.LocalDate licenseExpiryDate;
        private Double rating;
        private Long totalTrips;
        private String status;

        public DriverDto(Integer driverId, String fullName, String phone, String licenseType, String email, 
                        String licenseNumber, java.time.LocalDate licenseExpiryDate, 
                        Double rating, Long totalTrips, String status) {
            this.driverId = driverId;
            this.fullName = fullName;
            this.phone = phone;
            this.licenseType = licenseType;
            this.email = email;
            this.licenseNumber = licenseNumber;
            this.licenseExpiryDate = licenseExpiryDate;
            this.rating = rating;
            this.totalTrips = totalTrips;
            this.status = status;
        }

        // Getters
        public Integer getDriverId() { return driverId; }
        public String getFullName() { return fullName; }
        public String getPhone() { return phone; }
        public String getLicenseType() { return licenseType; }
        public String getEmail() { return email; }
        public String getLicenseNumber() { return licenseNumber; }
        public java.time.LocalDate getLicenseExpiryDate() { return licenseExpiryDate; }
        public Double getRating() { return rating; }
        public Long getTotalTrips() { return totalTrips; }
        public String getStatus() { return status; }
    }
}
