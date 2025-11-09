package com.logiflow.server.services.manager.dashboard;

import com.logiflow.server.dtos.manager.dashboard.ManagerOverviewDto;
import com.logiflow.server.repositories.manager.dashboard.DashboardStatsRepository;
import com.logiflow.server.repositories.manager.operations.TripStatsRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service("managerDashboardService")
public class DashboardServiceImpl implements DashboardService {

    private final DashboardStatsRepository dashboardStatsRepository;
    private final TripStatsRepository tripStatsRepository;
    private final OrderRepository orderRepository;
    private final VehicleRepository vehicleRepository;

    public DashboardServiceImpl(DashboardStatsRepository dashboardStatsRepository,
                                TripStatsRepository tripStatsRepository,
                                OrderRepository orderRepository,
                                VehicleRepository vehicleRepository) {
        this.dashboardStatsRepository = dashboardStatsRepository;
        this.tripStatsRepository = tripStatsRepository;
        this.orderRepository = orderRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public ManagerOverviewDto getOverview() {
        LocalDate today = LocalDate.now();
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();

        long totalTripsToday = tripStatsRepository.countByScheduledDepartureBetween(from, to); // <<< sửa
        long activeTrips = dashboardStatsRepository.countActiveTrips();

        long inTransitOrders = orderRepository.countByOrderStatus(
                com.logiflow.server.models.Order.OrderStatus.IN_TRANSIT);
        long pendingOrders = orderRepository.countByOrderStatus(
                com.logiflow.server.models.Order.OrderStatus.PENDING);

        // có thể bỏ hoặc thay thế bằng ước lượng
        int activeDrivers = 0; // tripRepository.countOnDutyDrivers(); // bỏ gọi sang TripRepository
        long activeVehicles = vehicleRepository.count();

        List<String> notices = Arrays.asList(
                "Theo dõi các chuyến trễ để điều phối lại.",
                "Nhắc kiểm tra giờ nghỉ tài xế trong ca dài."
        );

        return new ManagerOverviewDto(
                totalTripsToday,
                activeTrips,
                inTransitOrders,
                pendingOrders,
                activeDrivers,
                activeVehicles,
                notices
        );
    }
}
