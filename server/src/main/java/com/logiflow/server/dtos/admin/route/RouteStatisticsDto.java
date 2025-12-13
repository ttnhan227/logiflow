package com.logiflow.server.dtos.admin.route;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteStatisticsDto {
    private Integer totalRoutes;
    private Integer activeRoutes;
    private Integer totalTrips;
    private Integer scheduledTrips;
    private Integer inProgressTrips;
    private Integer completedTrips;
}
