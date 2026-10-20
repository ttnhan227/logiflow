package com.logiflow.server.services.dispatch;

import com.logiflow.server.constants.TripStatus;
import com.logiflow.server.dtos.dispatch.TripCancelRequest;
import com.logiflow.server.dtos.dispatch.TripDto;
import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;
import com.logiflow.server.exceptions.BusinessRuleException;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.TripAssignment;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.delivery.DeliveryConfirmationRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripProgressEventRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.services.admin.AuditLogService;
import com.logiflow.server.services.payment.PaymentService;
import com.logiflow.server.websocket.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceStateTransitionTest {

    @Mock private TripRepository tripRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private RouteRepository routeRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private TripAssignmentRepository tripAssignmentRepository;
    @Mock private DeliveryConfirmationRepository deliveryConfirmationRepository;
    @Mock private TripProgressEventRepository tripProgressEventRepository;
    @Mock private TripAssignmentMatchingService tripAssignmentMatchingService;
    @Mock private AuditLogService auditLogService;
    @Mock private NotificationService notificationService;
    @Mock private PaymentService paymentService;

    @InjectMocks
    private TripServiceImpl tripService;

    private User createMockUser(String username, String fullName) {
        User u = new User();
        u.setUserId(99);
        u.setUsername(username);
        u.setFullName(fullName);
        return u;
    }

    @Test
    @DisplayName("updateTripStatus rejects invalid transition from SCHEDULED to COMPLETED with BusinessRuleException")
    void testRejectsIllegalJumpToCompleted() {
        Trip trip = new Trip();
        trip.setTripId(1);
        trip.setStatus(TripStatus.SCHEDULED);

        when(tripRepository.findByIdWithRelations(1)).thenReturn(Optional.of(trip));

        TripStatusUpdateRequest req = new TripStatusUpdateRequest();
        req.setStatus(TripStatus.COMPLETED);

        assertThrows(BusinessRuleException.class, () -> tripService.updateTripStatus(1, req));
        verify(tripRepository, never()).save(any(Trip.class));
    }

    @Test
    @DisplayName("updateTripStatus rejects mutating a terminal COMPLETED trip with BusinessRuleException")
    void testRejectsMutationOfCompletedTrip() {
        Trip trip = new Trip();
        trip.setTripId(2);
        trip.setStatus(TripStatus.COMPLETED);

        when(tripRepository.findByIdWithRelations(2)).thenReturn(Optional.of(trip));

        TripStatusUpdateRequest req = new TripStatusUpdateRequest();
        req.setStatus(TripStatus.IN_PROGRESS);

        assertThrows(BusinessRuleException.class, () -> tripService.updateTripStatus(2, req));
        verify(tripRepository, never()).save(any(Trip.class));
    }

    @Test
    @DisplayName("updateTripStatus to IN_PROGRESS sets actualDeparture and transitions orders to IN_TRANSIT")
    void testTransitionToInProgressUpdatesOrders() {
        Trip trip = new Trip();
        trip.setTripId(3);
        trip.setStatus(TripStatus.ASSIGNED);

        Order order = new Order();
        order.setOrderId(301);
        order.setOrderStatus(Order.OrderStatus.ASSIGNED);
        trip.setOrders(new ArrayList<>(List.of(order)));

        when(tripRepository.findByIdWithRelations(3)).thenReturn(Optional.of(trip));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripStatusUpdateRequest req = new TripStatusUpdateRequest();
        req.setStatus(TripStatus.IN_PROGRESS);

        TripDto result = tripService.updateTripStatus(3, req);

        assertNotNull(trip.getActualDeparture());
        assertEquals(Order.OrderStatus.IN_TRANSIT, order.getOrderStatus());
        verify(orderRepository).saveAll(any());
        verify(tripRepository).save(trip);
    }

    @Test
    @DisplayName("updateTripStatus to COMPLETED sets actualArrival, marks orders DELIVERED, and frees driver")
    void testTransitionToCompletedFreesDriverAndDeliversOrders() {
        Trip trip = new Trip();
        trip.setTripId(4);
        trip.setStatus(TripStatus.ARRIVED);

        Driver driver = new Driver();
        driver.setDriverId(10);
        driver.setStatus("on_trip");
        driver.setUser(createMockUser("driver10", "Driver Ten"));

        TripAssignment assignment = new TripAssignment();
        assignment.setDriver(driver);
        assignment.setStatus("in_progress");
        trip.setTripAssignments(new ArrayList<>(List.of(assignment)));

        Order order = new Order();
        order.setOrderId(401);
        order.setOrderStatus(Order.OrderStatus.IN_TRANSIT);
        trip.setOrders(new ArrayList<>(List.of(order)));

        when(tripRepository.findByIdWithRelations(4)).thenReturn(Optional.of(trip));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripStatusUpdateRequest req = new TripStatusUpdateRequest();
        req.setStatus(TripStatus.COMPLETED);

        tripService.updateTripStatus(4, req);

        assertNotNull(trip.getActualArrival());
        assertEquals(TripStatus.COMPLETED, trip.getStatus());
        assertEquals(Order.OrderStatus.DELIVERED, order.getOrderStatus());
        assertEquals("available", driver.getStatus());
        verify(driverRepository).save(driver);
        verify(orderRepository).saveAll(any());
    }

    @Test
    @DisplayName("cancelTrip rejects cancellation of already COMPLETED trip with BusinessRuleException")
    void testCannotCancelCompletedTrip() {
        Trip trip = new Trip();
        trip.setTripId(5);
        trip.setStatus(TripStatus.COMPLETED);

        when(tripRepository.findByIdWithRelations(5)).thenReturn(Optional.of(trip));

        TripCancelRequest req = new TripCancelRequest();
        req.setReason("Customer cancelled");

        assertThrows(BusinessRuleException.class, () -> tripService.cancelTrip(5, req));
    }

    @Test
    @DisplayName("cancelTrip on SCHEDULED trip unassigns orders to PENDING and releases driver")
    void testCancelTripReleasesOrdersAndDriver() {
        Trip trip = new Trip();
        trip.setTripId(6);
        trip.setStatus(TripStatus.ASSIGNED);

        Driver driver = new Driver();
        driver.setDriverId(20);
        driver.setStatus("assigned");
        driver.setUser(createMockUser("driver20", "Driver Twenty"));

        TripAssignment assignment = new TripAssignment();
        assignment.setDriver(driver);
        assignment.setStatus("assigned");
        trip.setTripAssignments(new ArrayList<>(List.of(assignment)));

        Order order = new Order();
        order.setOrderId(601);
        order.setOrderStatus(Order.OrderStatus.ASSIGNED);
        order.setTrip(trip);
        trip.setOrders(new ArrayList<>(List.of(order)));

        when(tripRepository.findByIdWithRelations(6)).thenReturn(Optional.of(trip));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripCancelRequest req = new TripCancelRequest();
        req.setReason("Route blocked");

        tripService.cancelTrip(6, req);

        assertEquals(TripStatus.CANCELLED, trip.getStatus());
        assertEquals("available", driver.getStatus());
        assertEquals(Order.OrderStatus.PENDING, order.getOrderStatus());
        assertNull(order.getTrip());
        verify(driverRepository).save(driver);
        verify(orderRepository).saveAll(any());
    }
}
