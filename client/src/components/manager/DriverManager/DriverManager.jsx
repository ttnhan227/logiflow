import React, { useEffect, useState } from "react";
import {
    getDriverPerformance,
    getOperationsPerformance,
    getFleetStatus,
} from "../../../services/manager/managerService.js";
import "../../../assets/manager/driverManager.css";

const DriverManager = () => {
    const [drivers, setDrivers] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // summary từ API 2
    const [summary, setSummary] = useState(null);

    // fleet từ API 3
    const [fleet, setFleet] = useState(null);

    // helper: format Date -> "YYYY-MM-DD"
    const toInputDate = (date) => date.toISOString().slice(0, 10);

    // init default date range: last 7 days
    useEffect(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const defaultStart = toInputDate(sevenDaysAgo);
        const defaultEnd = toInputDate(today);

        setStartDate(defaultStart);
        setEndDate(defaultEnd);

        loadData(defaultStart, defaultEnd);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async (from, to) => {
        setLoading(true);
        setError("");

        const s = from ?? startDate;
        const e = to ?? endDate;

        console.log("Loading manager data with:", s, e);

        // tách riêng từng API để thằng nào lỗi thì lỗi, không kéo chết cả trang
        let driverData = [];
        let operationsData = null;
        let fleetData = null;

        // API 1 – driver performance
        try {
            driverData = await getDriverPerformance(s, e);
            console.log("Driver performance:", driverData);
        } catch (err) {
            console.error("Error getDriverPerformance:", err);
        }

        // API 2 – tổng quan operations
        try {
            operationsData = await getOperationsPerformance(s, e);
            console.log("Operations performance:", operationsData);
        } catch (err) {
            console.error("Error getOperationsPerformance:", err);
        }

        // API 3 – fleet status
        try {
            fleetData = await getFleetStatus();
            console.log("Fleet status:", fleetData);
        } catch (err) {
            console.error("Error getFleetStatus:", err);
        }

        // cập nhật state
        if (Array.isArray(driverData)) {
            setDrivers(driverData);
        } else {
            setDrivers([]);
        }

        setSummary(operationsData || null);
        setFleet(fleetData || null);

        // nếu cả 3 đều fail thì mới set error
        if (
            (!driverData || !Array.isArray(driverData) || driverData.length === 0) &&
            !operationsData &&
            !fleetData
        ) {
            setError("Failed to load driver performance.");
        } else {
            setError("");
        }

        setLoading(false);
    };

    const handleSearch = () => {
        loadData(startDate, endDate);
    };

    return (
        <div className="driver-manager-page">
            <h1>🚚 Driver Performance</h1>

            <div className="filters">
                <label>
                    From:
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </label>

                <label>
                    To:
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </label>

                <button onClick={handleSearch} disabled={loading}>
                    {loading ? "Loading..." : "View"}
                </button>
            </div>

            {error && <div className="error-text">{error}</div>}

            {!error && !loading && drivers.length === 0 && (
                <div>No data.</div>
            )}

            {/* API 2 – Overall operations performance */}
            {summary && (
                <div className="summary-cards">
                    <div className="card">
                        <div className="card-label">Total Trips</div>
                        <div className="card-value">{summary.totalTrips}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Completed</div>
                        <div className="card-value">{summary.completedTrips}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Cancelled</div>
                        <div className="card-value">{summary.cancelledTrips}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Delayed</div>
                        <div className="card-value">{summary.delayedTrips}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">On-time Rate</div>
                        <div className="card-value">
                            {summary.onTimeRatePercent != null
                                ? summary.onTimeRatePercent.toFixed(1)
                                : "-"}
                            %
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-label">Avg Delay</div>
                        <div className="card-value">
                            {summary.averageDelayMinutes != null
                                ? summary.averageDelayMinutes.toFixed(1)
                                : "-"}{" "}
                            min
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-label">Total Distance</div>
                        <div className="card-value">
                            {summary.totalDistanceKm != null
                                ? summary.totalDistanceKm.toFixed(1)
                                : "-"}{" "}
                            km
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-label">Avg Distance / Trip</div>
                        <div className="card-value">
                            {summary.averageDistancePerTripKm != null
                                ? summary.averageDistancePerTripKm.toFixed(1)
                                : "-"}{" "}
                            km
                        </div>
                    </div>
                </div>
            )}

            {/* API 3 – Fleet status */}
            {fleet && (
                <div className="summary-cards">
                    <div className="card">
                        <div className="card-label">Total Vehicles</div>
                        <div className="card-value">{fleet.totalVehicles}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Active</div>
                        <div className="card-value">{fleet.activeVehicles}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Idle</div>
                        <div className="card-value">{fleet.idleVehicles}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">In Maintenance</div>
                        <div className="card-value">
                            {fleet.inMaintenanceVehicles}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-label">Unavailable</div>
                        <div className="card-value">
                            {fleet.unavailableVehicles}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-label">Utilization</div>
                        <div className="card-value">
                            {fleet.averageUtilizationPercent != null
                                ? fleet.averageUtilizationPercent.toFixed(1)
                                : "-"}
                            %
                        </div>
                    </div>
                </div>
            )}

            {/* API 1 – Driver performance table */}
            {!error && drivers.length > 0 && (
                <table className="driver-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Driver ID</th>
                        <th>Driver Name</th>
                        <th>Total Trips</th>
                        <th>Completed</th>
                        <th>Cancelled</th>
                        <th>Delayed</th>
                        <th>On-time Rate (%)</th>
                        <th>Avg Delay (min)</th>
                        <th>Total Distance (km)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {drivers.map((d, idx) => (
                        <tr key={d.driverId ?? idx}>
                            <td>{idx + 1}</td>
                            <td>{d.driverId}</td>
                            <td>{d.driverName}</td>
                            <td>{d.totalTrips}</td>
                            <td>{d.completedTrips}</td>
                            <td>{d.cancelledTrips}</td>
                            <td>{d.delayedTrips}</td>
                            <td>
                                {d.onTimeRatePercent != null
                                    ? d.onTimeRatePercent.toFixed(1)
                                    : "-"}
                            </td>
                            <td>
                                {d.averageDelayMinutes != null
                                    ? d.averageDelayMinutes.toFixed(1)
                                    : "-"}
                            </td>
                            <td>
                                {d.totalDistanceKm != null
                                    ? d.totalDistanceKm.toFixed(1)
                                    : "-"}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default DriverManager;
