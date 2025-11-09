package com.logiflow.server.dtos.manager.fleet;

public class FleetStatusDto {
    private long totalVehicles;
    private long available;
    private long inUse;
    private long offline;

    public FleetStatusDto() {
    }

    public FleetStatusDto(long totalVehicles, long available, long inUse, long offline) {
        this.totalVehicles = totalVehicles;
        this.available = available;
        this.inUse = inUse;
        this.offline = offline;
    }

    public long getTotalVehicles() {
        return totalVehicles;
    }

    public void setTotalVehicles(long totalVehicles) {
        this.totalVehicles = totalVehicles;
    }

    public long getAvailable() {
        return available;
    }

    public void setAvailable(long available) {
        this.available = available;
    }

    public long getInUse() {
        return inUse;
    }

    public void setInUse(long inUse) {
        this.inUse = inUse;
    }

    public long getOffline() {
        return offline;
    }

    public void setOffline(long offline) {
        this.offline = offline;
    }
}
