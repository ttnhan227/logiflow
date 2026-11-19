package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.OrderCreateRequest;
import com.logiflow.server.dtos.dispatch.OrderDto;
import com.logiflow.server.dtos.dispatch.OrderUpdateRequest;
import com.logiflow.server.dtos.maps.DistanceResultDto;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.maps.MapsService;
import com.logiflow.server.websocket.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
class OrderTransactionBoundaryIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private MapsService mapsService;

    @MockitoBean
    private NotificationService notificationService;

    private User createDispatcherUser(String suffix) {
        Role role = roleRepository.findByRoleName("DISPATCHER").orElseGet(() -> {
            Role r = new Role();
            r.setRoleName("DISPATCHER");
            r.setDescription("Dispatcher");
            return roleRepository.save(r);
        });

        User u = new User();
        u.setUsername("ord_disp_" + suffix);
        u.setEmail("ord_disp_" + suffix + "@example.com");
        u.setPasswordHash(passwordEncoder.encode("Pass123!"));
        u.setFullName("Order Dispatcher");
        u.setRole(role);
        u.setIsActive(true);
        return userRepository.save(u);
    }

    @Test
    void createAndUpdateOrderRunGeocodingAndNotificationsOutsideTransactions() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User dispatcher = createDispatcherUser(suffix);

        AtomicBoolean txActiveDuringCreateGeocode = new AtomicBoolean(true);
        AtomicBoolean txActiveDuringNotify = new AtomicBoolean(true);

        when(mapsService.calculateDistance("Pickup A", "Delivery B")).thenAnswer(inv -> {
            txActiveDuringCreateGeocode.set(TransactionSynchronizationManager.isActualTransactionActive());
            DistanceResultDto dto = new DistanceResultDto();
            dto.setDistanceMeters(15000);
            return dto;
        });

        doAnswer(inv -> {
            txActiveDuringNotify.set(TransactionSynchronizationManager.isActualTransactionActive());
            return null;
        }).when(notificationService).notifyNewOrder(any(), anyString(), anyString());

        OrderCreateRequest createReq = new OrderCreateRequest();
        createReq.setCustomerName("Acme Co");
        createReq.setPickupAddress("Pickup A");
        createReq.setDeliveryAddress("Delivery B");
        createReq.setPriorityLevel(Order.PriorityLevel.NORMAL);
        createReq.setPickupType(Order.PickupType.WAREHOUSE);
        createReq.setWarehouseName("WH-1");
        createReq.setDockNumber("D-2");
        createReq.setWeightTons(new BigDecimal("2.5"));
        createReq.setPackageValue(new BigDecimal("100000"));

        OrderDto created = orderService.createOrder(createReq, dispatcher.getUsername());
        assertThat(txActiveDuringCreateGeocode.get()).isFalse();
        assertThat(txActiveDuringNotify.get()).isFalse();
        assertThat(created.getDistanceKm()).isEqualByComparingTo("15.00");

        AtomicBoolean txActiveDuringUpdateGeocode = new AtomicBoolean(true);
        when(mapsService.calculateDistance("Pickup C", "Delivery D")).thenAnswer(inv -> {
            txActiveDuringUpdateGeocode.set(TransactionSynchronizationManager.isActualTransactionActive());
            DistanceResultDto dto = new DistanceResultDto();
            dto.setDistanceMeters(25000);
            return dto;
        });

        OrderUpdateRequest updateReq = new OrderUpdateRequest();
        updateReq.setCustomerName("Acme Co");
        updateReq.setPickupAddress("Pickup C");
        updateReq.setDeliveryAddress("Delivery D");
        updateReq.setPriorityLevel(Order.PriorityLevel.URGENT);
        updateReq.setPickupType(Order.PickupType.WAREHOUSE);
        updateReq.setWarehouseName("WH-2");
        updateReq.setDockNumber("D-5");
        updateReq.setWeightTons(new BigDecimal("3.0"));
        updateReq.setPackageValue(new BigDecimal("200000"));

        OrderDto updated = orderService.updateOrder(created.getOrderId(), updateReq);
        assertThat(txActiveDuringUpdateGeocode.get()).isFalse();
        assertThat(updated.getDistanceKm()).isEqualByComparingTo("25.00");
        assertThat(orderRepository.findById(created.getOrderId()).orElseThrow().getDistanceKm())
                .isEqualByComparingTo("25.00");
    }

    @Test
    void createOrderDoesNotEmitNotificationsWhenWriteTransactionFails() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User dispatcher = createDispatcherUser(suffix);

        OrderCreateRequest createReq = new OrderCreateRequest();
        createReq.setCustomerName("Rollback Co");
        createReq.setPickupAddress("Pickup R");
        createReq.setDeliveryAddress("Delivery R");
        createReq.setDistanceKm(new BigDecimal("10.00"));
        createReq.setPriorityLevel(Order.PriorityLevel.URGENT);
        createReq.setPickupType(Order.PickupType.WAREHOUSE);
        createReq.setWarehouseName("WH-1");
        createReq.setDockNumber("D-1");
        createReq.setWeightTons(new BigDecimal("1.0"));
        createReq.setTripId(999999);

        assertThrows(RuntimeException.class,
                () -> orderService.createOrder(createReq, dispatcher.getUsername()));

        verify(notificationService, never()).notifyNewOrder(any(), anyString(), anyString());
        verify(notificationService, never()).broadcastToAdmins(anyString(), anyString(), anyString(), anyString());
    }
}
