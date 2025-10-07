package com.logiflow.server.services.user;

import com.logiflow.server.dtos.user.ProfileDto;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class ProfileServiceImpl implements ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private TripAssignmentRepository tripAssignmentRepository;

    @Autowired
    private DriverWorkLogRepository driverWorkLogRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    public ProfileDto getProfile(String username) {
        User user = userRepository.findByUsernameWithRole(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return buildProfileDto(user);
    }

    @Override
    public ProfileDto getProfileByUserId(Integer userId) {
        User user = userRepository.findByIdWithRole(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return buildProfileDto(user);
    }

    private ProfileDto buildProfileDto(User user) {
        ProfileDto profileDto = new ProfileDto();

        // Set user details
        profileDto.setUserId(user.getUserId());
        profileDto.setUsername(user.getUsername());
        profileDto.setEmail(user.getEmail());
        profileDto.setIsActive(user.getIsActive());
        profileDto.setLastLogin(user.getLastLogin());
        profileDto.setCreatedAt(user.getCreatedAt());

        if (user.getRole() != null) {
            profileDto.setRoleName(user.getRole().getRoleName());
            profileDto.setRoleDescription(user.getRole().getDescription());
        }

        // Check if user is a driver and get driver details
        Optional<Driver> driverOpt = driverRepository.findByUserId(user.getUserId());
        if (driverOpt.isPresent()) {
            Driver driver = driverOpt.get();
            profileDto.setIsDriver(true);
            profileDto.setDriverId(driver.getDriverId());
            profileDto.setFullName(driver.getFullName());
            profileDto.setPhone(driver.getPhone());
            profileDto.setLicenseType(driver.getLicenseType());
            profileDto.setYearsExperience(driver.getYearsExperience());
            profileDto.setHealthStatus(driver.getHealthStatus().toString());
            profileDto.setCurrentLocationLat(driver.getCurrentLocationLat());
            profileDto.setCurrentLocationLng(driver.getCurrentLocationLng());
            profileDto.setDriverStatus(driver.getStatus());

            // Get statistics for driver
            Long totalTrips = tripAssignmentRepository.countByDriverId(driver.getDriverId());
            Long completedTrips = tripAssignmentRepository.countCompletedByDriverId(driver.getDriverId());
            BigDecimal totalHoursWorked = driverWorkLogRepository.sumHoursWorkedByDriverId(driver.getDriverId());
            Long totalOrders = orderRepository.countByDriverTrips(driver.getDriverId());

            profileDto.setTotalTrips(totalTrips != null ? totalTrips.intValue() : 0);
            profileDto.setCompletedTrips(completedTrips != null ? completedTrips.intValue() : 0);
            profileDto.setTotalHoursWorked(totalHoursWorked != null ? totalHoursWorked : BigDecimal.ZERO);
            profileDto.setTotalOrders(totalOrders != null ? totalOrders.intValue() : 0);
        } else {
            profileDto.setIsDriver(false);
            profileDto.setTotalTrips(0);
            profileDto.setCompletedTrips(0);
            profileDto.setTotalHoursWorked(BigDecimal.ZERO);
            profileDto.setTotalOrders(0);
        }

        return profileDto;
    }
}
