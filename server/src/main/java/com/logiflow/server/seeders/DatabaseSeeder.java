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

    private void seedTrips() {
        List<Vehicle> vehicles = vehicleRepository.findAll().stream().limit(10).toList();
        List<Route> routes = routeRepository.findAll().stream().limit(10).toList();

        List<Trip> trips = Arrays.asList(
            // Driver 0 - 3 trips (past, current, future)
            createTrip(vehicles.get(0), routes.get(0), "freight", LocalDateTime.now().minusDays(2), LocalDateTime.now().minusDays(1), "completed"),
            createTrip(vehicles.get(0), routes.get(6), "mixed", LocalDateTime.now().plusHours(3), LocalDateTime.now().plusHours(3).plusMinutes(30), "scheduled"),
            createTrip(vehicles.get(0), routes.get(3), "freight", LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(2).plusHours(1), "scheduled"),
            
            // Driver 1 - 3 trips
            createTrip(vehicles.get(1), routes.get(1), "passenger", LocalDateTime.now().minusHours(4), LocalDateTime.now().minusHours(3), "completed"),
            createTrip(vehicles.get(1), routes.get(7), "passenger", LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(2).plusMinutes(45), "scheduled"),
            createTrip(vehicles.get(1), routes.get(4), "passenger", LocalDateTime.now().plusDays(1), LocalDateTime.now().plusDays(1).plusHours(2), "scheduled"),
            
            // Driver 2 - 3 trips
            createTrip(vehicles.get(2), routes.get(2), "mixed", LocalDateTime.now().minusDays(1), LocalDateTime.now().minusDays(1).plusHours(7), "completed"),
            createTrip(vehicles.get(2), routes.get(8), "freight", LocalDateTime.now().plusHours(6), LocalDateTime.now().plusHours(6).plusMinutes(30), "scheduled"),
            createTrip(vehicles.get(2), routes.get(5), "mixed", LocalDateTime.now().plusDays(3), LocalDateTime.now().plusDays(3).plusHours(1), "scheduled"),
            
            // Driver 3 - 3 trips
            createTrip(vehicles.get(3), routes.get(3), "freight", LocalDateTime.now().minusHours(8), LocalDateTime.now().minusHours(5), "completed"),
            createTrip(vehicles.get(3), routes.get(9), "freight", LocalDateTime.now().minusHours(2), LocalDateTime.now().minusHours(2).plusMinutes(20), "in_progress"),
            createTrip(vehicles.get(3), routes.get(0), "freight", LocalDateTime.now().plusDays(1).plusHours(6), LocalDateTime.now().plusDays(2).plusHours(6), "scheduled"),
            
            // Driver 4 - 3 trips
            createTrip(vehicles.get(4), routes.get(4), "passenger", LocalDateTime.now().minusDays(3), LocalDateTime.now().minusDays(3).plusHours(2), "completed"),
            createTrip(vehicles.get(4), routes.get(6), "mixed", LocalDateTime.now().plusHours(8), LocalDateTime.now().plusHours(8).plusMinutes(40), "scheduled"),
            createTrip(vehicles.get(4), routes.get(1), "passenger", LocalDateTime.now().plusDays(4), LocalDateTime.now().plusDays(4).plusHours(12), "scheduled"),
            
            // Driver 5 - 3 trips
            createTrip(vehicles.get(5), routes.get(5), "freight", LocalDateTime.now().minusHours(12), LocalDateTime.now().minusHours(10), "completed"),
            createTrip(vehicles.get(5), routes.get(7), "mixed", LocalDateTime.now().plusHours(4), LocalDateTime.now().plusHours(4).plusMinutes(50), "scheduled"),
            createTrip(vehicles.get(5), routes.get(2), "freight", LocalDateTime.now().plusDays(2).plusHours(8), LocalDateTime.now().plusDays(2).plusHours(15), "scheduled"),
            
            // Driver 6 - 3 trips
            createTrip(vehicles.get(6), routes.get(6), "mixed", LocalDateTime.now().minusDays(1).plusHours(6), LocalDateTime.now().minusDays(1).plusHours(9), "completed"),
            createTrip(vehicles.get(6), routes.get(8), "freight", LocalDateTime.now().plusHours(10), LocalDateTime.now().plusHours(10).plusMinutes(25), "scheduled"),
            createTrip(vehicles.get(6), routes.get(4), "passenger", LocalDateTime.now().plusDays(3).plusHours(4), LocalDateTime.now().plusDays(3).plusHours(6), "scheduled"),
            
            // Driver 7 - 3 trips
            createTrip(vehicles.get(7), routes.get(7), "passenger", LocalDateTime.now().minusHours(6), LocalDateTime.now().minusHours(4), "completed"),
            createTrip(vehicles.get(7), routes.get(9), "mixed", LocalDateTime.now().plusHours(5), LocalDateTime.now().plusHours(5).plusMinutes(20), "scheduled"),
            createTrip(vehicles.get(7), routes.get(3), "freight", LocalDateTime.now().plusDays(5), LocalDateTime.now().plusDays(5).plusHours(1), "scheduled"),
            
            // Driver 8 - 3 trips
            createTrip(vehicles.get(8), routes.get(8), "freight", LocalDateTime.now().minusDays(2).plusHours(3), LocalDateTime.now().minusDays(2).plusHours(4), "completed"),
            createTrip(vehicles.get(8), routes.get(6), "mixed", LocalDateTime.now().plusHours(12), LocalDateTime.now().plusHours(12).plusMinutes(35), "scheduled"),
            createTrip(vehicles.get(8), routes.get(5), "freight", LocalDateTime.now().plusDays(1).plusHours(10), LocalDateTime.now().plusDays(1).plusHours(12), "scheduled"),
            
            // Driver 9 - 3 trips
            createTrip(vehicles.get(9), routes.get(9), "mixed", LocalDateTime.now().minusHours(10), LocalDateTime.now().minusHours(9), "completed"),
            createTrip(vehicles.get(9), routes.get(0), "freight", LocalDateTime.now().plusHours(1), LocalDateTime.now().plusDays(1).plusHours(1), "scheduled"),
            createTrip(vehicles.get(9), routes.get(2), "mixed", LocalDateTime.now().plusDays(6), LocalDateTime.now().plusDays(6).plusHours(7), "scheduled")
        );
        tripRepository.saveAll(trips);
        System.out.println("Seeded 30 trips (3 per driver)");
    }

    private Trip createTrip(Vehicle vehicle, Route route, String type, LocalDateTime departure, LocalDateTime arrival, String status) {
        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(route);
        trip.setTripType(type);
        trip.setScheduledDeparture(departure);
        trip.setScheduledArrival(arrival);
        if (status.equals("completed")) {
            trip.setActualDeparture(departure);
            trip.setActualArrival(arrival);
        }
        trip.setStatus(status);
        trip.setCreatedAt(LocalDateTime.now());
        return trip;
    }

    private void seedOrders() {
        List<Trip> trips = tripRepository.findAll();
        User dispatcher = userRepository.findByUsername("john.dispatcher").orElseThrow(() -> new RuntimeException("Dispatcher not found"));

        List<Order> orders = Arrays.asList(
            // Orders for all 30 trips
            createOrder(trips.get(0), "Nguyen Thi Mai", "+84-901-111-111", "1.5kg laptop with charger and mouse, handle with care", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Hanoi Old Quarter", "Ben Thanh Market, HCM City"),
            createOrder(trips.get(1), "Tran Van Binh", "+84-902-222-222", "10kg cement bags and steel pipes, fragile construction materials", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Hoan Kiem Lake", "West Lake Area"),
            createOrder(trips.get(2), "Le Thi Cuc", "+84-903-333-333", "5kg surgical instruments, temperature controlled, urgent delivery", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.ASSIGNED, "Hospital District, Thai Nguyen", "156 Le Duan, Dong Da, Hanoi"),
            createOrder(trips.get(3), "Pham Van Duc", "+84-904-444-444", "2kg important documents in waterproof envelope, confidential", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "My Dinh Bus Station", "Da Nang Airport"),
            createOrder(trips.get(4), "Hoang Minh Tam", "+84-905-555-555", "20kg fresh fruits and vegetables, refrigerate immediately upon receipt", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.IN_TRANSIT, "Notre Dame Cathedral, District 1", "Phu My Hung, District 7"),
            createOrder(trips.get(5), "Diep Van Loc", "+84-906-666-666", "15kg 55-inch LCD TV in original packaging, glass screen - handle carefully", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Hanoi Train Station", "Bac Ninh Culture Center"),
            createOrder(trips.get(6), "Vo Thanh Nhung", "+84-907-777-777", "3kg designer shirts and dresses, dry clean only items", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Tan Son Nhat Airport", "Nha Trang Beach"),
            createOrder(trips.get(7), "Bui Duc Phong", "+84-908-888-888", "50kg solid wood dining table and chairs, assemble before noon", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.IN_TRANSIT, "Ninh Kieu Wharf", "Cai Rang Market"),
            createOrder(trips.get(8), "Do Thi Huong", "+84-909-999-999", "2kg custom wedding cake with edible decorations, keep cool", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Cat Bi Airport, Haiphong", "Noi Bai Airport, Hanoi"),
            createOrder(trips.get(9), "Ly Ngoc Son", "+84-910-000-000", "5kg framed oil paintings, valuable artwork - handle with extreme care", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Nha Trang Beach", "Vinpearl Cable Car"),
            createOrder(trips.get(10), "Nguyen Van Hai", "+84-911-111-111", "8kg electronics and accessories, keep dry", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Hanoi Old Quarter", "Ben Thanh Market"),
            createOrder(trips.get(11), "Tran Thi Lan", "+84-912-222-222", "25kg industrial equipment parts", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.IN_TRANSIT, "Dragon Bridge", "Japanese Bridge, Hoi An"),
            createOrder(trips.get(12), "Le Van Minh", "+84-913-333-333", "3kg pharmaceutical supplies, temperature sensitive", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.ASSIGNED, "HCM District 1", "District 7 Residential Area"),
            createOrder(trips.get(13), "Pham Thi Thu", "+84-914-444-444", "12kg office furniture and supplies", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Hanoi Center", "West Lake Office Park"),
            createOrder(trips.get(14), "Hoang Van Nam", "+84-915-555-555", "7kg fashion accessories and shoes", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "My Dinh Station", "Da Nang Central"),
            createOrder(trips.get(15), "Dinh Thi Hoa", "+84-916-666-666", "30kg building materials", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Bac Ninh Province", "Hanoi Train Station"),
            createOrder(trips.get(16), "Bui Van Tuan", "+84-917-777-777", "4kg jewelry and watches, high value", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Nha Trang Center", "Cam Ranh Area"),
            createOrder(trips.get(17), "Dao Thi Mai", "+84-918-888-888", "18kg household appliances", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Can Tho Wharf", "Floating Market Area"),
            createOrder(trips.get(18), "Ly Van Duc", "+84-919-999-999", "6kg sporting goods and equipment", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Haiphong Port", "Hanoi Sports Complex"),
            createOrder(trips.get(19), "Vo Thi Huong", "+84-920-000-000", "22kg construction tools", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "District 1 Center", "District 7 Construction Site"),
            // Additional 10 orders for trips 20-29
            createOrder(trips.get(20), "Nguyen Van Long", "+84-921-111-111", "15kg auto parts and accessories", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Hanoi Automotive District", "West Lake Auto Shop"),
            createOrder(trips.get(21), "Tran Thi Nga", "+84-922-222-222", "5kg medical equipment, sterile packaging", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Da Nang Medical Center", "Hoi An Clinic"),
            createOrder(trips.get(22), "Le Van Phong", "+84-923-333-333", "40kg industrial machinery parts", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "HCM Industrial Park", "District 7 Factory"),
            createOrder(trips.get(23), "Pham Thi Quynh", "+84-924-444-444", "3kg precious gems and jewelry, insured", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.ASSIGNED, "Halong Jewelry Store", "Hanoi Gold Street"),
            createOrder(trips.get(24), "Hoang Van Son", "+84-925-555-555", "20kg frozen seafood, keep below -18°C", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Can Tho Fish Market", "Floating Market Restaurant"),
            createOrder(trips.get(25), "Dinh Thi Tam", "+84-926-666-666", "10kg textiles and fabrics", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Hanoi Textile Market", "West Lake Fashion Store"),
            createOrder(trips.get(26), "Bui Van Tung", "+84-927-777-777", "35kg construction steel beams", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Bac Ninh Steel Yard", "Hanoi Construction Site"),
            createOrder(trips.get(27), "Dao Thi Uyen", "+84-928-888-888", "7kg computer hardware and peripherals", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Nha Trang Tech Store", "Vinpearl Office"),
            createOrder(trips.get(28), "Ly Van Vinh", "+84-929-999-999", "50kg agricultural products and seeds", dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Hanoi Agricultural Market", "HCM Wholesale Center"),
            createOrder(trips.get(29), "Vo Thi Xuan", "+84-930-000-000", "12kg pharmaceutical drugs, temperature controlled", dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.ASSIGNED, "HCM Pharmaceutical Depot", "Nha Trang Hospital Pharmacy")
        );
        orderRepository.saveAll(orders);
        System.out.println("Seeded 30 orders for 30 trips (1 order per trip)");
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
        return order;
    }

    private void seedTripAssignments() {
        List<Driver> drivers = driverRepository.findAll().stream().limit(10).toList();
        List<Trip> trips = tripRepository.findAll();

        List<TripAssignment> assignments = Arrays.asList(
            // Driver 0 - 3 trips
            createTripAssignment(trips.get(0), drivers.get(0), "primary", "completed"),
            createTripAssignment(trips.get(1), drivers.get(0), "primary", "accepted"),
            createTripAssignment(trips.get(2), drivers.get(0), "primary", "assigned"),
            
            // Driver 1 - 3 trips
            createTripAssignment(trips.get(3), drivers.get(1), "primary", "completed"),
            createTripAssignment(trips.get(4), drivers.get(1), "primary", "accepted"),
            createTripAssignment(trips.get(5), drivers.get(1), "primary", "assigned"),
            
            // Driver 2 - 3 trips
            createTripAssignment(trips.get(6), drivers.get(2), "primary", "completed"),
            createTripAssignment(trips.get(7), drivers.get(2), "primary", "accepted"),
            createTripAssignment(trips.get(8), drivers.get(2), "primary", "assigned"),
            
            // Driver 3 - 3 trips
            createTripAssignment(trips.get(9), drivers.get(3), "primary", "completed"),
            createTripAssignment(trips.get(10), drivers.get(3), "primary", "accepted"),
            createTripAssignment(trips.get(11), drivers.get(3), "primary", "assigned"),
            
            // Driver 4 - 3 trips
            createTripAssignment(trips.get(12), drivers.get(4), "primary", "completed"),
            createTripAssignment(trips.get(13), drivers.get(4), "primary", "accepted"),
            createTripAssignment(trips.get(14), drivers.get(4), "primary", "assigned"),
            
            // Driver 5 - 3 trips
            createTripAssignment(trips.get(15), drivers.get(5), "primary", "completed"),
            createTripAssignment(trips.get(16), drivers.get(5), "primary", "accepted"),
            createTripAssignment(trips.get(17), drivers.get(5), "primary", "assigned"),
            
            // Driver 6 - 3 trips
            createTripAssignment(trips.get(18), drivers.get(6), "primary", "completed"),
            createTripAssignment(trips.get(19), drivers.get(6), "primary", "accepted"),
            createTripAssignment(trips.get(20), drivers.get(6), "primary", "assigned"),
            
            // Driver 7 - 3 trips
            createTripAssignment(trips.get(21), drivers.get(7), "primary", "completed"),
            createTripAssignment(trips.get(22), drivers.get(7), "primary", "accepted"),
            createTripAssignment(trips.get(23), drivers.get(7), "primary", "assigned"),
            
            // Driver 8 - 3 trips
            createTripAssignment(trips.get(24), drivers.get(8), "primary", "completed"),
            createTripAssignment(trips.get(25), drivers.get(8), "primary", "accepted"),
            createTripAssignment(trips.get(26), drivers.get(8), "primary", "assigned"),
            
            // Driver 9 - 3 trips
            createTripAssignment(trips.get(27), drivers.get(9), "primary", "completed"),
            createTripAssignment(trips.get(28), drivers.get(9), "primary", "accepted"),
            createTripAssignment(trips.get(29), drivers.get(9), "primary", "assigned")
        );
        tripAssignmentRepository.saveAll(assignments);
        System.out.println("Seeded 30 trip assignments (3 per driver)");
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

        List<DriverWorkLog> logs = Arrays.asList(
            // Work logs for completed trips only
            createWorkLog(drivers.get(0), trips.get(0), LocalDateTime.now().minusDays(2), LocalDateTime.now().minusDays(1), new BigDecimal("24.0"), new BigDecimal("2.0")),
            createWorkLog(drivers.get(1), trips.get(3), LocalDateTime.now().minusHours(4), LocalDateTime.now().minusHours(3), new BigDecimal("1.0"), new BigDecimal("0.25")),
            createWorkLog(drivers.get(2), trips.get(6), LocalDateTime.now().minusDays(1), LocalDateTime.now().minusDays(1).plusHours(7), new BigDecimal("7.0"), new BigDecimal("1.5")),
            createWorkLog(drivers.get(3), trips.get(9), LocalDateTime.now().minusHours(8), LocalDateTime.now().minusHours(5), new BigDecimal("3.0"), new BigDecimal("0.5")),
            createWorkLog(drivers.get(4), trips.get(12), LocalDateTime.now().minusDays(3), LocalDateTime.now().minusDays(3).plusHours(2), new BigDecimal("2.0"), new BigDecimal("0.5")),
            createWorkLog(drivers.get(5), trips.get(15), LocalDateTime.now().minusHours(12), LocalDateTime.now().minusHours(10), new BigDecimal("2.0"), new BigDecimal("0.5")),
            createWorkLog(drivers.get(6), trips.get(18), LocalDateTime.now().minusDays(1).plusHours(6), LocalDateTime.now().minusDays(1).plusHours(9), new BigDecimal("3.0"), new BigDecimal("0.5")),
            createWorkLog(drivers.get(7), trips.get(21), LocalDateTime.now().minusHours(6), LocalDateTime.now().minusHours(4), new BigDecimal("2.0"), new BigDecimal("0.5")),
            createWorkLog(drivers.get(8), trips.get(24), LocalDateTime.now().minusDays(2).plusHours(3), LocalDateTime.now().minusDays(2).plusHours(4), new BigDecimal("1.0"), new BigDecimal("0.25")),
            createWorkLog(drivers.get(9), trips.get(27), LocalDateTime.now().minusHours(10), LocalDateTime.now().minusHours(9), new BigDecimal("1.0"), new BigDecimal("0.25"))
        );
        driverWorkLogRepository.saveAll(logs);
        System.out.println("Seeded 10 driver work logs for completed trips");
    }

    private void seedSystemSettings() {
        List<SystemSetting> settings = Arrays.asList(
            // Map Settings
            createSystemSetting("maps", "map_provider", "openstreet", false, "Primary map provider (openstreet, mapbox)"),
            createSystemSetting("maps", "map_display_marker_clusters", "true", false, "Enable marker clustering for multiple vehicles/locations"),
            createSystemSetting("maps", "map_default_zoom_level", "10", false, "Default zoom level for map views"),
            createSystemSetting("maps", "map_route_color", "#4285F4", false, "Default color for route visualization on maps"),
            createSystemSetting("maps", "map_vehicle_icon_style", "truck", false, "Vehicle icon style on map (truck, van, motorcycle)"),
            createSystemSetting("maps", "map_refresh_interval_seconds", "30", false, "Map refresh interval in seconds for real-time updates"),
            createSystemSetting("maps", "geocoding_cache_enabled", "true", false, "Enable geocoding result caching for performance"),
            createSystemSetting("maps", "geocoding_cache_expiry_hours", "24", false, "Geocoding cache expiry time in hours"),

            // GPS Settings
            createSystemSetting("gps", "gps_tracking_enabled", "true", false, "Enable GPS tracking for vehicles and drivers"),
            createSystemSetting("gps", "gps_tracking_frequency_seconds", "60", false, "GPS position update frequency in seconds"),
            createSystemSetting("gps", "gps_data_retention_days", "90", false, "Number of days to retain GPS location data"),
            createSystemSetting("gps", "gps_accuracy_required_meters", "50", false, "Required GPS accuracy in meters (lower is better)"),
            createSystemSetting("gps", "gps_battery_optimization", "false", false, "Enable battery optimization for GPS tracking"),
            createSystemSetting("gps", "gps_stop_detection_enabled", "true", false, "Enable automatic stop detection when vehicle is stationary"),
            createSystemSetting("gps", "gps_speed_threshold_kmph", "5", false, "Speed threshold in km/h to consider vehicle stopped"),
            createSystemSetting("gps", "gps_idle_timeout_minutes", "10", false, "Time in minutes to consider vehicle idle"),
            createSystemSetting("gps", "gps_geofencing_enabled", "true", false, "Enable geofencing alerts and notifications"),
            createSystemSetting("gps", "gps_trip_logging_enabled", "true", false, "Enable detailed trip logging with GPS coordinates"),

            // Existing integration settings
            createSystemSetting("integration", "notification_sms_enabled", "false", false, "Enable SMS notifications through third-party provider"),
            createSystemSetting("integration", "email_service_provider", "none", false, "Email service provider (smtp, sendgrid, mailgun, etc.)"),
            createSystemSetting("integration", "third_party_logistics_enabled", "false", false, "Enable third-party logistics API integrations")
        );
        systemSettingRepository.saveAll(settings);
        System.out.println("Seeded 21 system settings");
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
