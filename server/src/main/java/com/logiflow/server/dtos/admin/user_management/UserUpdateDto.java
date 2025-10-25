package com.logiflow.server.dtos.admin.user_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating users in admin user management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDto {
    @NotNull(message = "User ID is required")
    private Integer userId;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    private Integer roleId;

    private Boolean isActive;

    // Factory method for better readability
    public static UserUpdateDto of(Integer userId, String username, String email, Integer roleId, Boolean isActive) {
        return UserUpdateDto.builder()
                .userId(userId)
                .username(username)
                .email(email)
                .roleId(roleId)
                .isActive(isActive)
                .build();
    }
}
