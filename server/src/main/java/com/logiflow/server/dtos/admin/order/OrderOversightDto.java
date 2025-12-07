package com.logiflow.server.dtos.admin.order;

import com.logiflow.server.dtos.admin.order.DriverSummaryDto;
import com.logiflow.server.dtos.admin.order.VehicleSummaryDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.dtos.driver.DriverDtos.TripSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderOversightDto {
    private Integer orderId;
    private Integer tripId;
    private String customerName;
    private String customerPhone;
    private String pickupAddress;
    private String deliveryAddress;
    private String packageDetails;
    private java.math.BigDecimal distanceKm;
    private java.math.BigDecimal weightTon;
    private java.math.BigDecimal packageValue;
    private java.math.BigDecimal shippingFee;
    private Integer createdByUserId;
    private String createdByUsername;
    private Order.PriorityLevel priorityLevel;
    private Order.OrderStatus orderStatus;
    private LocalDateTime createdAt;
    private LocalDateTime slaDue;
    private LocalDateTime eta;
    private String delayReason;
    private Integer slaExtensionMinutes;
    private TripSummaryDto trip;
    private DriverSummaryDto driver;
    private VehicleSummaryDto vehicle;



    public static OrderOversightDto fromOrder(Order order) {
        OrderOversightDto dto = new OrderOversightDto();
        dto.setOrderId(order.getOrderId());
        dto.setTripId(order.getTrip() != null ? order.getTrip().getTripId() : null);
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerPhone(order.getCustomerPhone());
        dto.setPickupAddress(order.getPickupAddress());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setPackageDetails(order.getPackageDetails());
        dto.setDistanceKm(order.getDistanceKm());
        dto.setWeightTon(order.getWeightKg() != null ? order.getWeightKg().divide(new java.math.BigDecimal("1000"), 2, java.math.RoundingMode.HALF_UP) : null);
        dto.setPackageValue(order.getPackageValue());
        dto.setShippingFee(order.getShippingFee());
        dto.setCreatedByUserId(order.getCreatedBy() != null ? order.getCreatedBy().getUserId() : null);
        dto.setCreatedByUsername(order.getCreatedBy() != null ? order.getCreatedBy().getUsername() : null);
        dto.setPriorityLevel(order.getPriorityLevel());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setDelayReason(order.getDelayReason());
        dto.setSlaExtensionMinutes(order.getSlaExtensionMinutes());
        dto.setSlaDue(calculateSlaDue(order));
        dto.setEta(calculateEta(order));
        if (order.getTrip() != null) {
            dto.setTrip(TripSummaryDto.fromTrip(order.getTrip()));
            dto.setVehicle(VehicleSummaryDto.fromVehicle(order.getTrip().getVehicle()));
            // Find active driver assignment
            if (order.getTrip().getTripAssignments() != null && !order.getTrip().getTripAssignments().isEmpty()) {
                var activeAssignment = order.getTrip().getTripAssignments().stream()
                        .filter(ta -> "assigned".equalsIgnoreCase(ta.getStatus())
                                || "accepted".equalsIgnoreCase(ta.getStatus())
                                || "in_progress".equalsIgnoreCase(ta.getStatus())
                                || "completed".equalsIgnoreCase(ta.getStatus()))
                        .findFirst();
                if (activeAssignment.isPresent()) {
                    var driver = activeAssignment.get().getDriver();
                    dto.setDriver(DriverSummaryDto.fromDriver(driver, new java.util.ArrayList<>()));
                }
            }
        }
        return dto;
    }



    private static LocalDateTime calculateSlaDue(Order order) {
        if (order.getCreatedAt() == null) return null;
        // Urgent: 4 hours, Normal: 24 hours
        int hoursToAdd = order.getPriorityLevel() == Order.PriorityLevel.URGENT ? 4 : 24;
        LocalDateTime slaDue = order.getCreatedAt().plusHours(hoursToAdd);
        // Add any SLA extensions from delays
        if (order.getSlaExtensionMinutes() != null && order.getSlaExtensionMinutes() > 0) {
            slaDue = slaDue.plusMinutes(order.getSlaExtensionMinutes());
        }
        return slaDue;
    }

    private static LocalDateTime calculateEta(Order order) {
        if (order.getTrip() == null) return null;
        // Use scheduled arrival if available
        if (order.getTrip().getScheduledArrival() != null) {
            return order.getTrip().getScheduledArrival();
        }
        // Fallback: estimate based on distance (avg 40km/h)
        if (order.getDistanceKm() != null && order.getCreatedAt() != null) {
            double hours = order.getDistanceKm().doubleValue() / 40.0;
            return order.getCreatedAt().plusMinutes((long)(hours * 60));
        }
        return null;
    }
}


