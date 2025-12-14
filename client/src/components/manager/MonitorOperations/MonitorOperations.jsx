import React, { useEffect, useMemo, useState } from "react";
import {
    getOperationsPerformance,
    getFleetStatus,
    getDeliveryReport,
} from "../../../services/manager/managerService.js";
import "../manager.css";

const MonitorOperations = () => {
    const [deliveries, setDeliveries] = useState([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [summary, setSummary] = useState(null);
    const [fleet, setFleet] = useState(null);

    const toInputDate = (date) => date.toISOString().slice(0, 10);

    const formatNumber = (v) => {
        if (v === null || v === undefined) return "0";
        const n = Number(v);
        if (Number.isNaN(n)) return "0";
        return n.toLocaleString();
    };

    const formatPercent = (v) => {
        if (v === null || v === undefined) return "0%";
        const n = Number(v);
        if (Number.isNaN(n)) return "0%";
        return `${Math.round(n * 10) / 10}%`;
    };

    useEffect(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const defaultStart = toInputDate(sevenDaysAgo);
        const defaultEnd = toInputDate(today);

        setStartDate(defaultStart);
        setEndDate(defaultEnd);

        void loadData(defaultStart, defaultEnd);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async (from, to) => {
        setLoading(true);
        setError("");

        const s = from ?? startDate;
        const e = to ?? endDate;

        let operationsData = null;
        let fleetData = null;
        let deliveryData = [];

        try {
            operationsData = await getOperationsPerformance(s, e);
        } catch {
            setError("Failed to load manager data.");
        }

        try {
            fleetData = await getFleetStatus();
        } catch {
            setError("Failed to load manager data.");
        }

        try {
            deliveryData = await getDeliveryReport(s, e);
        } catch {
            setError("Failed to load manager data.");
        }

        setSummary(operationsData || null);
        setFleet(fleetData || null);
        setDeliveries(Array.isArray(deliveryData) ? deliveryData : []);

        if (!operationsData && !fleetData) {
            setError("Failed to load manager data.");
        } else {
            setError("");
        }
        setLoading(false);
    };

    const handleSearch = () => {
        void loadData(startDate, endDate);
    };

    const deliveriesSummary = useMemo(() => {
        if (!deliveries || deliveries.length === 0) {
            return {
                totalTrips: 0,
                completedTrips: 0,
                cancelledTrips: 0,
                delayedTrips: 0,
                onTimeRatePercent: 0,
                totalDistanceKm: 0,
            };
        }

        const totalTrips = deliveries.reduce((a, x) => a + (Number(x.totalTrips) || 0), 0);
        const completedTrips = deliveries.reduce((a, x) => a + (Number(x.completedTrips) || 0), 0);
        const cancelledTrips = deliveries.reduce((a, x) => a + (Number(x.cancelledTrips) || 0), 0);
        const delayedTrips = deliveries.reduce((a, x) => a + (Number(x.delayedTrips) || 0), 0);
        const totalDistanceKm = deliveries.reduce((a, x) => a + (Number(x.totalDistanceKm) || 0), 0);

        const onTimeRatePercent = totalTrips === 0 ? 0 : (completedTrips * 100.0) / totalTrips;

        return {
            totalTrips,
            completedTrips,
            cancelledTrips,
            delayedTrips,
            onTimeRatePercent,
            totalDistanceKm,
        };
    }, [deliveries]);

    return (
        <div className="monitor-operations-page">
            <h1>🚚 Monitor Operations</h1>

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

            {error && <div className="error">{error}</div>}

            {!error &&
                !loading &&
                !summary &&
                !fleet && (
                    <div>No operational data available.</div>
                )}

            {/* SUMMARY CARDS */}
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
                            {summary?.averageDelayMinutes != null
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
                            {summary?.averageDistancePerTripKm != null
                                ? summary.averageDistancePerTripKm.toFixed(1)
                                : "-"}{" "}
                            km
                        </div>
                    </div>
                </div>
            )}

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
                        <div className="card-value">{fleet.inMaintenanceVehicles}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Unavailable</div>
                        <div className="card-value">{fleet.unavailableVehicles}</div>
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

            {/* DELIVERIES REPORT */}
            <h2>📦 Deliveries Report</h2>

            <div className="summary-cards">
                <div className="card">
                    <h3>Total Trips</h3>
                    <p>{formatNumber(deliveriesSummary.totalTrips)}</p>
                </div>
                <div className="card">
                    <h3>Completed</h3>
                    <p>{formatNumber(deliveriesSummary.completedTrips)}</p>
                </div>
                <div className="card">
                    <h3>Cancelled</h3>
                    <p>{formatNumber(deliveriesSummary.cancelledTrips)}</p>
                </div>
                <div className="card">
                    <h3>Delayed</h3>
                    <p>{formatNumber(deliveriesSummary.delayedTrips)}</p>
                </div>
                <div className="card">
                    <h3>On-time Rate</h3>
                    <p>{formatPercent(deliveriesSummary.onTimeRatePercent)}</p>
                </div>
                <div className="card">
                    <h3>Total Distance</h3>
                    <p>{formatNumber(deliveriesSummary.totalDistanceKm)} km</p>
                </div>
            </div>

            {deliveries.length === 0 ? (
                <p>No delivery report data.</p>
            ) : (
                <table className="deliveries-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Completed</th>
                        <th>Cancelled</th>
                        <th>Delayed</th>
                        <th>On-time</th>
                        <th>Total Distance (km)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {deliveries.map((x, idx) => (
                        <tr key={idx}>
                            <td>{x.date}</td>
                            <td>{formatNumber(x.totalTrips)}</td>
                            <td>{formatNumber(x.completedTrips)}</td>
                            <td>{formatNumber(x.cancelledTrips)}</td>
                            <td>{formatNumber(x.delayedTrips)}</td>
                            <td>{formatPercent(x.onTimeRatePercent)}</td>
                            <td>{formatNumber(x.totalDistanceKm)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MonitorOperations;
