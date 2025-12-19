import React, { useEffect, useMemo, useState } from "react";
import { getRouteSummary } from "../../../services/manager/managerService";
import "../manager.css";

const RouteAnalyticsPage = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rows, setRows] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const toInputDate = (date) => date.toISOString().slice(0, 10);

    const formatNumber = (v) => {
        if (v === null || v === undefined) return "0";
        const n = Number(v);
        if (Number.isNaN(n)) return "0";
        return n.toLocaleString();
    };

    const formatFixed = (v, digits = 1) => {
        if (v === null || v === undefined) return "-";
        const n = Number(v);
        if (Number.isNaN(n)) return "-";
        return n.toFixed(digits);
    };

    const toTons = (kg) => {
        if (kg === null || kg === undefined) return null;
        const n = Number(kg);
        if (Number.isNaN(n)) return null;
        return n / 1000;
    };

    useEffect(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const s = toInputDate(sevenDaysAgo);
        const e = toInputDate(today);

        setStartDate(s);
        setEndDate(e);

        void loadData(s, e);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async (s, e) => {
        setLoading(true);
        setError("");

        try {
            const data = await getRouteSummary(s, e);
            const arr = Array.isArray(data) ? data : [];
            setRows(arr);
            if (arr.length === 0) setError("No route analytics data.");
        } catch (err) {
            console.error(err);
            setRows([]);
            setError("Failed to load route analytics.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        void loadData(startDate, endDate);
    };

    const sortedRows = useMemo(() => {
        const clone = [...rows];
        // ưu tiên route có nhiều trip hơn
        clone.sort((a, b) => (Number(b.totalTrips) || 0) - (Number(a.totalTrips) || 0));
        return clone;
    }, [rows]);

    return (
        <div className="manager-page">
            <h2>Route Analytics</h2>

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

            {!error && sortedRows.length > 0 && (
                <table className="manager-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Route</th>
                        <th>Origin</th>
                        <th>Destination</th>

                        <th>Total Trips</th>
                        <th>Delayed</th>
                        <th>Cancelled</th>

                        <th>Avg Delay (min)</th>
                        <th>On-time Rate (%)</th>

                        <th>Total Distance (km)</th>
                        <th>Avg Distance (km)</th>
                        <th>Avg Duration (min)</th>

                        <th>Cargo (t)</th>
                        <th>Suggestion</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedRows.map((r, idx) => (
                        <tr key={r.routeId ?? idx}>
                            <td>{idx + 1}</td>
                            <td>{r.routeId ?? "-"}</td>
                            <td>{r.origin ?? "-"}</td>
                            <td>{r.destination ?? "-"}</td>

                            <td>{formatNumber(r.totalTrips)}</td>
                            <td>{formatNumber(r.delayedTrips ?? 0)}</td>
                            <td>{formatNumber(r.cancelledTrips ?? 0)}</td>

                            <td>{formatFixed(r.averageDelayMinutes, 1)}</td>
                            <td>{formatFixed(r.onTimeRatePercent, 1)}</td>

                            <td>{formatFixed(r.totalDistanceKm, 1)}</td>
                            <td>{formatFixed(r.averageDistanceKm, 1)}</td>
                            <td>{formatFixed(r.averageDurationMinutes, 1)}</td>

                            <td>
                                {toTons(r.totalCargoWeightKg) != null
                                    ? toTons(r.totalCargoWeightKg).toFixed(2)
                                    : "-"}
                            </td>

                            <td>{r.optimizationSuggestion ?? "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default RouteAnalyticsPage;
