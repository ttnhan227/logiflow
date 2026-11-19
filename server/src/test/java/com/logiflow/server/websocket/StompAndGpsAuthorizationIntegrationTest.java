package com.logiflow.server.websocket;

import com.logiflow.server.controllers.maps.GpsTrackingController;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.TripAssignment;
import com.logiflow.server.models.User;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.utils.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc // Keep Spring Security filter chain enabled
class StompAndGpsAuthorizationIntegrationTest {

    @Autowired
    private StompAuthChannelInterceptor interceptor;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private TripAssignmentRepository tripAssignmentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminUser;
    private String dispatcherUser;
    private String driverA;
    private String driverB;
    private String customerA;
    private String customerB;
    private Integer tripAId;
    private Integer tripBId;

    @BeforeEach
    void setupFixtures() {
        GpsTrackingController.clearHistoryForTest();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Role adminRole = ensureRole("ADMIN");
        Role dispatcherRole = ensureRole("DISPATCHER");
        Role driverRole = ensureRole("DRIVER");
        Role customerRole = ensureRole("CUSTOMER");

        adminUser = createUser("adm_" + suffix, adminRole).getUsername();
        dispatcherUser = createUser("disp_" + suffix, dispatcherRole).getUsername();

        User driverAUser = createUser("drva_" + suffix, driverRole);
        User driverBUser = createUser("drvb_" + suffix, driverRole);
        driverA = driverAUser.getUsername();
        driverB = driverBUser.getUsername();

        Driver dA = createDriver(driverAUser);
        Driver dB = createDriver(driverBUser);

        User custAUser = createUser("custa_" + suffix, customerRole);
        User custBUser = createUser("custb_" + suffix, customerRole);
        customerA = custAUser.getUsername();
        customerB = custBUser.getUsername();

        Trip tA = createTrip("A-" + suffix);
        Trip tB = createTrip("B-" + suffix);
        tripAId = tA.getTripId();
        tripBId = tB.getTripId();

        assignDriver(tA, dA);
        assignDriver(tB, dB);

        createOrder(tA, custAUser);
        createOrder(tB, custBUser);

        GpsTrackingController.LocationMessage msgA = new GpsTrackingController.LocationMessage(driverA, String.valueOf(tripAId), 10.77, 106.70);
        GpsTrackingController.appendLocationHistory(driverA + "_" + tripAId, msgA);
        GpsTrackingController.LocationMessage msgB = new GpsTrackingController.LocationMessage(driverB, String.valueOf(tripBId), 21.02, 105.83);
        GpsTrackingController.appendLocationHistory(driverB + "_" + tripBId, msgB);
    }

    private Role ensureRole(String name) {
        return roleRepository.findByRoleName(name).orElseGet(() -> {
            Role r = new Role();
            r.setRoleName(name);
            r.setDescription(name);
            return roleRepository.save(r);
        });
    }

    private User createUser(String username, Role role) {
        User u = new User();
        u.setUsername(username);
        u.setEmail(username + "@example.com");
        u.setPasswordHash(passwordEncoder.encode("Pass123!"));
        u.setFullName(username);
        u.setRole(role);
        u.setIsActive(true);
        return userRepository.save(u);
    }

    private Driver createDriver(User user) {
        Driver d = new Driver();
        d.setUser(user);
        d.setLicenseType("C");
        d.setYearsExperience(2);
        return driverRepository.save(d);
    }

    private Trip createTrip(String suffix) {
        Vehicle v = new Vehicle();
        v.setVehicleType("Truck");
        v.setLicensePlate("51C-" + suffix);
        v.setCapacityTons(new BigDecimal("5.0"));
        v.setRequiredLicense("C");
        v = vehicleRepository.save(v);

        Route r = new Route();
        r.setRouteName("Route-" + suffix);
        r.setRouteType("LOCAL");
        r = routeRepository.save(r);

        Trip t = new Trip();
        t.setVehicle(v);
        t.setRoute(r);
        t.setTripType("DELIVERY");
        t.setScheduledDeparture(LocalDateTime.now());
        t.setScheduledArrival(LocalDateTime.now().plusHours(2));
        t.setStatus("in_progress");
        return tripRepository.save(t);
    }

    private void assignDriver(Trip trip, Driver driver) {
        TripAssignment ta = new TripAssignment();
        ta.setTrip(trip);
        ta.setDriver(driver);
        ta.setRole("PRIMARY");
        ta.setStatus("in_progress");
        tripAssignmentRepository.save(ta);
    }

    private void createOrder(Trip trip, User customer) {
        Order o = new Order();
        o.setTrip(trip);
        o.setCustomer(customer);
        o.setCustomerName(customer.getUsername());
        o.setPickupAddress("Pickup St");
        o.setDeliveryAddress("Delivery St");
        o.setCreatedBy(customer);
        orderRepository.save(o);
    }

