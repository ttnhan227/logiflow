package com.logiflow.server.dtos.maps;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for geocoding results.
 * Contains formatted address and coordinates.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GeocodeResultDto {
    private String formattedAddress;
    private Double latitude;
    private Double longitude;
}

