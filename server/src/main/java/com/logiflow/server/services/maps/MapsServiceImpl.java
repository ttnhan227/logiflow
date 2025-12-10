package com.logiflow.server.services.maps;

import com.logiflow.server.dtos.maps.GeocodeResultDto;
import com.logiflow.server.dtos.maps.DirectionsResultDto;
import com.logiflow.server.dtos.maps.DistanceResultDto;
import com.logiflow.server.dtos.maps.OptimizeRequestDto;
import com.logiflow.server.dtos.maps.OptimizedRouteDto;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ClientHttpRequestInterceptor;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Implementation of MapsService using OpenStreetMap services.
 * - Geocoding: Nominatim API
 * - Routing: OSRM (Open Source Routing Machine) API
 * - Rate limit: 1 request per second for Nominatim (enforced with delay)
 */
@Service
public class MapsServiceImpl implements MapsService {

    private final RestTemplate restTemplate;
    private long lastRequestTime = 0;
    private static final long MIN_REQUEST_INTERVAL_MS = 1000; // 1 second
    private static final String OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving";
    private static final String OSRM_TRIP_URL = "http://router.project-osrm.org/trip/v1/driving";

    public MapsServiceImpl() {
        this.restTemplate = new RestTemplate();
        // Set user agent as required by Nominatim usage policy
        List<ClientHttpRequestInterceptor> interceptors = new ArrayList<>();
        interceptors.add((request, body, execution) -> {
            HttpHeaders headers = request.getHeaders();
            if (!headers.containsKey("User-Agent")) {
                headers.add("User-Agent", "LogiFlow/1.0 (Contact: your-email@example.com)");
            }
            return execution.execute(request, body);
        });
        restTemplate.setInterceptors(interceptors);
    }

