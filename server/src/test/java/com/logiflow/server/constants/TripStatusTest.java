package com.logiflow.server.constants;

import com.logiflow.server.exceptions.BusinessRuleException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class TripStatusTest {

    @Test
    @DisplayName("Normalizes various string representations of statuses")
    void testNormalize() {
        assertEquals(TripStatus.SCHEDULED, TripStatus.normalize("scheduled"));
        assertEquals(TripStatus.SCHEDULED, TripStatus.normalize("pending"));
        assertEquals(TripStatus.IN_PROGRESS, TripStatus.normalize("in_progress"));
        assertEquals(TripStatus.IN_PROGRESS, TripStatus.normalize("in-progress"));
        assertEquals(TripStatus.IN_PROGRESS, TripStatus.normalize("active"));
        assertEquals(TripStatus.COMPLETED, TripStatus.normalize("completed"));
        assertEquals(TripStatus.COMPLETED, TripStatus.normalize("finished"));
        assertEquals(TripStatus.CANCELLED, TripStatus.normalize("cancelled"));
        assertEquals(TripStatus.CANCELLED, TripStatus.normalize("canceled"));
        assertEquals(TripStatus.ASSIGNED, TripStatus.normalize("assigned"));
        assertEquals(TripStatus.DELAYED, TripStatus.normalize("delayed"));
        assertNull(TripStatus.normalize(null));
        assertNull(TripStatus.normalize("   "));
    }

    @Test
    @DisplayName("Identifies terminal statuses correctly")
    void testTerminalStatuses() {
        assertTrue(TripStatus.isTerminal(TripStatus.COMPLETED));
        assertTrue(TripStatus.isTerminal(TripStatus.CANCELLED));
        assertFalse(TripStatus.isTerminal(TripStatus.SCHEDULED));
        assertFalse(TripStatus.isTerminal(TripStatus.ASSIGNED));
        assertFalse(TripStatus.isTerminal(TripStatus.IN_PROGRESS));
        assertFalse(TripStatus.isTerminal(TripStatus.DELAYED));
        assertFalse(TripStatus.isTerminal(TripStatus.ARRIVED));
    }

    @Test
    @DisplayName("Allows valid transitions along the delivery lifecycle")
    void testValidTransitions() {
        // SCHEDULED -> ASSIGNED, CANCELLED
        assertTrue(TripStatus.isValidTransition(TripStatus.SCHEDULED, TripStatus.ASSIGNED));
        assertTrue(TripStatus.isValidTransition(TripStatus.SCHEDULED, TripStatus.CANCELLED));

        // ASSIGNED -> IN_PROGRESS, CANCELLED
        assertTrue(TripStatus.isValidTransition(TripStatus.ASSIGNED, TripStatus.IN_PROGRESS));
        assertTrue(TripStatus.isValidTransition(TripStatus.ASSIGNED, TripStatus.CANCELLED));

        // IN_PROGRESS -> DELAYED, ARRIVED, COMPLETED, CANCELLED
        assertTrue(TripStatus.isValidTransition(TripStatus.IN_PROGRESS, TripStatus.DELAYED));
        assertTrue(TripStatus.isValidTransition(TripStatus.IN_PROGRESS, TripStatus.ARRIVED));
        assertTrue(TripStatus.isValidTransition(TripStatus.IN_PROGRESS, TripStatus.COMPLETED));
        assertTrue(TripStatus.isValidTransition(TripStatus.IN_PROGRESS, TripStatus.CANCELLED));

        // DELAYED -> IN_PROGRESS, ARRIVED, COMPLETED, CANCELLED
        assertTrue(TripStatus.isValidTransition(TripStatus.DELAYED, TripStatus.IN_PROGRESS));
        assertTrue(TripStatus.isValidTransition(TripStatus.DELAYED, TripStatus.ARRIVED));
        assertTrue(TripStatus.isValidTransition(TripStatus.DELAYED, TripStatus.COMPLETED));
        assertTrue(TripStatus.isValidTransition(TripStatus.DELAYED, TripStatus.CANCELLED));

        // ARRIVED -> COMPLETED
        assertTrue(TripStatus.isValidTransition(TripStatus.ARRIVED, TripStatus.COMPLETED));
    }

    @Test
    @DisplayName("Rejects invalid transitions and skipping lifecycle steps")
    void testInvalidTransitions() {
        // Cannot jump directly from SCHEDULED to COMPLETED
        assertFalse(TripStatus.isValidTransition(TripStatus.SCHEDULED, TripStatus.COMPLETED));
        assertThrows(BusinessRuleException.class, () ->
            TripStatus.validateTransition(TripStatus.SCHEDULED, TripStatus.COMPLETED));

        // Cannot transition from COMPLETED to anything
        assertFalse(TripStatus.isValidTransition(TripStatus.COMPLETED, TripStatus.SCHEDULED));
        assertFalse(TripStatus.isValidTransition(TripStatus.COMPLETED, TripStatus.IN_PROGRESS));
        assertThrows(BusinessRuleException.class, () ->
            TripStatus.validateTransition(TripStatus.COMPLETED, TripStatus.SCHEDULED));

        // Cannot transition from CANCELLED to anything
        assertFalse(TripStatus.isValidTransition(TripStatus.CANCELLED, TripStatus.IN_PROGRESS));
        assertFalse(TripStatus.isValidTransition(TripStatus.CANCELLED, TripStatus.COMPLETED));
        assertThrows(BusinessRuleException.class, () ->
            TripStatus.validateTransition(TripStatus.CANCELLED, TripStatus.IN_PROGRESS));
    }

    @ParameterizedTest
    @ValueSource(strings = {"invalid_status", "foo", "unknown_123"})
    @DisplayName("Rejects completely unknown status strings with BusinessRuleException")
    void testUnknownStatusRejection(String unknownStatus) {
        assertThrows(BusinessRuleException.class, () ->
            TripStatus.validateTransition(TripStatus.SCHEDULED, unknownStatus));
    }
}
