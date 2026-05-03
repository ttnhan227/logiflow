package com.logiflow.server.constants;

/**
 * String constants for Trip status values stored in the database.
 * Centralising these prevents typos and makes status transitions easy to audit.
 */
public final class TripStatus {

    public static final String SCHEDULED  = "scheduled";
    public static final String ASSIGNED   = "assigned";
    public static final String IN_PROGRESS = "in_progress";
    public static final String DELAYED    = "delayed";
    public static final String ARRIVED    = "arrived";
    public static final String COMPLETED  = "completed";
    public static final String CANCELLED  = "cancelled";

    private TripStatus() {}
}
