package com.logiflow.server.controllers.dispatch;

import com.logiflow.server.dtos.dispatch.TripDto;
import com.logiflow.server.exceptions.GlobalExceptionHandler;
import com.logiflow.server.exceptions.ResourceNotFoundException;
import com.logiflow.server.services.dispatch.TripService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TripControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TripService tripService;

    @InjectMocks
    private TripController tripController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tripController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getTripById_whenFound_returnsTrip() throws Exception {
        TripDto trip = new TripDto();
        trip.setTripId(101);
        trip.setStatus("ASSIGNED");

        when(tripService.getTripById(101)).thenReturn(trip);

        mockMvc.perform(get("/api/dispatch/trips/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(101))
                .andExpect(jsonPath("$.status").value("ASSIGNED"));
    }

    @Test
    void getTripById_whenNotFound_returnsStructured404() throws Exception {
        when(tripService.getTripById(999)).thenThrow(new ResourceNotFoundException("Trip with id 999 not found"));

        mockMvc.perform(get("/api/dispatch/trips/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Trip with id 999 not found"));
    }

    @Test
    void createTrip_whenInvalidPayload_returnsValidationError() throws Exception {
        mockMvc.perform(post("/api/dispatch/trips")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }
}
