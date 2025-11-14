package com.logiflow.server.services.manager.alerts;

import com.logiflow.server.dtos.manager.alerts.AlertDto;
import com.logiflow.server.repositories.manager.operations.TripStatsRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AlertServiceImpl implements AlertService {
    private final OrderRepository orderRepository;
    private final TripStatsRepository tripStatsRepository;
    public AlertServiceImpl(OrderRepository orderRepository,
                            TripStatsRepository tripStatsRepository) {
        this.orderRepository = orderRepository;
        this.tripStatsRepository = tripStatsRepository;
    }
    @Override
    public List<AlertDto> list(String level) {
        List<AlertDto> items = new ArrayList<>();
        long pending = orderRepository.countByOrderStatus(com.logiflow.server.models.Order.OrderStatus.PENDING);
        if (pending > 0) {
            items.add(new AlertDto(AlertDto.Level.WARNING,
                    "Có " + pending + " đơn đang chờ phân công.", LocalDateTime.now()));
        }
        long activeTrips = tripStatsRepository.countActive();
        items.add(new AlertDto(AlertDto.Level.INFO,
                "Đang có " + activeTrips + " chuyến đang hoạt động.", LocalDateTime.now()));
        if ("CRITICAL".equalsIgnoreCase(level) && activeTrips == 0) {
            items.add(new AlertDto(AlertDto.Level.CRITICAL,
                    "Không có chuyến hoạt động! Kiểm tra điều phối.", LocalDateTime.now()));
        }
        return items;
    }
}
