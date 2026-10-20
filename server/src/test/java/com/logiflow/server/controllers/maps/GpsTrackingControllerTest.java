package com.logiflow.server.controllers.maps;

import com.logiflow.server.controllers.maps.GpsTrackingController.LocationMessage;
import com.logiflow.server.services.driver.DriverService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GpsTrackingControllerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private DriverService driverService;

    private GpsTrackingController controller;

    @BeforeEach
    void setUp() {
        controller = new GpsTrackingController(messagingTemplate, driverService);
        GpsTrackingController.clearHistoryForTest();
    }

    private SimpMessageHeaderAccessor createHeaderAccessor(String driverId) {
        SimpMessageHeaderAccessor accessor = mock(SimpMessageHeaderAccessor.class);
        Map<String, Object> sessionAttributes = new HashMap<>();
        if (driverId != null) {
            sessionAttributes.put("userId", driverId);
        }
        when(accessor.getSessionAttributes()).thenReturn(sessionAttributes);
        return accessor;
    }

    @Test
    void receiveLocation_validCoordinates_broadcastsAndStoresLocation() {
        SimpMessageHeaderAccessor accessor = createHeaderAccessor("driver_42");
        LocationMessage input = new LocationMessage("spoofed_driver", "trip_100", 10.762622, 106.660172);

        LocationMessage result = controller.receiveLocation(input, accessor);

        assertNotNull(result);
        assertEquals("driver_42", result.getDriverId(), "Must override driver ID with authenticated session user");
        assertEquals("trip_100", result.getTripId());
        assertEquals(10.762622, result.getLatitude());
        assertEquals(106.660172, result.getLongitude());

        verify(messagingTemplate).convertAndSend(eq("/topic/trips/trip_100/location"), eq(result));

        LocationMessage latest = GpsTrackingController.getLatestLocation("driver_42", "trip_100");
        assertNotNull(latest);
        assertEquals(10.762622, latest.getLatitude());

        List<LocationMessage> history = GpsTrackingController.getLocationHistory("driver_42", "trip_100");
        assertEquals(1, history.size());
    }

    @Test
    void receiveLocation_invalidCoordinates_rejectsAndReturnsNull() {
        SimpMessageHeaderAccessor accessor = createHeaderAccessor("driver_42");

        // Latitude > 90
        LocationMessage invalidLat = new LocationMessage("driver_42", "trip_100", 95.0, 106.66);
        assertNull(controller.receiveLocation(invalidLat, accessor));

        // Longitude < -180
        LocationMessage invalidLng = new LocationMessage("driver_42", "trip_100", 10.0, -185.0);
        assertNull(controller.receiveLocation(invalidLng, accessor));

        // NaN coordinates
        LocationMessage nanCoord = new LocationMessage("driver_42", "trip_100", Double.NaN, 106.66);
        assertNull(controller.receiveLocation(nanCoord, accessor));

        verifyNoInteractions(messagingTemplate);
        assertTrue(GpsTrackingController.getLocationHistory("driver_42", "trip_100").isEmpty());
    }

    @Test
    void receiveLocation_unauthenticatedSession_returnsNull() {
        SimpMessageHeaderAccessor accessor = createHeaderAccessor(null);
        LocationMessage input = new LocationMessage("driver_anon", "trip_100", 10.76, 106.66);

        LocationMessage result = controller.receiveLocation(input, accessor);

        assertNull(result);
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void receiveLocation_invalidTripId_rejectsAndReturnsNull() {
        SimpMessageHeaderAccessor accessor = createHeaderAccessor("driver_42");

        // Path traversal / special characters
        LocationMessage traversalInput = new LocationMessage("driver_42", "../../../admin", 10.76, 106.66);
        assertNull(controller.receiveLocation(traversalInput, accessor));

        // Blank trip id
        LocationMessage blankInput = new LocationMessage("driver_42", "   ", 10.76, 106.66);
        assertNull(controller.receiveLocation(blankInput, accessor));

        // Null trip id
        LocationMessage nullInput = new LocationMessage("driver_42", null, 10.76, 106.66);
        assertNull(controller.receiveLocation(nullInput, accessor));

        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void appendLocationHistory_boundsHistoryToMaxEntries() {
        String key = "driver_bound_trip_1";
        for (int i = 0; i < 110; i++) {
            GpsTrackingController.appendLocationHistory(key,
                new LocationMessage("driver_bound", "trip_1", 10.0 + (i * 0.001), 106.0 + (i * 0.001)));
        }

        List<LocationMessage> history = GpsTrackingController.getLocationHistory("driver_bound", "trip_1");
        assertEquals(GpsTrackingController.MAX_HISTORY_PER_TRIP, history.size(), "History size must be capped at 100");

        // First remaining item should be entry 10 (0..9 evicted)
        assertEquals(10.0 + (10 * 0.001), history.get(0).getLatitude(), 0.0001);
        // Last item should be entry 109
        assertEquals(10.0 + (109 * 0.001), history.get(99).getLatitude(), 0.0001);
    }
}
