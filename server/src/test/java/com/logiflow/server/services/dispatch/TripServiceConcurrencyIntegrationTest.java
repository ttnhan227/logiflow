package com.logiflow.server.services.dispatch;

import com.logiflow.server.dtos.dispatch.TripAssignRequest;
import com.logiflow.server.exceptions.BusinessRuleException;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.Route;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.User;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class TripServiceConcurrencyIntegrationTest {

    @Autowired
    private TripService tripService;

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
    private PasswordEncoder passwordEncoder;

    private Trip createScheduledTrip(String suffix, Vehicle vehicle, Route route) {
        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType("STANDARD");
        trip.setStatus("scheduled");
        trip.setScheduledDeparture(LocalDateTime.now().plusHours(4));
        trip.setScheduledArrival(LocalDateTime.now().plusHours(8));
        return tripRepository.save(trip);
    }

    @Test
    void concurrentAssignTripForSameDriverSucceedsOnceAndRejectsSecondCaller() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Role driverRole = roleRepository.findByRoleName("DRIVER").orElseGet(() -> {
            Role role = new Role();
            role.setRoleName("DRIVER");
            role.setDescription("Driver");
            return roleRepository.save(role);
        });

        User user = new User();
        user.setUsername("race_drv_" + suffix);
        user.setEmail("race_drv_" + suffix + "@example.com");
        user.setPasswordHash(passwordEncoder.encode("Pass123!"));
        user.setFullName("Race Driver " + suffix);
        user.setRole(driverRole);
        user.setIsActive(true);
        user = userRepository.save(user);

        Driver driver = new Driver();
        driver.setUser(user);
        driver.setStatus("available");
        driver.setHealthStatus(Driver.HealthStatus.FIT);
        driver.setLicenseType("C");
        driver.setLicenseExpiryDate(LocalDate.now().plusYears(2));
        driver.setYearsExperience(4);
        driver = driverRepository.save(driver);

        Vehicle v1 = new Vehicle();
        v1.setVehicleType("Truck");
        v1.setLicensePlate("51C-" + suffix.substring(0, 4) + "1");
        v1.setCapacityTons(new BigDecimal("10.0"));
        v1.setRequiredLicense("C");
        v1.setStatus("available");
        v1 = vehicleRepository.save(v1);

        Vehicle v2 = new Vehicle();
        v2.setVehicleType("Truck");
        v2.setLicensePlate("51C-" + suffix.substring(0, 4) + "2");
        v2.setCapacityTons(new BigDecimal("10.0"));
        v2.setRequiredLicense("C");
        v2.setStatus("available");
        v2 = vehicleRepository.save(v2);

        Route route = new Route();
        route.setRouteName("Route-" + suffix);
        route.setRouteType("STANDARD");
        route.setIsTripRoute(false);
        route = routeRepository.save(route);

        Trip trip1 = createScheduledTrip(suffix + "-1", v1, route);
        Trip trip2 = createScheduledTrip(suffix + "-2", v2, route);

        Integer driverId = driver.getDriverId();
        Integer trip1Id = trip1.getTripId();
        Integer trip2Id = trip2.getTripId();

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger businessFailureCount = new AtomicInteger(0);

        List<Callable<Void>> calls = List.of(
                () -> {
                    ready.countDown();
                    assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
                    try {
                        tripService.assignTrip(trip1Id, new TripAssignRequest(driverId, null));
                        successCount.incrementAndGet();
                    } catch (BusinessRuleException ex) {
                        businessFailureCount.incrementAndGet();
                    }
                    return null;
                },
                () -> {
                    ready.countDown();
                    assertThat(start.await(5, TimeUnit.SECONDS)).isTrue();
                    try {
                        tripService.assignTrip(trip2Id, new TripAssignRequest(driverId, null));
                        successCount.incrementAndGet();
                    } catch (BusinessRuleException ex) {
                        businessFailureCount.incrementAndGet();
                    }
                    return null;
                }
        );

        List<Future<Void>> futures = new java.util.ArrayList<>();
        for (Callable<Void> call : calls) {
            futures.add(pool.submit(call));
        }
        assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        for (Future<Void> future : futures) {
            future.get(15, TimeUnit.SECONDS);
        }
        pool.shutdown();

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(businessFailureCount.get()).isEqualTo(1);
        assertThat(tripAssignmentRepository.countActiveAssignmentsByDriverId(driverId)).isEqualTo(1L);
        assertThat(driverRepository.findById(driverId).orElseThrow().getStatus()).isEqualTo("assigned");
    }
}
