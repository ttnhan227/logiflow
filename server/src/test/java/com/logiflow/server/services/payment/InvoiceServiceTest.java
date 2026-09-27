package com.logiflow.server.services.payment;

import com.logiflow.server.models.Order;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.order.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InvoicePdfService invoicePdfService;

    @InjectMocks
    private InvoiceService invoiceService;

    @Test
    void customerCanDownloadOwnInvoice() {
        Order order = orderForCustomer("alice");
        byte[] pdf = "%PDF".getBytes();
        when(orderRepository.findByIdWithRelations(1)).thenReturn(Optional.of(order));
        when(invoicePdfService.generateInvoice(order)).thenReturn(pdf);

        byte[] result = invoiceService.generateInvoice(1, authentication("alice", "ROLE_CUSTOMER"));

        assertArrayEquals(pdf, result);
    }

    @Test
    void customerCannotDownloadAnotherCustomersInvoice() {
        Order order = orderForCustomer("alice");
        when(orderRepository.findByIdWithRelations(1)).thenReturn(Optional.of(order));

        assertThrows(AccessDeniedException.class,
                () -> invoiceService.generateInvoice(1, authentication("bob", "ROLE_CUSTOMER")));
        verifyNoInteractions(invoicePdfService);
    }

    @Test
    void dispatcherCanDownloadAnyInvoice() {
        Order order = orderForCustomer("alice");
        byte[] pdf = "%PDF".getBytes();
        when(orderRepository.findByIdWithRelations(1)).thenReturn(Optional.of(order));
        when(invoicePdfService.generateInvoice(order)).thenReturn(pdf);

        byte[] result = invoiceService.generateInvoice(1, authentication("dispatcher", "ROLE_DISPATCHER"));

        assertArrayEquals(pdf, result);
    }

    private static Order orderForCustomer(String username) {
        User customer = new User();
        customer.setUsername(username);
        Order order = new Order();
        order.setCustomer(customer);
        return order;
    }

    private static UsernamePasswordAuthenticationToken authentication(String username, String role) {
        return new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority(role)));
    }
}
