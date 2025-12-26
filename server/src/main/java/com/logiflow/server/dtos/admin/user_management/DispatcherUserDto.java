package com.logiflow.server.dtos.admin.user_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for dispatcher user data in admin user management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatcherUserDto {
    // Base user fields
    private Integer userId;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String profilePictureUrl;
    private String roleName;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    // Dispatcher-specific fields (may be added later if needed)
    // For now, dispatchers only have base user fields

    // Factory method for better readability
    public static DispatcherUserDto fromUser(
            Integer userId, String username, String email, String fullName, String phone,
            String profilePictureUrl, String roleName, Boolean isActive, LocalDateTime createdAt, LocalDateTime lastLogin) {

        return DispatcherUserDto.builder()
                .userId(userId)
                .username(username)
                .email(email)
                .fullName(fullName)
                .phone(phone)
                .profilePictureUrl(profilePictureUrl)
                .roleName(roleName)
                .isActive(isActive)
                .createdAt(createdAt)
                .lastLogin(lastLogin)
                .build();
    }
}