    private Message<?> stompMessage(StompCommand cmd, String destination, String username, String role) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(cmd);
        if (destination != null) {
            accessor.setDestination(destination);
        }
        Map<String, Object> sessionAttrs = new HashMap<>();
        sessionAttrs.put("userId", username);
        sessionAttrs.put("userRole", role);
        accessor.setSessionAttributes(sessionAttrs);
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    void stompSubscribeAuthorizesByRoleAndOwnership() {
        MessageChannel channel = mock(MessageChannel.class);

        // CUSTOMER forbidden from admin, dispatcher, driver, global locations, other customer, and other trip
        for (String forbidden : new String[]{
                "/topic/admin/notifications",
                "/topic/dispatcher/notifications",
                "/topic/driver/" + driverA,
                "/topic/locations",
                "/topic/customer/" + customerB,
                "/topic/trips/" + tripBId + "/location"
        }) {
            assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, forbidden, customerA, "CUSTOMER"), channel))
                    .isInstanceOf(MessageDeliveryException.class);
        }

        // CUSTOMER allowed on own topic and trip containing their order
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/customer/" + customerA, customerA, "CUSTOMER"), channel)).isNotNull();
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/trips/" + tripAId + "/location", customerA, "CUSTOMER"), channel)).isNotNull();

        // DRIVER forbidden from admin, dispatcher, global locations, other driver, customer, and unassigned trip
        for (String forbidden : new String[]{
                "/topic/admin/notifications",
                "/topic/dispatcher/notifications",
                "/topic/locations",
                "/topic/driver/" + driverB,
                "/topic/customer/" + customerA,
                "/topic/trips/" + tripBId + "/location"
        }) {
            assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, forbidden, driverA, "DRIVER"), channel))
                    .isInstanceOf(MessageDeliveryException.class);
        }

        // DRIVER allowed on own topic and actively assigned trip
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/driver/" + driverA, driverA, "DRIVER"), channel)).isNotNull();
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/trips/" + tripAId + "/location", driverA, "DRIVER"), channel)).isNotNull();

        // DISPATCHER cannot subscribe to admin topic, can subscribe to dispatcher, locations, driver, and trip
        assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/admin/notifications", dispatcherUser, "DISPATCHER"), channel))
                .isInstanceOf(MessageDeliveryException.class);
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/dispatcher/notifications", dispatcherUser, "DISPATCHER"), channel)).isNotNull();
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/locations", dispatcherUser, "DISPATCHER"), channel)).isNotNull();
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/driver/" + driverA, dispatcherUser, "DISPATCHER"), channel)).isNotNull();

        // ADMIN can subscribe to admin notifications and global locations
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/admin/notifications", adminUser, "ADMIN"), channel)).isNotNull();
        assertThat(interceptor.preSend(stompMessage(StompCommand.SUBSCRIBE, "/topic/locations", adminUser, "ADMIN"), channel)).isNotNull();
    }

    @Test
    void stompSendRequiresDriverRoleOnTrackingDestination() {
        MessageChannel channel = mock(MessageChannel.class);

        assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.SEND, "/app/tracking", customerA, "CUSTOMER"), channel))
                .isInstanceOf(MessageDeliveryException.class);
        assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.SEND, "/app/tracking", dispatcherUser, "DISPATCHER"), channel))
                .isInstanceOf(MessageDeliveryException.class);
        assertThatThrownBy(() -> interceptor.preSend(stompMessage(StompCommand.SEND, "/app/other", driverA, "DRIVER"), channel))
                .isInstanceOf(MessageDeliveryException.class);

        assertThat(interceptor.preSend(stompMessage(StompCommand.SEND, "/app/tracking", driverA, "DRIVER"), channel)).isNotNull();
    }

    @Test
    void gpsRestEndpointsEnforceRoleAndOwnership() throws Exception {
        String customerToken = jwtUtils.generateToken(customerA, "CUSTOMER");
        String driverToken = jwtUtils.generateToken(driverA, "DRIVER");
        String dispatcherToken = jwtUtils.generateToken(dispatcherUser, "DISPATCHER");

        // Unauthenticated -> 403
        mockMvc.perform(get("/api/maps/gps/history")
                        .param("driverId", driverA)
                        .param("tripId", String.valueOf(tripAId)))
                .andExpect(status().isForbidden());

        // CUSTOMER can read history for their own order's trip & assigned driver
        mockMvc.perform(get("/api/maps/gps/history")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("driverId", driverA)
                        .param("tripId", String.valueOf(tripAId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].driverId").value(driverA));

        // CUSTOMER cannot read another customer's trip or wrong driver
        mockMvc.perform(get("/api/maps/gps/history")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("driverId", driverB)
                        .param("tripId", String.valueOf(tripBId)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/maps/gps/history")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("driverId", driverB)
                        .param("tripId", String.valueOf(tripAId)))
                .andExpect(status().isForbidden());

        // DRIVER can read own assigned trip, forbidden from another driver's trip
        mockMvc.perform(get("/api/maps/gps/history")
                        .header("Authorization", "Bearer " + driverToken)
                        .param("driverId", driverA)
                        .param("tripId", String.valueOf(tripAId)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/maps/gps/history")
                        .header("Authorization", "Bearer " + driverToken)
                        .param("driverId", driverB)
                        .param("tripId", String.valueOf(tripBId)))
                .andExpect(status().isForbidden());

        // DISPATCHER can read any trip history
        mockMvc.perform(get("/api/maps/gps/history")
                        .header("Authorization", "Bearer " + dispatcherToken)
                        .param("driverId", driverB)
                        .param("tripId", String.valueOf(tripBId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].driverId").value(driverB));
    }
}