    /**
     * Enforce rate limiting: 1 request per second for Nominatim
     */
    private void enforceRateLimit() {
        long currentTime = System.currentTimeMillis();
        long timeSinceLastRequest = currentTime - lastRequestTime;
        
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
            try {
                Thread.sleep(MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        
        lastRequestTime = System.currentTimeMillis();
    }

    /**
     * Geocode an address to coordinates using Nominatim API
     * 
     * @param address The address to geocode
     * @return GeocodeResultDto or null if geocoding fails
     */
    @Override
    public GeocodeResultDto geocodeAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }

        enforceRateLimit();

        try {
            // Try several variants to improve match rates:
            // 1. full address
            // 2. remove country (last token)
            // 3. use first two tokens
            // 4. use first token only
            String[] parts = address.split(",");
            List<String> attempts = new ArrayList<>();
            attempts.add(address);
            if (parts.length > 1) {
                // remove last token (often country)
                String withoutCountry = String.join(",", java.util.Arrays.copyOf(parts, parts.length - 1)).trim();
                attempts.add(withoutCountry);
            }
            if (parts.length > 2) {
                attempts.add(String.join(",", java.util.Arrays.copyOf(parts, 2)).trim());
            }
            if (parts.length > 0) {
                attempts.add(parts[0].trim());
            }

            for (String q : attempts) {
                if (q == null || q.isEmpty()) continue;
                enforceRateLimit();
                String encodedAddress = java.net.URLEncoder.encode(q, "UTF-8");
                // include addressdetails and accept-language to increase chances
                String url = String.format(
                    "https://nominatim.openstreetmap.org/search?format=json&q=%s&limit=1&addressdetails=1&accept-language=en",
                    encodedAddress
                );

                try {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> results = restTemplate.getForObject(url, List.class);

                    if (results != null && !results.isEmpty()) {
                        Map<String, Object> firstResult = (Map<String, Object>) results.get(0);
                        // Extract coordinates
                        String latStr = firstResult.get("lat").toString();
                        String lonStr = firstResult.get("lon").toString();
                        Double latitude = Double.parseDouble(latStr);
                        Double longitude = Double.parseDouble(lonStr);
                        // Extract formatted address (display_name)
                        String formattedAddress = firstResult.get("display_name").toString();

                        return new GeocodeResultDto(formattedAddress, latitude, longitude);
                    }
                } catch (Exception inner) {
                    // Log the failed URL and continue to next attempt
                    System.err.println("Geocoding attempt failed for url: " + url + " -> " + inner.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Geocoding error: " + e.getMessage());
            e.printStackTrace();
        }

        return null;
    }

    /**
     * Get route directions between two points using OSRM API
     * 
     * @param originLat Origin latitude
     * @param originLng Origin longitude
     * @param destLat Destination latitude
     * @param destLng Destination longitude
     * @param includeGeometry If false, excludes geometry from response (reduces response size)
     * @return DirectionsResultDto or null if routing fails
     */
    @Override
    public DirectionsResultDto getDirections(String originLat, String originLng, 
                                         String destLat, String destLng, boolean includeGeometry) {
        if (originLat == null || originLng == null || destLat == null || destLng == null) {
            return null;
        }

        try {
            // OSRM API format: /route/v1/{profile}/{coordinates}?overview={level}&geometries=geojson
            // Use simplified overview when geometry not needed to reduce response size
            String overview = includeGeometry ? "full" : "simplified";
            String coordinates = String.format("%s,%s;%s,%s", 
                originLng, originLat, destLng, destLat);
            String url = String.format(
                "%s/%s?overview=%s&geometries=geojson",
                OSRM_BASE_URL, coordinates, overview
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "Ok".equals(response.get("code"))) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");

                if (routes != null && !routes.isEmpty()) {
                    Map<String, Object> route = routes.get(0);
                    
                    // Extract distance (in meters)
                    Double distanceValue = ((Number) route.get("distance")).doubleValue();
                    Integer distanceMeters = distanceValue.intValue();
                    String totalDistance = formatDistance(distanceMeters);
                    
                    // Extract duration (in seconds)
                    Double durationValue = ((Number) route.get("duration")).doubleValue();
                    Integer durationSeconds = durationValue.intValue();
                    String totalDuration = formatDuration(durationSeconds);
                    
                    // Extract geometry only if requested (can be very large for long routes)
                    List<List<Double>> coordinatesList = null;
                    if (includeGeometry) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> geometry = (Map<String, Object>) route.get("geometry");
                        if (geometry != null) {
                            @SuppressWarnings("unchecked")
                            List<List<Double>> coords = (List<List<Double>>) geometry.get("coordinates");
                            coordinatesList = coords;
                        }
                    }

                    return new DirectionsResultDto(
                        totalDistance, 
                        distanceMeters, 
                        totalDuration, 
                        durationSeconds,
                        coordinatesList,
                        route
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Routing error: " + e.getMessage());
            e.printStackTrace();
        }

        return null;
    }

    /**
     * Format distance in meters to human-readable string
     */
    private String formatDistance(Integer meters) {
        if (meters < 1000) {
            return meters + " m";
        } else {
            double km = meters / 1000.0;
            return String.format("%.2f km", km);
        }
    }

    /**
     * Format duration in seconds to human-readable string
     */
    private String formatDuration(Integer seconds) {
        if (seconds < 60) {
            return seconds + " sec";
        } else if (seconds < 3600) {
            int minutes = seconds / 60;
            return minutes + " min";
        } else {
            int hours = seconds / 3600;
            int minutes = (seconds % 3600) / 60;
            if (minutes == 0) {
                return hours + " hr";
            } else {
                return String.format("%d hr %d min", hours, minutes);
            }
        }
    }

    /**
     * Calculate distance and duration between two addresses
     * Uses coordinate mapping for known addresses to avoid Nominatim calls
     *
     * @param originAddress Origin address
     * @param destinationAddress Destination address
     * @return DistanceResultDto or null if calculation fails
     */
    @Override
    public DistanceResultDto calculateDistance(String originAddress, String destinationAddress) {
        if (originAddress == null || originAddress.trim().isEmpty() ||
            destinationAddress == null || destinationAddress.trim().isEmpty()) {
            return null;
        }

        // Step 1: Try to resolve addresses using local coordinate mapping
        GeocodeResultDto origin = resolveKnownAddress(originAddress);
        GeocodeResultDto destination = resolveKnownAddress(destinationAddress);

        if (origin == null || destination == null) {
            return null; // Unknown addresses - return null instead of failing
        }

        // Step 2: Calculate distance using OSRM with known coordinates
        DirectionsResultDto directions = getDirections(
            origin.getLatitude().toString(),
            origin.getLongitude().toString(),
            destination.getLatitude().toString(),
            destination.getLongitude().toString(),
            false // Exclude geometry - we only need distance and duration
        );

        if (directions == null) {
            return null;
        }

        // Step 3: Return distance result
        return new DistanceResultDto(
            directions.getTotalDistance(),
            directions.getDistanceMeters(),
            directions.getTotalDuration(),
            directions.getDurationSeconds()
        );
    }

    /**
     * Resolve known addresses to coordinates to avoid Nominatim dependency
     * @param address The address to resolve
     * @return GeocodeResultDto or null if not recognized
     */
    private GeocodeResultDto resolveKnownAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }

        String trimmed = address.trim().toLowerCase();

        // Ho Chi Minh City coordinates (approximate center)
        if (trimmed.contains("ho chi minh") || trimmed.contains("hcm") || trimmed.contains("sai gon")) {
            // Districts with their rough coordinates
            if (trimmed.contains("district 1")) {
                return new GeocodeResultDto("Ho Chi Minh City, District 1", 10.7744, 106.6944);
            } else if (trimmed.contains("district 7")) {
                return new GeocodeResultDto("Ho Chi Minh City, District 7", 10.7306, 106.7216);
            } else if (trimmed.contains("go vap")) {
                return new GeocodeResultDto("Ho Chi Minh City, Go Vap District", 10.8333, 106.6667);
            } else if (trimmed.contains("tan binh")) {
                return new GeocodeResultDto("Ho Chi Minh City, Tan Binh District", 10.8000, 106.6500);
            }
            // Default to HCM center for district 1
            return new GeocodeResultDto("Ho Chi Minh City", 10.7744, 106.6944);
        }

        // Ha Noi coordinates (approximate center)
        if (trimmed.contains("ha noi") || trimmed.contains("hanoi")) {
            if (trimmed.contains("hoan kiem")) {
                return new GeocodeResultDto("Ha Noi, Hoan Kiem District", 21.0285, 105.8538);
            } else if (trimmed.contains("dong da")) {
                return new GeocodeResultDto("Ha Noi, Dong Da District", 21.0167, 105.8333);
            }
            return new GeocodeResultDto("Ha Noi", 21.0285, 105.8342);
        }

        // Da Nang coordinates (approximate center)
        if (trimmed.contains("da nang") || trimmed.contains("danang")) {
            if (trimmed.contains("hai chau")) {
                return new GeocodeResultDto("Da Nang, Hai Chau District", 16.0678, 108.2208);
            } else if (trimmed.contains("son tra")) {
                return new GeocodeResultDto("Da Nang, Son Tra District", 16.0833, 108.2333);
            }
            return new GeocodeResultDto("Da Nang", 16.0678, 108.2208);
        }

        // Can Tho coordinates
        if (trimmed.contains("can tho")) {
            if (trimmed.contains("ninh kieu")) {
                return new GeocodeResultDto("Can Tho City, Ninh Kieu District", 10.0333, 105.7833);
            }
            return new GeocodeResultDto("Can Tho City", 10.0333, 105.7833);
        }

        // Hai Phong coordinates
        if (trimmed.contains("hai phong")) {
            if (trimmed.contains("ngo quyen")) {
                return new GeocodeResultDto("Hai Phong, Ngo Quyen District", 20.8500, 106.6833);
            }
            return new GeocodeResultDto("Hai Phong", 20.8447, 106.6881);
        }

        // Not recognized - return null
        return null;
    }

    /**
     * Get basic address suggestions based on common Vietnamese locations
     * Returns static suggestions to avoid Nominatim usage policy violations
     *
     * @param query Partial address string to search for (ignored for basic implementation)
     * @param limit Maximum number of suggestions to return
     * @return List of common address suggestions
     */
    @Override
    public List<String> getBasicAddressSuggestions(String query, int limit) {
        List<String> suggestions = Arrays.asList(
            "Ho Chi Minh City, District 1",
            "Ho Chi Minh City, District 7",
            "Ho Chi Minh City, Go Vap District",
            "Ho Chi Minh City, Tan Binh District",
            "Ha Noi, Hoan Kiem District",
            "Ha Noi, Dong Da District",
            "Da Nang, Hai Chau District",
            "Da Nang, Son Tra District",
            "Can Tho City, Ninh Kieu District",
            "Hai Phong, Ngo Quyen District"
        );

        return suggestions.stream()
            .limit(Math.min(limit, suggestions.size()))
            .collect(Collectors.toList());
    }

    /**
     * Optimizes a route for multiple waypoints using OSRM Trip service.
     * The Trip service solves the Traveling Salesperson Problem (TSP) to find the optimal route
     * that visits all points exactly once and returns to the starting point.
     *
     * @param request DTO containing the list of points to visit
     * @return OptimizedRouteDto containing the optimized route information
     */
    @Override
    public OptimizedRouteDto optimizeRoute(OptimizeRequestDto request) {
        if (request == null || request.getLocations() == null || request.getLocations().isEmpty()) {
            throw new IllegalArgumentException("Request must contain at least one location");
        }

        List<String> coordinatesList = request.getLocations().stream()
            .map(loc -> normalizeToCoordinate(loc, request.isUseAddresses()))
            .collect(Collectors.toList());

        String coordinates = String.join(";", coordinatesList);
        boolean includeGeometry = request.isIncludeGeometry();
        String overview = includeGeometry ? "full" : "simplified";
        String url = String.format("%s/%s?overview=%s&geometries=geojson&roundtrip=true", OSRM_TRIP_URL, coordinates, overview);

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response != null && "Ok".equals(response.get("code"))) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> trips = (List<Map<String, Object>>) response.get("trips");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> waypoints = (List<Map<String, Object>>) response.get("waypoints");
            if (trips != null && !trips.isEmpty()) {
                Map<String, Object> trip = trips.get(0);
                Integer distanceMeters = ((Number) trip.get("distance")).intValue();
                String totalDistance = formatDistance(distanceMeters);
                Integer durationSeconds = ((Number) trip.get("duration")).intValue();
                String totalDuration = formatDuration(durationSeconds);
                List<List<Double>> routeCoordinates = null;
                if (includeGeometry) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> geometry = (Map<String, Object>) trip.get("geometry");
                    if (geometry != null) {
                        @SuppressWarnings("unchecked")
                        List<List<Double>> coords = (List<List<Double>>) geometry.get("coordinates");
                        routeCoordinates = coords;
                    }
                }
                return new OptimizedRouteDto(
                    totalDistance,
                    distanceMeters,
                    totalDuration,
                    durationSeconds,
                    waypoints,
                    routeCoordinates
                );
            }
        }
        throw new IllegalArgumentException("Failed to optimize route. Please check your input points.");
    }

    /**
     * Normalize a location string to OSRM coordinate format (lon,lat).
     * If useAddresses is true, geocode the address. If the string looks like coordinates, parse directly.
     */
    private String normalizeToCoordinate(String loc, boolean useAddresses) {
        if (loc == null || loc.trim().isEmpty()) {
            throw new IllegalArgumentException("Location cannot be null or empty");
        }
        String trimmed = loc.trim();
        // Try to parse as coordinates first
        String[] parts = trimmed.split(",");
        if (parts.length == 2) {
            try {
                double a = Double.parseDouble(parts[0].trim());
                double b = Double.parseDouble(parts[1].trim());
                // Heuristic: latitude in [-90,90], longitude in [-180,180]
                if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
                    // a is lat, b is lon
                    return String.format("%s,%s", b, a);
                } else if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
                    // a is lon, b is lat
                    return String.format("%s,%s", a, b);
                }
            } catch (NumberFormatException ignored) {}
        }
        if (useAddresses) {
            GeocodeResultDto result = geocodeAddress(trimmed);
            if (result == null || result.getLongitude() == null || result.getLatitude() == null) {
                throw new IllegalArgumentException("Failed to geocode address: " + trimmed);
            }
            return String.format("%s,%s", result.getLongitude(), result.getLatitude());
        }
        throw new IllegalArgumentException("Invalid location format: " + loc);
    }
}
