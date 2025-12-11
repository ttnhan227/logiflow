import React, { useEffect, useState } from "react";
import { getRouteSummary } from "../../../services/manager/managerService";

const RouteAnalyticsPage = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);

    const toInputDate = (d) => d.toISOString().slice(0, 10);

    useEffect(() => {
        const today = new Date();
        const past = new Date();
        past.setDate(today.getDate() - 6);

        const s = toInputDate(past);
        const e = toInputDate(today);

        setStartDate(s);
        setEndDate(e);
        load(s, e);
    }, []);

    const load = async (s, e) => {
        setLoading(true);
        try {
            const data = await getRouteSummary(s, e);
            setRoutes(data || []);
        } catch (err) {
            console.error("Error loading route summary:", err);
            setRoutes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = () => {
        load(startDate, endDate);
    };

    return (
        <div className="driver-manager-page">
            <h1>📊 Route Analytics</h1>

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
                <button onClick={handleView} disabled={loading}>
                    {loading ? "Loading..." : "View"}
                </button>
            </div>

            {!loading && routes.length === 0 && <p>No data.</p>}

            {routes.length > 0 && (
                <table className="driver-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Route</th>
                        <th>Origin</th>
                        <th>Destination</th>
                        <th>Total Trips</th>
                        <th>Total Distance (km)</th>
                        <th>Avg Distance (km)</th>
                        <th>Avg Duration (min)</th>
                        <th>On-time Rate (%)</th>
                        <th>Suggestion</th>
                    </tr>
                    </thead>
                    <tbody>
                    {routes.map((r, idx) => (
                        <tr key={r.routeId ?? idx}>
                            <td>{idx + 1}</td>
                            <td>{r.routeId}</td>
                            <td>{r.origin}</td>
                            <td>{r.destination}</td>
                            <td>{r.totalTrips}</td>
                            <td>
                                {r.totalDistanceKm != null
                                    ? r.totalDistanceKm.toFixed(1)
                                    : "-"}
                            </td>
                            <td>
                                {r.averageDistanceKm != null
                                    ? r.averageDistanceKm.toFixed(1)
                                    : "-"}
                            </td>
                            <td>
                                {r.averageDurationMinutes != null
                                    ? r.averageDurationMinutes.toFixed(1)
                                    : "-"}
                            </td>
                            <td>
                                {r.onTimeRatePercent != null
                                    ? r.onTimeRatePercent.toFixed(1)
                                    : "-"}
                            </td>
                            <td>{r.optimizationSuggestion}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default RouteAnalyticsPage;
