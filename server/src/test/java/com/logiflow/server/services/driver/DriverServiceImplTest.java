package com.logiflow.server.services.driver;

import com.logiflow.server.constants.TripStatus;
import com.logiflow.server.dtos.delivery.DeliveryConfirmationDto;
import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;
import com.logiflow.server.exceptions.BusinessRuleException;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.TripAssignment;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.delivery.DeliveryConfirmationRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.admin.SystemSettingsService;
import com.logiflow.server.services.dispatch.TripService;
import com.logiflow.server.services.maps.MapsService;
import com.logiflow.server.services.payment.PaymentService;
import com.logiflow.server.websocket.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriverServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private TripRepository tripRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private DriverWorkLogRepository driverWorkLogRepository;
    @Mock private MapsService mapsService;
    @Mock private TripAssignmentRepository tripAssignmentRepository;
    @Mock private NotificationService notificationService;
    @Mock private DeliveryConfirmationRepository deliveryConfirmationRepository;
    @Mock private SystemSettingsService systemSettingsService;
    @Mock private PaymentService paymentService;
    @Mock private TripService tripService;

    @InjectMocks
    private DriverServiceImpl driverService;

    private Driver createDriver(Integer driverId, String username) {
        User user = new User();
        user.setUserId(driverId + 100);
        user.setUsername(username);
        user.setFullName("Driver " + driverId);

        Driver driver = new Driver();
        driver.setDriverId(driverId);
        driver.setUser(user);
        driver.setStatus("on_trip");
        return driver;
    }

    private Order createOrder(Integer orderId, Integer customerId, Order.OrderStatus status, Trip trip) {
        User customer = new User();
        customer.setUserId(customerId);
        customer.setUsername("customer_" + customerId);

        Order order = new Order();
        order.setOrderId(orderId);
        order.setCustomer(customer);
        order.setCustomerName("Customer " + customerId);
        order.setDeliveryAddress("123 Main St");
        order.setOrderStatus(status);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        order.setTrip(trip);
        return order;
    }

    @Test
    @DisplayName("confirmDelivery succeeds on DELAYED trip, notifies customer, triggers payment, and completes via TripService")
    void testConfirmDeliveryOnDelayedTripCompletesViaTripService() {
        Driver driver = createDriver(10, "driver10");
        Trip trip = new Trip();
        trip.setTripId(50);
        trip.setStatus(TripStatus.DELAYED);

        Order order = createOrder(500, 200, Order.OrderStatus.IN_TRANSIT, trip);
        trip.setOrders(new ArrayList<>(List.of(order)));

        when(tripRepository.findTripByDriverAndTripId(10, 50)).thenReturn(Optional.of(trip));

        DeliveryConfirmationDto dto = new DeliveryConfirmationDto();
        dto.setConfirmationType("OTP");
        dto.setOtpCode("123456");

        driverService.confirmDelivery(10, 50, dto);

        assertEquals(Order.OrderStatus.DELIVERED, order.getOrderStatus());
        verify(deliveryConfirmationRepository).save(any());
        verify(orderRepository).saveAll(trip.getOrders());
        verify(notificationService).notifyOrderDelivered(200, 500, "Customer 200", "123 Main St");
        verify(paymentService).sendPaymentRequest(500);

        ArgumentCaptor<TripStatusUpdateRequest> reqCaptor = ArgumentCaptor.forClass(TripStatusUpdateRequest.class);
        verify(tripService).updateTripStatus(eq(50), reqCaptor.capture());
        assertEquals(TripStatus.COMPLETED, reqCaptor.getValue().getStatus());
        verify(driverRepository, never()).save(driver);
    }

    @Test
    @DisplayName("updateOrderStatus triggers customer delivery notification, payment request, and completes trip when last order is delivered")
    void testUpdateOrderStatusCompletesTripOnFinalOrderDelivered() {
        Trip trip = new Trip();
        trip.setTripId(60);
        trip.setStatus(TripStatus.IN_PROGRESS);

        Order deliveredFirst = createOrder(601, 201, Order.OrderStatus.DELIVERED, trip);
        Order finalOrder = createOrder(602, 202, Order.OrderStatus.IN_TRANSIT, trip);
        trip.setOrders(new ArrayList<>(List.of(deliveredFirst, finalOrder)));

        when(tripRepository.findTripByDriverAndTripId(11, 60)).thenReturn(Optional.of(trip));

        driverService.updateOrderStatus(11, 60, 602, "DELIVERED");

        assertEquals(Order.OrderStatus.DELIVERED, finalOrder.getOrderStatus());
        verify(orderRepository).save(finalOrder);
        verify(notificationService).notifyOrderDelivered(202, 602, "Customer 202", "123 Main St");
        verify(paymentService).sendPaymentRequest(602);

        ArgumentCaptor<TripStatusUpdateRequest> reqCaptor = ArgumentCaptor.forClass(TripStatusUpdateRequest.class);
        verify(tripService).updateTripStatus(eq(60), reqCaptor.capture());
        assertEquals(TripStatus.COMPLETED, reqCaptor.getValue().getStatus());
    }

    @Test
    @DisplayName("declineTripAssignment marks assignment declined, frees driver, and reverts ASSIGNED trip to SCHEDULED")
    void testDeclineTripAssignmentRevertsTripAndFreesDriver() {
        Driver driver = createDriver(12, "driver12");
        Trip trip = new Trip();
        trip.setTripId(70);
        trip.setStatus(TripStatus.ASSIGNED);

        TripAssignment assignment = new TripAssignment();
        assignment.setAssignmentId(700);
        assignment.setTrip(trip);
        assignment.setDriver(driver);
        assignment.setStatus("assigned");
        trip.setTripAssignments(new ArrayList<>(List.of(assignment)));

        when(tripRepository.findTripByDriverAndTripId(12, 70)).thenReturn(Optional.of(trip));
        when(driverRepository.findById(12)).thenReturn(Optional.of(driver));

        driverService.declineTripAssignment(12, 70);

        assertEquals("declined", assignment.getStatus());
        assertNotNull(assignment.getCompletedAt());
        assertEquals("available", driver.getStatus());
        verify(tripAssignmentRepository).saveAll(trip.getTripAssignments());
        verify(driverRepository).save(driver);

        ArgumentCaptor<TripStatusUpdateRequest> reqCaptor = ArgumentCaptor.forClass(TripStatusUpdateRequest.class);
        verify(tripService).updateTripStatus(eq(70), reqCaptor.capture());
        assertEquals(TripStatus.SCHEDULED, reqCaptor.getValue().getStatus());
    }

    @Test
    @DisplayName("cancelTripAssignment marks assignment cancelled, frees driver, and reverts ASSIGNED trip to SCHEDULED")
    void testCancelTripAssignmentRevertsTripAndFreesDriver() {
        Driver driver = createDriver(13, "driver13");
        Trip trip = new Trip();
        trip.setTripId(71);
        trip.setStatus(TripStatus.ASSIGNED);

        TripAssignment assignment = new TripAssignment();
        assignment.setAssignmentId(701);
        assignment.setTrip(trip);
        assignment.setDriver(driver);
        assignment.setStatus("accepted");
        trip.setTripAssignments(new ArrayList<>(List.of(assignment)));

        when(tripRepository.findTripByDriverAndTripId(13, 71)).thenReturn(Optional.of(trip));
        when(driverRepository.findById(13)).thenReturn(Optional.of(driver));

        driverService.cancelTripAssignment(13, 71);

        assertEquals(TripStatus.CANCELLED, assignment.getStatus());
        assertNotNull(assignment.getCompletedAt());
        assertEquals("available", driver.getStatus());
        verify(tripAssignmentRepository).saveAll(trip.getTripAssignments());
        verify(driverRepository).save(driver);

        ArgumentCaptor<TripStatusUpdateRequest> reqCaptor = ArgumentCaptor.forClass(TripStatusUpdateRequest.class);
        verify(tripService).updateTripStatus(eq(71), reqCaptor.capture());
        assertEquals(TripStatus.SCHEDULED, reqCaptor.getValue().getStatus());
    }

    @Test
    @DisplayName("declineTripAssignment and cancelTripAssignment reject trips already IN_PROGRESS")
    void testDeclineAndCancelRejectInProgressTrip() {
        Trip trip = new Trip();
        trip.setTripId(72);
        trip.setStatus(TripStatus.IN_PROGRESS);
        trip.setTripAssignments(new ArrayList<>());

        when(tripRepository.findTripByDriverAndTripId(14, 72)).thenReturn(Optional.of(trip));

        assertThrows(BusinessRuleException.class, () -> driverService.declineTripAssignment(14, 72));
        assertThrows(BusinessRuleException.class, () -> driverService.cancelTripAssignment(14, 72));
        verify(driverRepository, never()).save(any());
        verify(tripService, never()).updateTripStatus(any(), any());
    }
}
