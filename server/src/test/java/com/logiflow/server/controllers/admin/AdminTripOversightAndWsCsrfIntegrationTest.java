package com.logiflow.server.controllers.admin;

import com.logiflow.server.controllers.auth.AuthController;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.User;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.utils.JwtUtils;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminTripOversightAndWsCsrfIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User createUser(String roleName, String prefix) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Role role = roleRepository.findByRoleName(roleName).orElseGet(() -> {
            Role created = new Role();
            created.setRoleName(roleName);
            created.setDescription(roleName);
            return roleRepository.save(created);
        });

        User user = new User();
        user.setUsername(prefix + "_" + suffix);
        user.setEmail(prefix + "_" + suffix + "@example.com");
        user.setPasswordHash(passwordEncoder.encode("Pass123!"));
        user.setFullName(prefix + " " + suffix);
        user.setRole(role);
        user.setIsActive(true);
        return userRepository.save(user);
    }

    @Test
    void adminTripsOversightReturnsTripsAndHandlesOutOfRangePage() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User admin = createUser("ADMIN", "oversight_admin");
        String token = jwtUtils.generateToken(admin.getUsername(), "ADMIN");

        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleType("Truck");
        vehicle.setLicensePlate("51D-" + suffix.substring(0, 5));
        vehicle.setCapacityTons(new BigDecimal("8.0"));
        vehicle.setRequiredLicense("C");
        vehicle.setStatus("available");
        vehicle = vehicleRepository.save(vehicle);

        Route route = new Route();
        route.setRouteName("OversightRoute-" + suffix);
        route.setRouteType("STANDARD");
        route.setIsTripRoute(false);
        route = routeRepository.save(route);

        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType("STANDARD");
        trip.setStatus("scheduled");
        trip.setScheduledDeparture(LocalDateTime.now().plusHours(2));
        trip.setScheduledArrival(LocalDateTime.now().plusHours(6));
        tripRepository.save(trip);

        mockMvc.perform(get("/api/admin/trips/oversight")
                        .param("page", "0")
                        .param("size", "10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trips", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.currentPage").value(0));

        mockMvc.perform(get("/api/admin/trips/oversight")
                        .param("page", "99")
                        .param("size", "10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trips", hasSize(0)))
                .andExpect(jsonPath("$.currentPage").value(99))
                .andExpect(jsonPath("$.hasNext").value(false));
    }

    @Test
    void sockJsTransportPostWithAuthCookieWithoutCsrfHeaderIsNotBlockedByCsrfFilter() throws Exception {
        User admin = createUser("ADMIN", "ws_csrf_admin");
        String token = jwtUtils.generateToken(admin.getUsername(), "ADMIN");

        MvcResult result = mockMvc.perform(post("/ws/notifications/169/test/xhr_streaming")
                        .cookie(new Cookie(AuthController.AUTH_COOKIE_NAME, token)))
                .andReturn();

        assertThat(result.getResponse().getStatus()).isNotEqualTo(403);
        assertThat(result.getResponse().getContentAsString()).doesNotContain("CSRF validation failed");
    }
}
