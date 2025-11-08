package com.logiflow.server.services.maps;

import com.logiflow.server.dtos.maps.GeocodeResultDto;
import com.logiflow.server.dtos.maps.DirectionsResultDto;
import com.logiflow.server.dtos.maps.DistanceResultDto;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ClientHttpRequestInterceptor;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

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
            String encodedAddress = java.net.URLEncoder.encode(address, "UTF-8");
            String url = String.format(
                "https://nominatim.openstreetmap.org/search?format=json&q=%s&limit=1",
                encodedAddress
            );

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
     * First geocodes both addresses, then calculates route distance/duration using OSRM
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

        // Step 1: Geocode both addresses
        GeocodeResultDto origin = geocodeAddress(originAddress);
        GeocodeResultDto destination = geocodeAddress(destinationAddress);

        if (origin == null || destination == null) {
            return null;
        }

        // Step 2: Calculate distance using OSRM (no need for geometry, just distance/duration)
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
}

