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
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
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

    // Cloudinary placeholder image URL - single image for all seeded users
    // Note: When uploaded via the app, URLs include the folder path. For seeding, use a consistent URL.
    private static final String PLACEHOLDER_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dpp97gxhf/image/upload/v1765183836/logiflow/profile-pictures/75af113f-26e7-40aa-856a-017e28495325.jpg";

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
    private RegistrationRequestRepository registrationRequestRepository;

    @Autowired
    private DriverWorkLogRepository driverWorkLogRepository;

    @Autowired
    private com.logiflow.server.repositories.customer.CustomerRepository customerRepository;

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
            seedCustomers();
            seedSystemSettings();
            seedDrivers();
            seedVehicles();
            seedRoutes();
            seedTrips();
            seedOrders();
            seedTripAssignments();
            seedDriverWorkLogs();
            seedRegistrationRequests();
            System.out.println("Database seeding completed successfully!");
        } else {
            System.out.println("Database already seeded. Skipping...");
        }
    }

    private void seedCustomers() {
        // Filter users with CUSTOMER role and create Customer entities
        List<User> customerUsers = userRepository.findAllUsersWithRole().stream()
                .filter(user -> user.getRole() != null && "CUSTOMER".equalsIgnoreCase(user.getRole().getRoleName()))
                .toList();

        if (customerUsers.isEmpty()) {
            System.out.println("No customer users found. Skipping customer seeding.");
            return;
        }

        String[] paymentMethods = {"cash", "credit_card", "digital_wallet", "debit_card"};
        String[] neighborhoods = {"District 1", "District 7", "Thu Duc", "Go Vap", "Tan Binh"};
        String[] wards = {"Ward 1", "Ward 3", "Ward 5", "Ward 7", "Ward 9", "Ward 11"};
        String[] streets = {"Nguyen Trai", "Le Hong Phong", "Tran Hung Dao", "Vo Van Tan", "Pham Ngoc Thach", "Tong Huu Dinh"};

        List<Customer> customers = java.util.stream.IntStream.range(0, customerUsers.size())
                .mapToObj(index -> {
                    User user = customerUsers.get(index);

            Customer customer = new Customer();
            customer.setUser(user);

            // Business phone now managed in User entity (using user.getPhone())

            // Generate realistic Vietnamese address
            customer.setDefaultDeliveryAddress(generateAddress(neighborhoods, wards, streets, index));

            // Random payment method preference
            customer.setPreferredPaymentMethod(paymentMethods[Math.abs(user.getUsername().hashCode()) % paymentMethods.length]);

            // Generate realistic order statistics
            // Some customers are very active, others moderate, some new
            int activityLevel = Math.abs(user.getEmail().hashCode()) % 100;
            if (activityLevel > 70) { // 30% very active customers
                customer.setTotalOrders(25 + (activityLevel % 45)); // 25-70 orders
                customer.setTotalSpent(BigDecimal.valueOf(1500000 + (activityLevel % 5000000))); // 1.5M-6.5M VND
            } else if (activityLevel > 30) { // 40% moderate customers
                customer.setTotalOrders(3 + (activityLevel % 22)); // 3-25 orders
                customer.setTotalSpent(BigDecimal.valueOf(150000 + (activityLevel % 1350000))); // 150k-1.5M VND
            } else { // 30% new/occasional customers
                customer.setTotalOrders(activityLevel % 3); // 0-2 orders
                customer.setTotalSpent(BigDecimal.valueOf((activityLevel % 3) * 150000)); // Corresponding spent
            }

            // Set last order date based on activity
            if (customer.getTotalOrders() > 0) {
                int daysSinceLastOrder = 1 + (Math.abs(user.getUsername().hashCode()) % 60);
                customer.setLastOrderDate(LocalDateTime.now().minusDays(daysSinceLastOrder));
            }

            return customer;
        }).toList();

        // Save customers
        customerRepository.saveAll(customers);
        System.out.println("Seeded " + customers.size() + " realistic customer profiles for CUSTOMER role users");
    }

    private String generateVietnamesePhone() {
        // Generate mobile number starting with common Vietnamese prefixes
        String[] prefixes = {"+84-35", "+84-36", "+84-37", "+84-38", "+84-39", "+84-96", "+84-97", "+84-98", "+84-32"};
        String prefix = prefixes[(int)(Math.random() * prefixes.length)];
        String number = String.format("%06d", (int)(Math.random() * 1000000));
        return prefix + number;
    }

    private String generateAddress(String[] neighborhoods, String[] wards, String[] streets, int seed) {
        // Generate realistic Vietnamese addresses
        String neighborhood = neighborhoods[Math.abs(seed) % neighborhoods.length];
        String ward = wards[Math.abs(seed * 3) % wards.length];
        String street = streets[Math.abs(seed * 7) % streets.length];
        int houseNumber = 1 + Math.abs(seed * 13) % 999;

        // Some addresses include alley/number, some don't
        if (seed % 2 == 0) {
            return String.format("%d %s, %s, %s, Ho Chi Minh City", houseNumber, street, ward, neighborhood);
        } else {
            return String.format("%d/%d %s, %s, %s, Ho Chi Minh City", houseNumber, 1 + (seed % 50), street, ward, neighborhood);
        }
    }

    private void seedRoles() {
        List<Role> roles = Arrays.asList(
            createRole("ADMIN", "System administrator with full access"),
            createRole("DISPATCHER", "Manages trip assignments and routing"),
            createRole("DRIVER", "Vehicle driver"),
            createRole("MANAGER", "Fleet and operations manager"),
            createRole("CUSTOMER", "Customer who places delivery orders"),
            createRole("USER", "Standard user")
        );
        roleRepository.saveAll(roles);
        System.out.println("Seeded 6 roles");
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
        if (roles.size() < 6) {
            System.out.println("Roles not seeded yet. Skipping user creation.");
            return;
        }
        LocalDateTime now = LocalDateTime.now();

        List<User> users = Arrays.asList(
            createUserWithRole("admin", "admin@logiflow.com", "123", roles.get(0), "Admin User", "+84-901-000-001", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(120), now.minusDays(1)), // ADMIN
            createUserWithRole("john.dispatcher", "john.d@logiflow.com", "123", roles.get(1), "John Dispatcher", "+84-901-234-501", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(110), now.minusDays(2)), // DISPATCHER
            createUserWithRole("sarah.manager", "sarah.m@logiflow.com", "123", roles.get(3), "Sarah Manager", "+84-901-234-502", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(105), now.minusDays(3)), // MANAGER
            createUserWithRole("mike.driver", "mike.d@logiflow.com", "123", roles.get(2), "Mike Driver", "+84-901-234-503", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(89), now.minusDays(10)), // DRIVER
            createUserWithRole("amy.dispatcher2", "amy.d@logiflow.com", "123", roles.get(1), "Amy Dispatcher", "+84-901-234-504", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(95), now.minusDays(5)), // DISPATCHER
            createUserWithRole("carl.driver2", "carl.d@logiflow.com", "123", roles.get(2), "Carl Driver", "+84-901-234-505", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(84), now.minusDays(8)), // DRIVER
            createUserWithRole("lisa.manager2", "lisa.m@logiflow.com", "123", roles.get(3), "Lisa Manager", "+84-901-234-506", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(100), now.minusDays(4)), // MANAGER
            createUserWithRole("david.driver3", "david.d@logiflow.com", "123", roles.get(2), "David Driver", "+84-901-234-507", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(79), now.minusDays(12)), // DRIVER
            createUserWithRole("emma.driver4", "emma.d@logiflow.com", "123", roles.get(2), "Emma Driver", "+84-901-234-508", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(74), now.minusDays(15)), // DRIVER
            createUserWithRole("bob.driver5", "bob.d@logiflow.com", "123", roles.get(2), "Bob Driver", "+84-901-234-509", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(69), now.minusDays(7)), // DRIVER
            createUserWithRole("frank.driver6", "frank.d@logiflow.com", "123", roles.get(2), "Frank Driver", "+84-901-234-510", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(64), now.minusDays(9)), // DRIVER
            createUserWithRole("grace.driver7", "grace.d@logiflow.com", "123", roles.get(2), "Grace Driver", "+84-901-234-511", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(59), now.minusDays(11)), // DRIVER
            createUserWithRole("henry.driver8", "henry.d@logiflow.com", "123", roles.get(2), "Henry Driver", "+84-901-234-512", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(54), now.minusDays(6)), // DRIVER
            createUserWithRole("iris.driver9", "iris.d@logiflow.com", "123", roles.get(2), "Iris Driver", "+84-901-234-513", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(49), now.minusDays(13)), // DRIVER
            createUserWithRole("jack.driver10", "jack.d@logiflow.com", "123", roles.get(2), "Jack Driver", "+84-901-234-514", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(44), now.minusDays(14)), // DRIVER

            // CUSTOMER users (10 total)
            createUserWithRole("nguyen.mai", "nguyen.mai@gmail.com", "123", roles.get(4), "Nguyen Thi Mai", "+84-901-111-111", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(60), now.minusDays(1)), // CUSTOMER
            createUserWithRole("tran.binh", "tran.binh@gmail.com", "123", roles.get(4), "Tran Van Binh", "+84-902-222-222", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(55), now.minusDays(2)), // CUSTOMER
            createUserWithRole("pham.duc", "pham.duc@gmail.com", "123", roles.get(4), "Pham Van Duc", "+84-903-333-333", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(50), now.minusDays(3)), // CUSTOMER
            createUserWithRole("le.huong", "le.huong@gmail.com", "123", roles.get(4), "Le Thi Huong", "+84-904-444-444", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(45), now.minusDays(4)), // CUSTOMER
            createUserWithRole("hoang.tam", "hoang.tam@gmail.com", "123", roles.get(4), "Hoang Minh Tam", "+84-905-555-555", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(40), now.minusDays(5)), // CUSTOMER
            createUserWithRole("diep.loc", "diep.loc@gmail.com", "123", roles.get(4), "Diep Van Loc", "+84-906-666-666", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(35), now.minusDays(6)), // CUSTOMER
            createUserWithRole("vo.nhung", "vo.nhung@gmail.com", "123", roles.get(4), "Vo Thanh Nhung", "+84-907-777-777", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(30), now.minusDays(7)), // CUSTOMER
            createUserWithRole("bui.phong", "bui.phong@gmail.com", "123", roles.get(4), "Bui Duc Phong", "+84-908-888-888", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(25), now.minusDays(8)), // CUSTOMER
            createUserWithRole("do.huong", "do.huong@gmail.com", "123", roles.get(4), "Do Thi Huong", "+84-909-999-999", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(20), now.minusDays(9)), // CUSTOMER
            createUserWithRole("ly.son", "ly.son@gmail.com", "123", roles.get(4), "Ly Ngoc Son", "+84-910-000-000", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(15), now.minusDays(10)) // CUSTOMER
        );
        userRepository.saveAll(users);
        System.out.println("Seeded 25 users with roles (15 staff + 10 customers)");
    }

    private User createUserWithRole(String username, String email, String password, Role role, String fullName, String phone, String profilePictureUrl, LocalDateTime createdAt, LocalDateTime lastLogin) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setProfilePictureUrl(profilePictureUrl);
        user.setIsActive(true);
        user.setLastLogin(lastLogin);
        user.setCreatedAt(createdAt);
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
        // Only create Driver records for users with DRIVER role
        // Use findAllUsersWithRole to eagerly fetch roles and avoid lazy loading issues
        List<User> driverUsers = userRepository.findAllUsersWithRole().stream()
                .filter(user -> user.getRole() != null && "DRIVER".equalsIgnoreCase(user.getRole().getRoleName()))
                .toList();
        
        if (driverUsers.size() < 10) {
            System.out.println("Not enough users with DRIVER role. Skipping driver seeding.");
            return;
        }
        LocalDateTime now = LocalDateTime.now();

        List<Driver> drivers = Arrays.asList(
            createDriver(driverUsers.get(0), "Mike Driver", "+84-904-567-890", "E", 15, new BigDecimal("21.0313"), new BigDecimal("105.8518"), now.minusDays(89)),
            createDriver(driverUsers.get(1), "Carl Driver", "+84-906-789-012", "B2", 11, new BigDecimal("21.0282"), new BigDecimal("105.8542"), now.minusDays(84)),
            createDriver(driverUsers.get(2), "David Driver", "+84-908-901-234", "D", 14, new BigDecimal("20.8462"), new BigDecimal("106.6884"), now.minusDays(79)),
            createDriver(driverUsers.get(3), "Emma Driver", "+84-909-012-345", "E", 5, new BigDecimal("21.0278"), new BigDecimal("105.8342"), now.minusDays(74)),
            createDriver(driverUsers.get(4), "Bob Driver", "+84-910-123-456", "FC", 13, new BigDecimal("10.8230"), new BigDecimal("106.6297"), now.minusDays(69)),
            createDriver(driverUsers.get(5), "Frank Driver", "+84-911-234-567", "C", 8, new BigDecimal("16.0544"), new BigDecimal("108.2022"), now.minusDays(64)),
            createDriver(driverUsers.get(6), "Grace Driver", "+84-912-345-678", "D", 12, new BigDecimal("12.2388"), new BigDecimal("109.1967"), now.minusDays(59)),
            createDriver(driverUsers.get(7), "Henry Driver", "+84-913-456-789", "B2", 9, new BigDecimal("10.7726"), new BigDecimal("106.6980"), now.minusDays(54)),
            createDriver(driverUsers.get(8), "Iris Driver", "+84-914-567-890", "E", 7, new BigDecimal("20.8197"), new BigDecimal("106.7242"), now.minusDays(49)),
            createDriver(driverUsers.get(9), "Jack Driver", "+84-915-678-901", "C", 10, new BigDecimal("10.0378"), new BigDecimal("105.7833"), now.minusDays(44))
        );
        driverRepository.saveAll(drivers);
        System.out.println("Seeded " + drivers.size() + " drivers (only DRIVER role users)");
    }

    private Driver createDriver(User user, String fullName, String phone, String licenseType, int experience, BigDecimal lat, BigDecimal lng, LocalDateTime createdAt) {
        Driver driver = new Driver();
        driver.setUser(user);
        // Contact info now stored in User entity (already set above)
        driver.setLicenseType(licenseType);
        driver.setYearsExperience(experience);
        driver.setHealthStatus(Driver.HealthStatus.FIT);
        driver.setCurrentLocationLat(lat);
        driver.setCurrentLocationLng(lng);
        driver.setStatus("available");
        driver.setCreatedAt(createdAt);
        return driver;
    }

    private void seedVehicles() {
        LocalDateTime now = LocalDateTime.now();
        List<Vehicle> vehicles = Arrays.asList(
            createVehicle("truck", "51A-12345", 2000, "C", new BigDecimal("21.0285"), new BigDecimal("105.8342"), "available", now.minusDays(150)),
            createVehicle("van", "51B-23456", 800, "B2", new BigDecimal("16.0471"), new BigDecimal("108.2068"), "available", now.minusDays(145)),
            createVehicle("container", "51C-34567", 25000, "FC", new BigDecimal("21.5867"), new BigDecimal("105.3819"), "maintenance", now.minusDays(140)),
            createVehicle("truck", "51A-45678", 5000, "C", new BigDecimal("21.0313"), new BigDecimal("105.8518"), "available", now.minusDays(135)),
            createVehicle("motorbike", "51F-56789", 30, "A2", new BigDecimal("16.0628"), new BigDecimal("108.2328"), "available", now.minusDays(130)),
            createVehicle("truck", "51A-67890", 3000, "D", new BigDecimal("21.0282"), new BigDecimal("105.8542"), "in_use", now.minusDays(125)),
            createVehicle("container", "51C-78901", 20000, "FC", new BigDecimal("21.4082"), new BigDecimal("105.4282"), "available", now.minusDays(120)),
            createVehicle("van", "51B-89012", 1000, "C", new BigDecimal("20.8462"), new BigDecimal("106.6884"), "maintenance", now.minusDays(115)),
            createVehicle("truck", "51A-90123", 4000, "C", new BigDecimal("21.0278"), new BigDecimal("105.8342"), "available", now.minusDays(110)),
            createVehicle("motorbike", "51F-01234", 25, "A2", new BigDecimal("10.8230"), new BigDecimal("106.6297"), "in_use", now.minusDays(105))
        );
        vehicleRepository.saveAll(vehicles);
        System.out.println("Seeded 10 vehicles: 6 available, 2 in_use, 2 maintenance");
    }

    private Vehicle createVehicle(String vehicleType, String licensePlate, int capacity, String requiredLicense, BigDecimal lat, BigDecimal lng, String status, LocalDateTime createdAt) {
        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleType(vehicleType);
        vehicle.setLicensePlate(licensePlate);
        vehicle.setCapacity(capacity);
        vehicle.setRequiredLicense(requiredLicense);
        vehicle.setCurrentLocationLat(lat);
        vehicle.setCurrentLocationLng(lng);
        vehicle.setStatus(status);
        vehicle.setCreatedAt(createdAt);
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
        // Trips are created 2-5 days before departure
        trip.setCreatedAt(departure.minusDays(3));
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
        // Trips are created 2-5 days before departure
        trip.setCreatedAt(scheduledDeparture.minusDays(3));
        return trip;
    }

    private void seedTrips() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Route> routes = routeRepository.findAll().stream().limit(10).toList();
        LocalDateTime now = LocalDateTime.now();
        
        // 60 trips total for 10 drivers (DRIVER role users only)
        // Spread completed trips across last 60 days for realistic reports

        List<Trip> trips = Arrays.asList(
            // Driver 0 (Mike) - 6 trips (2 completed, 1 in_progress, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(0), routes.get(0), "freight", now.minusDays(45), now.minusDays(45).plusHours(24), now.minusDays(45).plusMinutes(5), now.minusDays(45).plusHours(26).plusMinutes(30)),
            createCompletedTrip(vehicles.get(0), routes.get(1), "mixed", now.minusDays(28), now.minusDays(28).plusHours(8), now.minusDays(28).plusMinutes(10), now.minusDays(28).plusHours(9).plusMinutes(5)),
            createTrip(vehicles.get(0), routes.get(6), "mixed", now.minusHours(1), now.plusHours(2), "in_progress"),
            createTrip(vehicles.get(0), routes.get(3), "freight", now.plusDays(2), now.plusDays(2).plusHours(1), "scheduled"),
            createTrip(vehicles.get(0), routes.get(8), "freight", now.plusDays(4), now.plusDays(4).plusHours(3), "scheduled"),
            createTrip(vehicles.get(0), routes.get(2), "freight", now.minusDays(6), now.minusDays(6).plusHours(1), "cancelled"),
            
            // Driver 1 (Carl) - 6 trips (2 completed, 1 arrived, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(1), routes.get(1), "mixed", now.minusDays(32), now.minusDays(32).plusHours(12), now.minusDays(32).plusMinutes(10), now.minusDays(32).plusHours(13).plusMinutes(15)),
            createCompletedTrip(vehicles.get(1), routes.get(3), "passenger", now.minusDays(22), now.minusDays(22).plusHours(1), now.minusDays(22).plusMinutes(3), now.minusDays(22).plusHours(1).plusMinutes(18)),
            createTrip(vehicles.get(1), routes.get(7), "passenger", now.minusHours(3), now.minusMinutes(10), "arrived"),
            createTrip(vehicles.get(1), routes.get(4), "passenger", now.plusDays(1), now.plusDays(1).plusHours(2), "scheduled"),
            createTrip(vehicles.get(1), routes.get(9), "mixed", now.plusDays(5), now.plusDays(5).plusHours(1), "scheduled"),
            createTrip(vehicles.get(1), routes.get(5), "freight", now.minusDays(8), now.minusDays(8).plusHours(2), "cancelled"),
            
            // Driver 2 (David) - 6 trips (3 completed, 1 in_progress, 2 scheduled)
            createCompletedTrip(vehicles.get(2), routes.get(2), "freight", now.minusDays(38), now.minusDays(37), now.minusDays(38).plusMinutes(20), now.minusDays(37).plusHours(1).plusMinutes(10)),
            createCompletedTrip(vehicles.get(2), routes.get(5), "freight", now.minusDays(18), now.minusDays(18).plusHours(2), now.minusDays(18).plusMinutes(7), now.minusDays(18).plusHours(2).plusMinutes(35)),
            createCompletedTrip(vehicles.get(2), routes.get(7), "mixed", now.minusDays(7), now.minusDays(7).plusHours(1), now.minusDays(7).plusMinutes(7), now.minusDays(7).plusHours(1).plusMinutes(22)),
            createTrip(vehicles.get(2), routes.get(3), "freight", now.minusHours(2), now.plusHours(1), "in_progress"),
            createTrip(vehicles.get(2), routes.get(9), "freight", now.plusHours(5), now.plusHours(6), "scheduled"),
            createTrip(vehicles.get(2), routes.get(6), "mixed", now.plusDays(3), now.plusDays(3).plusHours(4), "scheduled"),
            
            // Driver 3 (Emma) - 6 trips (2 completed, 1 arrived, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(3), routes.get(4), "passenger", now.minusDays(50), now.minusDays(50).plusHours(0).plusMinutes(30), now.minusDays(50).plusMinutes(4), now.minusDays(50).plusHours(0).plusMinutes(38)),
            createCompletedTrip(vehicles.get(3), routes.get(8), "passenger", now.minusDays(12), now.minusDays(12).plusHours(0).plusMinutes(25), now.minusDays(12).plusMinutes(2), now.minusDays(12).plusHours(0).plusMinutes(30)),
            createTrip(vehicles.get(3), routes.get(0), "passenger", now.minusHours(4), now.minusMinutes(5), "arrived"),
            createTrip(vehicles.get(3), routes.get(5), "mixed", now.plusDays(2), now.plusDays(2).plusHours(1), "scheduled"),
            createTrip(vehicles.get(3), routes.get(9), "passenger", now.plusDays(6), now.plusDays(6).plusHours(2), "scheduled"),
            createTrip(vehicles.get(3), routes.get(2), "freight", now.minusDays(5), now.minusDays(5).plusHours(3), "cancelled"),
            
            // Driver 4 (Bob) - 6 trips (1 completed, 1 in_progress, 2 scheduled, 2 cancelled)
            createCompletedTrip(vehicles.get(4), routes.get(6), "mixed", now.minusDays(55), now.minusDays(55).plusHours(5), now.minusDays(55).plusMinutes(15), now.minusDays(55).plusHours(6).plusMinutes(10)),
            createTrip(vehicles.get(4), routes.get(1), "freight", now.minusMinutes(30), now.plusHours(3), "in_progress"),
            createTrip(vehicles.get(4), routes.get(7), "mixed", now.plusDays(1), now.plusDays(1).plusHours(2), "scheduled"),
            createTrip(vehicles.get(4), routes.get(4), "passenger", now.plusDays(7), now.plusDays(7).plusHours(1), "scheduled"),
            createTrip(vehicles.get(4), routes.get(3), "mixed", now.minusDays(10), now.minusDays(10).plusHours(1), "cancelled"),
            createTrip(vehicles.get(4), routes.get(8), "freight", now.minusDays(3), now.minusDays(3).plusHours(2), "cancelled"),
            
            // Driver 5 (Frank) - 6 trips (2 completed, 1 in_progress, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(5), routes.get(3), "freight", now.minusDays(42), now.minusDays(42).plusHours(2), now.minusDays(42).plusMinutes(8), now.minusDays(42).plusHours(2).plusMinutes(25)),
            createCompletedTrip(vehicles.get(5), routes.get(6), "mixed", now.minusDays(25), now.minusDays(25).plusHours(0).plusMinutes(45), now.minusDays(25).plusMinutes(5), now.minusDays(25).plusHours(0).plusMinutes(50)),
            createTrip(vehicles.get(5), routes.get(8), "freight", now.minusHours(2).minusMinutes(15), now.plusHours(1), "in_progress"),
            createTrip(vehicles.get(5), routes.get(2), "mixed", now.plusDays(3), now.plusDays(3).plusHours(5), "scheduled"),
            createTrip(vehicles.get(5), routes.get(5), "freight", now.plusDays(8), now.plusDays(8).plusHours(2), "scheduled"),
            createTrip(vehicles.get(5), routes.get(1), "mixed", now.minusDays(9), now.minusDays(9).plusHours(3), "cancelled"),
            
            // Driver 6 (Grace) - 6 trips (2 completed, 1 arrived, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(6), routes.get(0), "freight", now.minusDays(48), now.minusDays(48).plusHours(24), now.minusDays(48).plusMinutes(12), now.minusDays(48).plusHours(25).plusMinutes(45)),
            createCompletedTrip(vehicles.get(6), routes.get(4), "passenger", now.minusDays(20), now.minusDays(20).plusHours(2), now.minusDays(20).plusMinutes(6), now.minusDays(20).plusHours(2).plusMinutes(18)),
            createTrip(vehicles.get(6), routes.get(9), "passenger", now.minusHours(5), now.minusHours(4).minusMinutes(45), "arrived"),
            createTrip(vehicles.get(6), routes.get(7), "mixed", now.plusDays(2), now.plusDays(2).plusHours(0).plusMinutes(30), "scheduled"),
            createTrip(vehicles.get(6), routes.get(3), "passenger", now.plusDays(5), now.plusDays(5).plusHours(0).plusMinutes(45), "scheduled"),
            createTrip(vehicles.get(6), routes.get(6), "freight", now.minusDays(7), now.minusDays(7).plusHours(4), "cancelled"),
            
            // Driver 7 (Henry) - 6 trips (3 completed, 1 in_progress, 2 scheduled)
            createCompletedTrip(vehicles.get(7), routes.get(7), "mixed", now.minusDays(35), now.minusDays(35).plusHours(0).plusMinutes(35), now.minusDays(35).plusMinutes(4), now.minusDays(35).plusHours(0).plusMinutes(42)),
            createCompletedTrip(vehicles.get(7), routes.get(2), "freight", now.minusDays(15), now.minusDays(15).plusHours(7), now.minusDays(15).plusMinutes(10), now.minusDays(15).plusHours(8).plusMinutes(5)),
            createCompletedTrip(vehicles.get(7), routes.get(5), "mixed", now.minusDays(9), now.minusDays(9).plusHours(2), now.minusDays(9).plusMinutes(5), now.minusDays(9).plusHours(2).plusMinutes(28)),
            createTrip(vehicles.get(7), routes.get(0), "freight", now.minusHours(3), now.plusHours(18), "in_progress"),
            createTrip(vehicles.get(7), routes.get(4), "mixed", now.plusDays(4), now.plusDays(4).plusHours(2), "scheduled"),
            createTrip(vehicles.get(7), routes.get(8), "passenger", now.plusDays(6), now.plusDays(6).plusHours(0).plusMinutes(30), "scheduled"),
            
            // Driver 8 (Iris) - 6 trips (2 completed, 1 arrived, 2 scheduled, 1 cancelled)
            createCompletedTrip(vehicles.get(8), routes.get(5), "freight", now.minusDays(52), now.minusDays(52).plusHours(2), now.minusDays(52).plusMinutes(7), now.minusDays(52).plusHours(2).plusMinutes(35)),
            createCompletedTrip(vehicles.get(8), routes.get(9), "passenger", now.minusDays(14), now.minusDays(14).plusHours(0).plusMinutes(20), now.minusDays(14).plusMinutes(3), now.minusDays(14).plusHours(0).plusMinutes(25)),
            createTrip(vehicles.get(8), routes.get(1), "mixed", now.minusHours(6), now.minusHours(5).minusMinutes(30), "arrived"),
            createTrip(vehicles.get(8), routes.get(6), "freight", now.plusDays(1), now.plusDays(1).plusHours(0).plusMinutes(30), "scheduled"),
            createTrip(vehicles.get(8), routes.get(3), "mixed", now.plusDays(7), now.plusDays(7).plusHours(0).plusMinutes(45), "scheduled"),
            createTrip(vehicles.get(8), routes.get(4), "passenger", now.minusDays(4), now.minusDays(4).plusHours(2), "cancelled"),
            
            // Driver 9 (Jack) - 6 trips (1 completed, 1 in_progress, 2 scheduled, 2 cancelled)
            createCompletedTrip(vehicles.get(9), routes.get(8), "passenger", now.minusDays(58), now.minusDays(58).plusHours(0).plusMinutes(25), now.minusDays(58).plusMinutes(2), now.minusDays(58).plusHours(0).plusMinutes(30)),
            createTrip(vehicles.get(9), routes.get(2), "freight", now.minusMinutes(45), now.plusHours(6), "in_progress"),
            createTrip(vehicles.get(9), routes.get(0), "freight", now.plusDays(3), now.plusDays(3).plusHours(20), "scheduled"),
            createTrip(vehicles.get(9), routes.get(7), "mixed", now.plusDays(8), now.plusDays(8).plusHours(0).plusMinutes(30), "scheduled"),
            createTrip(vehicles.get(9), routes.get(5), "freight", now.minusDays(11), now.minusDays(11).plusHours(2), "cancelled"),
            createTrip(vehicles.get(9), routes.get(9), "passenger", now.minusDays(2), now.minusDays(2).plusHours(0).plusMinutes(20), "cancelled")
        );
        tripRepository.saveAll(trips);
        System.out.println("Seeded " + trips.size() + " trips for 10 drivers (DRIVER role only)");
    }

    private void seedOrders() {
        List<Trip> trips = tripRepository.findAll();
        
        // Get dispatcher users
        User dispatcher = userRepository.findByUsername("john.dispatcher").orElseThrow(() -> new RuntimeException("Dispatcher not found"));
        User dispatcher2 = userRepository.findByUsername("amy.dispatcher2").orElseThrow(() -> new RuntimeException("Dispatcher2 not found"));
        
        // Get customer users (10 total)
        User customer1 = userRepository.findByUsername("nguyen.mai").orElseThrow(() -> new RuntimeException("Customer nguyen.mai not found"));
        User customer2 = userRepository.findByUsername("tran.binh").orElseThrow(() -> new RuntimeException("Customer tran.binh not found"));
        User customer3 = userRepository.findByUsername("pham.duc").orElseThrow(() -> new RuntimeException("Customer pham.duc not found"));
        User customer4 = userRepository.findByUsername("le.huong").orElseThrow(() -> new RuntimeException("Customer le.huong not found"));
        User customer5 = userRepository.findByUsername("hoang.tam").orElseThrow(() -> new RuntimeException("Customer hoang.tam not found"));
        User customer6 = userRepository.findByUsername("diep.loc").orElseThrow(() -> new RuntimeException("Customer diep.loc not found"));
        User customer7 = userRepository.findByUsername("vo.nhung").orElseThrow(() -> new RuntimeException("Customer vo.nhung not found"));
        User customer8 = userRepository.findByUsername("bui.phong").orElseThrow(() -> new RuntimeException("Customer bui.phong not found"));
        User customer9 = userRepository.findByUsername("do.huong").orElseThrow(() -> new RuntimeException("Customer do.huong not found"));
        User customer10 = userRepository.findByUsername("ly.son").orElseThrow(() -> new RuntimeException("Customer ly.son not found"));

        List<Order> orders = Arrays.asList(
            // Orders for 10 completed trips (revenue-generating DELIVERED orders)
            // Driver 0 (Mike) - 2 completed trips (indices 0, 1)
            createOrder(trips.get(0), "Nguyen Thi Mai", "+84-901-111-111", "15kg laptop with charger and mouse, handle with care", customer1, dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Hanoi Old Quarter", "Ben Thanh Market, HCM City"),
            createOrder(trips.get(1), "Tran Van Binh", "+84-902-222-222", "8kg office documents and supplies", customer2, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "My Dinh Station", "Da Nang Central"),
            
            // Driver 1 (Carl) - 2 completed trips (indices 6, 7)
            createOrder(trips.get(6), "Pham Van Duc", "+84-903-333-333", "10kg cement bags and steel pipes, fragile construction materials", customer3, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Hanoi Old Quarter", "Ba Dinh Square"),
            createOrder(trips.get(7), "Le Thi Huong", "+84-904-444-444", "5kg electronics and accessories", customer4, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Ben Thanh Market", "District 7 HCM"),
            
            // Driver 2 (David) - 3 completed trips (indices 12, 13, 14)
            createOrder(trips.get(12), "Hoang Minh Tam", "+84-905-555-555", "20kg fresh fruits and vegetables, refrigerate immediately upon receipt", customer5, dispatcher2, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Dragon Bridge", "Japanese Bridge, Hoi An"),
            createOrder(trips.get(13), "Diep Van Loc", "+84-906-666-666", "12kg machinery parts", customer6, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Notre Dame Cathedral", "Phu My Hung District 7"),
            createOrder(trips.get(14), "Vo Thanh Nhung", "+84-907-777-777", "3kg fashion items and shoes", customer7, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Hanoi Train Station", "Bac Ninh Culture Center"),
            
            // Driver 3 (Emma) - 2 completed trips (indices 18, 19)
            createOrder(trips.get(18), "Bui Duc Phong", "+84-908-888-888", "18kg 55-inch LCD TV in original packaging, glass screen - handle carefully", customer8, dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Tan Son Nhat Airport", "Nha Trang Beach"),
            createOrder(trips.get(19), "Do Thi Huong", "+84-909-999-999", "7kg medical supplies", customer9, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Ninh Kieu Wharf", "Cai Rang Market"),
            
            // Driver 4 (Bob) - 1 completed trip (index 24)
            createOrder(trips.get(24), "Ly Ngoc Son", "+84-910-000-000", "22kg furniture parts and tools", customer10, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Cat Bi Airport", "Noi Bai Airport"),
            
            // Driver 5 (Frank) - 2 completed trips (indices 30, 31)
            createOrder(trips.get(30), "Phan Thi Thao", "+84-924-111-111", "14kg industrial tools", customer5, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Da Nang Airport", "Hoi An"),
            createOrder(trips.get(31), "Nguyen Van Khanh", "+84-925-222-222", "6kg office supplies", customer6, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Hanoi Center", "West Lake"),
            
            // Driver 6 (Grace) - 2 completed trips (indices 36, 37)
            createOrder(trips.get(36), "Tran Minh Quang", "+84-926-333-333", "25kg construction materials", customer7, dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Hanoi Old Quarter", "HCM City Center"),
            createOrder(trips.get(37), "Le Thi Ngoc", "+84-927-444-444", "8kg electronic components", customer8, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Cat Bi Airport", "Hanoi Station"),
            
            // Driver 7 (Henry) - 3 completed trips (indices 42, 43, 44)
            createOrder(trips.get(42), "Hoang Van Duc", "+84-928-555-555", "4kg medical instruments", customer9, dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "HCM District 1", "District 7"),
            createOrder(trips.get(43), "Pham Thi Lan", "+84-929-666-666", "18kg fresh produce, keep refrigerated", customer1, dispatcher2, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Tan Son Nhat Airport", "Nha Trang Center"),
            createOrder(trips.get(44), "Nguyen Minh Tam", "+84-930-777-777", "10kg textile materials", customer2, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Cat Bi Airport", "Hanoi"),
            
            // Driver 8 (Iris) - 2 completed trips (indices 48, 49)
            createOrder(trips.get(48), "Bui Van Long", "+84-931-888-888", "12kg automotive parts", customer3, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Cat Bi Airport", "Hanoi Auto Center"),
            createOrder(trips.get(49), "Vo Thi Huong", "+84-932-999-999", "3kg jewelry and valuables, handle with extreme care", customer4, dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.DELIVERED, "Nha Trang Beach", "Vinpearl"),
            
            // Driver 9 (Jack) - 1 completed trip (index 54)
            createOrder(trips.get(54), "Do Van Minh", "+84-933-000-000", "5kg books and documents", customer5, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.DELIVERED, "Nha Trang Beach", "Vinpearl Cable Car"),
            
            // Orders for in_progress trips (IN_TRANSIT status)
            createOrder(trips.get(2), "Nguyen Van Hai", "+84-911-111-111", "12kg industrial equipment", customer6, dispatcher, Order.PriorityLevel.URGENT, Order.OrderStatus.IN_TRANSIT, "Nha Trang Beach", "Vinpearl Cable Car"),
            createOrder(trips.get(15), "Tran Thi Lan", "+84-912-222-222", "5kg pharmaceutical supplies, temperature sensitive", customer7, dispatcher2, Order.PriorityLevel.URGENT, Order.OrderStatus.IN_TRANSIT, "HCM District 1", "District 7 Residential"),
            createOrder(trips.get(25), "Le Van Minh", "+84-913-333-333", "9kg electronics and gadgets", customer8, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Hanoi Center", "West Lake Office Park"),
            createOrder(trips.get(32), "Dang Thi Phuong", "+84-934-111-111", "7kg handicrafts", customer9, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Nha Trang", "Cam Ranh"),
            createOrder(trips.get(45), "Le Van Hung", "+84-935-222-222", "20kg rice and grains", customer10, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Hanoi", "HCM City"),
            createOrder(trips.get(55), "Nguyen Thi Hanh", "+84-936-333-333", "15kg household items", customer1, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "Tan Son Nhat", "Nha Trang"),
            
            // Orders for arrived trips (IN_TRANSIT status - nearly delivered)
            createOrder(trips.get(8), "Pham Thi Thu", "+84-914-444-444", "6kg custom wedding cake with edible decorations, keep cool", customer2, dispatcher2, Order.PriorityLevel.URGENT, Order.OrderStatus.IN_TRANSIT, "Ninh Kieu Wharf", "Cai Rang Market"),
            createOrder(trips.get(20), "Hoang Van Nam", "+84-915-555-555", "14kg office furniture", customer3, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "My Dinh Station", "Da Nang Central"),
            createOrder(trips.get(38), "Tran Van Phong", "+84-937-444-444", "9kg computer equipment", customer4, dispatcher2, Order.PriorityLevel.URGENT, Order.OrderStatus.IN_TRANSIT, "Nha Trang Beach", "Vinpearl"),
            createOrder(trips.get(50), "Pham Minh Duc", "+84-938-555-555", "11kg sports equipment", customer5, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.IN_TRANSIT, "My Dinh", "Da Nang"),
            
              // Orders for scheduled trips (PENDING status)
              // PENDING orders: all restored, trip, dispatcher, and driver set to null
              createOrder(null, "Dinh Thi Hoa", "+84-916-666-666", "25kg building materials", customer1, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Bac Ninh Province", "Hanoi Train Station"),
              createOrder(null, "Tran Minh Duc", "+84-917-777-777", "4kg fashion accessories", customer2, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Hanoi Center", "West Lake Area"),
              createOrder(null, "Le Thi Huyen", "+84-920-000-000", "13kg construction tools", customer5, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Hanoi Station", "Ninh Binh"),
              createOrder(null, "Hoang Minh Tuan", "+84-921-111-111", "7kg textiles and fabrics", customer6, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "District 7", "Binh Duong"),
              createOrder(null, "Hoang Thi Nga", "+84-939-666-666", "10kg packaging materials", customer9, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Tan Son Nhat", "Nha Trang"),
              createOrder(null, "Nguyen Van Tuan", "+84-940-777-777", "6kg laboratory equipment", customer10, null, Order.PriorityLevel.URGENT, Order.OrderStatus.PENDING, "Cat Bi", "Hanoi"),
              createOrder(null, "Le Minh Khoa", "+84-941-888-888", "8kg art supplies", customer6, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "HCM District 1", "District 7"),
              createOrder(null, "Phan Van Hai", "+84-942-999-999", "12kg fitness equipment", customer7, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Hanoi", "Da Nang"),
              createOrder(null, "Vo Thi Mai", "+84-945-222-222", "9kg baby products", customer10, null, Order.PriorityLevel.URGENT, Order.OrderStatus.PENDING, "Hanoi", "West Lake"),
              createOrder(null, "Do Minh Tuan", "+84-946-333-333", "7kg pet supplies", customer1, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "HCM District 1", "District 7"),
              createOrder(null, "Nguyen Van Nam", "+84-947-444-444", "20kg building materials", customer2, null, Order.PriorityLevel.NORMAL, Order.OrderStatus.PENDING, "Hanoi", "HCM City"),
              createOrder(null, "Le Thi Thao", "+84-948-555-555", "4kg musical instruments", customer3, null, Order.PriorityLevel.URGENT, Order.OrderStatus.PENDING, "Nha Trang Beach", "Vinpearl Cable Car"),
              // ASSIGNED orders (with trip/driver)
              createOrder(trips.get(9), "Nguyen Thi Lan", "+84-918-888-888", "11kg artwork and paintings", customer3, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Ben Thanh Market", "Thu Duc City"),
              createOrder(trips.get(10), "Pham Van Thanh", "+84-919-999-999", "8kg medical equipment", customer4, dispatcher2, Order.PriorityLevel.URGENT, Order.OrderStatus.ASSIGNED, "Da Nang Central", "Hue Imperial City"),
              createOrder(trips.get(21), "Vo Van Kiet", "+84-922-222-222", "16kg sporting goods", customer7, dispatcher2, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Nha Trang", "Cam Ranh"),
              createOrder(trips.get(22), "Bui Thi Mai", "+84-923-333-333", "5kg fresh seafood, keep cold", customer8, dispatcher2, Order.PriorityLevel.URGENT, Order.OrderStatus.ASSIGNED, "Vung Tau", "Ho Chi Minh City"),
              createOrder(trips.get(46), "Tran Thi Hoa", "+84-943-000-000", "5kg beauty products", customer8, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Cat Bi Airport", "Hanoi Center"),
              createOrder(trips.get(47), "Bui Van Loc", "+84-944-111-111", "14kg gardening tools", customer9, dispatcher, Order.PriorityLevel.NORMAL, Order.OrderStatus.ASSIGNED, "Nha Trang", "Vinpearl")
        );
        orderRepository.saveAll(orders);
        System.out.println("Seeded " + orders.size() + " orders");
    }

    private Order createOrder(Trip trip, String customerName, String customerPhone, String packageDetails, User customer, User dispatcher, Order.PriorityLevel priorityLevel, Order.OrderStatus orderStatus, String pickupAddress, String deliveryAddress) {
        Order order = new Order();
        order.setTrip(trip);
        order.setCustomerName(customerName);
        order.setCustomerPhone(customerPhone);
        order.setPackageDetails(packageDetails);
        order.setCustomer(customer);
        order.setCreatedBy(dispatcher);
        order.setPriorityLevel(priorityLevel);
        order.setOrderStatus(orderStatus);
        order.setPickupAddress(pickupAddress);
        order.setDeliveryAddress(deliveryAddress);

        // Set order creation date
        if (trip != null) {
            // Orders created 1-3 hours before trip departure
            LocalDateTime orderCreatedAt = trip.getScheduledDeparture().minusHours(2);
            order.setCreatedAt(orderCreatedAt);
        } else if (orderStatus == Order.OrderStatus.PENDING) {
            // For PENDING orders, create a mix of ON_TRACK, DUE_SOON, and OVERDUE
            int hash = Math.abs(customerName.hashCode());
            int mod = hash % 3;
            if (mod == 0) {
                // ON_TRACK: created now
                order.setCreatedAt(LocalDateTime.now());
            } else if (mod == 1) {
                // DUE_SOON: created 3 hours ago (for URGENT, SLA is 4h, so 1h left)
                order.setCreatedAt(LocalDateTime.now().minusHours(3));
            } else {
                // OVERDUE: created 6 hours ago (for URGENT, SLA is 4h, so 2h overdue)
                order.setCreatedAt(LocalDateTime.now().minusHours(6));
            }
        } else {
            // For unassigned non-pending orders, use a different time in the past for each order for realism
            int offset = Math.abs(customerName.hashCode() % 30) + 30; // 30 to 59 days ago
            order.setCreatedAt(LocalDateTime.now().minusDays(offset));
        }

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
        List<Driver> drivers = driverRepository.findAll();
        List<Trip> trips = tripRepository.findAll();
        List<TripAssignment> assignments = new java.util.ArrayList<>();
        for (int i = 0; i < trips.size(); i++) {
            Trip trip = trips.get(i);
            Driver driver = drivers.get(i / 6); // 6 trips per driver (10 drivers, 60 trips total)
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
        
        // Set assignment date based on trip schedule (assigned 2 days before trip, same as trip creation)
        assignment.setAssignedAt(trip.getScheduledDeparture().minusDays(2));
        
        if (status.equals("completed")) {
            // For completed trips, use actual trip times
            assignment.setStartedAt(trip.getActualDeparture());
            assignment.setCompletedAt(trip.getActualArrival());
        } else if (status.equals("accepted")) {
            // For in_progress/arrived trips, set started time if trip has started
            if (trip.getActualDeparture() != null) {
                assignment.setStartedAt(trip.getActualDeparture());
            }
        }
        assignment.setStatus(status);
        return assignment;
    }

    private void seedDriverWorkLogs() {
        List<Driver> drivers = driverRepository.findAll();
        List<Trip> trips = tripRepository.findAll();

        // Create work logs for all completed trips
        List<DriverWorkLog> logs = new java.util.ArrayList<>();
        
        for (int i = 0; i < trips.size(); i++) {
            Trip trip = trips.get(i);
            if ("completed".equals(trip.getStatus()) && trip.getActualDeparture() != null && trip.getActualArrival() != null) {
                Driver driver = drivers.get(i / 6); // 6 trips per driver
                
                // Calculate hours worked based on actual departure and arrival
                long minutesWorked = java.time.Duration.between(trip.getActualDeparture(), trip.getActualArrival()).toMinutes();
                BigDecimal hoursWorked = new BigDecimal(minutesWorked).divide(new BigDecimal("60"), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal restRequired = hoursWorked.compareTo(new BigDecimal("8")) > 0 ? new BigDecimal("2.0") : new BigDecimal("0.5");
                
                logs.add(createWorkLog(driver, trip, trip.getActualDeparture(), trip.getActualArrival(), hoursWorked, restRequired));
            }
        }
        
        driverWorkLogRepository.saveAll(logs);
        System.out.println("Seeded " + logs.size() + " driver work logs for completed trips (10 drivers, 20 completed trips total)");
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

    private void seedRegistrationRequests() {
        Role driverRole = roleRepository.findByRoleName("DRIVER")
                .orElseThrow(() -> new RuntimeException("DRIVER role not found"));
        LocalDateTime now = LocalDateTime.now();

        // Create APPROVED registration requests for existing driver users (matching the actual seeded users)
        List<RegistrationRequest> requests = Arrays.asList(
            // APPROVED - Match existing driver users
            createRegistrationRequest("mike.driver", "mike.d@logiflow.com", "Mike Driver", "+84-901-234-503", 
                "DL123456", "B2", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(90)),
            createRegistrationRequest("carl.driver2", "carl.d@logiflow.com", "Carl Driver", "+84-901-234-505", 
                "DL234567", "C", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(85)),
            createRegistrationRequest("david.driver3", "david.d@logiflow.com", "David Driver", "+84-901-234-507", 
                "DL345678", "D", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(80)),
            createRegistrationRequest("emma.driver4", "emma.d@logiflow.com", "Emma Driver", "+84-901-234-508", 
                "DL456789", "E", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(75)),
            createRegistrationRequest("bob.driver5", "bob.d@logiflow.com", "Bob Driver", "+84-901-234-509", 
                "DL567890", "FC", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(70)),
            createRegistrationRequest("frank.driver6", "frank.d@logiflow.com", "Frank Driver", "+84-901-234-510", 
                "DL678901", "C", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(65)),
            createRegistrationRequest("grace.driver7", "grace.d@logiflow.com", "Grace Driver", "+84-901-234-511", 
                "DL789012", "D", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(60)),
            createRegistrationRequest("henry.driver8", "henry.d@logiflow.com", "Henry Driver", "+84-901-234-512", 
                "DL890123", "B2", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(55)),
            createRegistrationRequest("iris.driver9", "iris.d@logiflow.com", "Iris Driver", "+84-901-234-513", 
                "DL901234", "E", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(50)),
            createRegistrationRequest("jack.driver10", "jack.d@logiflow.com", "Jack Driver", "+84-901-234-514", 
                "DL012345", "C", now.plusYears(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(45)),

            // REJECTED - These accounts were never created
            createRegistrationRequest("rejected.nguyen", "rejected.nguyen@example.com", "Nguyen Van Rejected", "+84-914-567-890", 
                "DL999001", "C", now.plusYears(1), driverRole, RegistrationRequest.RequestStatus.REJECTED, now.minusDays(20)),
            createRegistrationRequest("rejected.tran", "rejected.tran@example.com", "Tran Thi Rejected", "+84-915-678-901", 
                "DL999002", "B2", now.plusYears(1), driverRole, RegistrationRequest.RequestStatus.REJECTED, now.minusDays(15)),
            createRegistrationRequest("rejected.le", "rejected.le@example.com", "Le Minh Rejected", "+84-916-789-012", 
                "DL999003", "D", now.plusYears(1), driverRole, RegistrationRequest.RequestStatus.REJECTED, now.minusDays(10))
        );

        registrationRequestRepository.saveAll(requests);
        System.out.println("Seeded 13 registration requests: 10 approved (matching existing drivers), 3 rejected");
    }

    private RegistrationRequest createRegistrationRequest(String username, String email, String fullName, String phone,
                                                          String licenseNumber, String licenseType, LocalDateTime licenseExpiry,
                                                          Role role, RegistrationRequest.RequestStatus status, LocalDateTime createdAt) {
        RegistrationRequest request = new RegistrationRequest();
        request.setUsername(username);
        request.setPasswordHash(passwordEncoder.encode("123")); // Default password for demo
        request.setEmail(email);
        request.setFullName(fullName);
        request.setPhone(phone);
        request.setLicenseNumber(licenseNumber);
        request.setLicenseType(licenseType);
        request.setLicenseExpiry(licenseExpiry.toLocalDate());
        request.setDateOfBirth(LocalDateTime.now().minusYears(30).toLocalDate()); // Default 30 years old
        request.setAddress("Sample Address, Vietnam");
        request.setEmergencyContactName("Emergency Contact");
        request.setEmergencyContactPhone("+84-999-999-999");
        request.setRole(role);
        request.setStatus(status);
        request.setCreatedAt(createdAt);
        return request;
    }
}
