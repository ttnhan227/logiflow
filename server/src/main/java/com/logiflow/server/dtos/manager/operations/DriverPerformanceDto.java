package com.logiflow.server.dtos.manager.operations;

public class DriverPerformanceDto {
    private Integer driverId;
    private String driverName;
    private long tripsAssigned;
    private long tripsCompleted;
    private double completionRate; // %

    public DriverPerformanceDto() {
    }

    public DriverPerformanceDto(Integer driverId, String driverName, long tripsAssigned,
                                long tripsCompleted, double completionRate) {
        this.driverId = driverId;
        this.driverName = driverName;
        this.tripsAssigned = tripsAssigned;
        this.tripsCompleted = tripsCompleted;
        this.completionRate = completionRate;
    }

    public Integer getDriverId() {
        return driverId;
    }

    public void setDriverId(Integer driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public long getTripsAssigned() {
        return tripsAssigned;
    }

    public void setTripsAssigned(long tripsAssigned) {
        this.tripsAssigned = tripsAssigned;
    }

    public long getTripsCompleted() {
        return tripsCompleted;
    }

    public void setTripsCompleted(long tripsCompleted) {
        this.tripsCompleted = tripsCompleted;
    }

    public double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(double completionRate) {
        this.completionRate = completionRate;
    }
}
