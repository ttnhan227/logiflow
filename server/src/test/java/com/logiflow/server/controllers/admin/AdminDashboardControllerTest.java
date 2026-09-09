package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.dashboard.ActiveDriverLocationDto;
import com.logiflow.server.dtos.admin.dashboard.AdminDashboardDto;
import com.logiflow.server.dtos.admin.dashboard.UserStatsDto;
import com.logiflow.server.exceptions.GlobalExceptionHandler;
import com.logiflow.server.services.admin.AdminDashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminDashboardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminDashboardService adminDashboardService;

    @InjectMocks
    private AdminDashboardController adminDashboardController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminDashboardController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getDashboardData_returnsOverviewMetrics() throws Exception {
        UserStatsDto userStats = new UserStatsDto(25L, 3L, 5, 11);
        AdminDashboardDto dashboardDto = AdminDashboardDto.builder()
                .userStats(userStats)
                .recentActivities(List.of())
                .build();

        when(adminDashboardService.getDashboardData()).thenReturn(dashboardDto);

        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userStats.totalUsers").value(25))
                .andExpect(jsonPath("$.userStats.activeDrivers").value(11));
    }

    @Test
    void getActiveDriverLocations_returnsDriverCoordinates() throws Exception {
        ActiveDriverLocationDto driverLoc = ActiveDriverLocationDto.builder()
                .driverId(1)
                .driverName("Sarah Driver")
                .tripId(101)
                .tripStatus("IN_PROGRESS")
                .latitude(new BigDecimal("10.7769"))
                .longitude(new BigDecimal("106.7009"))
                .vehiclePlate("51B-12345")
                .build();

        when(adminDashboardService.getActiveDriverLocations()).thenReturn(List.of(driverLoc));

        mockMvc.perform(get("/api/admin/dashboard/active-drivers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].driverId").value(1))
                .andExpect(jsonPath("$[0].driverName").value("Sarah Driver"))
                .andExpect(jsonPath("$[0].tripStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$[0].vehiclePlate").value("51B-12345"));
    }
}
