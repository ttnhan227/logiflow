package com.logiflow.server.services.dispatch;

import com.logiflow.server.constants.TripStatus;
import com.logiflow.server.constants.VehicleStatus;
import com.logiflow.server.dtos.dispatch.TripCreateRequest;
import com.logiflow.server.exceptions.BusinessRuleException;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.Vehicle;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripDomainInvariantsTest {

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

    private Vehicle testVehicle;
    private Route testRoute;
    private Order order1;
    private Order order2;

    @BeforeEach
    void setUp() {
        testVehicle = new Vehicle();
        testVehicle.setVehicleId(1);
        testVehicle.setLicensePlate("51D-999.88");
        testVehicle.setVehicleType("Container Truck");
        testVehicle.setStatus(VehicleStatus.AVAILABLE);
        testVehicle.setCapacityTons(new BigDecimal("15.000"));

        testRoute = new Route();
        testRoute.setRouteId(10);
        testRoute.setRouteName("Cat Lai Port -> VSIP Binh Duong");

        order1 = new Order();
        order1.setOrderId(101);
        order1.setOrderStatus(Order.OrderStatus.PENDING);
        order1.setWeightTons(new BigDecimal("8.500"));

        order2 = new Order();
        order2.setOrderId(102);
        order2.setOrderStatus(Order.OrderStatus.PENDING);
        order2.setWeightTons(new BigDecimal("9.000"));
    }

    @Test
    @DisplayName("createTrip rejects vehicle currently in MAINTENANCE status")
    void testRejectsVehicleInMaintenance() {
        testVehicle.setStatus(VehicleStatus.MAINTENANCE);

        when(vehicleRepository.findById(1)).thenReturn(Optional.of(testVehicle));
        when(routeRepository.findById(10)).thenReturn(Optional.of(testRoute));
        when(orderRepository.findByIdsWithRelations(List.of(101))).thenReturn(List.of(order1));

        TripCreateRequest req = new TripCreateRequest();
        req.setVehicleId(1);
        req.setRouteId(10);
        req.setOrderIds(List.of(101));
        req.setTripType("Delivery");
        req.setScheduledDeparture(LocalDateTime.now().plusHours(2));
        req.setScheduledArrival(LocalDateTime.now().plusHours(6));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> tripService.createTrip(req));
        assertTrue(ex.getMessage().contains("maintenance"), "Expected maintenance message, got: " + ex.getMessage());
        verify(tripRepository, never()).save(any(Trip.class));
    }

    @Test
    @DisplayName("createTrip rejects orders exceeding vehicle capacity (overload invariant)")
    void testRejectsCargoOverload() {
        // order1 (8.5t) + order2 (9.0t) = 17.5t > vehicle capacity (15.0t)
        when(vehicleRepository.findById(1)).thenReturn(Optional.of(testVehicle));
        when(routeRepository.findById(10)).thenReturn(Optional.of(testRoute));
        when(orderRepository.findByIdsWithRelations(List.of(101, 102))).thenReturn(List.of(order1, order2));

        TripCreateRequest req = new TripCreateRequest();
        req.setVehicleId(1);
        req.setRouteId(10);
        req.setOrderIds(List.of(101, 102));
        req.setTripType("Delivery");
        req.setScheduledDeparture(LocalDateTime.now().plusHours(2));
        req.setScheduledArrival(LocalDateTime.now().plusHours(6));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> tripService.createTrip(req));
        assertTrue(ex.getMessage().contains("exceeds vehicle capacity"), "Expected capacity error, got: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("17.500"), "Expected total weight in message");
        assertTrue(ex.getMessage().contains("15.000"), "Expected vehicle capacity in message");
        verify(tripRepository, never()).save(any(Trip.class));
    }

    @Test
    @DisplayName("createTrip succeeds when combined cargo weight is within vehicle capacity")
    void testAcceptsCargoWithinCapacity() {
        // order1 is 8.5t <= vehicle capacity 15.0t
        when(vehicleRepository.findById(1)).thenReturn(Optional.of(testVehicle));
        when(routeRepository.findById(10)).thenReturn(Optional.of(testRoute));
        when(orderRepository.findByIdsWithRelations(List.of(101))).thenReturn(List.of(order1));

        Trip savedTrip = new Trip();
        savedTrip.setTripId(55);
        savedTrip.setVehicle(testVehicle);
        savedTrip.setRoute(testRoute);
        savedTrip.setTripType("Delivery");
        savedTrip.setStatus(TripStatus.SCHEDULED);
        savedTrip.setScheduledDeparture(LocalDateTime.now().plusHours(2));
        savedTrip.setScheduledArrival(LocalDateTime.now().plusHours(6));
        savedTrip.setCreatedAt(LocalDateTime.now());
        savedTrip.setTripAssignments(new ArrayList<>());
        savedTrip.setProgressEvents(new ArrayList<>());

        when(tripRepository.save(any(Trip.class))).thenReturn(savedTrip);
        when(tripRepository.findByIdWithRelations(55)).thenReturn(Optional.of(savedTrip));

        TripCreateRequest req = new TripCreateRequest();
        req.setVehicleId(1);
        req.setRouteId(10);
        req.setOrderIds(List.of(101));
        req.setTripType("Delivery");
        req.setScheduledDeparture(LocalDateTime.now().plusHours(2));
        req.setScheduledArrival(LocalDateTime.now().plusHours(6));

        assertDoesNotThrow(() -> tripService.createTrip(req));
        assertEquals(Order.OrderStatus.ASSIGNED, order1.getOrderStatus());
        verify(tripRepository).save(any(Trip.class));
        verify(orderRepository).saveAll(any());
    }
}
