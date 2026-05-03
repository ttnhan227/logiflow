package com.logiflow.server.constants;

/**
 * String constants for audit log action values.
 * These must match the strings recognised by {@link com.logiflow.server.services.admin.AuditLogService}.
 */
public final class AuditActions {

    // Authentication
    public static final String LOGIN           = "LOGIN";
    public static final String LOGOUT          = "LOGOUT";
    public static final String PASSWORD_CHANGE = "PASSWORD_CHANGE";

    // User management
    public static final String CREATE_USER        = "CREATE_USER";
    public static final String UPDATE_USER        = "UPDATE_USER";
    public static final String TOGGLE_USER_STATUS = "TOGGLE_USER_STATUS";

    // System settings
    public static final String CREATE_SETTING = "CREATE_SETTING";
    public static final String UPDATE_SETTING = "UPDATE_SETTING";
    public static final String DELETE_SETTING = "DELETE_SETTING";

    // Vehicle management
    public static final String CREATE_VEHICLE = "CREATE_VEHICLE";
    public static final String UPDATE_VEHICLE = "UPDATE_VEHICLE";
    public static final String DELETE_VEHICLE = "DELETE_VEHICLE";

    // Route management
    public static final String CREATE_ROUTE = "CREATE_ROUTE";
    public static final String UPDATE_ROUTE = "UPDATE_ROUTE";
    public static final String DELETE_ROUTE = "DELETE_ROUTE";

    // Registration
    public static final String APPROVE_REGISTRATION      = "APPROVE_REGISTRATION";
    public static final String REJECT_REGISTRATION       = "REJECT_REGISTRATION";
    public static final String UPDATE_REGISTRATION_REQUEST = "UPDATE_REGISTRATION_REQUEST";

    // Trip management
    public static final String TRIP_ASSIGNED             = "TRIP_ASSIGNED";
    public static final String TRIP_CANCELLED            = "TRIP_CANCELLED";
    public static final String ADMIN_UPDATE_TRIP_STATUS  = "ADMIN_UPDATE_TRIP_STATUS";

    // Override / compliance
    public static final String FORCE_DISPATCH_REST_VIOLATION = "FORCE_DISPATCH_REST_VIOLATION";
    public static final String MANUAL_SLA_EXTENSION          = "MANUAL_SLA_EXTENSION";
    public static final String OVERRIDE_TRIP_ASSIGNMENT      = "OVERRIDE_TRIP_ASSIGNMENT";
    public static final String BYPASS_COMPLIANCE_CHECK       = "BYPASS_COMPLIANCE_CHECK";

    private AuditActions() {}
}
