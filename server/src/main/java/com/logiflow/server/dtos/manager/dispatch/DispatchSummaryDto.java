package com.logiflow.server.dtos.manager.dispatch;

public class DispatchSummaryDto {
    private long totalTrips;
    private long assigned;
    private long inProgress;
    private long completed;
    private long pendingOrders;

    public DispatchSummaryDto() {
    }

    public DispatchSummaryDto(long totalTrips, long assigned, long inProgress,
                              long completed, long pendingOrders) {
        this.totalTrips = totalTrips;
        this.assigned = assigned;
        this.inProgress = inProgress;
        this.completed = completed;
        this.pendingOrders = pendingOrders;
    }

    public long getTotalTrips() {
        return totalTrips;
    }

    public void setTotalTrips(long totalTrips) {
        this.totalTrips = totalTrips;
    }

    public long getAssigned() {
        return assigned;
    }

    public void setAssigned(long assigned) {
        this.assigned = assigned;
    }

    public long getInProgress() {
        return inProgress;
    }

    public void setInProgress(long inProgress) {
        this.inProgress = inProgress;
    }

    public long getCompleted() {
        return completed;
    }

    public void setCompleted(long completed) {
        this.completed = completed;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }
}
