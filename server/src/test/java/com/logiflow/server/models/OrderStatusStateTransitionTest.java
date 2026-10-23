package com.logiflow.server.models;

import com.logiflow.server.exceptions.BusinessRuleException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

class OrderStatusStateTransitionTest {

    @Test
    @DisplayName("Identifies terminal order statuses correctly")
    void testTerminalStatuses() {
        assertTrue(Order.OrderStatus.DELIVERED.isTerminal());
        assertTrue(Order.OrderStatus.CANCELLED.isTerminal());
        assertFalse(Order.OrderStatus.PENDING.isTerminal());
        assertFalse(Order.OrderStatus.ASSIGNED.isTerminal());
        assertFalse(Order.OrderStatus.IN_TRANSIT.isTerminal());
    }

    @Test
    @DisplayName("Allows valid order lifecycle transitions")
    void testValidTransitions() {
        // PENDING -> ASSIGNED, CANCELLED
        assertTrue(Order.OrderStatus.PENDING.canTransitionTo(Order.OrderStatus.ASSIGNED));
        assertTrue(Order.OrderStatus.PENDING.canTransitionTo(Order.OrderStatus.CANCELLED));

        // ASSIGNED -> IN_TRANSIT, PENDING (unassigned), CANCELLED
        assertTrue(Order.OrderStatus.ASSIGNED.canTransitionTo(Order.OrderStatus.IN_TRANSIT));
        assertTrue(Order.OrderStatus.ASSIGNED.canTransitionTo(Order.OrderStatus.PENDING));
        assertTrue(Order.OrderStatus.ASSIGNED.canTransitionTo(Order.OrderStatus.CANCELLED));

        // IN_TRANSIT -> DELIVERED, PENDING (trip aborted/rerouted), CANCELLED
        assertTrue(Order.OrderStatus.IN_TRANSIT.canTransitionTo(Order.OrderStatus.DELIVERED));
        assertTrue(Order.OrderStatus.IN_TRANSIT.canTransitionTo(Order.OrderStatus.PENDING));
        assertTrue(Order.OrderStatus.IN_TRANSIT.canTransitionTo(Order.OrderStatus.CANCELLED));

        // Idempotent transitions
        assertTrue(Order.OrderStatus.PENDING.canTransitionTo(Order.OrderStatus.PENDING));
        assertTrue(Order.OrderStatus.ASSIGNED.canTransitionTo(Order.OrderStatus.ASSIGNED));
        assertTrue(Order.OrderStatus.IN_TRANSIT.canTransitionTo(Order.OrderStatus.IN_TRANSIT));
        assertTrue(Order.OrderStatus.DELIVERED.canTransitionTo(Order.OrderStatus.DELIVERED));
        assertTrue(Order.OrderStatus.CANCELLED.canTransitionTo(Order.OrderStatus.CANCELLED));
    }

    @Test
    @DisplayName("Rejects skipping lifecycle stages (e.g. PENDING straight to DELIVERED)")
    void testRejectLifecycleSkipping() {
        assertFalse(Order.OrderStatus.PENDING.canTransitionTo(Order.OrderStatus.DELIVERED));
        assertFalse(Order.OrderStatus.PENDING.canTransitionTo(Order.OrderStatus.IN_TRANSIT));

        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.PENDING, Order.OrderStatus.DELIVERED));
        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.PENDING, Order.OrderStatus.IN_TRANSIT));
    }

    @Test
    @DisplayName("Rejects mutating terminal DELIVERED status back to any other state")
    void testTerminalDeliveredCannotMutate() {
        assertFalse(Order.OrderStatus.DELIVERED.canTransitionTo(Order.OrderStatus.PENDING));
        assertFalse(Order.OrderStatus.DELIVERED.canTransitionTo(Order.OrderStatus.ASSIGNED));
        assertFalse(Order.OrderStatus.DELIVERED.canTransitionTo(Order.OrderStatus.IN_TRANSIT));
        assertFalse(Order.OrderStatus.DELIVERED.canTransitionTo(Order.OrderStatus.CANCELLED));

        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.DELIVERED, Order.OrderStatus.PENDING));
        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.DELIVERED, Order.OrderStatus.IN_TRANSIT));
        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED));
    }

    @Test
    @DisplayName("Rejects mutating terminal CANCELLED status back to any other state")
    void testTerminalCancelledCannotMutate() {
        assertFalse(Order.OrderStatus.CANCELLED.canTransitionTo(Order.OrderStatus.PENDING));
        assertFalse(Order.OrderStatus.CANCELLED.canTransitionTo(Order.OrderStatus.ASSIGNED));
        assertFalse(Order.OrderStatus.CANCELLED.canTransitionTo(Order.OrderStatus.IN_TRANSIT));
        assertFalse(Order.OrderStatus.CANCELLED.canTransitionTo(Order.OrderStatus.DELIVERED));

        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.CANCELLED, Order.OrderStatus.PENDING));
        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.CANCELLED, Order.OrderStatus.IN_TRANSIT));
        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.CANCELLED, Order.OrderStatus.DELIVERED));
    }

    @Test
    @DisplayName("Order.transitionTo successfully updates status on legal transition")
    void testOrderTransitionToSuccess() {
        Order order = new Order();
        order.setOrderStatus(Order.OrderStatus.PENDING);

        order.transitionTo(Order.OrderStatus.ASSIGNED);
        assertEquals(Order.OrderStatus.ASSIGNED, order.getOrderStatus());

        order.transitionTo(Order.OrderStatus.IN_TRANSIT);
        assertEquals(Order.OrderStatus.IN_TRANSIT, order.getOrderStatus());

        order.transitionTo(Order.OrderStatus.DELIVERED);
        assertEquals(Order.OrderStatus.DELIVERED, order.getOrderStatus());
    }

    @Test
    @DisplayName("Order.transitionTo rejects illegal transition and preserves current status")
    void testOrderTransitionToRejection() {
        Order order = new Order();
        order.setOrderStatus(Order.OrderStatus.DELIVERED);

        assertThrows(BusinessRuleException.class, () -> order.transitionTo(Order.OrderStatus.PENDING));
        assertEquals(Order.OrderStatus.DELIVERED, order.getOrderStatus());
    }

    @Test
    @DisplayName("Rejects null target status with BusinessRuleException")
    void testRejectNullTargetStatus() {
        assertThrows(BusinessRuleException.class, () ->
                Order.OrderStatus.validateTransition(Order.OrderStatus.PENDING, null));
    }
}
