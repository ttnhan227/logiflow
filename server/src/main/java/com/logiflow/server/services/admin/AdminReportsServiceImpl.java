package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.reports.*;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of AdminReportsService for generating reports and analytics
 */
@Service
public class AdminReportsServiceImpl implements AdminReportsService {

    private final TripRepository tripRepository;
    private final OrderRepository orderRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    public AdminReportsServiceImpl(
            TripRepository tripRepository,
            OrderRepository orderRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository) {
        this.tripRepository = tripRepository;
        this.orderRepository = orderRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PerformanceReportDto getPerformanceReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // Get trips in date range
        List<Trip> trips = tripRepository.findByScheduledDepartureBetween(startDateTime, endDateTime);
        
        long totalTrips = trips.size();
        long completedTrips = trips.stream().filter(t -> "completed".equals(t.getStatus())).count();
        long cancelledTrips = trips.stream().filter(t -> "cancelled".equals(t.getStatus())).count();
        
        double completionRate = totalTrips > 0 ? (completedTrips * 100.0 / totalTrips) : 0.0;
        
        // Calculate average delivery time
        double avgDeliveryTime = trips.stream()
            .filter(t -> t.getActualArrival() != null && t.getScheduledDeparture() != null)
            .mapToLong(t -> Duration.between(t.getScheduledDeparture(), t.getActualArrival()).toMinutes())
            .average()
            .orElse(0.0);
        
        // Calculate revenue using dashboard approach - query DELIVERED orders directly
        BigDecimal totalRevenue = orderRepository.sumShippingFeeByStatusAndDateRange(
            Order.OrderStatus.DELIVERED, startDateTime, endDateTime);
        
        List<Order> completedOrders = orderRepository.findByOrderStatusAndDateRange(
            Order.OrderStatus.DELIVERED, startDateTime, endDateTime);
        
        long completedOrdersCount = completedOrders.size();
        BigDecimal avgRevenue = completedOrdersCount > 0 
            ? totalRevenue.divide(BigDecimal.valueOf(completedOrdersCount), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        // Active drivers
        int activeDrivers = (int) driverRepository.findAll().stream()
            .filter(d -> "available".equals(d.getStatus()))
            .count();
        double avgTripsPerDriver = activeDrivers > 0 ? (double) totalTrips / activeDrivers : 0.0;
        
        // Calculate daily stats
        List<DailyTripStatsDto> dailyStats = calculateDailyStats(trips);
        
        return PerformanceReportDto.builder()
            .startDate(startDate)
            .endDate(endDate)
            .totalTrips(totalTrips)
            .completedTrips(completedTrips)
            .cancelledTrips(cancelledTrips)
            .completionRate(Math.round(completionRate * 10.0) / 10.0)
            .averageDeliveryTimeMinutes(Math.round(avgDeliveryTime * 10.0) / 10.0)
            .totalRevenue(totalRevenue)
            .averageRevenuePerTrip(avgRevenue)
            .totalActiveDrivers(activeDrivers)
            .averageTripsPerDriver(Math.round(avgTripsPerDriver * 10.0) / 10.0)
            .dailyStats(dailyStats)
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CostAnalysisDto getCostAnalysis(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // Use dashboard approach - query DELIVERED orders directly
        BigDecimal totalRevenue = orderRepository.sumShippingFeeByStatusAndDateRange(
            Order.OrderStatus.DELIVERED, startDateTime, endDateTime);
        
        long totalOrders = orderRepository.findByOrderStatusAndDateRange(
            Order.OrderStatus.DELIVERED, startDateTime, endDateTime).size();
        
        // Get completed trips for vehicle analysis
        List<Trip> completedTrips = tripRepository.findByStatusAndScheduledDepartureBetween(
            "completed", startDateTime, endDateTime);
        long totalTrips = completedTrips.size();
        
        double avgCostPerTrip = totalOrders > 0 
            ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP).doubleValue()
            : 0.0;
        
        // Vehicle statistics
        int totalVehicles = (int) vehicleRepository.count();
        int activeVehicles = (int) vehicleRepository.countByStatus("in_use");
        double utilizationRate = totalVehicles > 0 ? (activeVehicles * 100.0 / totalVehicles) : 0.0;
        
        // Group by vehicle type
        List<VehicleTypeCostDto> vehicleTypeCosts = calculateVehicleTypeCosts(completedTrips);
        
        return CostAnalysisDto.builder()
            .startDate(startDate)
            .endDate(endDate)
            .totalRevenue(totalRevenue)
            .totalTrips(totalTrips)
            .averageCostPerTrip(Math.round(avgCostPerTrip * 100.0) / 100.0)
            .totalVehicles(totalVehicles)
            .activeVehicles(activeVehicles)
            .vehicleUtilizationRate(Math.round(utilizationRate * 10.0) / 10.0)
            .vehicleTypeCosts(vehicleTypeCosts)
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ComplianceReportDto getComplianceReport(LocalDate startDate, LocalDate endDate) {
        List<Driver> allDrivers = driverRepository.findAll();
        int totalDrivers = allDrivers.size();
        
        // Note: License expiry tracking not implemented in current model
        // Using placeholder values based on driver status
        int validLicense = (int) allDrivers.stream()
            .filter(d -> "available".equals(d.getStatus()) || "on_duty".equals(d.getStatus()))
            .count();
        
        int expiredLicense = (int) allDrivers.stream()
            .filter(d -> "inactive".equals(d.getStatus()))
            .count();
        
        int expiringSoon = 0; // Placeholder - requires license_expiry_date field in Driver model
        
        // Vehicle compliance
        int totalVehicles = (int) vehicleRepository.count();
        int activeVehicles = (int) vehicleRepository.countByStatus("in_use");
        int inactiveVehicles = totalVehicles - activeVehicles;
        
        double complianceRate = totalDrivers > 0 ? (validLicense * 100.0 / totalDrivers) : 100.0;
        
        return ComplianceReportDto.builder()
            .startDate(startDate)
            .endDate(endDate)
            .totalDrivers(totalDrivers)
            .driversWithValidLicense(validLicense)
            .driversWithExpiredLicense(expiredLicense)
            .driversWithExpiringSoonLicense(expiringSoon)
            .totalVehicles(totalVehicles)
            .vehiclesActive(activeVehicles)
            .vehiclesInactive(inactiveVehicles)
            .overallComplianceRate(Math.round(complianceRate * 10.0) / 10.0)
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverPerformanceDto> getDriverPerformance(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // Only include drivers whose linked user has role DRIVER
        List<Driver> drivers = driverRepository.findAll().stream()
            .filter(driver -> driver.getUser() != null &&
                driver.getUser().getRole() != null &&
                "DRIVER".equalsIgnoreCase(driver.getUser().getRole().getRoleName()))
            .collect(Collectors.toList());

        return drivers.stream()
            .map(driver -> {
                List<Trip> driverTrips = tripRepository.findByDriverAndScheduledDepartureBetween(
                    driver, startDateTime, endDateTime);
                
                long completed = driverTrips.stream().filter(t -> "completed".equals(t.getStatus())).count();
                long cancelled = driverTrips.stream().filter(t -> "cancelled".equals(t.getStatus())).count();
                long total = driverTrips.size();
                
                double completionRate = total > 0 ? (completed * 100.0 / total) : 0.0;
                
                double avgDeliveryTime = driverTrips.stream()
                    .filter(t -> t.getActualArrival() != null && t.getScheduledDeparture() != null)
                    .mapToLong(t -> Duration.between(t.getScheduledDeparture(), t.getActualArrival()).toMinutes())
                    .average()
                    .orElse(0.0);
                
        // Calculate revenue from DELIVERED orders for this driver's completed trips
                List<Integer> completedTripIds = driverTrips.stream()
                    .filter(t -> "completed".equals(t.getStatus()))
                    .map(Trip::getTripId)
                    .collect(Collectors.toList());

                BigDecimal revenue = completedTripIds.isEmpty() ? BigDecimal.ZERO :
                    orderRepository.findAll().stream()
                        .filter(o -> o.getTrip() != null && completedTripIds.contains(o.getTrip().getTripId()))
                        .filter(o -> Order.OrderStatus.DELIVERED.equals(o.getOrderStatus()))
                        .filter(o -> o.getShippingFee() != null)
                        .map(Order::getShippingFee)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                return DriverPerformanceDto.builder()
                    .driverId(driver.getDriverId())
                    .driverName(driver.getUser().getFullName())
                    .email(driver.getUser().getEmail())
                    .phone(driver.getUser().getPhone())
                    .totalTripsCompleted(completed)
                    .totalTripsCancelled(cancelled)
                    .completionRate(Math.round(completionRate * 10.0) / 10.0)
                    .averageDeliveryTimeMinutes(Math.round(avgDeliveryTime * 10.0) / 10.0)
                    .totalRevenue(revenue)
                    .status(driver.getStatus())
                    .build();
            })
            .sorted((d1, d2) -> Long.compare(d2.getTotalTripsCompleted(), d1.getTotalTripsCompleted()))
            .collect(Collectors.toList());
    }

    // Helper methods
    
    private List<DailyTripStatsDto> calculateDailyStats(List<Trip> trips) {
        Map<LocalDate, List<Trip>> tripsByDate = trips.stream()
            .collect(Collectors.groupingBy(t -> t.getScheduledDeparture().toLocalDate()));
        
        return tripsByDate.entrySet().stream()
            .map(entry -> {
                LocalDate date = entry.getKey();
                List<Trip> dayTrips = entry.getValue();
                
                long total = dayTrips.size();
                long completed = dayTrips.stream().filter(t -> "completed".equals(t.getStatus())).count();
                long cancelled = dayTrips.stream().filter(t -> "cancelled".equals(t.getStatus())).count();
                
                // Calculate revenue from DELIVERED orders for this day
                LocalDateTime dayStart = date.atStartOfDay();
                LocalDateTime dayEnd = date.atTime(LocalTime.MAX);
                BigDecimal revenue = orderRepository.sumShippingFeeByStatusAndDateRange(
                    Order.OrderStatus.DELIVERED, dayStart, dayEnd);
                
                double avgTime = dayTrips.stream()
                    .filter(t -> t.getActualArrival() != null && t.getScheduledDeparture() != null)
                    .mapToLong(t -> Duration.between(t.getScheduledDeparture(), t.getActualArrival()).toMinutes())
                    .average()
                    .orElse(0.0);
                
                return DailyTripStatsDto.builder()
                    .date(date)
                    .totalTrips(total)
                    .completedTrips(completed)
                    .cancelledTrips(cancelled)
                    .revenue(revenue)
                    .averageDeliveryTimeMinutes(Math.round(avgTime * 10.0) / 10.0)
                    .build();
            })
            .sorted((d1, d2) -> d1.getDate().compareTo(d2.getDate()))
            .collect(Collectors.toList());
    }
    
    private List<VehicleTypeCostDto> calculateVehicleTypeCosts(List<Trip> completedTrips) {
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        
        Map<String, List<Vehicle>> vehiclesByType = allVehicles.stream()
            .collect(Collectors.groupingBy(Vehicle::getVehicleType));
        
        return vehiclesByType.entrySet().stream()
            .map(entry -> {
                String type = entry.getKey();
                List<Vehicle> vehicles = entry.getValue();
                
                int total = vehicles.size();
                int active = (int) vehicles.stream()
                    .filter(v -> "in_use".equals(v.getStatus()))
                    .count();
                
                long tripsCount = completedTrips.stream()
                    .filter(t -> t.getVehicle() != null && type.equals(t.getVehicle().getVehicleType()))
                    .count();
                
                double utilization = total > 0 ? (active * 100.0 / total) : 0.0;
                
                return VehicleTypeCostDto.builder()
                    .vehicleType(type)
                    .totalVehicles(total)
                    .activeVehicles(active)
                    .tripsCompleted(tripsCount)
                    .utilizationRate(Math.round(utilization * 10.0) / 10.0)
                    .build();
            })
            .collect(Collectors.toList());
    }
}
