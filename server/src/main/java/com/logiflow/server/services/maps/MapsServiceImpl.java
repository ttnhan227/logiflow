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
import java.util.Collections;
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

    private String buildOsrmRouteBaseUrl(String profile) {
        // Public demo server supports driving/bike/walk.
        // For "truck" we do best-effort by falling back to driving.
        if (profile == null || profile.trim().isEmpty()) return OSRM_BASE_URL;
        String p = profile.trim().toLowerCase();
        if ("truck".equals(p)) {
            return "http://router.project-osrm.org/route/v1/driving";
        }
        if ("driving".equals(p)) {
            return "http://router.project-osrm.org/route/v1/driving";
        }
        // Unknown profiles fallback
        return "http://router.project-osrm.org/route/v1/driving";
    }

    public MapsServiceImpl() {
        this.restTemplate = new RestTemplate();
        // Set proper headers as required by Nominatim usage policy
        List<ClientHttpRequestInterceptor> interceptors = new ArrayList<>();
        interceptors.add((request, body, execution) -> {
            HttpHeaders headers = request.getHeaders();
            if (!headers.containsKey("User-Agent")) {
                headers.add("User-Agent", "LogiFlow Logistics App (contact@logiflow.com)");
            }
            if (!headers.containsKey("Referer")) {
                headers.add("Referer", "https://logiflow.example.com");
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
        return getDirections(originLat, originLng, destLat, destLng, includeGeometry, "driving");
    }

    @Override
    public DirectionsResultDto getDirections(String originLat, String originLng,
                                            String destLat, String destLng, boolean includeGeometry, String profile) {
        if (originLat == null || originLng == null || destLat == null || destLng == null) {
            return null;
        }

        try {
            // OSRM API format: /route/v1/{profile}/{coordinates}?overview={level}&geometries=geojson
            // Use simplified overview when geometry not needed to reduce response size
            String overview = includeGeometry ? "full" : "simplified";
            String coordinates = String.format("%s,%s;%s,%s",
                originLng, originLat, destLng, destLat);
            String baseUrl = buildOsrmRouteBaseUrl(profile);
            String url = String.format(
                "%s/%s?overview=%s&geometries=geojson",
                baseUrl, coordinates, overview
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
     * Uses Nominatim geocoding and OSRM routing only (no hardcoded fallbacks)
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

        // Step 1: Geocode both addresses using Nominatim only (no fallback)
        GeocodeResultDto origin = geocodeAddress(originAddress);
        GeocodeResultDto destination = geocodeAddress(destinationAddress);

        if (origin == null || destination == null) {
            return null; // Geocoding failed for one or both addresses
        }

        // Step 2: Calculate distance using OSRM with geocoded coordinates
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

    // All hardcoded address methods removed - using real OpenStreetMap services only

    /**
     * Get address suggestions using Nominatim search API
     * Returns real address suggestions from Nominatim only
     *
     * @param query Partial address string to search for
     * @param limit Maximum number of suggestions to return
     * @return List of address suggestions from Nominatim, or empty list if service fails
     */
    @Override
    public List<String> getBasicAddressSuggestions(String query, int limit) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            enforceRateLimit();

            String url = String.format(
                "https://nominatim.openstreetmap.org/search?format=json&q=%s&limit=%d&addressdetails=1&accept-language=en",
                java.net.URLEncoder.encode(query.trim(), "UTF-8"),
                Math.min(limit, 5) // Reasonable limit for suggestions
            );

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = restTemplate.getForObject(url, List.class);

            List<String> suggestions = new ArrayList<>();
            if (results != null) {
                for (Map<String, Object> result : results) {
                    String displayName = (String) result.get("display_name");
                    if (displayName != null && !displayName.trim().isEmpty()) {
                        suggestions.add(displayName);
                    }
                }
            }

            return suggestions.stream().limit(limit).collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("Address suggestions failed: " + e.getMessage());
            // Return empty list - no hardcoded fallback
            return Collections.emptyList();
        }
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
