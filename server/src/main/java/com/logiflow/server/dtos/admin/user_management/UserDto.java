package com.logiflow.server.dtos.admin.user_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for user data in admin user management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
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

    // Factory method for better readability
    public static UserDto fromUser(
            Integer userId, String username, String email, String fullName, String phone,
            String profilePictureUrl, String roleName, Boolean isActive, LocalDateTime createdAt, LocalDateTime lastLogin) {

        return UserDto.builder()
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
