package com.logiflow.server.exceptions;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/test/resource");
    }

    @Test
    @DisplayName("IllegalArgumentException maps to HTTP 400 with INVALID_ARGUMENT error code")
    void testIllegalArgumentException() {
        IllegalArgumentException ex = new IllegalArgumentException("Coordinate out of range");

        ResponseEntity<ApiErrorResponse> response = exceptionHandler.handleIllegalArgument(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertEquals("INVALID_ARGUMENT", response.getBody().error());
        assertEquals("Coordinate out of range", response.getBody().message());
        assertEquals("/api/test/resource", response.getBody().path());
    }

    @Test
    @DisplayName("IllegalStateException maps to HTTP 409 Conflict with INVALID_STATE error code")
    void testIllegalStateException() {
        IllegalStateException ex = new IllegalStateException("Cannot jump from scheduled to completed");

        ResponseEntity<ApiErrorResponse> response = exceptionHandler.handleIllegalState(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().status());
        assertEquals("INVALID_STATE", response.getBody().error());
        assertEquals("Cannot jump from scheduled to completed", response.getBody().message());
        assertEquals("/api/test/resource", response.getBody().path());
    }

    @Test
    @DisplayName("ResourceNotFoundException maps to HTTP 404 with RESOURCE_NOT_FOUND error code")
    void testResourceNotFoundException() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Trip with id 999 not found");

        ResponseEntity<ApiErrorResponse> response = exceptionHandler.handleNotFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().status());
        assertEquals("RESOURCE_NOT_FOUND", response.getBody().error());
        assertEquals("Trip with id 999 not found", response.getBody().message());
    }

    @Test
    @DisplayName("ObjectOptimisticLockingFailureException maps to HTTP 409 Conflict with OPTIMISTIC_LOCK_CONFLICT")
    void testOptimisticLockException() {
        org.springframework.orm.ObjectOptimisticLockingFailureException ex =
                new org.springframework.orm.ObjectOptimisticLockingFailureException("Trip", 42);

        ResponseEntity<ApiErrorResponse> response = exceptionHandler.handleOptimisticLock(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().status());
        assertEquals("OPTIMISTIC_LOCK_CONFLICT", response.getBody().error());
        assertTrue(response.getBody().message().contains("concurrent"));
    }

    @Test
    @DisplayName("BusinessRuleException maps to HTTP 400 with BUSINESS_RULE_VIOLATION error code")
    void testBusinessRuleException() {
        BusinessRuleException ex = new BusinessRuleException("Cannot reroute completed trip");

        ResponseEntity<ApiErrorResponse> response = exceptionHandler.handleBusinessRule(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertEquals("BUSINESS_RULE_VIOLATION", response.getBody().error());
        assertEquals("Cannot reroute completed trip", response.getBody().message());
    }
}
