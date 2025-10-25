package com.logiflow.server.services.google;

import com.logiflow.server.services.admin.SystemSettingsService;
import com.logiflow.server.dtos.admin.system.SystemSettingDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class GoogleMapsService {

    private final SystemSettingsService settingsService;
    private final RestTemplate restTemplate;

    @Autowired
    public GoogleMapsService(SystemSettingsService settingsService) {
        this.settingsService = settingsService;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Get Google Maps API key from settings (encrypted storage)
     * Uses "maps.google_maps_api_key" setting we seeded
     */
    public String getGoogleMapsApiKey() {
        // Read all settings and find the Google Maps API key
        List<SystemSettingDto> settings = settingsService.getSettings(PageRequest.of(0, 50)).getContent();

        return settings.stream()
            .filter(s -> "maps".equals(s.getCategory()) && "google_maps_api_key".equals(s.getKey()))
            .findFirst()
            .map(SystemSettingDto::getValue)
            .orElse("");
    }

    /**
     * Check if Google Maps integration is enabled
     * Uses "maps.google_maps_enabled" setting (default: true)
     */
    public boolean isGoogleMapsEnabled() {
        List<SystemSettingDto> settings = settingsService.getSettings(PageRequest.of(0, 50)).getContent();

        return settings.stream()
            .filter(s -> "maps".equals(s.getCategory()) && "google_maps_enabled".equals(s.getKey()))
            .findFirst()
            .map(setting -> "true".equals(setting.getValue()))
            .orElse(true); // Default to enabled
    }

    /**
     * Geocode an address to coordinates (reverse geocoding)
     * Uses Google Geocoding API
     */
    public GeocodeResult geocodeAddress(String address) {
        if (!isGoogleMapsEnabled() || address == null || address.trim().isEmpty()) {
            return null;
        }

        String apiKey = getGoogleMapsApiKey();
        if (apiKey.isEmpty()) {
            return null;
        }

        try {
            String url = String.format(
                "https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s",
                java.net.URLEncoder.encode(address, "UTF-8"),
                apiKey
            );

            Map response = restTemplate.getForObject(url, Map.class);
            if (response != null && "OK".equals(response.get("status"))) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");

                if (results != null && !results.isEmpty()) {
                    Map<String, Object> firstResult = results.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> location = (Map<String, Object>)
                        ((Map<String, Object>) firstResult.get("geometry")).get("location");

                    Double lat = (Double) location.get("lat");
                    Double lng = (Double) location.get("lng");

                    return new GeocodeResult(firstResult.get("formatted_address").toString(), lat, lng);
                }
            }
        } catch (Exception e) {
            // Log error in production
            System.err.println("Geocoding error: " + e.getMessage());
        }

        return null;
    }

    /**
     * Calculate distance and duration between two points
     * Uses Google Distance Matrix API
     */
    public DistanceMatrixResult calculateDistance(String originAddress, String destinationAddress) {
        if (!isGoogleMapsEnabled()) {
            return null;
        }

        String apiKey = getGoogleMapsApiKey();
        if (apiKey.isEmpty()) {
            return null;
        }

        try {
            String url = String.format(
                "https://maps.googleapis.com/maps/api/distancematrix/json?origins=%s&destinations=%s&key=%s&units=metric",
                java.net.URLEncoder.encode(originAddress, "UTF-8"),
                java.net.URLEncoder.encode(destinationAddress, "UTF-8"),
                apiKey
            );

            Map response = restTemplate.getForObject(url, Map.class);
            if (response != null && "OK".equals(response.get("status"))) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> rows = (List<Map<String, Object>>) response.get("rows");

                if (rows != null && !rows.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> elements = (List<Map<String, Object>>) rows.get(0).get("elements");

                    if (elements != null && !elements.isEmpty()) {
                        Map<String, Object> element = elements.get(0);

                        if ("OK".equals(element.get("status"))) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> distance = (Map<String, Object>) element.get("distance");
                            @SuppressWarnings("unchecked")
                            Map<String, Object> duration = (Map<String, Object>) element.get("duration");

                            Integer distanceMeters = ((Number) distance.get("value")).intValue();
                            Integer durationSeconds = ((Number) duration.get("value")).intValue();

                            return new DistanceMatrixResult(
                                distance.get("text").toString(),
                                distanceMeters,
                                duration.get("text").toString(),
                                durationSeconds
                            );
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Distance matrix error: " + e.getMessage());
        }

        return null;
    }

    /**
     * Get route directions between two points
     * Uses Google Directions API for detailed routing
     */
    public DirectionsResult getDirections(String originLat, String originLng,
                                         String destLat, String destLng) {
        if (!isGoogleMapsEnabled()) {
            return null;
        }

        String apiKey = getGoogleMapsApiKey();
        if (apiKey.isEmpty()) {
            return null;
        }

        try {
            String url = String.format(
                "https://maps.googleapis.com/maps/api/directions/json?origin=%s,%s&destination=%s,%s&key=%s",
                originLat, originLng, destLat, destLng, apiKey
            );

            Map response = restTemplate.getForObject(url, Map.class);
            if (response != null && "OK".equals(response.get("status"))) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");

                if (routes != null && !routes.isEmpty()) {
                    Map<String, Object> route = routes.get(0);

                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> legs = (List<Map<String, Object>>) route.get("legs");

                    if (legs != null && !legs.isEmpty()) {
                        return new DirectionsResult(route);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Directions error: " + e.getMessage());
        }

        return null;
    }

    /**
     * DTO classes for API responses
     */
    public static class GeocodeResult {
        public final String formattedAddress;
        public final Double latitude;
        public final Double longitude;

        public GeocodeResult(String formattedAddress, Double latitude, Double longitude) {
            this.formattedAddress = formattedAddress;
            this.latitude = latitude;
            this.longitude = longitude;
        }

        @Override
        public String toString() {
            return String.format("Address: %s, Lat: %f, Lng: %f",
                formattedAddress, latitude, longitude);
        }
    }

    public static class DistanceMatrixResult {
        public final String distanceText;
        public final Integer distanceMeters;
        public final String durationText;
        public final Integer durationSeconds;

        public DistanceMatrixResult(String distanceText, Integer distanceMeters,
                                   String durationText, Integer durationSeconds) {
            this.distanceText = distanceText;
            this.distanceMeters = distanceMeters;
            this.durationText = durationText;
            this.durationSeconds = durationSeconds;
        }

        @Override
        public String toString() {
            return String.format("Distance: %s (%dm), Duration: %s (%ds)",
                distanceText, distanceMeters, durationText, durationSeconds);
        }
    }

    public static class DirectionsResult {
        public final Map<String, Object> routeData;

        public DirectionsResult(Map<String, Object> routeData) {
            this.routeData = routeData;
        }

        // Helper method to extract total distance from route
        public String getTotalDistance() {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> legs = (List<Map<String, Object>>) routeData.get("legs");
                if (legs != null && !legs.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> distance = (Map<String, Object>) legs.get(0).get("distance");
                    return distance.get("text").toString();
                }
            } catch (Exception e) {
                // Ignore parsing errors
            }
            return "Unknown";
        }

        // Helper method to extract total duration from route
        public String getTotalDuration() {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> legs = (List<Map<String, Object>>) routeData.get("legs");
                if (legs != null && !legs.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> duration = (Map<String, Object>) legs.get(0).get("duration");
                    return duration.get("text").toString();
                }
            } catch (Exception e) {
                // Ignore parsing errors
            }
            return "Unknown";
        }

        @Override
        public String toString() {
            return String.format("Route - Distance: %s, Duration: %s",
                getTotalDistance(), getTotalDuration());
        }
    }
}
