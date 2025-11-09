package com.logiflow.server.services.manager.audit;

import com.logiflow.server.dtos.manager.audit.AuditActivityDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.manager.audit.AuditReadRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AuditServiceImpl implements AuditService {

    private final AuditReadRepository auditReadRepository;

    public AuditServiceImpl(AuditReadRepository auditReadRepository) {
        this.auditReadRepository = auditReadRepository;
    }

    @Override
    public List<AuditActivityDto> activities() {
        List<AuditActivityDto> list = new ArrayList<>();

        List<User> users = auditReadRepository.findRecentActiveUsers(PageRequest.of(0, 10));
        for (User u : users) {
            AuditActivityDto dto = new AuditActivityDto(
                    u.getUsername(),
                    "LOGIN",
                    u.getLastLogin(),
                    "Đăng nhập thành công"
            );
            list.add(dto);
        }

        List<Order> orders = auditReadRepository.findRecentOrders(PageRequest.of(0, 10));
        for (Order o : orders) {
            String actor = (o.getCreatedBy() != null ? o.getCreatedBy().getUsername() : "system");
            AuditActivityDto dto = new AuditActivityDto(
                    actor,
                    "ORDER_CREATED",
                    o.getCreatedAt(),
                    "Order #" + o.getOrderId() + " created (" + o.getOrderStatus() + ")"
            );
            list.add(dto);
        }

        return list;
    }
}
