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
    private com.logiflow.server.repositories.system.SystemSettingRepository systemSettingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Only seed if data doesn't exist
        if (roleRepository.count() == 0) {
            seedRoles();
            seedUsersWithRoles();
            seedSystemSettings();
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
            createUserWithRole("admin", "admin@logiflow.com", "123", roles.get(0), "Admin User", "+84-901-000-001", "/uploads/profile-pictures/albert-dera-ILip77SbmOE-unsplash.jpg"), // ADMIN
            createUserWithRole("john.dispatcher", "john.d@logiflow.com", "123", roles.get(1), "John Dispatcher", "+84-901-234-501", "/uploads/profile-pictures/boy-snow-hoodie.jpg"), // DISPATCHER
            createUserWithRole("sarah.manager", "sarah.m@logiflow.com", "123", roles.get(3), "Sarah Manager", "+84-901-234-502", "/uploads/profile-pictures/woman-on-a-football-field.jpg"), // MANAGER
            createUserWithRole("mike.driver", "mike.d@logiflow.com", "123", roles.get(2), "Mike Driver", "+84-901-234-503", "/uploads/profile-pictures/man-portrait.jpg"), // DRIVER
            createUserWithRole("amy.dispatcher2", "amy.d@logiflow.com", "123", roles.get(1), "Amy Dispatcher", "+84-901-234-504", "/uploads/profile-pictures/vicky-hladynets-C8Ta0gwPbQg-unsplash.jpg"), // DISPATCHER
            createUserWithRole("carl.driver2", "carl.d@logiflow.com", "123", roles.get(2), "Carl Driver", "+84-901-234-505", "/uploads/profile-pictures/smile.jpg"), // DRIVER
            createUserWithRole("lisa.manager2", "lisa.m@logiflow.com", "123", roles.get(3), "Lisa Manager", "+84-901-234-506", "/uploads/profile-pictures/look-up.jpg"), // MANAGER
            createUserWithRole("david.driver3", "david.d@logiflow.com", "123", roles.get(2), "David Driver", "+84-901-234-507", "/uploads/profile-pictures/toa-heftiba-O3ymvT7Wf9U-unsplash.jpg"), // DRIVER
            createUserWithRole("emma.driver4", "emma.d@logiflow.com", "123", roles.get(2), "Emma Driver", "+84-901-234-508", "/uploads/profile-pictures/upscale-face-1.jpg"), // DRIVER
            createUserWithRole("bob.driver5", "bob.d@logiflow.com", "123", roles.get(2), "Bob Driver", "+84-901-234-509", "/uploads/profile-pictures/smiling-man.jpg") // DRIVER
        );
        userRepository.saveAll(users);
        System.out.println("Seeded 10 users with roles");
    }

    private User createUserWithRole(String username, String email, String password, Role role, String fullName, String phone, String profilePictureUrl) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setProfilePictureUrl(profilePictureUrl);
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
            // Long haul routes
            createRoute("Hanoi-HCM City", "Hanoi Old Quarter, Hoan Kiem District", new BigDecimal("21.0285"), new BigDecimal("105.8542"), "Ben Thanh Market, District 1, HCM City", new BigDecimal("10.7726"), new BigDecimal("106.6980"), new BigDecimal("1729.50"), new BigDecimal("24.0"), "long_haul"),
            createRoute("Hanoi-Da Nang", "My Dinh Bus Station, Hanoi", new BigDecimal("21.0293"), new BigDecimal("105.7799"), "Da Nang International Airport", new BigDecimal("16.0544"), new BigDecimal("108.2022"), new BigDecimal("764.0"), new BigDecimal("12.5"), "long_haul"),
            createRoute("HCM City-Nha Trang", "Tan Son Nhat Airport, HCM City", new BigDecimal("10.8184"), new BigDecimal("106.6519"), "Nha Trang City Center", new BigDecimal("12.2388"), new BigDecimal("109.1967"), new BigDecimal("448.0"), new BigDecimal("7.5"), "long_haul"),
            
            // Intercity routes
            createRoute("Da Nang-Hoi An", "Dragon Bridge, Da Nang", new BigDecimal("16.0609"), new BigDecimal("108.2278"), "Japanese Covered Bridge, Hoi An", new BigDecimal("15.8790"), new BigDecimal("108.3272"), new BigDecimal("30.5"), new BigDecimal("0.75"), "intercity"),
            createRoute("Haiphong-Hanoi", "Cat Bi International Airport, Haiphong", new BigDecimal("20.8197"), new BigDecimal("106.7242"), "Noi Bai International Airport, Hanoi", new BigDecimal("21.2212"), new BigDecimal("105.8073"), new BigDecimal("102.0"), new BigDecimal("2.0"), "intercity"),
            createRoute("Bac Ninh-Hanoi", "Kinh Bac Culture Center, Bac Ninh", new BigDecimal("21.1861"), new BigDecimal("106.0763"), "Hanoi Train Station", new BigDecimal("21.0245"), new BigDecimal("105.8412"), new BigDecimal("31.0"), new BigDecimal("1.0"), "intercity"),
            
            // Intracity routes
            createRoute("Hanoi City Center Loop", "Hoan Kiem Lake", new BigDecimal("21.0285"), new BigDecimal("105.8542"), "West Lake (Ho Tay)", new BigDecimal("21.0583"), new BigDecimal("105.8191"), new BigDecimal("7.5"), new BigDecimal("0.33"), "intracity"),
            createRoute("HCM District 1-District 7", "Notre Dame Cathedral, District 1", new BigDecimal("10.7798"), new BigDecimal("106.6990"), "Phu My Hung, District 7", new BigDecimal("10.7295"), new BigDecimal("106.7189"), new BigDecimal("12.0"), new BigDecimal("0.5"), "intracity"),
            createRoute("Can Tho River Route", "Ninh Kieu Wharf, Can Tho", new BigDecimal("10.0378"), new BigDecimal("105.7833"), "Cai Rang Floating Market, Can Tho", new BigDecimal("10.0525"), new BigDecimal("105.7450"), new BigDecimal("6.5"), new BigDecimal("0.25"), "intracity"),
            createRoute("Nha Trang Beach Route", "Nha Trang Beach", new BigDecimal("12.2388"), new BigDecimal("109.1967"), "Vinpearl Cable Car Station", new BigDecimal("12.2166"), new BigDecimal("109.1942"), new BigDecimal("4.2"), new BigDecimal("0.17"), "intracity")
        );
        routeRepository.saveAll(routes);
        System.out.println("Seeded 10 routes with specific Vietnamese coordinates");
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

    private Trip createTrip(Vehicle vehicle, Route route, String type, LocalDateTime departure, LocalDateTime arrival, String status) {
        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType(type);
        trip.setScheduledDeparture(departure);
        trip.setScheduledArrival(arrival);
        trip.setStatus(status);
        trip.setCreatedAt(LocalDateTime.now());
        return trip;
    }

    private Trip createCompletedTrip(Vehicle vehicle, Route route, String type, LocalDateTime scheduledDeparture, LocalDateTime scheduledArrival, LocalDateTime actualDeparture, LocalDateTime actualArrival) {
        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType(type);
        trip.setScheduledDeparture(scheduledDeparture);
        trip.setScheduledArrival(scheduledArrival);
        trip.setActualDeparture(actualDeparture);
        trip.setActualArrival(actualArrival);
        trip.setStatus("completed");
        trip.setCreatedAt(LocalDateTime.now());
        return trip;
    }

    private void seedTrips() {
        List<Vehicle> vehicles = vehicleRepository.findAll().stream().limit(10).toList();
        List<Route> routes = routeRepository.findAll().stream().limit(10).toList();
        LocalDateTime now = LocalDateTime.now();

        List<Trip> trips = Arrays.asList(
            // Driver 0 - 5 trips (2 completed, 1 in_progress, 2 scheduled)
            createCompletedTrip(vehicles.get(0), routes.get(0), "freight", now.minusDays(7), now.minusDays(7).plusHours(24), now.minusDays(7).plusMinutes(5), now.minusDays(7).plusHours(26).plusMinutes(30)),
            createCompletedTrip(vehicles.get(0), routes.get(1), "mixed", now.minusDays(5), now.minusDays(5).plusHours(12), now.minusDays(5).plusMinutes(10), now.minusDays(5).plusHours(13).plusMinutes(15)),
            createTrip(vehicles.get(0), routes.get(6), "mixed", now.minusHours(1), now.plusHours(2), "in_progress"),
            createTrip(vehicles.get(0), routes.get(3), "freight", now.plusDays(2), now.plusDays(2).plusHours(1), "scheduled"),
            createTrip(vehicles.get(0), routes.get(2), "freight", now.plusDays(3), now.plusDays(3).plusHours(7), "scheduled"),
            
            // Driver 1 - 5 trips (2 completed, 1 arrived, 2 scheduled)
            createCompletedTrip(vehicles.get(1), routes.get(1), "passenger", now.minusDays(6), now.minusDays(6).plusHours(2), now.minusDays(6).plusMinutes(8), now.minusDays(6).plusHours(2).plusMinutes(25)),
            createCompletedTrip(vehicles.get(1), routes.get(3), "passenger", now.minusDays(4), now.minusDays(4).plusHours(1), now.minusDays(4).plusMinutes(3), now.minusDays(4).plusHours(1).plusMinutes(18)),
            createTrip(vehicles.get(1), routes.get(7), "passenger", now.minusHours(3), now.minusMinutes(10), "arrived"),
            createTrip(vehicles.get(1), routes.get(4), "passenger", now.plusDays(1), now.plusDays(1).plusHours(2), "scheduled"),
            createTrip(vehicles.get(1), routes.get(5), "passenger", now.plusDays(4), now.plusDays(4).plusHours(2), "scheduled"),
            
            // Driver 2 - 6 trips (3 completed, 1 in_progress, 2 scheduled)
            createCompletedTrip(vehicles.get(2), routes.get(2), "mixed", now.minusDays(10), now.minusDays(10).plusHours(5), now.minusDays(10).plusMinutes(15), now.minusDays(10).plusHours(5).plusMinutes(45)),
            createCompletedTrip(vehicles.get(2), routes.get(4), "freight", now.minusDays(8), now.minusDays(8).plusHours(2), now.minusDays(8).plusMinutes(5), now.minusDays(8).plusHours(2).plusMinutes(35)),
            createCompletedTrip(vehicles.get(2), routes.get(6), "mixed", now.minusDays(3), now.minusDays(3).plusHours(0).plusMinutes(20), now.minusDays(3).plusMinutes(2), now.minusDays(3).plusHours(0).plusMinutes(28)),
            createTrip(vehicles.get(2), routes.get(8), "freight", now.minusMinutes(30), now.plusHours(4), "in_progress"),
            createTrip(vehicles.get(2), routes.get(5), "mixed", now.plusDays(3), now.plusDays(3).plusHours(1), "scheduled"),
            createTrip(vehicles.get(2), routes.get(7), "freight", now.plusDays(5), now.plusDays(5).plusHours(0).plusMinutes(30), "scheduled"),
            
            // Driver 3 - 5 trips (2 completed, 1 in_progress, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(3), routes.get(0), "freight", now.minusDays(9), now.minusDays(8), now.minusDays(9).plusMinutes(20), now.minusDays(8).plusHours(1).plusMinutes(10)),
            createCompletedTrip(vehicles.get(3), routes.get(5), "freight", now.minusDays(2), now.minusDays(2).plusHours(1), now.minusDays(2).plusMinutes(7), now.minusDays(2).plusHours(1).plusMinutes(22)),
            createTrip(vehicles.get(3), routes.get(3), "freight", now.minusHours(2), now.plusHours(1), "in_progress"),
            createTrip(vehicles.get(3), routes.get(9), "freight", now.plusHours(5), now.plusHours(6), "scheduled"),
            createTrip(vehicles.get(3), routes.get(1), "freight", now.plusDays(1).plusHours(6), now.plusDays(2).plusHours(6), "scheduled"),
            createTrip(vehicles.get(3), routes.get(2), "freight", now.minusDays(5), now.minusDays(5).plusHours(7), "cancelled"),
            
            // Driver 4 - 5 trips (2 completed, 1 arrived, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(4), routes.get(7), "passenger", now.minusDays(11), now.minusDays(11).plusHours(0).plusMinutes(30), now.minusDays(11).plusMinutes(4), now.minusDays(11).plusHours(0).plusMinutes(38)),
            createCompletedTrip(vehicles.get(4), routes.get(9), "passenger", now.minusDays(1), now.minusDays(1).plusHours(0).plusMinutes(17), now.minusDays(1).plusMinutes(2), now.minusDays(1).plusHours(0).plusMinutes(20)),
            createTrip(vehicles.get(4), routes.get(4), "passenger", now.minusHours(4), now.minusMinutes(5), "arrived"),
            createTrip(vehicles.get(4), routes.get(6), "mixed", now.plusHours(8), now.plusHours(8).plusMinutes(40), "scheduled"),
            createTrip(vehicles.get(4), routes.get(1), "passenger", now.plusDays(4), now.plusDays(4).plusHours(12), "scheduled"),
            createTrip(vehicles.get(4), routes.get(3), "mixed", now.minusDays(6), now.minusDays(6).plusHours(1), "cancelled"),
            
            // Driver 5 - 6 trips (3 completed, 1 in_progress, 2 scheduled)
            createCompletedTrip(vehicles.get(5), routes.get(0), "freight", now.minusDays(12), now.minusDays(11), now.minusDays(12).plusMinutes(12), now.minusDays(11).plusHours(0).plusMinutes(50)),
            createCompletedTrip(vehicles.get(5), routes.get(8), "mixed", now.minusDays(7), now.minusDays(7).plusHours(0).plusMinutes(15), now.minusDays(7).plusMinutes(3), now.minusDays(7).plusHours(0).plusMinutes(22)),
            createCompletedTrip(vehicles.get(5), routes.get(4), "freight", now.minusDays(4), now.minusDays(4).plusHours(2), now.minusDays(4).plusMinutes(10), now.minusDays(4).plusHours(2).plusMinutes(28)),
            createTrip(vehicles.get(5), routes.get(5), "freight", now.minusHours(1), now.plusHours(3), "in_progress"),
            createTrip(vehicles.get(5), routes.get(7), "mixed", now.plusHours(6), now.plusHours(7), "scheduled"),
            createTrip(vehicles.get(5), routes.get(2), "freight", now.plusDays(2).plusHours(8), now.plusDays(2).plusHours(15), "scheduled"),
            
            // Driver 6 - 5 trips (2 completed, 1 arrived, 2 scheduled)
            createCompletedTrip(vehicles.get(6), routes.get(2), "mixed", now.minusDays(13), now.minusDays(13).plusHours(7), now.minusDays(13).plusMinutes(18), now.minusDays(13).plusHours(8).plusMinutes(5)),
            createCompletedTrip(vehicles.get(6), routes.get(9), "freight", now.minusDays(9), now.minusDays(9).plusHours(0).plusMinutes(17), now.minusDays(9).plusMinutes(6), now.minusDays(9).plusHours(0).plusMinutes(25)),
            createTrip(vehicles.get(6), routes.get(6), "mixed", now.minusHours(5), now.minusMinutes(15), "arrived"),
            createTrip(vehicles.get(6), routes.get(8), "freight", now.plusHours(10), now.plusHours(10).plusMinutes(25), "scheduled"),
            createTrip(vehicles.get(6), routes.get(4), "passenger", now.plusDays(3).plusHours(4), now.plusDays(3).plusHours(6), "scheduled"),
            
            // Driver 7 - 5 trips (2 completed, 1 in_progress, 2 scheduled)
            createCompletedTrip(vehicles.get(7), routes.get(6), "passenger", now.minusDays(14), now.minusDays(14).plusHours(0).plusMinutes(20), now.minusDays(14).plusMinutes(5), now.minusDays(14).plusHours(0).plusMinutes(30)),
            createCompletedTrip(vehicles.get(7), routes.get(8), "mixed", now.minusDays(8), now.minusDays(8).plusHours(0).plusMinutes(15), now.minusDays(8).plusMinutes(8), now.minusDays(8).plusHours(0).plusMinutes(28)),
            createTrip(vehicles.get(7), routes.get(7), "passenger", now.minusMinutes(45), now.plusHours(2), "in_progress"),
            createTrip(vehicles.get(7), routes.get(9), "mixed", now.plusHours(5), now.plusHours(5).plusMinutes(20), "scheduled"),
            createTrip(vehicles.get(7), routes.get(3), "freight", now.plusDays(5), now.plusDays(5).plusHours(1), "scheduled"),
            
            // Driver 8 - 6 trips (3 completed, 1 arrived, 2 scheduled)
            createCompletedTrip(vehicles.get(8), routes.get(1), "freight", now.minusDays(15), now.minusDays(15).plusHours(12), now.minusDays(15).plusMinutes(20), now.minusDays(15).plusHours(13).plusMinutes(10)),
            createCompletedTrip(vehicles.get(8), routes.get(3), "mixed", now.minusDays(10), now.minusDays(10).plusHours(1), now.minusDays(10).plusMinutes(12), now.minusDays(10).plusHours(1).plusMinutes(35)),
            createCompletedTrip(vehicles.get(8), routes.get(7), "freight", now.minusDays(5), now.minusDays(5).plusHours(0).plusMinutes(30), now.minusDays(5).plusMinutes(7), now.minusDays(5).plusHours(0).plusMinutes(42)),
            createTrip(vehicles.get(8), routes.get(8), "freight", now.minusHours(6), now.minusMinutes(20), "arrived"),
            createTrip(vehicles.get(8), routes.get(6), "mixed", now.plusHours(12), now.plusHours(12).plusMinutes(35), "scheduled"),
            createTrip(vehicles.get(8), routes.get(5), "freight", now.plusDays(1).plusHours(10), now.plusDays(1).plusHours(12), "scheduled"),
            
            // Driver 9 - 6 trips (3 completed, 1 in_progress, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(9), routes.get(4), "mixed", now.minusDays(16), now.minusDays(16).plusHours(2), now.minusDays(16).plusMinutes(15), now.minusDays(16).plusHours(2).plusMinutes(45)),
            createCompletedTrip(vehicles.get(9), routes.get(6), "freight", now.minusDays(11), now.minusDays(11).plusHours(0).plusMinutes(20), now.minusDays(11).plusMinutes(8), now.minusDays(11).plusHours(0).plusMinutes(32)),
            createCompletedTrip(vehicles.get(9), routes.get(8), "mixed", now.minusDays(6), now.minusDays(6).plusHours(0).plusMinutes(15), now.minusDays(6).plusMinutes(10), now.minusDays(6).plusHours(0).plusMinutes(28)),
            createTrip(vehicles.get(9), routes.get(9), "mixed", now.minusHours(2), now.plusHours(5), "in_progress"),
            createTrip(vehicles.get(9), routes.get(0), "freight", now.plusHours(8), now.plusHours(9), "scheduled"),
            createTrip(vehicles.get(9), routes.get(2), "mixed", now.plusDays(6), now.plusDays(6).plusHours(7), "scheduled"),
            createTrip(vehicles.get(9), routes.get(5), "freight", now.minusDays(4), now.minusDays(4).plusHours(1), "cancelled")
        );
        tripRepository.saveAll(trips);
        System.out.println("Seeded 54 trips with comprehensive status distribution and actual completion times");
    }

    private void seedOrders() {
        List<Trip> trips = tripRepository.findAll();
        User dispatcher = userRepository.findByUsername("john.dispatcher").orElseThrow(() -> new RuntimeException("Dispatcher not found"));

        List<Order> orders = Arrays.asList(
            // Orders for completed trips - DELIVERED status
            createOrder(trips.get(0), "Nguyen Thi Mai", "+84-901-111-111", "1.5kg laptop with charger and mouse, handle with care", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Hanoi Old Quarter", "Ben Thanh Market, HCM City"),
            createOrder(trips.get(1), "Tran Van Binh", "+84-902-222-222", "10kg cement bags and steel pipes, fragile construction materials", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "My Dinh Station", "Da Nang Central"),
            
            // Orders for in_progress trips - IN_TRANSIT status  
            createOrder(trips.get(2), "Pham Van Duc", "+84-904-444-444", "2kg important documents in waterproof envelope, confidential", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Hoan Kiem Lake", "West Lake Area"),
            createOrder(trips.get(9), "Hoang Minh Tam", "+84-905-555-555", "20kg fresh fruits and vegetables, refrigerate immediately upon receipt", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.IN_TRANSIT, "Dragon Bridge", "Japanese Bridge, Hoi An"),
            
            // Orders for arrived trips - IN_TRANSIT status
            createOrder(trips.get(7), "Diep Van Loc", "+84-906-666-666", "15kg 55-inch LCD TV in original packaging, glass screen - handle carefully", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Notre Dame Cathedral", "Phu My Hung District 7"),
            
            // Orders for scheduled trips - PENDING status
            createOrder(trips.get(3), "Vo Thanh Nhung", "+84-907-777-777", "3kg designer shirts and dresses, dry clean only items", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Hanoi Train Station", "Bac Ninh Culture Center"),
            createOrder(trips.get(4), "Bui Duc Phong", "+84-908-888-888", "50kg solid wood dining table and chairs, assemble before noon", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.PENDING, "Tan Son Nhat Airport", "Nha Trang Beach"),
            createOrder(trips.get(8), "Do Thi Huong", "+84-909-999-999", "2kg custom wedding cake with edible decorations, keep cool", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Ninh Kieu Wharf", "Cai Rang Market"),
            createOrder(trips.get(11), "Ly Ngoc Son", "+84-910-000-000", "5kg framed oil paintings, valuable artwork - handle with extreme care", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Cat Bi Airport", "Noi Bai Airport"),
            createOrder(trips.get(13), "Nguyen Van Hai", "+84-911-111-111", "8kg electronics and accessories, keep dry", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Nha Trang Beach", "Vinpearl Cable Car"),
            createOrder(trips.get(15), "Tran Thi Lan", "+84-912-222-222", "25kg industrial equipment parts", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.PENDING, "Hanoi Old Quarter", "Ben Thanh Market"),
            createOrder(trips.get(17), "Le Van Minh", "+84-913-333-333", "3kg pharmaceutical supplies, temperature sensitive", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.PENDING, "HCM District 1", "District 7 Residential"),
            createOrder(trips.get(19), "Pham Thi Thu", "+84-914-444-444", "12kg office furniture and supplies", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Hanoi Center", "West Lake Office Park"),
            createOrder(trips.get(21), "Hoang Van Nam", "+84-915-555-555", "7kg fashion accessories and shoes", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "My Dinh Station", "Da Nang Central"),
            createOrder(trips.get(23), "Dinh Thi Hoa", "+84-916-666-666", "30kg building materials", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Bac Ninh Province", "Hanoi Train Station")
        );
        orderRepository.saveAll(orders);
        System.out.println("Seeded 17 orders: 3 delivered, 3 in_transit, 11 pending");
    }

    private Order createOrder(Trip trip, String customerName, String customerPhone, String packageDetails, User createdBy, Order.PriorityLevel priorityLevel, Order.OrderStatus orderStatus, String pickupAddress, String deliveryAddress) {
        Order order = new Order();
        order.setTrip(trip);
        order.setCustomerName(customerName);
        order.setCustomerPhone(customerPhone);
        order.setPackageDetails(packageDetails);
        order.setCreatedBy(createdBy);
        order.setPriorityLevel(priorityLevel);
        order.setOrderStatus(orderStatus);
        order.setPickupAddress(pickupAddress);
        order.setDeliveryAddress(deliveryAddress);
        order.setCreatedAt(LocalDateTime.now());
        
        // Calculate delivery fee based on priority and package weight
        java.math.BigDecimal baseFee = new java.math.BigDecimal("150000"); // Base fee in VND
        java.math.BigDecimal fee = baseFee;
        
        // Extract weight from package details if available
        String details = packageDetails.toLowerCase();
        if (details.contains("kg")) {
            try {
                String[] parts = details.split("kg");
                String weightStr = parts[0].replaceAll("[^0-9.]", "");
                double weight = Double.parseDouble(weightStr);
                fee = fee.add(new java.math.BigDecimal(weight * 5000)); // 5000 VND per kg
            } catch (Exception ignored) {}
        }
        
        // Add urgent priority surcharge (50%)
        if (priorityLevel == Order.PriorityLevel.URGENT) {
            fee = fee.multiply(new java.math.BigDecimal("1.5"));
        }
        
        order.setDeliveryFee(fee);
        return order;
    }

    private void seedTripAssignments() {
        List<Driver> drivers = driverRepository.findAll().stream().limit(10).toList();
        List<Trip> trips = tripRepository.findAll();

        // Create assignments for all 54 trips - completed trips have "completed" status, others based on trip status
        List<TripAssignment> assignments = new java.util.ArrayList<>();
        
        for (int i = 0; i < trips.size(); i++) {
            Trip trip = trips.get(i);
            Driver driver = drivers.get(i / 6); // 6 trips per driver (changed from 3 to accommodate 54 trips)
            
            String assignmentStatus;
            if ("completed".equals(trip.getStatus())) {
                assignmentStatus = "completed";
            } else if ("in_progress".equals(trip.getStatus()) || "arrived".equals(trip.getStatus())) {
                assignmentStatus = "accepted";
            } else if ("cancelled".equals(trip.getStatus())) {
                assignmentStatus = "declined";
            } else {
                assignmentStatus = "assigned";
            }
            
            assignments.add(createTripAssignment(trip, driver, "primary", assignmentStatus));
        }
        
        tripAssignmentRepository.saveAll(assignments);
        System.out.println("Seeded " + assignments.size() + " trip assignments");
    }

    private TripAssignment createTripAssignment(Trip trip, Driver driver, String role, String status) {
        TripAssignment assignment = new TripAssignment();
        assignment.setTrip(trip);
        assignment.setDriver(driver);
        assignment.setRole(role);
        assignment.setAssignedAt(LocalDateTime.now());
        if (status.equals("completed")) {
            assignment.setStartedAt(LocalDateTime.now().minusHours(2));
            assignment.setCompletedAt(LocalDateTime.now());
        }
        assignment.setStatus(status);
        return assignment;
    }

    private void seedDriverWorkLogs() {
        List<Driver> drivers = driverRepository.findAll().stream().limit(10).toList();
        List<Trip> trips = tripRepository.findAll();

        // Create work logs for all completed trips
        List<DriverWorkLog> logs = new java.util.ArrayList<>();
        
        for (int i = 0; i < trips.size(); i++) {
            Trip trip = trips.get(i);
            if ("completed".equals(trip.getStatus()) && trip.getActualDeparture() != null && trip.getActualArrival() != null) {
                Driver driver = drivers.get(i / 6);
                
                // Calculate hours worked based on actual departure and arrival
                long minutesWorked = java.time.Duration.between(trip.getActualDeparture(), trip.getActualArrival()).toMinutes();
                BigDecimal hoursWorked = new BigDecimal(minutesWorked).divide(new BigDecimal("60"), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal restRequired = hoursWorked.compareTo(new BigDecimal("8")) > 0 ? new BigDecimal("2.0") : new BigDecimal("0.5");
                
                logs.add(createWorkLog(driver, trip, trip.getActualDeparture(), trip.getActualArrival(), hoursWorked, restRequired));
            }
        }
        
        driverWorkLogRepository.saveAll(logs);
        System.out.println("Seeded " + logs.size() + " driver work logs for completed trips");
    }

    private void seedSystemSettings() {
        List<SystemSetting> settings = Arrays.asList(
            // Essentials only
            createSystemSetting("maps", "map_provider", "openstreet", false, "Primary map provider (openstreet, mapbox)"),
            createSystemSetting("gps", "gps_tracking_enabled", "true", false, "Enable GPS tracking for vehicles and drivers"),
            createSystemSetting("integration", "notification_sms_enabled", "false", false, "Enable SMS notifications through third-party provider"),
            createSystemSetting("integration", "email_service_provider", "none", false, "Email service provider (smtp, sendgrid, mailgun, etc.)")
        );
        systemSettingRepository.saveAll(settings);
        System.out.println("Seeded 4 system settings");
    }

    private SystemSetting createSystemSetting(String category, String key, String value, boolean isEncrypted, String description) {
        SystemSetting setting = new SystemSetting();
        setting.setCategory(category);
        setting.setKey(key);
        setting.setValue(value);
        setting.setIsEncrypted(isEncrypted);
        setting.setDescription(description);
        setting.setCreatedAt(LocalDateTime.now());
        return setting;
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
