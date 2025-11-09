package com.logiflow.server.dtos.driver;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class DriverDtos {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TripSummaryDto {
        private Integer tripId;
        private String status;
        private String tripType;
        private LocalDateTime scheduledDeparture;
        private LocalDateTime scheduledArrival;
        private String routeName;        // gợi ý hiển thị
        private String vehiclePlate;     // gợi ý hiển thị
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TripDetailDto {
        private Integer tripId;
        private String status;
        private String tripType;
        private LocalDateTime scheduledDeparture;
        private LocalDateTime scheduledArrival;
        private LocalDateTime actualDeparture;
        private LocalDateTime actualArrival;

        private String routeName;
        private String originAddress;
        private String destinationAddress;

        private String vehicleType;
        private String vehiclePlate;
        private Integer vehicleCapacity;

        private List<OrderBrief> orders;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OrderBrief {
        private Integer orderId;
        private String customerName;
        private String pickupAddress;
        private String deliveryAddress;
        private String status;
        private String priority;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ScheduleItemDto {
        private Integer tripId;
        private LocalDateTime scheduledDeparture;
        private LocalDateTime scheduledArrival;
        private String status;
        private String routeName;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ComplianceDto {
        private BigDecimal hoursDrivenTotal;      // đã lái (tổng) — đơn giản
        private BigDecimal restRequiredHours;     // số giờ nghỉ còn phải nghỉ
        private LocalDateTime nextAvailableTime;  // từ DriverWorkLog.nextAvailableTime gần nhất
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateLocationRequest {
        private BigDecimal latitude;
        private BigDecimal longitude;
        private LocalDateTime timestamp;
    }
}
