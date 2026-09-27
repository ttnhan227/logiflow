package com.logiflow.server.services.payment;

import com.logiflow.server.models.Order;
import com.logiflow.server.repositories.order.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InvoiceService {

    private final OrderRepository orderRepository;
    private final InvoicePdfService invoicePdfService;

    public InvoiceService(OrderRepository orderRepository, InvoicePdfService invoicePdfService) {
        this.orderRepository = orderRepository;
        this.invoicePdfService = invoicePdfService;
    }

    @Transactional(readOnly = true)
    public byte[] generateInvoice(Integer orderId, Authentication authentication) {
        Order order = orderRepository.findByIdWithRelations(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!canDownload(order, authentication)) {
            throw new AccessDeniedException("You are not allowed to download this invoice");
        }

        return invoicePdfService.generateInvoice(order);
    }

    private boolean canDownload(Order order, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        boolean operationsUser = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ROLE_DISPATCHER"));
        if (operationsUser) {
            return true;
        }

        return order.getCustomer() != null
                && order.getCustomer().getUsername() != null
                && order.getCustomer().getUsername().equals(authentication.getName());
    }
}
