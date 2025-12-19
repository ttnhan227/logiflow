import React, { useEffect, useMemo, useState } from "react";
import { getAlerts } from "../../../services/manager/managerService.js";
import "../manager.css";

const AlertsPage = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [alerts, setAlerts] = useState([]);

    const toInputDate = (d) => d.toISOString().slice(0, 10);

    useEffect(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const s = toInputDate(sevenDaysAgo);
        const e = toInputDate(today);

        setStartDate(s);
        setEndDate(e);

        loadData(s, e);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async (s, e) => {
        setLoading(true);
        setError("");
        try {
            const data = await getAlerts(s, e);
            setAlerts(Array.isArray(data) ? data : []);
        } catch (err) {
            setError("Failed to load alerts.");
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => loadData(startDate, endDate);

    const topSummary = useMemo(() => {
        const total = alerts.length;
        const critical = alerts.filter((x) => x.severity === "CRITICAL").length;
        const high = alerts.filter((x) => x.severity === "HIGH").length;
        const medium = alerts.filter((x) => x.severity === "MEDIUM").length;
        return { total, critical, high, medium };
    }, [alerts]);

    return (
        <div className="manager-page">
            <h1>🚨 Alerts</h1>

            <div className="filters">
                <label>
                    From:
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>

                <label>
                    To:
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>

                <button onClick={handleSearch} disabled={loading}>
                    {loading ? "Loading..." : "View"}
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {!error && (
                <div className="summary-cards">
                    <div className="card">
                        <div className="card-label">Total Alerts</div>
                        <div className="card-value">{topSummary.total}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Critical</div>
                        <div className="card-value">{topSummary.critical}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">High</div>
                        <div className="card-value">{topSummary.high}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Medium</div>
                        <div className="card-value">{topSummary.medium}</div>
                    </div>
                </div>
            )}

            {!loading && !error && alerts.length === 0 && <div>No alerts found.</div>}

            {!error && alerts.length > 0 && (
                <table className="manager-table">
                    <thead>
                    <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Severity</th>
                        <th>Trip</th>
                        <th>Vehicle</th>
                    </tr>
                    </thead>
                    <tbody>
                    {alerts.map((a, idx) => (
                        <tr key={a.alertId ?? idx}>
                            <td>{a.createdAt ?? "-"}</td>
                            <td>{a.type ?? "-"}</td>
                            <td>{a.title ?? "-"}</td>
                            <td>{a.message ?? "-"}</td>
                            <td>
                  <span className={`badge badge-${(a.severity || "LOW").toLowerCase()}`}>
                    {a.severity ?? "LOW"}
                  </span>
                            </td>
                            <td>{a.relatedTripId ?? "-"}</td>
                            <td>{a.relatedVehicleId ?? "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AlertsPage;
