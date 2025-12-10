package com.logiflow.server.services.maps;

import com.logiflow.server.dtos.maps.DirectionsResultDto;
import com.logiflow.server.dtos.maps.DistanceResultDto;
import com.logiflow.server.dtos.maps.GeocodeResultDto;
import com.logiflow.server.dtos.maps.OptimizeRequestDto;
import com.logiflow.server.dtos.maps.OptimizedRouteDto;
import java.util.List;

/**
 * Service interface for map-related operations using OpenStreetMap services.
 * Provides geocoding, routing, and distance calculation capabilities.
 */
public interface MapsService {
    /**
     * Geocode an address to coordinates (latitude and longitude)
     * Uses Nominatim API (OpenStreetMap)
     *
     * @param address The address to geocode
     * @return GeocodeResultDto containing formatted address, latitude, and longitude, or null if geocoding fails
     */
    GeocodeResultDto geocodeAddress(String address);

    /**
     * Get route directions between two points
     * Uses OSRM (Open Source Routing Machine) API
     *
     * @param originLat Origin latitude
     * @param originLng Origin longitude
     * @param destLat Destination latitude
     * @param destLng Destination longitude
     * @param includeGeometry If false, excludes geometry from response (reduces response size significantly)
     * @return DirectionsResultDto containing distance, duration, and optionally route geometry, or null if routing fails
     */
    DirectionsResultDto getDirections(
        String originLat,
        String originLng,
        String destLat,
        String destLng,
        boolean includeGeometry
    );

    /**
     * Calculate distance and duration between two addresses
     * Uses Nominatim for geocoding and OSRM for distance calculation
     *
     * @param originAddress Origin address
     * @param destinationAddress Destination address
     * @return DistanceResultDto containing distance and duration, or null if calculation fails
     */
    DistanceResultDto calculateDistance(
        String originAddress,
        String destinationAddress
    );

    /**
     * Get basic address suggestions based on common Vietnamese locations
     * Returns static suggestions to avoid Nominatim usage policy violations
     *
     * @param query Partial address string to search for (ignored for basic implementation)
     * @param limit Maximum number of suggestions to return
     * @return List of common address suggestions
     */
    List<String> getBasicAddressSuggestions(String query, int limit);

    /**
     * Optimizes a route for multiple waypoints (Traveling Salesperson Problem).
     * Uses OSRM Trip API.
     *
     * @param request DTO containing the list of points to visit.
     * @return OptimizedRouteDto containing the optimized route, distance, duration, and waypoints order.
     */
    OptimizedRouteDto optimizeRoute(OptimizeRequestDto request);
}
