package com.logiflow.server.services.manager.dispatch;

import com.logiflow.server.dtos.manager.dispatch.DispatchSummaryDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.repositories.manager.dispatch.DispatchStatsRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import org.springframework.stereotype.Service;

@Service
public class DispatchServiceImpl implements DispatchService {

    private final DispatchStatsRepository dispatchStatsRepository;
    private final OrderRepository orderRepository;

    public DispatchServiceImpl(DispatchStatsRepository dispatchStatsRepository,
                               OrderRepository orderRepository) {
        this.dispatchStatsRepository = dispatchStatsRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public DispatchSummaryDto getSummary() {
        long total = dispatchStatsRepository.countAllTrips();
        long assigned = dispatchStatsRepository.countAssigned();
        long inProgress = dispatchStatsRepository.countInProgress();
        long completed = dispatchStatsRepository.countCompleted();
        long pendingOrders = orderRepository.countByOrderStatus(Order.OrderStatus.PENDING);

        return new DispatchSummaryDto(total, assigned, inProgress, completed, pendingOrders);
    }
}
