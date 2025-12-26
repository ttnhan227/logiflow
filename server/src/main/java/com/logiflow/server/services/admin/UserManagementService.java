package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.user_management.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface UserManagementService {

    // Create user
    UserDto createUser(UserCreationDto userCreationDto);

    // Update user
    UserDto updateUser(UserUpdateDto userUpdateDto);

    // Deactivate/Activate user
    UserDto toggleUserActiveStatus(Integer userId);

    // Get user by ID
    Optional<UserDto> getUserById(Integer userId);

    // Get all users with pagination
    Page<UserDto> getUsers(Pageable pageable);

    // Get users by role
    List<UserDto> getUsersByRole(String roleName);

    // Get active users
    List<UserDto> getActiveUsers();

    // Search users by username or email
    Page<UserDto> searchUsers(String searchTerm, Pageable pageable);

    // Role-specific methods
    Page<DriverUserDto> getDrivers(Pageable pageable);
    Page<CustomerUserDto> getCustomers(Pageable pageable);
    Page<DispatcherUserDto> getDispatchers(Pageable pageable);

    Page<DriverUserDto> searchDrivers(String searchTerm, Pageable pageable);
    Page<CustomerUserDto> searchCustomers(String searchTerm, Pageable pageable);
    Page<DispatcherUserDto> searchDispatchers(String searchTerm, Pageable pageable);
}
