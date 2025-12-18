import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getDashboardOverview,
    getRecommendations,
} from "../../../services/manager/managerService.js";
import "../manager.css";

const ManagerDashboard = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [overview, setOverview] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const toInputDate = (date) => date.toISOString().slice(0, 10);

    const sevScore = (s) => {
        if (!s) return 0;
        const x = String(s).trim().toUpperCase();
        if (x === "CRITICAL" || x === "HIGH") return 3;
        if (x === "MEDIUM") return 2;
        if (x === "LOW") return 1;
        return 0;
    };

    const sevClass = (s) => {
        if (!s) return "sev sev-low";
        const x = String(s).trim().toUpperCase();
        if (x === "CRITICAL" || x === "HIGH") return "sev sev-high";
        if (x === "MEDIUM") return "sev sev-medium";
        return "sev sev-low";
    };

    useEffect(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const defaultStart = toInputDate(sevenDaysAgo);
        const defaultEnd = toInputDate(today);

        setStartDate(defaultStart);
        setEndDate(defaultEnd);

        void loadAll(defaultStart, defaultEnd);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAll = async (from, to) => {
        setLoading(true);
        setError("");

        const s = from ?? startDate;
        const e = to ?? endDate;

        try {
            const [ov, recs] = await Promise.all([
                getDashboardOverview(s, e),
                getRecommendations(s, e),
            ]);

            setOverview(ov || null);
            setRecommendations(Array.isArray(recs) ? recs : []);
            setError("");
        } catch (err) {
            console.error(err);
            setOverview(null);
            setRecommendations([]);
            setError("Failed to load dashboard overview.");
        }

        setLoading(false);
    };

    const handleSearch = () => {
        void loadAll(startDate, endDate);
    };

    const kpi = overview?.kpi || null;
    const fleet = overview?.fleet || null;
    const deliveriesSummary = overview?.deliveriesSummary || null;
    const topAlerts = Array.isArray(overview?.topAlerts) ? overview.topAlerts : [];

    const top3Recs = useMemo(() => {
        const clone = [...recommendations];
        clone.sort((a, b) => {
            const sb = sevScore(b?.severity);
            const sa = sevScore(a?.severity);
            if (sb !== sa) return sb - sa;
            return String(a?.code ?? "").localeCompare(String(b?.code ?? ""));
        });
        return clone.slice(0, 3);
    }, [recommendations]);

    const fmtNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n.toLocaleString() : "0";
    };

    const fmtPercent = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? `${n.toFixed(1)}%` : "0.0%";
    };

    return (
        <div className="monitor-operations-page">
            <h1>📊 Dashboard Overview</h1>

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

            {!error && !loading && !overview && (
                <div className="manager-empty">No overview data.</div>
            )}

            {/* KPI CARDS */}
            {overview && (
                <div className="summary-cards">
                    <div className="card">
                        <div className="card-label">Total Trips</div>
                        <div className="card-value">{fmtNum(kpi?.totalTrips)}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">Completed Trips</div>
                        <div className="card-value">{fmtNum(kpi?.completedTrips)}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">Delayed Trips</div>
                        <div className="card-value">{fmtNum(kpi?.delayedTrips)}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">On-time Rate</div>
                        <div className="card-value">{fmtPercent(kpi?.onTimeRatePercent)}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">Fleet Utilization</div>
                        <div className="card-value">{fmtPercent(kpi?.fleetUtilizationPercent)}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">Active Vehicles</div>
                        <div className="card-value">{fmtNum(fleet?.activeVehicles)}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">Total Vehicles</div>
                        <div className="card-value">{fmtNum(fleet?.totalVehicles)}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">Deliveries Trips</div>
                        <div className="card-value">{fmtNum(deliveriesSummary?.totalTrips)}</div>
                    </div>
                </div>
            )}

            {/* TOP RECOMMENDATIONS */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                <h2 style={{ margin: 0 }}>✅ Top Recommendations</h2>
                <Link to="/manager/recommendations" className="btn-link">
                    View all
                </Link>
            </div>

            {top3Recs.length === 0 ? (
                <div className="manager-empty">No recommendations.</div>
            ) : (
                <table className="deliveries-table">
                    <thead>
                    <tr>
                        <th>Severity</th>
                        <th>Code</th>
                        <th>Action</th>
                        <th>Evidence</th>
                    </tr>
                    </thead>
                    <tbody>
                    {top3Recs.map((x, idx) => (
                        <tr key={`${x.code ?? "REC"}-${idx}`}>
                            <td>
                                    <span className={sevClass(x.severity)}>
                                        {x.severity ?? "-"}
                                    </span>
                            </td>
                            <td>{x.code ?? "-"}</td>
                            <td>{x.message ?? "-"}</td>
                            <td>{x.evidence ?? "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* KEY ALERTS */}
            <h2>⚠️ Key Alerts</h2>

            {overview && topAlerts.length === 0 ? (
                <div className="manager-empty">No alerts.</div>
            ) : null}

            {overview && topAlerts.length > 0 ? (
                <table className="deliveries-table">
                    <thead>
                    <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Severity</th>
                    </tr>
                    </thead>
                    <tbody>
                    {topAlerts.map((a, idx) => (
                        <tr key={idx}>
                            <td>{a.createdAt ?? a.time ?? "-"}</td>
                            <td>{a.type ?? "-"}</td>
                            <td>{a.message ?? a.description ?? "-"}</td>
                            <td>{a.severity ?? "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : null}
        </div>
    );
};

export default ManagerDashboard;
