package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.user_management.UserDto;
import com.logiflow.server.dtos.admin.user_management.UserCreationDto;
import com.logiflow.server.dtos.admin.user_management.UserUpdateDto;
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

    // Delete user (soft delete)
    void deleteUser(Integer userId);

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
}
