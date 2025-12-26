package com.logiflow.server.dtos.admin.user_management;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for customer user data in admin user management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerUserDto {
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

    // Customer-specific fields
    private String companyName;
    private String companyCode;
    private String defaultDeliveryAddress;
    private String preferredPaymentMethod;
    private Integer totalOrders;
    private BigDecimal totalSpent;
    private LocalDateTime lastOrderDate;

    // Factory method for better readability
    public static CustomerUserDto fromUserAndCustomer(
            Integer userId, String username, String email, String fullName, String phone,
            String profilePictureUrl, String roleName, Boolean isActive, LocalDateTime createdAt, LocalDateTime lastLogin,
            String companyName, String companyCode, String defaultDeliveryAddress, String preferredPaymentMethod,
            Integer totalOrders, BigDecimal totalSpent, LocalDateTime lastOrderDate) {

        return CustomerUserDto.builder()
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
                .companyName(companyName)
                .companyCode(companyCode)
                .defaultDeliveryAddress(defaultDeliveryAddress)
                .preferredPaymentMethod(preferredPaymentMethod)
                .totalOrders(totalOrders)
                .totalSpent(totalSpent)
                .lastOrderDate(lastOrderDate)
                .build();
    }
}
