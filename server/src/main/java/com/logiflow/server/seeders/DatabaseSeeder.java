package com.logiflow.server.seeders;

import com.logiflow.server.models.*;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import com.logiflow.server.repositories.order.OrderRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.route.RouteRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

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
    private OrderRepository orderRepository;

    @Autowired
    private TripAssignmentRepository tripAssignmentRepository;

    @Autowired
    private DriverWorkLogRepository driverWorkLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Only seed if data doesn't exist
        if (roleRepository.count() == 0) {
            seedRoles();
            seedUsersWithRoles();
            seedDrivers();
            seedVehicles();
            seedRoutes();
            seedTrips();
            seedOrders();
            seedTripAssignments();
            seedDriverWorkLogs();
            System.out.println("Database seeding completed successfully!");
        } else {
            System.out.println("Database already seeded. Skipping...");
        }
    }

    private void seedRoles() {
        List<Role> roles = Arrays.asList(
            createRole("ADMIN", "System administrator with full access"),
            createRole("DISPATCHER", "Manages trip assignments and routing"),
            createRole("DRIVER", "Vehicle driver"),
            createRole("MANAGER", "Fleet and operations manager"),
            createRole("USER", "Standard user")
        );
        roleRepository.saveAll(roles);
        System.out.println("Seeded 5 roles");
    }

    private Role createRole(String name, String description) {
        Role role = new Role();
        role.setRoleName(name);
        role.setDescription(description);
        role.setCreatedAt(LocalDateTime.now());
        return role;
    }

    private void seedUsersWithRoles() {
        List<Role> roles = roleRepository.findAll();
        if (roles.size() < 5) {
            System.out.println("Roles not seeded yet. Skipping user creation.");
            return;
        }

        List<User> users = Arrays.asList(
            createUserWithRole("admin", "admin@logiflow.com", "123", roles.get(0)), // ADMIN
            createUserWithRole("john.dispatcher", "john.d@logiflow.com", "123", roles.get(1)), // DISPATCHER
            createUserWithRole("sarah.manager", "sarah.m@logiflow.com", "123", roles.get(3)), // MANAGER
            createUserWithRole("mike.driver", "mike.d@logiflow.com", "123", roles.get(2)), // DRIVER
            createUserWithRole("amy.dispatcher2", "amy.d@logiflow.com", "123", roles.get(1)), // DISPATCHER
            createUserWithRole("carl.driver2", "carl.d@logiflow.com", "123", roles.get(2)), // DRIVER
            createUserWithRole("lisa.manager2", "lisa.m@logiflow.com", "123", roles.get(3)), // MANAGER
            createUserWithRole("david.driver3", "david.d@logiflow.com", "123", roles.get(2)), // DRIVER
            createUserWithRole("emma.driver4", "emma.d@logiflow.com", "123", roles.get(2)), // DRIVER
            createUserWithRole("bob.driver5", "bob.d@logiflow.com", "123", roles.get(2)) // DRIVER
        );
        userRepository.saveAll(users);
        System.out.println("Seeded 10 users with roles");
    }

    private User createUserWithRole(String username, String email, String password, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setIsActive(true);
        user.setLastLogin(LocalDateTime.now());
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    private User createUser(String username, String email, String password) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    private void seedDrivers() {
        List<User> driverUsers = userRepository.findAll().stream()
                .filter(user -> user.getUsername().contains("driver"))
                .toList();
        if (driverUsers.size() < 10) {
            driverUsers = userRepository.findAll().stream().limit(10).toList();
        }

        List<Driver> drivers = Arrays.asList(
            createDriver(driverUsers.get(0), "Nguyen Van An", "+84-901-234-567", "B2", 8, new BigDecimal("21.0285"), new BigDecimal("105.8342")),
            createDriver(driverUsers.get(1), "Tran Thi Binh", "+84-902-345-678", "C", 12, new BigDecimal("16.0471"), new BigDecimal("108.2068")),
            createDriver(driverUsers.get(2), "Le Minh Chau", "+84-903-456-789", "D", 6, new BigDecimal("21.5867"), new BigDecimal("105.3819")),
            createDriver(driverUsers.get(3), "Pham Duy Danh", "+84-904-567-890", "E", 15, new BigDecimal("21.0313"), new BigDecimal("105.8518")),
            createDriver(driverUsers.get(4), "Hoang Ngoc Em", "+84-905-678-901", "FC", 9, new BigDecimal("16.0628"), new BigDecimal("108.2328")),
            createDriver(driverUsers.get(5), "Vo Phuong Giang", "+84-906-789-012", "B2", 11, new BigDecimal("21.0282"), new BigDecimal("105.8542")),
            createDriver(driverUsers.get(6), "Diep Hai Hau", "+84-907-890-123", "C", 7, new BigDecimal("21.4082"), new BigDecimal("105.4282")),
            createDriver(driverUsers.get(7), "Bui Thi Hoa", "+84-908-901-234", "D", 14, new BigDecimal("20.8462"), new BigDecimal("106.6884")),
            createDriver(driverUsers.get(8), "Do Quang Hung", "+84-909-012-345", "E", 5, new BigDecimal("21.0278"), new BigDecimal("105.8342")),
            createDriver(driverUsers.get(9), "Ly Ngoc Lan", "+84-910-123-456", "FC", 13, new BigDecimal("10.8230"), new BigDecimal("106.6297"))
        );
        driverRepository.saveAll(drivers);
        System.out.println("Seeded 10 drivers");
    }

    private Driver createDriver(User user, String fullName, String phone, String licenseType, int experience, BigDecimal lat, BigDecimal lng) {
        Driver driver = new Driver();
        driver.setUser(user);
        driver.setFullName(fullName);
        driver.setPhone(phone);
        driver.setLicenseType(licenseType);
        driver.setYearsExperience(experience);
        driver.setHealthStatus(Driver.HealthStatus.FIT);
        driver.setCurrentLocationLat(lat);
        driver.setCurrentLocationLng(lng);
        driver.setStatus("available");
        driver.setCreatedAt(LocalDateTime.now());
        return driver;
    }

    private void seedVehicles() {
        List<Vehicle> vehicles = Arrays.asList(
            createVehicle("truck", "51A-12345", 2000, "C", new BigDecimal("21.0285"), new BigDecimal("105.8342")),
            createVehicle("bus", "51B-23456", 45, "D", new BigDecimal("16.0471"), new BigDecimal("108.2068")),
            createVehicle("container", "51C-34567", 25000, "FC", new BigDecimal("21.5867"), new BigDecimal("105.3819")),
            createVehicle("truck", "51A-45678", 5000, "C", new BigDecimal("21.0313"), new BigDecimal("105.8518")),
            createVehicle("bus", "51B-56789", 50, "E", new BigDecimal("16.0628"), new BigDecimal("108.2328")),
            createVehicle("truck", "51A-67890", 3000, "D", new BigDecimal("21.0282"), new BigDecimal("105.8542")),
            createVehicle("container", "51C-78901", 20000, "FC", new BigDecimal("21.4082"), new BigDecimal("105.4282")),
            createVehicle("bus", "51B-89012", 40, "E", new BigDecimal("20.8462"), new BigDecimal("106.6884")),
            createVehicle("truck", "51A-90123", 4000, "C", new BigDecimal("21.0278"), new BigDecimal("105.8342")),
            createVehicle("container", "51C-01234", 22000, "FC", new BigDecimal("10.8230"), new BigDecimal("106.6297"))
        );
        vehicleRepository.saveAll(vehicles);
        System.out.println("Seeded 10 vehicles");
    }

    private Vehicle createVehicle(String vehicleType, String licensePlate, int capacity, String requiredLicense, BigDecimal lat, BigDecimal lng) {
        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleType(vehicleType);
        vehicle.setLicensePlate(licensePlate);
        vehicle.setCapacity(capacity);
        vehicle.setRequiredLicense(requiredLicense);
        vehicle.setCurrentLocationLat(lat);
        vehicle.setCurrentLocationLng(lng);
        vehicle.setStatus("available");
        vehicle.setCreatedAt(LocalDateTime.now());
        return vehicle;
    }

    private void seedRoutes() {
        List<Route> routes = Arrays.asList(
            createRoute("Hanoi-HCM City", "Hanoi Center", new BigDecimal("21.0285"), new BigDecimal("105.8342"), "HCM City Center", new BigDecimal("10.8230"), new BigDecimal("106.6297"), new BigDecimal("1729.50"), new BigDecimal("24.0"), "long_haul"),
            createRoute("Da Nang-Hoi An", "Da Nang Airport", new BigDecimal("16.0471"), new BigDecimal("108.2068"), "Hoi An Old Town", new BigDecimal("15.8801"), new BigDecimal("108.3370"), new BigDecimal("30.0"), new BigDecimal("0.75"), "intercity"),
            createRoute("Thai Binh-Hanoi", "Thai Binh Bus Station", new BigDecimal("20.4500"), new BigDecimal("106.3400"), "Hanoi Giap Bat", new BigDecimal("21.0113"), new BigDecimal("105.8231"), new BigDecimal("85.0"), new BigDecimal("2.0"), "intercity"),
            createRoute("Can Tho-Chau Doc", "Can Tho Port", new BigDecimal("10.0343"), new BigDecimal("105.7814"), "Chau Doc Market", new BigDecimal("10.6860"), new BigDecimal("105.1468"), new BigDecimal("120.0"), new BigDecimal("3.0"), "intracity"),
            createRoute("Haiphong-Hanoi", "Haiphong Port", new BigDecimal("20.8667"), new BigDecimal("106.6833"), "Hanoi Center", new BigDecimal("21.0285"), new BigDecimal("105.8342"), new BigDecimal("103.0"), new BigDecimal("2.25"), "intercity"),
            createRoute("Nha Trang-Cam Ranh", "Nha Trang Beach", new BigDecimal("12.2388"), new BigDecimal("109.1967"), "Cam Ranh Airport", new BigDecimal("12.0061"), new BigDecimal("109.2189"), new BigDecimal("35.0"), new BigDecimal("1.5"), "intracity"),
            createRoute("Phan Thiet-Mui Ne", "Phan Thiet Center", new BigDecimal("10.9333"), new BigDecimal("108.1000"), "Mui Ne Beach", new BigDecimal("10.9517"), new BigDecimal("108.2407"), new BigDecimal("25.0"), new BigDecimal("0.75"), "intracity"),
            createRoute("Quang Ninh-Cat Ba", "Quang Ninh City", new BigDecimal("21.1057"), new BigDecimal("107.3467"), "Cat Ba Island", new BigDecimal("20.7295"), new BigDecimal("107.0485"), new BigDecimal("65.0"), new BigDecimal("2.0"), "intracity"),
            createRoute("Bac Ninh-Hanoi", "Bac Ninh Province", new BigDecimal("21.1861"), new BigDecimal("106.0763"), "Hanoi Lotte Center", new BigDecimal("21.0316"), new BigDecimal("105.8117"), new BigDecimal("25.0"), new BigDecimal("0.75"), "intercity"),
            createRoute("Vung Tau-Bien Hoa", "Vung Tau Port", new BigDecimal("10.3461"), new BigDecimal("107.0733"), "Bien Hoa City", new BigDecimal("10.9522"), new BigDecimal("106.8430"), new BigDecimal("75.0"), new BigDecimal("1.75"), "intracity")
        );
        routeRepository.saveAll(routes);
        System.out.println("Seeded 10 routes");
    }

    private Route createRoute(String name, String originAddr, BigDecimal originLat, BigDecimal originLng, String destAddr, BigDecimal destLat, BigDecimal destLng, BigDecimal distance, BigDecimal duration, String type) {
        Route route = new Route();
        route.setRouteName(name);
        route.setOriginAddress(originAddr);
        route.setOriginLat(originLat);
        route.setOriginLng(originLng);
        route.setDestinationAddress(destAddr);
        route.setDestinationLat(destLat);
        route.setDestinationLng(destLng);
        route.setDistanceKm(distance);
        route.setEstimatedDurationHours(duration);
        route.setRouteType(type);
        return route;
    }

    private void seedTrips() {
        List<Vehicle> vehicles = vehicleRepository.findAll().stream().limit(10).toList();
        List<Route> routes = routeRepository.findAll().stream().limit(10).toList();

        List<Trip> trips = Arrays.asList(
            createTrip(vehicles.get(0), routes.get(0), "freight", LocalDateTime.now().plusDays(1), LocalDateTime.now().plusDays(1).plusHours(24)),
            createTrip(vehicles.get(1), routes.get(1), "passenger", LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(2).plusMinutes(45)),
            createTrip(vehicles.get(2), routes.get(2), "mixed", LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(2).plusHours(3)),
            createTrip(vehicles.get(3), routes.get(3), "freight", LocalDateTime.now().minusHours(2), LocalDateTime.now().minusHours(2).plusHours(3)),
            createTrip(vehicles.get(4), routes.get(4), "passenger", LocalDateTime.now().plusDays(3), LocalDateTime.now().plusDays(3).plusHours(2)),
            createTrip(vehicles.get(5), routes.get(5), "freight", LocalDateTime.now().plusHours(6), LocalDateTime.now().plusHours(6).plusHours(2)),
            createTrip(vehicles.get(6), routes.get(6), "mixed", LocalDateTime.now().minusDays(1), LocalDateTime.now().minusDays(1).plusHours(3)),
            createTrip(vehicles.get(7), routes.get(7), "passenger", LocalDateTime.now().plusDays(4), LocalDateTime.now().plusDays(4).plusHours(2)),
            createTrip(vehicles.get(8), routes.get(8), "freight", LocalDateTime.now().plusHours(12), LocalDateTime.now().plusHours(12).plusHours(1)),
            createTrip(vehicles.get(9), routes.get(9), "mixed", LocalDateTime.now().minusHours(6), LocalDateTime.now().minusHours(6).plusHours(1))
        );
        tripRepository.saveAll(trips);
        System.out.println("Seeded 10 trips");
    }

    private Trip createTrip(Vehicle vehicle, Route route, String type, LocalDateTime departure, LocalDateTime arrival) {
        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType(type);
        trip.setScheduledDeparture(departure);
        trip.setScheduledArrival(arrival);
        trip.setActualDeparture(departure);
        trip.setActualArrival(arrival);
        trip.setStatus("completed");
        trip.setCreatedAt(LocalDateTime.now());
        return trip;
    }

    private void seedOrders() {
        List<Order> orders = Arrays.asList(
            createOrder("Nguyen Thi Mai", "123 Tran Hung Dao, Hoan Kiem, Hanoi", "647 Bach Dang, Hai Chau, Da Nang"),
            createOrder("Tran Van Binh", "45 Nguyen Hue, District 1, HCM City", "Villa 12, Phu My Hung, District 7, HCM City"),
            createOrder("Le Thi Cuc", "Hospital District, Thai Nguyen", "156 Le Duan, Dong Da, Hanoi"),
            createOrder("Pham Van Duc", "Can Tho Port Authority", "Soc Trang River Port"),
            createOrder("Hoang Minh Tam", "89A Cat Bi Road, Hai Phong", "Military Academy Campus, Hanoi"),
            createOrder("Diep Van Loc", "Airport PLAZA, Nha Trang", "Sapaco Tourist, Bao Loc"),
            createOrder("VO Thanh Nhung", "Industrial Zone, Binh Duong", "Ocean Park, Gia Lam, Hanoi"),
            createOrder("Bui Duc Phong", "Halong Marina Resort", "Louisiane Brewhouse, Hanoi"),
            createOrder("Do Thi Huong", "BigC Supermarket, Ha Long", "Metropole Hotel, Hanoi"),
            createOrder("Ly Ngoc son", "Sapa Weather Station", "Truc Bach Lake Garden, Hanoi")
        );
        orderRepository.saveAll(orders);
        System.out.println("Seeded 10 orders");
    }

    private Order createOrder(String customerName, String pickupAddress, String deliveryAddress) {
        Order order = new Order();
        order.setCustomerName(customerName);
        order.setPickupAddress(pickupAddress);
        order.setDeliveryAddress(deliveryAddress);
        order.setOrderStatus("pending");
        order.setCreatedAt(LocalDateTime.now());
        return order;
    }

    private void seedTripAssignments() {
        List<Driver> drivers = driverRepository.findAll().stream().limit(10).toList();
        List<Trip> trips = tripRepository.findAll().stream().limit(10).toList();

        List<TripAssignment> assignments = Arrays.asList(
            createTripAssignment(trips.get(0), drivers.get(0), "primary"),
            createTripAssignment(trips.get(1), drivers.get(1), "primary"),
            createTripAssignment(trips.get(2), drivers.get(2), "primary"),
            createTripAssignment(trips.get(3), drivers.get(3), "primary"),
            createTripAssignment(trips.get(4), drivers.get(4), "primary"),
            createTripAssignment(trips.get(5), drivers.get(5), "primary"),
            createTripAssignment(trips.get(6), drivers.get(6), "primary"),
            createTripAssignment(trips.get(7), drivers.get(7), "primary"),
            createTripAssignment(trips.get(8), drivers.get(8), "primary"),
            createTripAssignment(trips.get(9), drivers.get(9), "primary")
        );
        tripAssignmentRepository.saveAll(assignments);
        System.out.println("Seeded 10 trip assignments");
    }

    private TripAssignment createTripAssignment(Trip trip, Driver driver, String role) {
        TripAssignment assignment = new TripAssignment();
        assignment.setTrip(trip);
        assignment.setDriver(driver);
        assignment.setRole(role);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setStartedAt(LocalDateTime.now());
        assignment.setCompletedAt(LocalDateTime.now().plusMinutes(30));
        assignment.setStatus("completed");
        return assignment;
    }

    private void seedDriverWorkLogs() {
        List<Driver> drivers = driverRepository.findAll().stream().limit(10).toList();
        List<Trip> trips = tripRepository.findAll().stream().limit(10).toList();

        List<DriverWorkLog> logs = Arrays.asList(
            createWorkLog(drivers.get(0), trips.get(0), LocalDateTime.now().minusHours(24), LocalDateTime.now().minusHours(2), new BigDecimal("22.0"), new BigDecimal("2.0")),
            createWorkLog(drivers.get(1), trips.get(1), LocalDateTime.now().minusHours(4), LocalDateTime.now(), new BigDecimal("2.5"), new BigDecimal("0.5")),
            createWorkLog(drivers.get(2), trips.get(2), LocalDateTime.now().minusHours(8), LocalDateTime.now().minusHours(2), new BigDecimal("6.0"), new BigDecimal("1.0")),
            createWorkLog(drivers.get(3), trips.get(3), LocalDateTime.now().minusHours(12), LocalDateTime.now().minusHours(8), new BigDecimal("4.0"), new BigDecimal("0.75")),
            createWorkLog(drivers.get(4), trips.get(4), LocalDateTime.now().minusHours(16), LocalDateTime.now().minusHours(12), new BigDecimal("4.0"), new BigDecimal("0.75")),
            createWorkLog(drivers.get(5), trips.get(5), LocalDateTime.now().minusHours(20), LocalDateTime.now().minusHours(16), new BigDecimal("4.0"), new BigDecimal("0.75")),
            createWorkLog(drivers.get(6), trips.get(6), LocalDateTime.now().minusHours(6), LocalDateTime.now().minusHours(3), new BigDecimal("3.0"), new BigDecimal("0.5")),
            createWorkLog(drivers.get(7), trips.get(7), LocalDateTime.now().minusHours(10), LocalDateTime.now().minusHours(6), new BigDecimal("4.0"), new BigDecimal("0.75")),
            createWorkLog(drivers.get(8), trips.get(8), LocalDateTime.now().minusHours(14), LocalDateTime.now().minusHours(10), new BigDecimal("4.0"), new BigDecimal("0.75")),
            createWorkLog(drivers.get(9), trips.get(9), LocalDateTime.now().minusHours(18), LocalDateTime.now().minusHours(14), new BigDecimal("4.0"), new BigDecimal("0.75"))
        );
        driverWorkLogRepository.saveAll(logs);
        System.out.println("Seeded 10 driver work logs");
    }

    private DriverWorkLog createWorkLog(Driver driver, Trip trip, LocalDateTime start, LocalDateTime end, BigDecimal hoursWorked, BigDecimal restRequired) {
        DriverWorkLog log = new DriverWorkLog();
        log.setDriver(driver);
        log.setTrip(trip);
        log.setStartTime(start);
        log.setEndTime(end);
        log.setHoursWorked(hoursWorked);
        log.setRestHoursRequired(restRequired);
        log.setNextAvailableTime(end.plusHours(restRequired.longValue()));
        return log;
    }
}
