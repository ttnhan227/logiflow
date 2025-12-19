import React, { useEffect, useMemo, useState } from "react";
import { getIssueReports } from "../../../services/manager/managerService";
import "../manager.css";

const IssueReports = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [summary, setSummary] = useState(null);
    const [items, setItems] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const toInputDate = (d) => d.toISOString().slice(0, 10);

    const formatNumber = (v) => {
        if (v === null || v === undefined) return "0";
        const n = Number(v);
        if (Number.isNaN(n)) return "0";
        return n.toLocaleString();
    };

    const formatDelayMinutes = (v) => {
        if (v === null || v === undefined) return "-";
        const n = Number(v);
        if (Number.isNaN(n)) return "-";
        return n.toFixed(1);
    };

    const normalizeBadgeKey = (issueType) => {
        const s = (issueType || "").toString().trim().toLowerCase();
        if (s === "delayed") return "delayed";
        if (s === "cancelled" || s === "canceled") return "cancelled";
        return "other";
    };

    useEffect(() => {
        const today = new Date();
        const from = new Date();
        from.setDate(today.getDate() - 6);

        const s = toInputDate(from);
        const e = toInputDate(today);

        setStartDate(s);
        setEndDate(e);

        void loadData(s, e);
        // eslint-disable-next-line
    }, []);

    const loadData = async (from, to) => {
        setLoading(true);
        setError("");

        try {
            const res = await getIssueReports(from, to);
            setSummary(res?.summary ?? null);
            setItems(Array.isArray(res?.items) ? res.items : []);
        } catch (err) {
            console.error(err);
            setError("Failed to load issue reports");
            setSummary(null);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const sortedItems = useMemo(() => {
        // sort theo ngày desc (yyyy-mm-dd), nếu null thì đẩy xuống cuối
        const clone = [...items];
        clone.sort((a, b) => {
            const da = a?.date ? new Date(a.date).getTime() : 0;
            const db = b?.date ? new Date(b.date).getTime() : 0;
            return db - da;
        });
        return clone;
    }, [items]);

    return (
        <div className="manager-page">
            <h1>🚨 Issues & Reports</h1>

            {/* FILTER */}
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

                <button onClick={() => loadData(startDate, endDate)} disabled={loading}>
                    {loading ? "Loading..." : "View"}
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {/* SUMMARY */}
            {summary && (
                <div className="summary-cards">
                    <div className="card">
                        <div className="card-label">Total Issues</div>
                        <div className="card-value">{formatNumber(summary.totalIssues)}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Delayed</div>
                        <div className="card-value">{formatNumber(summary.delayedIssues)}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Cancelled</div>
                        <div className="card-value">{formatNumber(summary.cancelledIssues)}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Technical</div>
                        <div className="card-value">{formatNumber(summary.technicalIssues)}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">High Severity</div>
                        <div className="card-value">{formatNumber(summary.highSeverity)}</div>
                    </div>
                </div>
            )}

            {/* TABLE */}
            <table className="manager-table">
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Trip</th>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Delay (min)</th>
                </tr>
                </thead>
                <tbody>
                {sortedItems.length === 0 && (
                    <tr>
                        <td colSpan="7" style={{ textAlign: "center" }}>
                            {loading ? "Loading..." : "No issues found"}
                        </td>
                    </tr>
                )}

                {sortedItems.map((x, idx) => (
                    <tr key={`${x.tripId ?? "trip"}-${x.date ?? "date"}-${idx}`}>
                        <td>{x.date ?? "-"}</td>
                        <td>{x.tripId ?? "-"}</td>
                        <td>{x.driverName ?? "-"}</td>
                        <td>{x.vehicleId ?? "-"}</td>
                        <td>
                            <span className={`badge badge-${normalizeBadgeKey(x.issueType)}`}>
                                {x.issueType ?? "-"}
                            </span>
                        </td>
                        <td>{x.description ?? "-"}</td>
                        <td>{formatDelayMinutes(x.delayMinutes)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default IssueReports;
