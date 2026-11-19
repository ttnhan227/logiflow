package com.logiflow.server.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiflow.server.controllers.maps.GpsTrackingController;
import com.logiflow.server.dtos.notification.TripNotificationDto;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.TripAssignment;
import com.logiflow.server.models.User;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.driver.DriverRepository;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WebSocketAuthAndRoutingIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

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

    private Role customerRole;
    private Role driverRole;

    @BeforeEach
    void setupRoles() {
        customerRole = roleRepository.findByRoleName("CUSTOMER").orElseGet(() -> {
            Role r = new Role();
            r.setRoleName("CUSTOMER");
            r.setDescription("Customer role");
            return roleRepository.save(r);
        });
        driverRole = roleRepository.findByRoleName("DRIVER").orElseGet(() -> {
            Role r = new Role();
            r.setRoleName("DRIVER");
            r.setDescription("Driver role");
            return roleRepository.save(r);
        });
    }

    private WebSocketStompClient createNativeStompClient() {
        WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
        client.setMessageConverter(new MappingJackson2MessageConverter(objectMapper));
        return client;
    }

    private WebSocketStompClient createSockJsStompClient() {
        SockJsClient sockJsClient = new SockJsClient(List.of(new WebSocketTransport(new StandardWebSocketClient())));
        WebSocketStompClient client = new WebSocketStompClient(sockJsClient);
        client.setMessageConverter(new MappingJackson2MessageConverter(objectMapper));
        return client;
    }

    @Test
    void unauthenticatedAndInvalidStompConnectionsAreRejected() {
        WebSocketStompClient nativeClient = createNativeStompClient();
        String nativeUrl = "ws://localhost:" + port + "/ws/notifications-native";

        // 1. Missing both ?token= and STOMP CONNECT Authorization header
        assertThatThrownBy(() -> nativeClient.connectAsync(
                nativeUrl,
                new WebSocketHttpHeaders(),
                new StompHeaders(),
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS)).isInstanceOf(Exception.class);

        // 2. Invalid STOMP Authorization header
        StompHeaders badAuthHeaders = new StompHeaders();
        badAuthHeaders.add("Authorization", "Bearer not-a-valid-jwt");
        assertThatThrownBy(() -> nativeClient.connectAsync(
                nativeUrl,
                new WebSocketHttpHeaders(),
                badAuthHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS)).isInstanceOf(Exception.class);

        // 3. Invalid ?token= query parameter rejected at handshake
        assertThatThrownBy(() -> nativeClient.connectAsync(
                nativeUrl + "?token=bad.jwt.token",
                new WebSocketHttpHeaders(),
                new StompHeaders(),
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS)).isInstanceOf(Exception.class);
    }

    @Test
    void sockJsClientsConnectWithStompAuthorizationHeaderAndReceiveBroadcasts() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String driverUsername = "ws_driver_" + suffix;

        User driverUser = new User();
        driverUser.setUsername(driverUsername);
        driverUser.setEmail(driverUsername + "@example.com");
        driverUser.setPasswordHash(passwordEncoder.encode("DrvPass123!"));
        driverUser.setFullName("WS Driver");
        driverUser.setRole(driverRole);
        driverUser.setIsActive(true);
        driverUser = userRepository.save(driverUser);

        Driver driver = new Driver();
        driver.setUser(driverUser);
        driver.setLicenseType("C");
        driver.setYearsExperience(3);
        driver = driverRepository.save(driver);

        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleType("Truck");
        vehicle.setLicensePlate("51C-" + suffix);
        vehicle.setCapacityTons(new BigDecimal("10.0"));
        vehicle.setRequiredLicense("C");
        vehicle = vehicleRepository.save(vehicle);

        Route route = new Route();
        route.setRouteName("WS Route " + suffix);
        route.setRouteType("INTERCITY");
        route = routeRepository.save(route);

        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType("DELIVERY");
        trip.setScheduledDeparture(LocalDateTime.now());
        trip.setScheduledArrival(LocalDateTime.now().plusHours(4));
        trip.setStatus("in_progress");
        trip = tripRepository.save(trip);

        TripAssignment assignment = new TripAssignment();
        assignment.setTrip(trip);
        assignment.setDriver(driver);
        assignment.setRole("PRIMARY");
        assignment.setStatus("in_progress");
        tripAssignmentRepository.save(assignment);

        String driverToken = jwtUtils.generateToken(driverUsername, "DRIVER");
        String adminToken = jwtUtils.generateToken("ws_admin_" + suffix, "ADMIN");

        WebSocketStompClient notificationsSockJs = createSockJsStompClient();
        StompHeaders adminHeaders = new StompHeaders();
        adminHeaders.add("Authorization", "Bearer " + adminToken);

        StompSession adminSession = notificationsSockJs.connectAsync(
                "http://localhost:" + port + "/ws/notifications",
                new WebSocketHttpHeaders(),
                adminHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS);
        assertThat(adminSession.isConnected()).isTrue();
        adminSession.disconnect();

        WebSocketStompClient trackingSockJs = createSockJsStompClient();
        StompHeaders driverHeaders = new StompHeaders();
        driverHeaders.add("Authorization", "Bearer " + driverToken);

        StompSession trackingSession = trackingSockJs.connectAsync(
                "http://localhost:" + port + "/ws/tracking",
                new WebSocketHttpHeaders(),
                driverHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS);
        assertThat(trackingSession.isConnected()).isTrue();

        CompletableFuture<GpsTrackingController.LocationMessage> received = new CompletableFuture<>();
        String tripId = String.valueOf(trip.getTripId());
        trackingSession.subscribe("/topic/trips/" + tripId + "/location", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return GpsTrackingController.LocationMessage.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                received.complete((GpsTrackingController.LocationMessage) payload);
            }
        });

        trackingSession.send("/app/tracking", new GpsTrackingController.LocationMessage("ignored", tripId, 10.7769, 106.7009));

        GpsTrackingController.LocationMessage message = received.get(5, TimeUnit.SECONDS);
        assertThat(message.getDriverId()).isEqualTo(driverUsername);
        assertThat(message.getTripId()).isEqualTo(tripId);
        assertThat(message.getLatitude()).isEqualTo(10.7769);
        assertThat(message.getLongitude()).isEqualTo(106.7009);
        trackingSession.disconnect();
    }

    @Test
    void customerReceivesOrderNotificationOnUsernameTopicViaConnectHeaderAndLegacyQueryToken() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "ws_cust_" + suffix;
        User customer = new User();
        customer.setUsername(username);
        customer.setEmail(username + "@example.com");
        customer.setPasswordHash(passwordEncoder.encode("CustPass123!"));
        customer.setFullName("WS Customer");
        customer.setRole(customerRole);
        customer.setIsActive(true);
        User savedCustomer = userRepository.save(customer);

        String customerToken = jwtUtils.generateToken(username, "CUSTOMER");
        WebSocketStompClient nativeClient = createNativeStompClient();

        // Connect using STOMP Authorization header
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + customerToken);
        StompSession headerSession = nativeClient.connectAsync(
                "ws://localhost:" + port + "/ws/notifications-native",
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS);

        CompletableFuture<TripNotificationDto> received = new CompletableFuture<>();
        headerSession.subscribe("/topic/customer/" + username, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return TripNotificationDto.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                received.complete((TripNotificationDto) payload);
            }
        });

        // Allow SimpleBrokerMessageHandler to process async SUBSCRIBE before direct server publish
        Thread.sleep(300);

        notificationService.sendOrderNotification(
                savedCustomer.getUserId(),
                4242,
                "ORDER_CREATED",
                "Your order #4242 has been created",
                "PENDING"
        );

        TripNotificationDto dto = received.get(5, TimeUnit.SECONDS);
        assertThat(dto.getType()).isEqualTo("ORDER_CREATED");
        assertThat(dto.getTripId()).isEqualTo(4242);
        assertThat(dto.getMessage()).contains("4242");
        headerSession.disconnect();

        // Legacy ?token= handshake fallback also remains functional
        StompSession querySession = nativeClient.connectAsync(
                "ws://localhost:" + port + "/ws/notifications-native?token=" + customerToken,
                new WebSocketHttpHeaders(),
                new StompHeaders(),
                new StompSessionHandlerAdapter() {}
        ).get(5, TimeUnit.SECONDS);
        assertThat(querySession.isConnected()).isTrue();
        querySession.disconnect();
    }
}
