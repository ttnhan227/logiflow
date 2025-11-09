package com.logiflow.server.dtos.manager.dashboard;

import java.util.List;

public class ManagerOverviewDto {
    private long totalTripsToday;
    private long activeTrips;
    private long inTransitOrders;
    private long pendingOrders;
    private int activeDrivers;
    private long activeVehicles;
    private List<String> importantNotices;

    public ManagerOverviewDto() {
    }

    public ManagerOverviewDto(long totalTripsToday,
                              long activeTrips,
                              long inTransitOrders,
                              long pendingOrders,
                              int activeDrivers,
                              long activeVehicles,
                              List<String> importantNotices) {
        this.totalTripsToday = totalTripsToday;
        this.activeTrips = activeTrips;
        this.inTransitOrders = inTransitOrders;
        this.pendingOrders = pendingOrders;
        this.activeDrivers = activeDrivers;
        this.activeVehicles = activeVehicles;
        this.importantNotices = importantNotices;
    }

    public long getTotalTripsToday() {
        return totalTripsToday;
    }

    public void setTotalTripsToday(long totalTripsToday) {
        this.totalTripsToday = totalTripsToday;
    }

    public long getActiveTrips() {
        return activeTrips;
    }

    public void setActiveTrips(long activeTrips) {
        this.activeTrips = activeTrips;
    }

    public long getInTransitOrders() {
        return inTransitOrders;
    }

    public void setInTransitOrders(long inTransitOrders) {
        this.inTransitOrders = inTransitOrders;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public int getActiveDrivers() {
        return activeDrivers;
    }

    public void setActiveDrivers(int activeDrivers) {
        this.activeDrivers = activeDrivers;
    }

    public long getActiveVehicles() {
        return activeVehicles;
    }

    public void setActiveVehicles(long activeVehicles) {
        this.activeVehicles = activeVehicles;
    }

    public List<String> getImportantNotices() {
        return importantNotices;
    }

    public void setImportantNotices(List<String> importantNotices) {
        this.importantNotices = importantNotices;
    }
}
