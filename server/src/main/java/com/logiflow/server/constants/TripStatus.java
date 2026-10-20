package com.logiflow.server.constants;

import com.logiflow.server.exceptions.BusinessRuleException;
import java.util.Map;
import java.util.Set;

/**
 * String constants and state-machine transitions for Trip status values stored in the database.
 * Centralising these prevents typos and enforces valid delivery workflows.
 */
public final class TripStatus {

    public static final String SCHEDULED   = "scheduled";
    public static final String ASSIGNED    = "assigned";
    public static final String IN_PROGRESS = "in_progress";
    public static final String DELAYED     = "delayed";
    public static final String ARRIVED     = "arrived";
    public static final String COMPLETED   = "completed";
    public static final String CANCELLED   = "cancelled";

    public static final Set<String> ALL_STATUSES = Set.of(
            SCHEDULED, ASSIGNED, IN_PROGRESS, DELAYED, ARRIVED, COMPLETED, CANCELLED
    );

    // Terminal states cannot transition to any other status
    public static final Set<String> TERMINAL_STATUSES = Set.of(
            COMPLETED, CANCELLED
    );

    private static final Map<String, Set<String>> VALID_TRANSITIONS = Map.of(
            SCHEDULED, Set.of(ASSIGNED, CANCELLED),
            ASSIGNED, Set.of(IN_PROGRESS, SCHEDULED, CANCELLED),
            IN_PROGRESS, Set.of(DELAYED, ARRIVED, COMPLETED, CANCELLED),
            DELAYED, Set.of(IN_PROGRESS, ARRIVED, COMPLETED, CANCELLED),
            ARRIVED, Set.of(COMPLETED, CANCELLED),
            COMPLETED, Set.of(),
            CANCELLED, Set.of()
    );

    private TripStatus() {}

    public static String normalize(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }
        String s = status.trim().toLowerCase();
        return switch (s) {
            case "pending", "scheduled" -> SCHEDULED;
            case "active", "in-progress", "in_progress", "inprogress" -> IN_PROGRESS;
            case "completed", "complete", "finished" -> COMPLETED;
            case "cancelled", "canceled" -> CANCELLED;
            case "assigned" -> ASSIGNED;
            case "delayed" -> DELAYED;
            case "arrived" -> ARRIVED;
            default -> s;
        };
    }

    public static boolean isValidStatus(String status) {
        if (status == null) return false;
        return ALL_STATUSES.contains(normalize(status));
    }

    public static boolean isTerminal(String status) {
        if (status == null) return false;
        return TERMINAL_STATUSES.contains(normalize(status));
    }

    public static boolean isValidTransition(String fromStatus, String toStatus) {
        String from = normalize(fromStatus);
        String to = normalize(toStatus);
        if (from == null || to == null) return false;
        if (!isValidStatus(from) || !isValidStatus(to)) return false;
        if (from.equals(to)) return true; // idempotent

        Set<String> allowed = VALID_TRANSITIONS.get(from);
        return allowed != null && allowed.contains(to);
    }

    public static void validateTransition(String fromStatus, String toStatus) {
        String from = normalize(fromStatus);
        String to = normalize(toStatus);

        if (to == null || !isValidStatus(to)) {
            throw new BusinessRuleException("Invalid target trip status: " + toStatus +
                    ". Valid statuses: " + String.join(", ", ALL_STATUSES));
        }

        if (from == null) {
            return; // initial creation
        }

        if (from.equals(to)) {
            return; // idempotent
        }

        if (COMPLETED.equals(from)) {
            throw new BusinessRuleException("Cannot change status of a completed trip");
        }

        if (CANCELLED.equals(from)) {
            throw new BusinessRuleException("Cannot change status of a cancelled trip");
        }

        if (!isValidTransition(from, to)) {
            throw new BusinessRuleException(String.format(
                    "Invalid trip status transition from '%s' to '%s'", from, to));
        }
    }
}
