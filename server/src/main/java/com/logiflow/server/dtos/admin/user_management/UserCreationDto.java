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
 * DTO for creating new users in admin user management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreationDto {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;

    @NotNull(message = "Role ID is required")
    private Integer roleId;

    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String fullName;

    @Size(max = 20, message = "Phone must be at most 20 characters")
    private String phone;

    @Size(max = 500, message = "Profile picture URL must be at most 500 characters")
    private String profilePictureUrl;

    // Factory method for better readability
    public static UserCreationDto of(String username, String email, String password, Integer roleId) {
        return UserCreationDto.builder()
                .username(username)
                .email(email)
                .password(password)
                .roleId(roleId)
                .build();
    }
}
