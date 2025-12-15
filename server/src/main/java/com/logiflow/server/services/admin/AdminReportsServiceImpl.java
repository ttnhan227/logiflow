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
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Arrays;

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

        // 🔧 OPTIMIZATION: Only include drivers whose linked user has role DRIVER
        List<Driver> drivers = driverRepository.findAll().stream()
            .filter(driver -> driver.getUser() != null &&
                driver.getUser().getRole() != null &&
                "DRIVER".equalsIgnoreCase(driver.getUser().getRole().getRoleName()))
            .collect(Collectors.toList());

        // 🔧 OPTIMIZATION: TWO EFFICIENT QUERIES - Fetch all data upfront
        // 1. Get ALL trips in date range (single query)
        List<Trip> allTripsInRange = tripRepository.findByScheduledDepartureBetween(startDateTime, endDateTime);

        // 2. Get ALL delivered orders in date range (single query)
        List<Order> allDeliveredOrdersInRange = orderRepository.findByOrderStatusAndDateRange(
            Order.OrderStatus.DELIVERED, startDateTime, endDateTime);

        // 🔧 OPTIMIZATION: Pre-group data by driver using Java Maps (in-memory processing)
        // Group trips by driver - O(n) complexity, no additional DB queries
        Map<Driver, List<Trip>> tripsByDriver = allTripsInRange.stream()
            .flatMap(trip -> trip.getTripAssignments().stream()
                .filter(assignment -> assignment.getDriver() != null)
                .map(assignment -> new AbstractMap.SimpleEntry<Driver, Trip>(assignment.getDriver(), trip)))
            .collect(Collectors.groupingBy(
                Map.Entry<Driver, Trip>::getKey,
                Collectors.mapping(Map.Entry<Driver, Trip>::getValue, Collectors.toList())
            ));

        // Group delivered orders by trip ID for revenue calculations - O(m) complexity
        Map<Integer, List<Order>> ordersByTripId = allDeliveredOrdersInRange.stream()
            .filter(order -> order.getTrip() != null)
            .collect(Collectors.groupingBy(order -> order.getTrip().getTripId()));

        // 🔧 OPTIMIZATION: Process grouped data without additional DB queries
        return drivers.stream()
            .map(driver -> {
                // Get this driver's trips from our pre-grouped map (O(1) lookup)
                List<Trip> driverTrips = tripsByDriver.getOrDefault(driver, new ArrayList<>());

                // Calculate basic metrics from driver's trips
                long completed = driverTrips.stream().filter(t -> "completed".equals(t.getStatus())).count();
                long cancelled = driverTrips.stream().filter(t -> "cancelled".equals(t.getStatus())).count();
                long total = driverTrips.size();

                double completionRate = total > 0 ? (completed * 100.0 / total) : 0.0;

                double avgDeliveryTime = driverTrips.stream()
                    .filter(t -> t.getActualArrival() != null && t.getScheduledDeparture() != null)
                    .mapToLong(t -> Duration.between(t.getScheduledDeparture(), t.getActualArrival()).toMinutes())
                    .average()
                    .orElse(0.0);

                // Calculate tiered on-time delivery rate using DIFOT logic
                long onTimeDeliveries = driverTrips.stream()
                    .filter(t -> "completed".equals(t.getStatus()))
                    .mapToDouble(t -> calculateOnTimeScore(t)) // Use new tiered scoring
                    .filter(score -> score == 1.0) // Only count perfect scores
                    .count();

                double onTimeDeliveryRate = completed > 0 ? (onTimeDeliveries * 100.0 / completed) : 0.0;

                // Calculate effective on-time score (weighted average including partial credit)
                double effectiveOnTimeScore = driverTrips.stream()
                    .filter(t -> "completed".equals(t.getStatus()))
                    .mapToDouble(t -> calculateOnTimeScore(t))
                    .average()
                    .orElse(0.0) * 100.0; // Convert to percentage

                // Get customer rating
                BigDecimal rating = driver.getRating();
                double customerRating = rating != null ? rating.doubleValue() : 0.0;

                // 🔧 OPTIMIZATION: Calculate revenue using pre-grouped orders (O(k) lookup, k = trips per driver)
                List<Integer> completedTripIds = driverTrips.stream()
                    .filter(t -> "completed".equals(t.getStatus()))
                    .map(Trip::getTripId)
                    .collect(Collectors.toList());

                BigDecimal revenue = BigDecimal.ZERO;
                for (Integer tripId : completedTripIds) {
                    List<Order> tripOrders = ordersByTripId.get(tripId);
                    if (tripOrders != null) {
                        revenue = revenue.add(tripOrders.stream()
                            .filter(o -> o.getShippingFee() != null)
                            .map(Order::getShippingFee)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
                    }
                }

                // Calculate composite performance score
                double performanceScore = calculatePerformanceScore(completionRate, onTimeDeliveryRate, customerRating, cancelled, total);
                String performanceGrade = getPerformanceGrade(performanceScore);
                List<String> alerts = getPerformanceAlerts(completionRate, onTimeDeliveryRate, customerRating, cancelled, total);
                List<String> recommendations = getImprovementRecommendations(completionRate, onTimeDeliveryRate, customerRating, cancelled, total);

                // Calculate extended metrics
                double dailyConsistencyScore = calculateDailyConsistencyScore(driverTrips);
                double[] peakPerformance = calculatePeakHourPerformance(driverTrips, startDateTime, endDateTime);
                double avgRevenuePerTrip = total > 0 ? revenue.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP).doubleValue() : 0.0;
                List<String> efficiencyBadges = calculateEfficiencyBadges(performanceScore, total, customerRating, onTimeDeliveryRate);

                return DriverPerformanceDto.builder()
                    .driverId(driver.getDriverId())
                    .driverName(driver.getUser().getFullName())
                    .email(driver.getUser().getEmail())
                    .phone(driver.getUser().getPhone())
                    .totalTripsCompleted(completed)
                    .totalTripsCancelled(cancelled)
                    .completionRate(Math.round(completionRate * 10.0) / 10.0)
                    .averageDeliveryTimeMinutes(Math.round(avgDeliveryTime * 10.0) / 10.0)
                    .onTimeDeliveryRate(Math.round(onTimeDeliveryRate * 10.0) / 10.0)
                    .customerRating(Math.round(customerRating * 10.0) / 10.0)
                    .totalRevenue(revenue)
                    .status(driver.getStatus())
                    .performanceScore(Math.round(performanceScore * 10.0) / 10.0)
                    .performanceGrade(performanceGrade)
                    .performanceAlerts(alerts)
                    .improvementRecommendations(recommendations)
                    .dailyConsistencyScore(Math.round(dailyConsistencyScore * 10.0) / 10.0)
                    .peakHourPerformance(Math.round(peakPerformance[0] * 10.0) / 10.0)
                    .offHourPerformance(Math.round(peakPerformance[1] * 10.0) / 10.0)
                    .averageRevenuePerTrip(Math.round(avgRevenuePerTrip * 100.0) / 100.0)
                    .efficiencyBadges(efficiencyBadges)
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

    // Week 3: Performance Scoring System

    /**
     * Real-world logistics logic: Tiered scoring for on-time delivery (DIFOT)
     * Returns a score: 1.0 (perfect), 0.8 (early but acceptable), 0.5 (late but delivered), or 0.0 (fail).
     */
    private double calculateOnTimeScore(Trip trip) {
        if (trip.getActualArrival() == null || trip.getScheduledArrival() == null) {
            return 0.0; // No arrival time available
        }

        // Difference in minutes (Positive = late, Negative = early)
        long diffMinutes = Duration.between(trip.getScheduledArrival(), trip.getActualArrival()).toMinutes();

        // Arriving early is generally good, but extremely early might block loading docks
        if (diffMinutes < -60) return 0.8;  // Too early (20% penalty)
        if (diffMinutes <= 15) return 1.0;  // Perfect window (-60 to +15 mins)
        if (diffMinutes <= 60) return 0.5;  // Late but within acceptable window (15-60 mins)

        return 0.0; // Very late (>60 mins late) - failure
    }

    /**
     * Calculate composite performance score using logistics-focused weights
     */
    private double calculatePerformanceScore(double completionRate, double onTimeDeliveryRate,
                                           double customerRating, long cancelled, long total) {
        if (total == 0) return 0.0;

        // Logistics weights - Reliability (DIFOT) is king in supply chain
        double onTimeScore = (onTimeDeliveryRate / 100.0) * 50.0; // 50% - Most important
        double completionScore = (completionRate / 100.0) * 30.0; // 30% - Did they actually deliver?
        double qualityScore = (customerRating / 5.0) * 20.0;      // 20% - Customer satisfaction

        double totalScore = onTimeScore + completionScore + qualityScore;

        // Heavy penalty for unreliable drivers (>10% cancellations = liability)
        double cancellationRate = (double) cancelled / total;
        if (cancellationRate > 0.10) {
            totalScore *= 0.8; // Slash score by 20% if they frequently cancel
        }

        return Math.round(totalScore * 10.0) / 10.0;
    }

    /**
     * Get performance grade based on composite score
     */
    private String getPerformanceGrade(double score) {
        if (score >= 90.0) return "Excellent";
        else if (score >= 75.0) return "Good";
        else if (score >= 50.0) return "Needs Improvement";
        else return "Critical";
    }

    /**
     * Generate real-world logistics alerts - focus on patterns that create business risk
     */
    private List<String> getPerformanceAlerts(double completionRate, double onTimeDeliveryRate,
                                            double customerRating, long cancelled, long total) {
        List<String> alerts = new ArrayList<>();

        // Pattern 1: The "Flakey" Driver (High Cancellation) - Logistics liability
        double cancellationRate = total > 0 ? (double)cancelled/total : 0.0;
        if (total > 5 && cancellationRate > 0.15) {
            alerts.add("CRITICAL: High cancellation rate (" + cancelled + " trips). Risk of service failure.");
        }

        // Pattern 2: The "Slow" Driver (Low On-Time) - Predictability issues
        if (onTimeDeliveryRate < 70.0) {
            alerts.add("Operations Warning: Consistent lateness. Check route efficiency or driver behavior.");
        }

        // Pattern 3: The "Rude" Driver (Low Rating) - Customer experience risk
        if (customerRating < 3.0 && total > 3) {
            alerts.add("CX Risk: Customer rating dangerously low.");
        }

        // Pattern 4: The Newbie (Low Data) - Learning curve period
        if (total < 5) {
            alerts.add("New Driver: Monitoring period.");
        }

        return alerts;
    }

    /**
     * Generate improvement recommendations based on performance
     */
    private List<String> getImprovementRecommendations(double completionRate, double onTimeDeliveryRate,
                                                     double customerRating, long cancelled, long total) {
        List<String> recommendations = new ArrayList<>();

        if (completionRate < 80.0) {
            recommendations.add("Focus on completing more trips - current rate is below 80%");
        }

        if (onTimeDeliveryRate < 65.0) {
            recommendations.add("Improve delivery timing to achieve on-time rate above 80%");
        }

        if (customerRating < 3.5) {
            recommendations.add("Enhance customer service and satisfaction for higher ratings");
        }

        double cancellationRate = total > 0 ? (cancelled * 100.0 / total) : 0.0;
        if (cancellationRate > 20.0) {
            recommendations.add("Reduce trip cancellations below 20% - current rate is " + Math.round(cancellationRate) + "%");
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Excellent performance! Continue maintaining high standards");
        }

        return recommendations;
    }

    // Extended Phase 1 Metrics

    /**
     * Calculate daily consistency score based on performance stability across days
     */
    private double calculateDailyConsistencyScore(List<Trip> driverTrips) {
        if (driverTrips.isEmpty()) return 100.0; // Perfect consistency if no trips

        Map<LocalDate, List<Trip>> tripsByDate = driverTrips.stream()
            .collect(Collectors.groupingBy(t -> t.getScheduledDeparture().toLocalDate()));

        if (tripsByDate.size() < 2) return 100.0; // Need at least 2 days for consistency calculation

        List<Double> dailyRates = tripsByDate.values().stream()
            .map(dayTrips -> {
                long total = dayTrips.size();
                long completed = dayTrips.stream().filter(t -> "completed".equals(t.getStatus())).count();
                return total > 0 ? (completed * 100.0 / total) : 0.0;
            })
            .collect(Collectors.toList());

        // Calculate coefficient of variation (lower is better consistency)
        double mean = dailyRates.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        if (mean == 0.0) return 100.0;

        double variance = dailyRates.stream()
            .mapToDouble(rate -> Math.pow(rate - mean, 2))
            .average()
            .orElse(0.0);

        double stdDev = Math.sqrt(variance);
        double cv = mean > 0 ? (stdDev / mean) * 100.0 : 0.0; // Coefficient of variation as percentage

        // Convert to consistency score (inverse of variation, higher is better)
        double consistencyScore = Math.max(0.0, 100.0 - cv);
        return Math.round(consistencyScore * 10.0) / 10.0;
    }

    /**
     * Calculate peak hour (8AM-6PM) vs off-hour performance
     * Returns [peakHourPerformance, offHourPerformance]
     */
    private double[] calculatePeakHourPerformance(List<Trip> driverTrips, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        double[] result = new double[2]; // [peakHour, offHour]

        List<Trip> peakHourTrips = new ArrayList<>();
        List<Trip> offHourTrips = new ArrayList<>();

        // Separate trips by peak hours (8AM-6PM)
        for (Trip trip : driverTrips) {
            if (trip.getScheduledDeparture() != null) {
                LocalTime time = trip.getScheduledDeparture().toLocalTime();
                if (time.isAfter(LocalTime.of(7, 59)) && time.isBefore(LocalTime.of(18, 1))) {
                    peakHourTrips.add(trip);
                } else {
                    offHourTrips.add(trip);
                }
            }
        }

        // Calculate completion rates
        double peakCompletionRate = calculateCompletionRate(peakHourTrips);
        double offCompletionRate = calculateCompletionRate(offHourTrips);

        result[0] = peakCompletionRate;
        result[1] = offCompletionRate;

        return result;
    }

    /**
     * Helper method to calculate completion rate for a list of trips
     */
    private double calculateCompletionRate(List<Trip> trips) {
        if (trips.isEmpty()) return 0.0;
        long completed = trips.stream().filter(t -> "completed".equals(t.getStatus())).count();
        return Math.round((completed * 100.0 / trips.size()) * 10.0) / 10.0;
    }

    // Phase 3 Extended Features

    /**
     * Calculate efficiency badges based on performance metrics
     */
    private List<String> calculateEfficiencyBadges(double performanceScore, long totalTrips,
                                                  double customerRating, double onTimeDeliveryRate) {
        List<String> badges = new ArrayList<>();

        // Top Performer Badge
        if (performanceScore >= 90.0) {
            badges.add("🏆 Top Performer");
        }

        // Consistency King Badge
        if (performanceScore >= 85.0 && totalTrips >= 10) {
            badges.add("🎯 Consistency King");
        }

        // Customer Favorite Badge
        if (customerRating >= 4.5) {
            badges.add("⭐ Customer Favorite");
        }

        // Punctuality Master Badge
        if (onTimeDeliveryRate >= 80.0) {
            badges.add("⏰ Punctuality Master");
        }

        // High Volume Champion Badge
        if (totalTrips >= 20) {
            badges.add("🚛 High Volume Champion");
        }

        // Excellence Award Badge
        if (performanceScore >= 95.0 && customerRating >= 4.7) {
            badges.add("💎 Excellence Award");
        }

        return badges;
    }
}
