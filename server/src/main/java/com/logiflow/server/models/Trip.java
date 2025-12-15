package com.logiflow.server.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@Entity
@Table(name = "trips")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trip_id")
    private Integer tripId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @Column(name = "trip_type", length = 20, nullable = false)
    private String tripType;

    @Column(name = "scheduled_departure", nullable = false)
    private LocalDateTime scheduledDeparture;

    @Column(name = "actual_departure")
    private LocalDateTime actualDeparture;

    @Column(name = "scheduled_arrival", nullable = false)
    private LocalDateTime scheduledArrival;

    @Column(name = "actual_arrival")
    private LocalDateTime actualArrival;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "scheduled";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TripAssignment> tripAssignments;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DriverWorkLog> driverWorkLogs;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<TripProgressEvent> progressEvents;

    // ================= Delay / SLA handling =================

    /**
     * Free-text reason provided by the driver describing the delay.
     * This should remain unchanged by admin decisions (for audit purposes).
     */
    @Column(name = "delay_reason", length = 500, nullable = true)
    private String delayReason;

    /**
     * Overall SLA extension minutes that have been granted by admin(s).
     */
    @Column(name = "sla_extension_minutes", nullable = true)
    private Integer slaExtensionMinutes = 0;

    /**
     * Status of the delay report from the driver's perspective:
     * - PENDING  : driver submitted, waiting for admin review
     * - APPROVED : admin approved and possibly extended SLA
     * - REJECTED : admin rejected (SLA unchanged)
     * - null     : no delay report has been submitted
     */
    @Column(name = "delay_status", length = 20, nullable = true)
    private String delayStatus;

    /**
     * Optional comment from admin when responding to a delay report
     * (e.g. explanation for approval/rejection, guidance to driver).
     */
    @Column(name = "delay_admin_comment", length = 500, nullable = true)
    private String delayAdminComment;
}
