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
import org.springframework.beans.factory.annotation.Autowired;
import com.logiflow.server.services.file.FileStorageService;

@Service
public class ProfileServiceImpl implements ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

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

    @Override
    public ProfileDto updateProfile(String username, com.logiflow.server.dtos.user.ProfileUpdateDto profileUpdateDto) {
        User user = userRepository.findByUsernameWithRole(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String oldProfilePicture = user.getProfilePictureUrl();

        // If email is being updated, ensure uniqueness
        if (profileUpdateDto.getEmail() != null && !profileUpdateDto.getEmail().equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(profileUpdateDto.getEmail()).ifPresent(u -> {
                throw new RuntimeException("Email already exists");
            });
            user.setEmail(profileUpdateDto.getEmail());
        }

        if (profileUpdateDto.getFullName() != null) {
            user.setFullName(profileUpdateDto.getFullName());
        }
        if (profileUpdateDto.getPhone() != null) {
            user.setPhone(profileUpdateDto.getPhone());
        }
        if (profileUpdateDto.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(profileUpdateDto.getProfilePictureUrl());
        }

        User saved = userRepository.save(user);

        // If profile picture changed, attempt to delete the old file if it's local and not referenced by others
        try {
            if (oldProfilePicture != null && !oldProfilePicture.equals(saved.getProfilePictureUrl())) {
                int refs = userRepository.countByProfilePictureUrl(oldProfilePicture);
                if (refs <= 0) {
                    // no other users reference it, delete safely
                    try {
                        fileStorageService.deleteProfilePicture(oldProfilePicture);
                    } catch (Exception ex) {
                        // ignore deletion errors to avoid failing the update
                    }
                }
            }
        } catch (Exception ex) {
            // swallow to avoid failing the update when deletion fails
        }

        return buildProfileDto(saved);
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
            int totalOrders = orderRepository.countByDriverTrips(driver.getDriverId());

            profileDto.setTotalTrips(totalTrips != null ? totalTrips.intValue() : 0);
            profileDto.setCompletedTrips(completedTrips != null ? completedTrips.intValue() : 0);
            profileDto.setTotalOrders(totalOrders);
            profileDto.setTotalHoursWorked(totalHoursWorked != null ? totalHoursWorked : BigDecimal.ZERO);
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
