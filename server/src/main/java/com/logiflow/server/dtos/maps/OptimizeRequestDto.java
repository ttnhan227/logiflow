package com.logiflow.server.dtos.maps;

import java.util.List;

/**
 * DTO for requesting route optimization.
 * It can accept either addresses or coordinates for the points to be visited.
 */
public class OptimizeRequestDto {

    /**
     * A list of locations to visit. Can be either:
     * - Addresses (e.g., "123 Main St, City, Country")
     * - Coordinates in "latitude,longitude" format (e.g., "48.8584,2.2945")
     */
    private List<String> locations;

    /**
     * Indicates whether the locations are provided as addresses (true) or coordinates (false)
     */
    private boolean useAddresses = false;


    /**
     * If false, geometry will not be included in the optimized route response (default: true)
     */
    private boolean includeGeometry = true;

    public OptimizeRequestDto() {
    }

    public OptimizeRequestDto(List<String> locations, boolean useAddresses) {
        this.locations = locations;
        this.useAddresses = useAddresses;
    }

    public OptimizeRequestDto(List<String> locations, boolean useAddresses, boolean includeGeometry) {
        this.locations = locations;
        this.useAddresses = useAddresses;
        this.includeGeometry = includeGeometry;
    }

    public List<String> getLocations() {
        return locations;
    }

    public void setLocations(List<String> locations) {
        this.locations = locations;
    }

    public boolean isUseAddresses() {
        return useAddresses;
    }

    public void setUseAddresses(boolean useAddresses) {
        this.useAddresses = useAddresses;
    }

    public boolean isIncludeGeometry() {
        return includeGeometry;
    }

    public void setIncludeGeometry(boolean includeGeometry) {
        this.includeGeometry = includeGeometry;
    }
}
