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
import com.logiflow.server.repositories.customer.CustomerRepository;
import com.logiflow.server.repositories.system.SystemSettingRepository;
import com.logiflow.server.repositories.payment.PaymentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final String PLACEHOLDER_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dpp97gxhf/image/upload/v1765183836/logiflow/profile-pictures/75af113f-26e7-40aa-856a-017e28495325.jpg";

    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DriverRepository driverRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private RouteRepository routeRepository;
    @Autowired private TripRepository tripRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private TripAssignmentRepository tripAssignmentRepository;
    @Autowired private RegistrationRequestRepository registrationRequestRepository;
    @Autowired private DriverWorkLogRepository driverWorkLogRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private SystemSettingRepository systemSettingRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private final Random random = new Random();

    @Override
    public void run(String... args) throws Exception {
        // Only seed if data doesn't exist (checking Roles is a good indicator)
        if (roleRepository.count() == 0) {
            System.out.println("Starting Database Seeding...");

            seedRoles();
            seedUsersWithRoles();
            seedCustomers();
            seedSystemSettings();
            seedDrivers();
            seedVehicles();

            // THE CORE LOGIC: Seeding linked operational data
            seedOperationalData();

            seedRegistrationRequests();
            System.out.println("Database seeding completed successfully!");
        } else {
            System.out.println("Database already seeded. Skipping...");
        }
    }

    // ==========================================
    // Unified Operational Seeder
    // ==========================================
    private void seedOperationalData() {
        System.out.println("Seeding operational data (Trips, Orders, Assignments)...");

        // Use custom methods to Fetch Users eagerly (Prevents LazyInitializationException)
        List<Driver> drivers = driverRepository.findAllDriversWithUser();
        List<Customer> customers = customerRepository.findAllCustomersWithUser();

        List<Vehicle> vehicles = vehicleRepository.findAll();

        // Get Dispatchers safely using your existing UserRepository method
        List<User> dispatchers = userRepository.findAllUsersWithRole().stream()
                .filter(u -> "DISPATCHER".equals(u.getRole().getRoleName()))
                .toList();

        // Safety checks
        if (drivers.isEmpty() || vehicles.isEmpty() || customers.isEmpty() || dispatchers.isEmpty()) {
            System.out.println("WARNING: Missing basic data. Skipping operational seeding.");
            return;
        }

        List<Trip> allTrips = new ArrayList<>();
        List<TripAssignment> allAssignments = new ArrayList<>();
        List<Order> allOrders = new ArrayList<>();
        List<DriverWorkLog> allWorkLogs = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        // Iterate through ALL drivers to ensure full coverage
        for (int i = 0; i < drivers.size(); i++) {
            Driver driver = drivers.get(i);
            // Assign a license-compatible vehicle to this driver
            Vehicle vehicle = findCompatibleVehicle(driver, vehicles);

            // --- 1. PAST: Two Completed Trips (For history/logs) ---
            // 10 days ago
            generateFullTripScenario(driver, vehicle, dispatchers, customers,
                    now.minusDays(10), "completed", allTrips, allAssignments, allOrders, allWorkLogs);

            // 3 days ago
            generateFullTripScenario(driver, vehicle, dispatchers, customers,
                    now.minusDays(3), "completed", allTrips, allAssignments, allOrders, allWorkLogs);

            // --- 2. PRESENT: One Active Trip ---
            // Only drivers 0, 2, 4 have active trips (to leave some drivers available for testing)
            if (i % 3 == 0) { // Every 3rd driver (0, 3, 6, 9) has active trip
                String activeStatus = (i % 6 == 0) ? "in_progress" : "arrived"; // Alternate between in_progress and arrived
                generateFullTripScenario(driver, vehicle, dispatchers, customers,
                        now, activeStatus, allTrips, allAssignments, allOrders, allWorkLogs);
            }
            // Other drivers (1, 2, 4, 5, 7, 8, 10) remain available

            // --- 3. FUTURE: Two Scheduled Trips ---
            // Tomorrow
            generateFullTripScenario(driver, vehicle, dispatchers, customers,
                    now.plusDays(1), "scheduled", allTrips, allAssignments, allOrders, allWorkLogs);

            // Next Week (spread out)
            generateFullTripScenario(driver, vehicle, dispatchers, customers,
                    now.plusDays(4 + (i % 3)), "scheduled", allTrips, allAssignments, allOrders, allWorkLogs);
        }

        // Save everything strictly in order to maintain Foreign Key integrity
        tripRepository.saveAll(allTrips);           // 1. Trips first
        tripAssignmentRepository.saveAll(allAssignments); // 2. Assignments link Trip + Driver
        orderRepository.saveAll(allOrders);         // 3. Orders link Trip + Customer

        // Update trip routes with real order IDs now that orders are saved
        updateTripRoutesWithRealOrderIds(allTrips, allOrders);

        // Create payments for delivered orders to have realistic payment data
        List<Payment> allPayments = createPaymentsForDeliveredOrders(allOrders, allTrips);
        paymentRepository.saveAll(allPayments);

        // Save updated orders with payment status changes
        orderRepository.saveAll(allOrders);         // 4. Save orders again with updated payment status

        // Seed some standalone pending orders (not assigned to any trip)
        List<Order> pendingOrders = seedPendingOrders(dispatchers, customers);
        orderRepository.saveAll(pendingOrders);

        driverWorkLogRepository.saveAll(allWorkLogs); // 5. Logs link Trip + Driver

        System.out.println("Generated: " + allTrips.size() + " trips, " + allOrders.size() + " orders, " + pendingOrders.size() + " pending orders.");
    }

    private void updateTripRoutesWithRealOrderIds(List<Trip> allTrips, List<Order> allOrders) {
        System.out.println("Updating trip routes with real order IDs...");

        List<Route> routesToUpdate = new ArrayList<>();

        for (Trip trip : allTrips) {
            Route route = trip.getRoute();
            if (route.getIsTripRoute() && !route.getWaypoints().isEmpty()) {
                try {
                    // Parse existing waypoints
                    List<Map<String, Object>> waypoints = new com.fasterxml.jackson.databind.ObjectMapper()
                            .readValue(route.getWaypoints(), new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});

                    // Get orders for this trip
                    List<Order> tripOrders = allOrders.stream()
                            .filter(order -> trip.equals(order.getTrip()))
                            .sorted((o1, o2) -> Integer.compare(o1.getOrderId(), o2.getOrderId()))
                            .collect(Collectors.toList());

                    // Create mapping from temp ID to real ID and update waypoints
                    List<String> realOrderIds = new ArrayList<>();

                    for (int i = 0; i < tripOrders.size(); i++) {
                        Order order = tripOrders.get(i);
                        String tempId = String.valueOf(i);
                        String realId = String.valueOf(order.getOrderId());

                        // Update waypoints with real orderId
                        for (Map<String, Object> waypoint : waypoints) {
                            if (tempId.equals(waypoint.get("orderId"))) {
                                waypoint.put("orderId", realId);
                            }
                        }

                        realOrderIds.add(realId);
                    }

                    // Update route with new waypoints and orderIds
                    route.setWaypoints(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(waypoints));
                    route.setOrderIds(String.join(",", realOrderIds));

                    routesToUpdate.add(route);

                } catch (Exception e) {
                    System.out.println("Error updating route for trip: " + e.getMessage());
                }
            }
        }

        // Save updated routes
        if (!routesToUpdate.isEmpty()) {
            routeRepository.saveAll(routesToUpdate);
            System.out.println("Updated " + routesToUpdate.size() + " trip routes with real order IDs.");
        }
    }

    private void generateFullTripScenario(Driver driver, Vehicle vehicle,
                                          List<User> dispatchers, List<Customer> customers,
                                          LocalDateTime baseTime, String status,
                                          List<Trip> tripsList, List<TripAssignment> assignsList,
                                          List<Order> ordersList, List<DriverWorkLog> logsList) {

        // A. Create Orders First (1 to 3 orders per trip)
        int orderCount = 1 + random.nextInt(3);
        User dispatcher = dispatchers.get(random.nextInt(dispatchers.size()));
        List<Order> tripOrders = new ArrayList<>();

        // Pre-create orders to get their coordinates for trip route
        for (int k = 0; k < orderCount; k++) {
            Customer customer = customers.get(random.nextInt(customers.size()));
            Order order = createOrderPrototype(customer, dispatcher, status, baseTime);
            tripOrders.add(order);
        }

        // B. Create Trip Route from Orders (all trips get trip routes)
        Route tripRoute = createTripRouteFromOrders(tripOrders, baseTime);
        routeRepository.save(tripRoute);

        // C. Trip Setup
        String tripType = (random.nextBoolean()) ? "freight" : "mixed";

        Trip trip = new Trip();
        trip.setVehicle(vehicle);
        trip.setRoute(tripRoute);
        trip.setTripType(tripType);

        // Set status based on whether driver will be assigned and trip timing
        if ("scheduled".equals(status)) {
            trip.setStatus("scheduled"); // Future trips with no driver assigned
        } else if ("in_progress".equals(status) || "arrived".equals(status)) {
            trip.setStatus("assigned"); // Will be changed to in_progress/arrived after assignment
        } else {
            trip.setStatus(status);
        }

        trip.setCreatedAt(baseTime.minusDays(5)); // Trip was planned 5 days before

        // Configure Scheduled vs Actual times
        BigDecimal durationHours = tripRoute.getIsTripRoute() ? calculateTripRouteDuration(tripRoute) : new BigDecimal("2.0");
        configureTripTimes(trip, baseTime, status, durationHours);

        // Add delay information to some active trips for demo
        if ("in_progress".equals(status) || "arrived".equals(status)) {
            // Add delay data to ~50% of active trips
            if (random.nextInt(100) < 50) {
                addDelayDataToTrip(trip);
            }
        }

        tripsList.add(trip);

        // D. Save Orders with Trip Reference
        for (Order order : tripOrders) {
            order.setTrip(trip);
            // Set distance from trip route (total for trip routes, individual for single routes)
            if (tripRoute.getIsTripRoute()) {
                // For trip routes, keep individual order distances
                order.setDistanceKm(order.getDistanceKm());
            } else {
                // For single routes, use route distance
                order.setDistanceKm(tripRoute.getDistanceKm());
            }
            ordersList.add(order);
        }

        // E. Assignment Setup - Only assign drivers to non-scheduled trips
        if (!"scheduled".equals(status)) {
            TripAssignment assignment = new TripAssignment();
            assignment.setTrip(trip);
            assignment.setDriver(driver);
            assignment.setRole("primary");
            assignment.setAssignedAt(trip.getCreatedAt().plusDays(1)); // Driver accepted 1 day after creation

            if ("completed".equals(status)) {
                assignment.setStatus("completed");
                assignment.setStartedAt(trip.getActualDeparture());
                assignment.setCompletedAt(trip.getActualArrival());
                // Create Work Log only for completed trips
                createWorkLog(driver, trip, trip.getActualDeparture(), trip.getActualArrival(), logsList);
            } else if ("in_progress".equals(status) || "arrived".equals(status)) {
                assignment.setStatus("accepted");
                assignment.setStartedAt(trip.getActualDeparture());
            } else {
                assignment.setStatus("assigned");
            }
            assignsList.add(assignment);
        }
    }

    private void configureTripTimes(Trip trip, LocalDateTime baseTime, String status, BigDecimal durationHours) {
        long durationMins = (long) (durationHours.doubleValue() * 60);

        if ("completed".equals(status)) {
            // baseTime is in the past
            trip.setScheduledDeparture(baseTime);
            trip.setScheduledArrival(baseTime.plusMinutes(durationMins));

            // Actuals: departed 0-30 mins late, arrived +/- 10 mins of duration
            trip.setActualDeparture(baseTime.plusMinutes(random.nextInt(30)));
            trip.setActualArrival(trip.getActualDeparture().plusMinutes(durationMins).plusMinutes(random.nextInt(20) - 10));

        } else if ("in_progress".equals(status)) {
            // baseTime is Now. Started 1 hour ago (mock logic)
            trip.setScheduledDeparture(baseTime.minusHours(1));
            trip.setScheduledArrival(baseTime.plusMinutes(durationMins).minusHours(1));

            trip.setActualDeparture(baseTime.minusHours(1).plusMinutes(5));
            trip.setActualArrival(null);

        } else if ("arrived".equals(status)) {
            // baseTime is Now. Driver is at destination waiting to unload.
            trip.setScheduledDeparture(baseTime.minusMinutes(durationMins));
            trip.setScheduledArrival(baseTime);

            trip.setActualDeparture(baseTime.minusMinutes(durationMins).plusMinutes(10));
            trip.setActualArrival(null);

        } else { // Scheduled
            // baseTime is Future
            trip.setScheduledDeparture(baseTime);
            trip.setScheduledArrival(baseTime.plusMinutes(durationMins));
            trip.setActualDeparture(null);
            trip.setActualArrival(null);
        }
    }

    private Order createOrderPrototype(Customer customer, User dispatcher, String tripStatus, LocalDateTime baseTime) {
        Order order = new Order();
        order.setCustomer(customer.getUser()); // Link User entity
        order.setCreatedBy(dispatcher);

        // Populate snapshot details to make the order look real
        order.setCustomerName(customer.getUser().getFullName());
        order.setCustomerPhone(customer.getUser().getPhone());

        // Generate realistic order details
        generateOrderDetails(order, customer, tripStatus, baseTime);

        return order;
    }

    private void generateOrderDetails(Order order, Customer customer, String tripStatus, LocalDateTime baseTime) {
        // Random cargo details with weights in tons for heavy logistics
        String[] items = {"Electronics", "Office Furniture", "Legal Documents", "Ind. Machinery", "Textiles", "Fresh Produce"};
        String item = items[random.nextInt(items.length)];

        // Weight ranges in tons appropriate for heavy logistics
        BigDecimal weightTons;
        switch (item.toLowerCase()) {
            case "electronics":
                weightTons = new BigDecimal("0.5").add(new BigDecimal(random.nextInt(15)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 0.5-2.0 tons
                break;
            case "office furniture":
                weightTons = new BigDecimal("1.0").add(new BigDecimal(random.nextInt(20)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 1.0-3.0 tons
                break;
            case "legal documents":
                weightTons = new BigDecimal("0.05").add(new BigDecimal(random.nextInt(15)).divide(new BigDecimal(100), 2, java.math.RoundingMode.HALF_UP)); // 0.05-0.20 tons
                break;
            case "ind. machinery":
                weightTons = new BigDecimal("2.0").add(new BigDecimal(random.nextInt(30)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 2.0-5.0 tons
                break;
            case "textiles":
                weightTons = new BigDecimal("0.8").add(new BigDecimal(random.nextInt(17)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 0.8-2.5 tons
                break;
            case "fresh produce":
                weightTons = new BigDecimal("0.3").add(new BigDecimal(random.nextInt(17)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 0.3-2.0 tons
                break;
            default:
                weightTons = new BigDecimal("1.0").add(new BigDecimal(random.nextInt(20)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 1.0-3.0 tons default
        }

        order.setWeightTons(weightTons);

        // Generate realistic addresses in HCMC
        String[] pickupAddresses = {
            "105 Tran Hung Dao, Ward 1, Go Vap, Ho Chi Minh City",
            "237 Đê thủy Lợi Ấp 3, Thành phố Hồ Chí Minh, Vietnam",
            "456 Nguyen Hue, District 1, Ho Chi Minh City",
            "789 Le Hong Phong, District 10, Ho Chi Minh City",
            "321 Vo Van Tan, District 3, Ho Chi Minh City"
        };

        String[] deliveryAddresses = {
            "160a Đ. Số 14, Thành phố Hồ Chí Minh, Vietnam",
            "MPJC+9R2 Phước Kiểng Bridge, Thành phố Hồ Chí Minh, Vietnam",
            "Ben Thanh Market, District 1, Ho Chi Minh City",
            "Tan Son Nhat Airport, Ho Chi Minh City",
            "Saigon River Port, District 4, Ho Chi Minh City"
        };

        order.setPickupAddress(pickupAddresses[random.nextInt(pickupAddresses.length)]);
        order.setDeliveryAddress(deliveryAddresses[random.nextInt(deliveryAddresses.length)]);

        // Set random coordinates for HCMC area
        // HCMC coordinates roughly: 10.7-11.2°N, 106.5-107.0°E
        BigDecimal pickupLat = new BigDecimal("10.7").add(new BigDecimal(random.nextInt(50)).divide(new BigDecimal(100), 4, java.math.RoundingMode.HALF_UP));
        BigDecimal pickupLng = new BigDecimal("106.5").add(new BigDecimal(random.nextInt(50)).divide(new BigDecimal(100), 4, java.math.RoundingMode.HALF_UP));
        BigDecimal deliveryLat = new BigDecimal("10.7").add(new BigDecimal(random.nextInt(50)).divide(new BigDecimal(100), 4, java.math.RoundingMode.HALF_UP));
        BigDecimal deliveryLng = new BigDecimal("106.5").add(new BigDecimal(random.nextInt(50)).divide(new BigDecimal(100), 4, java.math.RoundingMode.HALF_UP));

        order.setPickupLat(pickupLat);
        order.setPickupLng(pickupLng);
        order.setDeliveryLat(deliveryLat);
        order.setDeliveryLng(deliveryLng);

        // Calculate distance using Haversine
        BigDecimal distance = calculateHaversineDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
        order.setDistanceKm(distance);

        // Set package value based on item type and weight
        BigDecimal baseValuePerTon;
        String detailedDescription;

        switch (item.toLowerCase()) {
            case "electronics":
                baseValuePerTon = new BigDecimal("500000");
                detailedDescription = "High-quality electronic devices including tablets, laptops, and accessories carefully packed for safe transport";
                break;
            case "office furniture":
                baseValuePerTon = new BigDecimal("80000");
                detailedDescription = "Professional office furniture set including desks, chairs, and storage units requiring special handling";
                break;
            case "legal documents":
                baseValuePerTon = new BigDecimal("10000000");
                detailedDescription = "Confidential legal documents and corporate records in secure, climate-controlled packaging";
                break;
            case "ind. machinery":
                baseValuePerTon = new BigDecimal("300000");
                detailedDescription = "Industrial machinery and equipment components with specialized packaging and handling requirements";
                break;
            case "textiles":
                baseValuePerTon = new BigDecimal("150000");
                detailedDescription = "Premium textile products and clothing materials requiring moisture-resistant packaging";
                break;
            case "fresh produce":
                baseValuePerTon = new BigDecimal("25000");
                detailedDescription = "Fresh agricultural produce and perishable goods maintained at optimal temperature during transport";
                break;
            default:
                baseValuePerTon = new BigDecimal("100000");
                detailedDescription = "Miscellaneous goods safely packaged for transportation";
        }

        BigDecimal packageValue = baseValuePerTon.multiply(weightTons).setScale(2, java.math.RoundingMode.HALF_UP);
        order.setPackageValue(packageValue);
        order.setPackageDetails(detailedDescription);

        // Randomly assign pickup types
        int pickupTypeRandom = random.nextInt(100);
        Order.PickupType pickupType;

        if (pickupTypeRandom < 40) {
            pickupType = Order.PickupType.STANDARD;
        } else if (pickupTypeRandom < 70) {
            pickupType = Order.PickupType.WAREHOUSE;
        } else {
            pickupType = Order.PickupType.PORT_TERMINAL;
        }

        order.setPickupType(pickupType);

        // Set fields based on pickup type
        if (pickupType == Order.PickupType.WAREHOUSE) {
            String[] warehouseNames = {"HCM Warehouse", "Da Nang Logistics Center", "Hai Phong Distribution Hub", "Can Tho Storage Facility"};
            order.setWarehouseName(warehouseNames[random.nextInt(warehouseNames.length)]);

            String[] dockPrefixes = {"D-", "L-", "B-", "G-"};
            int dockNumber = 1 + random.nextInt(20);
            order.setDockNumber(dockPrefixes[random.nextInt(dockPrefixes.length)] + dockNumber);

        } else if (pickupType == Order.PickupType.PORT_TERMINAL) {
            String[] containerPrefixes = {"MSCU", "MAEU", "OOLU", "COSU", "HLCU", "YMLU"};
            String prefix = containerPrefixes[random.nextInt(containerPrefixes.length)];
            String serial = String.format("%06d", random.nextInt(999999));
            String checkDigit = String.valueOf(random.nextInt(9));
            order.setContainerNumber(prefix + serial + "-" + checkDigit);

            String[] terminalNames = {"Saigon Port Terminal 1", "Da Nang Port Terminal", "Hai Phong Port Terminal", "Can Tho River Port"};
            order.setTerminalName(terminalNames[random.nextInt(terminalNames.length)]);
        }

        // Synch Order status with Trip status - distribute statuses realistically for active trips
        if ("completed".equals(tripStatus)) {
            order.setOrderStatus(Order.OrderStatus.DELIVERED);
        } else if ("in_progress".equals(tripStatus) || "arrived".equals(tripStatus)) {
            // For active trips, distribute order statuses realistically:
            // ~40% ASSIGNED (not started), ~40% IN_TRANSIT (in progress), ~20% DELIVERED (completed)
            int statusRandom = random.nextInt(100);
            if (statusRandom < 40) {
                order.setOrderStatus(Order.OrderStatus.ASSIGNED);
            } else if (statusRandom < 80) {
                order.setOrderStatus(Order.OrderStatus.IN_TRANSIT);
            } else {
                order.setOrderStatus(Order.OrderStatus.DELIVERED);
            }
        } else {
            order.setOrderStatus(Order.OrderStatus.ASSIGNED);
        }

        order.setPriorityLevel(random.nextBoolean() ? Order.PriorityLevel.NORMAL : Order.PriorityLevel.URGENT);

        // Calculate Shipping Fee
        BigDecimal shippingFee = distance.multiply(new BigDecimal("1500")) // Distance fee (1500 VND per km)
                .add(order.getWeightTons().multiply(new BigDecimal("700000"))) // Weight fee (700000 VND per ton)
                .add(new BigDecimal("30000")); // Base shipping fee
        if (order.getPriorityLevel() == Order.PriorityLevel.URGENT) shippingFee = shippingFee.multiply(new BigDecimal("1.3"));
        order.setShippingFee(shippingFee);

        // Set realistic creation dates based on trip timing
        LocalDateTime orderCreatedAt;
        if ("completed".equals(tripStatus)) {
            // For completed trips, orders were created 7-14 days before trip
            orderCreatedAt = baseTime.minusDays(7 + random.nextInt(8));
        } else if ("in_progress".equals(tripStatus) || "arrived".equals(tripStatus)) {
            // For active trips, orders were created 2-5 days before trip
            orderCreatedAt = baseTime.minusDays(2 + random.nextInt(4));
        } else {
            // For scheduled trips, orders were created 1-3 days ago
            orderCreatedAt = LocalDateTime.now().minusDays(1 + random.nextInt(3));
        }
        order.setCreatedAt(orderCreatedAt);
    }



    private Route createTripRouteFromOrders(List<Order> orders, LocalDateTime baseTime) {
        // Create waypoints from all order coordinates
        List<Map<String, Object>> waypoints = new ArrayList<>();
        BigDecimal totalFee = BigDecimal.ZERO;
        List<String> orderIds = new ArrayList<>();

        for (int i = 0; i < orders.size(); i++) {
            Order order = orders.get(i);
            // Use order index as temporary ID since real IDs don't exist yet
            String tempOrderId = String.valueOf(i);

            // Add pickup waypoint
            if (order.getPickupLat() != null && order.getPickupLng() != null) {
                Map<String, Object> pickupPoint = new HashMap<>();
                pickupPoint.put("lat", order.getPickupLat());
                pickupPoint.put("lng", order.getPickupLng());
                pickupPoint.put("type", "pickup");
                pickupPoint.put("orderId", tempOrderId);
                pickupPoint.put("address", order.getPickupAddress());
                pickupPoint.put("customerName", order.getCustomerName());
                waypoints.add(pickupPoint);
            }

            // Add delivery waypoint
            if (order.getDeliveryLat() != null && order.getDeliveryLng() != null) {
                Map<String, Object> deliveryPoint = new HashMap<>();
                deliveryPoint.put("lat", order.getDeliveryLat());
                deliveryPoint.put("lng", order.getDeliveryLng());
                deliveryPoint.put("type", "delivery");
                deliveryPoint.put("orderId", tempOrderId);
                deliveryPoint.put("address", order.getDeliveryAddress());
                deliveryPoint.put("customerName", order.getCustomerName());
                waypoints.add(deliveryPoint);
            }

            // Accumulate fees
            if (order.getShippingFee() != null) {
                totalFee = totalFee.add(order.getShippingFee());
            }

            // Collect temporary order IDs
            orderIds.add(tempOrderId);
        }

        // Calculate total distance (sum of all individual order distances)
        BigDecimal totalDistance = BigDecimal.ZERO;
        for (Order order : orders) {
            if (order.getDistanceKm() != null) {
                totalDistance = totalDistance.add(order.getDistanceKm());
            }
        }

        // Create route entity
        Route route = new Route();
        route.setRouteName("Trip: " + orders.size() + " orders - " + baseTime.toLocalDate());
        route.setRouteType("trip");

        try {
            route.setWaypoints(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(waypoints));
        } catch (Exception e) {
            // Fallback simple waypoints
            route.setWaypoints("[]");
        }

        route.setDistanceKm(totalDistance);
        route.setTotalFee(totalFee);
        route.setOrderIds(""); // Will be set after orders are saved with IDs
        route.setIsTripRoute(true);

        return route;
    }

    private BigDecimal calculateTripRouteDuration(Route route) {
        // Estimate duration based on total distance
        // Assume average speed of 40 km/h for urban delivery
        if (route.getDistanceKm() != null) {
            return route.getDistanceKm().divide(new BigDecimal("40"), 2, java.math.RoundingMode.HALF_UP);
        }
        return new BigDecimal("2.0"); // Default 2 hours
    }

    private BigDecimal calculateHaversineDistance(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2) {
        double lat1Rad = Math.toRadians(lat1.doubleValue());
        double lat2Rad = Math.toRadians(lat2.doubleValue());
        double lng1Rad = Math.toRadians(lng1.doubleValue());
        double lng2Rad = Math.toRadians(lng2.doubleValue());

        double dLat = lat2Rad - lat1Rad;
        double dLng = lng2Rad - lng1Rad;

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = 6371 * c; // Earth's radius in km

        return new BigDecimal(distance).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private void createOrderForTrip(Trip trip, Customer customer, User dispatcher, String tripStatus, List<Order> ordersList) {
        Order order = new Order();
        order.setTrip(trip);
        order.setCustomer(customer.getUser()); // Link User entity
        order.setCreatedBy(dispatcher);

        // Randomly assign pickup types: 40% STANDARD, 30% WAREHOUSE, 30% PORT_TERMINAL
        int pickupTypeRandom = random.nextInt(100);
        Order.PickupType pickupType;

        if (pickupTypeRandom < 40) {
            pickupType = Order.PickupType.STANDARD;
        } else if (pickupTypeRandom < 70) {
            pickupType = Order.PickupType.WAREHOUSE;
        } else {
            pickupType = Order.PickupType.PORT_TERMINAL;
        }

        order.setPickupType(pickupType);

        // Set fields based on pickup type
        if (pickupType == Order.PickupType.WAREHOUSE) {
            // Warehouse pickup - set warehouse and dock info
            String[] warehouseNames = {"HCM Warehouse", "Da Nang Logistics Center", "Hai Phong Distribution Hub", "Can Tho Storage Facility"};
            order.setWarehouseName(warehouseNames[random.nextInt(warehouseNames.length)]);

            String[] dockPrefixes = {"D-", "L-", "B-", "G-"}; // Dock, Loading, Bay, Gate
            int dockNumber = 1 + random.nextInt(20);
            order.setDockNumber(dockPrefixes[random.nextInt(dockPrefixes.length)] + dockNumber);

        } else if (pickupType == Order.PickupType.PORT_TERMINAL) {
            // Port terminal pickup - set container and terminal info
            // Generate realistic container number (MSCU, MAEU, etc. prefixes)
            String[] containerPrefixes = {"MSCU", "MAEU", "OOLU", "COSU", "HLCU", "YMLU"};
            String prefix = containerPrefixes[random.nextInt(containerPrefixes.length)];
            String serial = String.format("%06d", random.nextInt(999999));
            String checkDigit = String.valueOf(random.nextInt(9));
            order.setContainerNumber(prefix + serial + "-" + checkDigit);

            String[] terminalNames = {"Saigon Port Terminal 1", "Da Nang Port Terminal", "Hai Phong Port Terminal", "Can Tho River Port"};
            order.setTerminalName(terminalNames[random.nextInt(terminalNames.length)]);
        }
        // For STANDARD pickup type, no additional fields needed

        // Synch Order status with Trip status
        if ("completed".equals(tripStatus)) {
            order.setOrderStatus(Order.OrderStatus.DELIVERED);
        } else if ("in_progress".equals(tripStatus) || "arrived".equals(tripStatus)) {
            order.setOrderStatus(Order.OrderStatus.IN_TRANSIT);
        } else {
            order.setOrderStatus(Order.OrderStatus.ASSIGNED);
        }

        // Random cargo details with weights in tons for heavy logistics
        String[] items = {"Electronics", "Office Furniture", "Legal Documents", "Ind. Machinery", "Textiles", "Fresh Produce"};
        String item = items[random.nextInt(items.length)];

        // Weight ranges in tons appropriate for heavy logistics
        BigDecimal weightTons;
        switch (item.toLowerCase()) {
            case "electronics":
                weightTons = new BigDecimal("0.5").add(new BigDecimal(random.nextInt(15)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 0.5-2.0 tons
                break;
            case "office furniture":
                weightTons = new BigDecimal("1.0").add(new BigDecimal(random.nextInt(20)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 1.0-3.0 tons
                break;
            case "legal documents":
                weightTons = new BigDecimal("0.05").add(new BigDecimal(random.nextInt(15)).divide(new BigDecimal(100), 2, java.math.RoundingMode.HALF_UP)); // 0.05-0.20 tons
                break;
            case "ind. machinery":
                weightTons = new BigDecimal("2.0").add(new BigDecimal(random.nextInt(30)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 2.0-5.0 tons
                break;
            case "textiles":
                weightTons = new BigDecimal("0.8").add(new BigDecimal(random.nextInt(17)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 0.8-2.5 tons
                break;
            case "fresh produce":
                weightTons = new BigDecimal("0.3").add(new BigDecimal(random.nextInt(17)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 0.3-2.0 tons
                break;
            default:
                weightTons = new BigDecimal("1.0").add(new BigDecimal(random.nextInt(20)).divide(new BigDecimal(10), 1, java.math.RoundingMode.HALF_UP)); // 1.0-3.0 tons default
        }

        order.setWeightTons(weightTons);

        // Set package value based on item type and weight (realistic pricing)
        BigDecimal baseValuePerToon;
        String detailedDescription;

        switch (item.toLowerCase()) {
            case "electronics":
                baseValuePerToon = new BigDecimal("500000"); // High value electronics
                detailedDescription = "High-quality electronic devices including tablets, laptops, and accessories carefully packed for safe transport";
                break;
            case "office furniture":
                baseValuePerToon = new BigDecimal("80000");  // Mid-range furniture
                detailedDescription = "Professional office furniture set including desks, chairs, and storage units requiring special handling";
                break;
            case "legal documents":
                baseValuePerToon = new BigDecimal("10000000"); // High value documents
                detailedDescription = "Confidential legal documents and corporate records in secure, climate-controlled packaging";
                break;
            case "ind. machinery":
                baseValuePerToon = new BigDecimal("300000");  // Heavy equipment
                detailedDescription = "Industrial machinery and equipment components with specialized packaging and handling requirements";
                break;
            case "textiles":
                baseValuePerToon = new BigDecimal("150000");  // Valuable fabrics
                detailedDescription = "Premium textile products and clothing materials requiring moisture-resistant packaging";
                break;
            case "fresh produce":
                baseValuePerToon = new BigDecimal("25000");   // Lower value produce
                detailedDescription = "Fresh agricultural produce and perishable goods maintained at optimal temperature during transport";
                break;
            default:
                baseValuePerToon = new BigDecimal("100000");
                detailedDescription = "Miscellaneous goods safely packaged for transportation";
        }

        BigDecimal packageValue = baseValuePerToon.multiply(weightTons).setScale(2, java.math.RoundingMode.HALF_UP);
        order.setPackageValue(packageValue);

        order.setPackageDetails(detailedDescription);

        // Set distance from route
        order.setDistanceKm(trip.getRoute().getDistanceKm());

        order.setPriorityLevel(random.nextBoolean() ? Order.PriorityLevel.NORMAL : Order.PriorityLevel.URGENT);

        // Created 1 day before trip departure
        order.setCreatedAt(trip.getScheduledDeparture().minusDays(1));

        // Calculate Shipping Fee (distance + weight based) - Updated for local delivery pricing
        BigDecimal shippingFee = trip.getRoute().getDistanceKm().multiply(new BigDecimal("1500")) // Distance fee (1500 VND per km)
                .add(order.getWeightTons().multiply(new BigDecimal("700000"))) // Weight fee (700000 VND per ton)
                .add(new BigDecimal("30000")); // Base shipping fee
        if (order.getPriorityLevel() == Order.PriorityLevel.URGENT) shippingFee = shippingFee.multiply(new BigDecimal("1.3"));
        order.setShippingFee(shippingFee);

        ordersList.add(order);
    }

    private void createWorkLog(Driver driver, Trip trip, LocalDateTime start, LocalDateTime end, List<DriverWorkLog> logsList) {
        if (start == null || end == null) return;

        DriverWorkLog log = new DriverWorkLog();
        log.setDriver(driver);
        log.setTrip(trip);
        log.setStartTime(start);
        log.setEndTime(end);

        long minutes = Duration.between(start, end).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
        log.setHoursWorked(hours);

        BigDecimal rest = hours.doubleValue() > 4.0 ? new BigDecimal("1.0") : new BigDecimal("0.5");
        log.setRestHoursRequired(rest);
        log.setNextAvailableTime(end.plusMinutes((long)(rest.doubleValue() * 60)));

        logsList.add(log);
    }

    // ==========================================
    // Entity Seeding Helper Methods
    // ==========================================

    private void seedCustomers() {
        // Use user repo to get Customer users safely
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

        // Company data for B2B customers (some customers are B2B companies)
        String[] companyNames = {
            "Logistics Solutions Ltd", "Global Trade Corp", "Metro Freight Services",
            "Pacific Shipping Co", "Prime Logistics Group", "Express Cargo Ltd",
            "Blue Ocean Traders", "Fast Track Logistics", "Unity Shipping Corp"
        };
        String[] companyCodes = {
            "LOG001", "GTC002", "MFS003", "PSC004", "PLG005",
            "ECL006", "BOT007", "FTL008", "USC009"
        };

        List<Customer> customers = java.util.stream.IntStream.range(0, customerUsers.size())
                .mapToObj(index -> {
                    User user = customerUsers.get(index);
                    Customer customer = new Customer();
                    customer.setUser(user);
                    customer.setDefaultDeliveryAddress(generateAddress(neighborhoods, wards, streets, index));
                    customer.setPreferredPaymentMethod(paymentMethods[Math.abs(user.getUsername().hashCode()) % paymentMethods.length]);

                    int activityLevel = Math.abs(user.getEmail().hashCode()) % 100;
                    if (activityLevel > 70) {
                        customer.setTotalOrders(25 + (activityLevel % 45));
                        customer.setTotalSpent(BigDecimal.valueOf(1500000 + (activityLevel % 5000000)));
                    } else if (activityLevel > 30) {
                        customer.setTotalOrders(3 + (activityLevel % 22));
                        customer.setTotalSpent(BigDecimal.valueOf(150000 + (activityLevel % 1350000)));
                    } else {
                        customer.setTotalOrders(activityLevel % 3);
                        customer.setTotalSpent(BigDecimal.valueOf((activityLevel % 3) * 150000));
                    }

                    if (customer.getTotalOrders() > 0) {
                        int daysSinceLastOrder = 1 + (Math.abs(user.getUsername().hashCode()) % 60);
                        customer.setLastOrderDate(LocalDateTime.now().minusDays(daysSinceLastOrder));
                    }

                    // Add company information to specific customers for demo + ~30% random
                    String username = user.getUsername();
                    boolean isB2B = false;

                    // Force some specific users to have company data for demo
                    if ("nguyen.mai".equals(username) || "tran.binh".equals(username)) {
                        customer.setCompanyName("Logistics Solutions Ltd");
                        customer.setCompanyCode("LOG001");
                        isB2B = true;
                    } else if ("pham.duc".equals(username) || "le.huong".equals(username)) {
                        customer.setCompanyName("Global Trade Corp");
                        customer.setCompanyCode("GTC002");
                        isB2B = true;
                    }

                    // Add company information to ~30% of remaining customers (B2B simulation)
                    if (!isB2B) {
                        int companySeed = Math.abs(user.getUsername().hashCode()) % 100;
                        if (companySeed < 30) { // 30% chance of being a B2B customer
                            int companyIndex = companySeed % companyNames.length;
                            customer.setCompanyName(companyNames[companyIndex]);
                            customer.setCompanyCode(companyCodes[companyIndex]);
                        }
                    }

                    return customer;
                }).toList();

        customerRepository.saveAll(customers);
        System.out.println("Seeded " + customers.size() + " customer profiles.");
    }

    private String generateAddress(String[] neighborhoods, String[] wards, String[] streets, int seed) {
        String neighborhood = neighborhoods[Math.abs(seed) % neighborhoods.length];
        String ward = wards[Math.abs(seed * 3) % wards.length];
        String street = streets[Math.abs(seed * 7) % streets.length];
        int houseNumber = 1 + Math.abs(seed * 13) % 999;
        return String.format("%d %s, %s, %s, Ho Chi Minh City", houseNumber, street, ward, neighborhood);
    }

    private void seedRoles() {
        List<Role> roles = Arrays.asList(
                createRole("ADMIN", "System administrator with full access"),
                createRole("DISPATCHER", "Manages trip assignments and routing"),
                createRole("DRIVER", "Vehicle driver"),
                createRole("CUSTOMER", "Customer who places delivery orders")
        );
        roleRepository.saveAll(roles);
        System.out.println("Seeded 4 roles");
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
        if (roles.size() < 4) return;
        LocalDateTime now = LocalDateTime.now();

        List<User> users = Arrays.asList(
                createUserWithRole("admin", "admin@logiflow.com", "123", roles.get(0), "Admin User", "+84-901-000-001", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(120), now.minusDays(1)),
                createUserWithRole("john.dispatcher", "john.d@logiflow.com", "123", roles.get(1), "John Dispatcher", "+84-901-234-501", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(110), now.minusDays(2)),

                createUserWithRole("sarah.driver", "sarah.d@logiflow.com", "123", roles.get(2), "Sarah Driver", "+84-901-234-502", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(105), now.minusDays(3)),
                createUserWithRole("mike.driver", "mike.d@logiflow.com", "123", roles.get(2), "Mike Driver", "+84-901-234-503", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(89), now.minusDays(10)),
                createUserWithRole("amy.dispatcher2", "amy.d@logiflow.com", "123", roles.get(1), "Amy Dispatcher", "+84-901-234-504", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(95), now.minusDays(5)),
                createUserWithRole("lisa.dispatcher3", "lisa.d@logiflow.com", "123", roles.get(1), "Lisa Dispatcher", "+84-901-234-506", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(100), now.minusDays(4)),
                createUserWithRole("carl.driver2", "carl.d@logiflow.com", "123", roles.get(2), "Carl Driver", "+84-901-234-505", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(84), now.minusDays(8)),

                createUserWithRole("david.driver3", "david.d@logiflow.com", "123", roles.get(2), "David Driver", "+84-901-234-507", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(79), now.minusDays(12)),
                createUserWithRole("emma.driver4", "emma.d@logiflow.com", "123", roles.get(2), "Emma Driver", "+84-901-234-508", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(74), now.minusDays(15)),
                createUserWithRole("bob.driver5", "bob.d@logiflow.com", "123", roles.get(2), "Bob Driver", "+84-901-234-509", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(69), now.minusDays(7)),
                createUserWithRole("frank.driver6", "frank.d@logiflow.com", "123", roles.get(2), "Frank Driver", "+84-901-234-510", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(64), now.minusDays(9)),
                createUserWithRole("grace.driver7", "grace.d@logiflow.com", "123", roles.get(2), "Grace Driver", "+84-901-234-511", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(59), now.minusDays(11)),
                createUserWithRole("henry.driver8", "henry.d@logiflow.com", "123", roles.get(2), "Henry Driver", "+84-901-234-512", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(54), now.minusDays(6)),
                createUserWithRole("iris.driver9", "iris.d@logiflow.com", "123", roles.get(2), "Iris Driver", "+84-901-234-513", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(49), now.minusDays(13)),
                createUserWithRole("jack.driver10", "jack.d@logiflow.com", "123", roles.get(2), "Jack Driver", "+84-901-234-514", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(44), now.minusDays(14)),

                createUserWithRole("nguyen.mai", "nguyen.mai@gmail.com", "123", roles.get(3), "Nguyen Thi Mai", "+84-901-111-111", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(60), now.minusDays(1)),
                createUserWithRole("tran.binh", "tran.binh@gmail.com", "123", roles.get(3), "Tran Van Binh", "+84-902-222-222", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(55), now.minusDays(2)),
                createUserWithRole("pham.duc", "pham.duc@gmail.com", "123", roles.get(3), "Pham Van Duc", "+84-903-333-333", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(50), now.minusDays(3)),
                createUserWithRole("le.huong", "le.huong@gmail.com", "123", roles.get(3), "Le Thi Huong", "+84-904-444-444", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(45), now.minusDays(4)),
                createUserWithRole("hoang.tam", "hoang.tam@gmail.com", "123", roles.get(3), "Hoang Minh Tam", "+84-905-555-555", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(40), now.minusDays(5)),
                createUserWithRole("diep.loc", "diep.loc@gmail.com", "123", roles.get(3), "Diep Van Loc", "+84-906-666-666", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(35), now.minusDays(6)),
                createUserWithRole("vo.nhung", "vo.nhung@gmail.com", "123", roles.get(3), "Vo Thanh Nhung", "+84-907-777-777", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(30), now.minusDays(7)),
                createUserWithRole("bui.phong", "bui.phong@gmail.com", "123", roles.get(3), "Bui Duc Phong", "+84-908-888-888", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(25), now.minusDays(8)),
                createUserWithRole("do.huong", "do.huong@gmail.com", "123", roles.get(3), "Do Thi Huong", "+84-909-999-999", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(20), now.minusDays(9)),
                createUserWithRole("ttnhan227", "ttnhan227@gmail.com", "123", roles.get(3), "Tran Trong Nhan", "+84-910-000-000", PLACEHOLDER_PROFILE_IMAGE_URL, now.minusDays(15), now.minusDays(10))
        );
        userRepository.saveAll(users);
        System.out.println("Seeded 25 users with roles");
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

        // Generate random date of birth (18-70 years old)
        int age = 18 + random.nextInt(53);
        user.setDateOfBirth(LocalDate.now().minusYears(age).minusDays(random.nextInt(365)));

        // Generate address using the same method as customers
        String[] neighborhoods = {"District 1", "District 7", "Thu Duc", "Go Vap", "Tan Binh"};
        String[] wards = {"Ward 1", "Ward 3", "Ward 5", "Ward 7", "Ward 9", "Ward 11"};
        String[] streets = {"Nguyen Trai", "Le Hong Phong", "Tran Hung Dao", "Vo Van Tan", "Pham Ngoc Thach", "Tong Huu Dinh"};
        user.setAddress(generateAddress(neighborhoods, wards, streets, Math.abs(username.hashCode())));

        return user;
    }

    private void seedDrivers() {
        // Safe fetch
        List<User> driverUsers = userRepository.findAllUsersWithRole().stream()
                .filter(user -> user.getRole() != null && "DRIVER".equalsIgnoreCase(user.getRole().getRoleName()))
                .toList();

        if (driverUsers.size() < 11) return;
        LocalDateTime now = LocalDateTime.now();

        List<Driver> drivers = Arrays.asList(
                createDriver(driverUsers.get(0), "Sarah Driver", "D", 12, "VN-D-123456789", now.plusYears(3).plusMonths(2), 4.7, new BigDecimal("21.0285"), new BigDecimal("105.8342"), now.minusDays(105)),
                createDriver(driverUsers.get(1), "Mike Driver", "E", 15, "VN-E-234567890", now.plusYears(4).plusMonths(1), 4.8, new BigDecimal("21.0313"), new BigDecimal("105.8518"), now.minusDays(89)),
                createDriver(driverUsers.get(2), "Carl Driver", "B2", 11, "VN-B2-345678901", now.plusYears(2).plusMonths(8), 4.6, new BigDecimal("21.0282"), new BigDecimal("105.8542"), now.minusDays(84)),
                createDriver(driverUsers.get(3), "David Driver", "D", 14, "VN-D-456789012", now.plusYears(3).plusMonths(6), 4.9, new BigDecimal("20.8462"), new BigDecimal("106.6884"), now.minusDays(79)),
                createDriver(driverUsers.get(4), "Emma Driver", "E", 5, "VN-E-567890123", now.plusYears(2).plusMonths(4), 4.4, new BigDecimal("21.0278"), new BigDecimal("105.8342"), now.minusDays(74)),
                createDriver(driverUsers.get(5), "Bob Driver", "FC", 13, "VN-FC-678901234", now.plusYears(4).plusMonths(3), 4.7, new BigDecimal("10.8230"), new BigDecimal("106.6297"), now.minusDays(69)),
                createDriver(driverUsers.get(6), "Frank Driver", "C", 8, "VN-C-789012345", now.plusYears(2).plusMonths(9), 4.5, new BigDecimal("16.0544"), new BigDecimal("108.2022"), now.minusDays(64)),
                createDriver(driverUsers.get(7), "Grace Driver", "D", 12, "VN-D-890123456", now.plusYears(3).plusMonths(7), 4.8, new BigDecimal("12.2388"), new BigDecimal("109.1967"), now.minusDays(59)),
                createDriver(driverUsers.get(8), "Henry Driver", "B2", 9, "VN-B2-901234567", now.plusYears(2).plusMonths(11), 4.3, new BigDecimal("10.7726"), new BigDecimal("106.6980"), now.minusDays(54)),
                createDriver(driverUsers.get(9), "Iris Driver", "E", 7, "VN-E-012345678", now.plusYears(3).plusMonths(1), 4.6, new BigDecimal("20.8197"), new BigDecimal("106.7242"), now.minusDays(49)),
                createDriver(driverUsers.get(10), "Jack Driver", "C", 10, "VN-C-123456789", now.plusYears(2).plusMonths(6), 4.7, new BigDecimal("10.0378"), new BigDecimal("105.7833"), now.minusDays(44))
        );
        driverRepository.saveAll(drivers);
        System.out.println("Seeded " + drivers.size() + " drivers");
    }

    private Driver createDriver(User user, String fullName, String licenseType, int experience, String licenseNumber, LocalDateTime licenseExpiry, double ratingValue, BigDecimal lat, BigDecimal lng, LocalDateTime createdAt) {
        Driver driver = new Driver();
        driver.setUser(user);
        driver.setLicenseType(licenseType);
        driver.setLicenseNumber(licenseNumber);
        driver.setLicenseExpiryDate(licenseExpiry.toLocalDate());

        // Calculate license issue date (typically 5-10 years before expiry)
        int yearsBeforeExpiry = 5 + random.nextInt(6); // 5-10 years
        driver.setLicenseIssueDate(licenseExpiry.toLocalDate().minusYears(yearsBeforeExpiry));

        driver.setRating(BigDecimal.valueOf(ratingValue));
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
                createVehicle("truck", "51D-56789", 12000, "E", new BigDecimal("16.0628"), new BigDecimal("108.2328"), "available", now.minusDays(130)),
                createVehicle("truck", "51A-67890", 3000, "D", new BigDecimal("21.0282"), new BigDecimal("105.8542"), "in_use", now.minusDays(125)),
                createVehicle("container", "51C-78901", 20000, "FC", new BigDecimal("21.4082"), new BigDecimal("105.4282"), "available", now.minusDays(120)),
                createVehicle("van", "51B-89012", 1000, "C", new BigDecimal("20.8462"), new BigDecimal("106.6884"), "maintenance", now.minusDays(115)),
                createVehicle("truck", "51A-90123", 4000, "C", new BigDecimal("21.0278"), new BigDecimal("105.8342"), "available", now.minusDays(110)),
                createVehicle("container", "51C-01234", 30000, "FC", new BigDecimal("10.8230"), new BigDecimal("106.6297"), "in_use", now.minusDays(105))
        );
        vehicleRepository.saveAll(vehicles);
        System.out.println("Seeded " + vehicles.size() + " vehicles");
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
        // Legacy routes removed - new system creates trip routes dynamically from orders
        // Trip routes are created per trip based on order pickup/delivery coordinates
        System.out.println("Legacy routes seeding skipped - using dynamic trip routes");
    }



    private void seedSystemSettings() {
        List<SystemSetting> settings = Arrays.asList(
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

    private void seedRegistrationRequests() {
        Role driverRole = roleRepository.findByRoleName("DRIVER")
                .orElseThrow(() -> new RuntimeException("DRIVER role not found"));
        Role customerRole = roleRepository.findByRoleName("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("CUSTOMER role not found"));
        LocalDateTime now = LocalDateTime.now();

        List<RegistrationRequest> requests = Arrays.asList(
                // Driver registration requests
                createDriverRegistrationRequest("sarah.d@logiflow.com", "Sarah Driver", "+84-901-234-502", "DL123456", "D", now.plusYears(3).plusMonths(2), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(105)),
                createDriverRegistrationRequest("mike.d@logiflow.com", "Mike Driver", "+84-901-234-503", "DL234567", "B2", now.plusYears(4).plusMonths(1), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(90)),
                createDriverRegistrationRequest("carl.d@logiflow.com", "Carl Driver", "+84-901-234-505", "DL345678", "C", now.plusYears(2).plusMonths(8), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(85)),
                createDriverRegistrationRequest("david.d@logiflow.com", "David Driver", "+84-901-234-507", "DL456789", "D", now.plusYears(3).plusMonths(6), driverRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(80)),
                createDriverRegistrationRequest("john.smith@example.com", "John Smith", "+84-999-000-001", "DL999999", "B2", now.plusYears(1).plusMonths(6), driverRole, RegistrationRequest.RequestStatus.REJECTED, now.minusDays(10)),

                // Customer registration requests
                createCustomerRegistrationRequest("mai.nguyen@logistics-solutions.com", "Mai Nguyen", "+84-901-111-111", "Logistics Solutions Ltd", "LOG001", "Logistics", "Manager", customerRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(60)),
                createCustomerRegistrationRequest("binh.tran@globaltrade.com", "Binh Tran", "+84-902-222-222", "Global Trade Corp", "GTC002", "Manufacturing", "Operations Director", customerRole, RegistrationRequest.RequestStatus.APPROVED, now.minusDays(55)),
                createCustomerRegistrationRequest("maria.garcia@metrofreight.com", "Maria Garcia", "+84-999-222-222", "Metro Freight Services", "MFS003", "Transportation", "Logistics Manager", customerRole, RegistrationRequest.RequestStatus.PENDING, now.minusDays(45)),
                createCustomerRegistrationRequest("david.chen@pacificshipping.com", "David Chen", "+84-999-333-333", "Pacific Shipping Co", "PSC004", "Shipping", "CEO", customerRole, RegistrationRequest.RequestStatus.PENDING, now.minusDays(40)),
                createCustomerRegistrationRequest("sarah.johnson@johnsonlogistics.com", "Sarah Johnson", "+84-999-111-111", "Johnson Logistics", "JL001", "Manufacturing", "Operations Manager", customerRole, RegistrationRequest.RequestStatus.REJECTED, now.minusDays(35))
        );
        registrationRequestRepository.saveAll(requests);
        System.out.println("Seeded registration requests");
    }

    private RegistrationRequest createDriverRegistrationRequest(String email, String fullName, String phone, String licenseNumber, String licenseType, LocalDateTime licenseExpiry, Role role, RegistrationRequest.RequestStatus status, LocalDateTime createdAt) {
        RegistrationRequest request = new RegistrationRequest();
        request.setEmail(email);
        request.setFullName(fullName);
        request.setPhone(phone);
        request.setLicenseNumber(licenseNumber);
        request.setLicenseType(licenseType);
        request.setLicenseExpiry(licenseExpiry.toLocalDate());
        request.setDateOfBirth(LocalDateTime.now().minusYears(30).toLocalDate());
        request.setAddress("Sample Address");
        request.setEmergencyContactName("Contact");
        request.setEmergencyContactPhone("123456");
        request.setRole(role);
        request.setStatus(status);
        request.setCreatedAt(createdAt);
        return request;
    }

    private RegistrationRequest createCustomerRegistrationRequest(String email, String fullName, String phone, String companyName, String companyTaxId, String companyIndustry, String userPosition, Role role, RegistrationRequest.RequestStatus status, LocalDateTime createdAt) {
        RegistrationRequest request = new RegistrationRequest();
        request.setEmail(email);
        request.setFullName(fullName);
        request.setPhone(phone);
        request.setCompanyName(companyName);
        request.setCompanyTaxId(companyTaxId);
        request.setCompanyIndustry(companyIndustry);
        request.setUserPosition(userPosition);
        request.setCompanyAddress("Sample Company Address");
        request.setRole(role);
        request.setStatus(status);
        request.setCreatedAt(createdAt);
        return request;
    }

    private void addDelayDataToTrip(Trip trip) {
        // Random delay reasons for demo
        String[] delayReasons = {
            "Heavy traffic congestion in urban area",
            "Port gate waiting time extended",
            "Warehouse loading delay due to staff shortage",
            "Weather conditions affecting route",
            "Vehicle maintenance check required",
            "Container handling delay at terminal",
            "Customer pickup delay at origin"
        };

        // Random delay reason
        String delayReason = delayReasons[random.nextInt(delayReasons.length)];

        // Random delay status (mostly approved for demo)
        String delayStatus = random.nextInt(100) < 80 ? "APPROVED" : "PENDING";

        // Random SLA extension if approved
        Integer slaExtension = null;

        if ("APPROVED".equals(delayStatus)) {
            slaExtension = 15 + random.nextInt(46); // 15-60 minutes
        }

        // Set delay data on trip
        trip.setDelayReason(delayReason);
        trip.setDelayStatus(delayStatus);
        trip.setSlaExtensionMinutes(slaExtension);
    }

    private List<Payment> createPaymentsForDeliveredOrders(List<Order> allOrders, List<Trip> allTrips) {
        List<Payment> payments = new ArrayList<>();

        // Filter for delivered orders with PENDING payment status
        List<Order> deliveredPendingOrders = allOrders.stream()
                .filter(order -> Order.OrderStatus.DELIVERED.equals(order.getOrderStatus()) &&
                        Order.PaymentStatus.PENDING.equals(order.getPaymentStatus()))
                .collect(Collectors.toList());

        System.out.println("Creating payments for " + deliveredPendingOrders.size() + " delivered orders with pending payments...");

        // Group orders by customer to ensure each customer has at least one pending order
        Map<Integer, List<Order>> ordersByCustomer = deliveredPendingOrders.stream()
                .collect(Collectors.groupingBy(order -> order.getCustomer().getUserId()));

        for (Map.Entry<Integer, List<Order>> entry : ordersByCustomer.entrySet()) {
            List<Order> customerOrders = entry.getValue();
            boolean hasPendingForCustomer = false;

            for (Order order : customerOrders) {
                // 70% chance of having PAID status, but ensure at least one per customer stays pending
                boolean shouldBePaid = random.nextInt(100) < 70;

                // If this is the last order for this customer and none are pending yet, force it to stay pending
                if (!shouldBePaid && !hasPendingForCustomer) {
                    // This order will stay pending
                    hasPendingForCustomer = true;
                    continue;
                }

                if (shouldBePaid) {
                    Payment payment = new Payment();
                    payment.setOrder(order);
                    payment.setAmount(order.getShippingFee());
                    payment.setPaymentStatus(Payment.PaymentStatus.PAID);
                    payment.setPaymentMethod(random.nextBoolean() ? "paypal" : "cash");

                    // Payment created 1-7 days after order delivery
                    LocalDateTime deliveryTime = order.getTrip().getActualArrival();
                    if (deliveryTime == null) {
                        deliveryTime = order.getTrip().getScheduledArrival();
                    }
                    if (deliveryTime != null) {
                        int daysAfter = 1 + random.nextInt(7);
                        payment.setCreatedAt(deliveryTime.plusDays(daysAfter));
                        payment.setUpdatedAt(payment.getCreatedAt());
                    } else {
                        payment.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
                        payment.setUpdatedAt(payment.getCreatedAt());
                    }

                    // Set PayPal details if payment method is paypal
                    if ("paypal".equals(payment.getPaymentMethod())) {
                        payment.setPaypalOrderId("PAY-" + order.getOrderId() + "-" + random.nextInt(100000));
                        payment.setPaypalTransactionId("TXN-" + order.getOrderId() + "-" + random.nextInt(100000));
                    }

                    payments.add(payment);

                    // Update order payment status to PAID
                    order.setPaymentStatus(Order.PaymentStatus.PAID);
                }
            }
        }

        System.out.println("Created " + payments.size() + " payments for delivered orders.");
        return payments;
    }

    private List<Order> seedPendingOrders(List<User> dispatchers, List<Customer> customers) {
        System.out.println("Seeding pending orders (not assigned to any trip)...");

        List<Order> pendingOrders = new ArrayList<>();
        int numberOfPendingOrders = 5 + random.nextInt(11); // 5-15 pending orders

        for (int i = 0; i < numberOfPendingOrders; i++) {
            Customer customer = customers.get(random.nextInt(customers.size()));
            User dispatcher = dispatchers.get(random.nextInt(dispatchers.size()));

            Order order = new Order();
            order.setCustomer(customer.getUser()); // Link User entity
            order.setCreatedBy(dispatcher);

            // Populate snapshot details to make the order look real
            order.setCustomerName(customer.getUser().getFullName());
            order.setCustomerPhone(customer.getUser().getPhone());

            // Generate realistic order details
            generateOrderDetails(order, customer, "pending", LocalDateTime.now()); // Pass "pending" as trip status and current time

            // Explicitly set order status to PENDING
            order.setOrderStatus(Order.OrderStatus.PENDING);

            // Set created date to recent (within last 7 days)
            order.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(7) + 1));

            // No trip assigned (trip remains null)
            pendingOrders.add(order);
        }

        System.out.println("Created " + pendingOrders.size() + " pending orders.");
        return pendingOrders;
    }

    private Vehicle findCompatibleVehicle(Driver driver, List<Vehicle> vehicles) {
        String driverLicense = driver.getLicenseType();
        if (driverLicense == null) {
            // If no license, assign a vehicle with no license requirement
            return vehicles.stream()
                    .filter(v -> v.getRequiredLicense() == null || v.getRequiredLicense().trim().isEmpty())
                    .findFirst()
                    .orElse(vehicles.get(0)); // Fallback to first vehicle
        }

        // Find vehicles that this driver can operate
        List<Vehicle> compatibleVehicles = vehicles.stream()
                .filter(vehicle -> {
                    String requiredLicense = vehicle.getRequiredLicense();
                    if (requiredLicense == null || requiredLicense.trim().isEmpty()) {
                        return true; // No license requirement
                    }
                    return driverLicense.trim().equalsIgnoreCase(requiredLicense.trim());
                })
                .collect(Collectors.toList());

        if (!compatibleVehicles.isEmpty()) {
            return compatibleVehicles.get(random.nextInt(compatibleVehicles.size()));
        }

        // Fallback: return any vehicle if no compatible ones found
        return vehicles.get(0);
    }
}
