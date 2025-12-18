import React, { useEffect, useState } from "react";
import { getComplianceCheck } from "../../../services/manager/managerService";
import "../manager.css";

const CompliancePage = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [summary, setSummary] = useState(null);
    const [items, setItems] = useState([]);

    const toInputDate = (d) => d.toISOString().slice(0, 10);

    useEffect(() => {
        const today = new Date();
        const from = new Date();
        from.setDate(today.getDate() - 6);

        const s = toInputDate(from);
        const e = toInputDate(today);

        setStartDate(s);
        setEndDate(e);

        loadData(s, e);
        // eslint-disable-next-line
    }, []);

    const loadData = async (s, e) => {
        setLoading(true);
        setError("");

        try {
            const res = await getComplianceCheck(s, e);
            setSummary(res?.summary || null);
            setItems(Array.isArray(res?.items) ? res.items : []);
        } catch (err) {
            console.error(err);
            setSummary(null);
            setItems([]);
            setError("Failed to load compliance data.");
        }

        setLoading(false);
    };

    return (
        <div className="manager-page">
            <h1>✅ Compliance</h1>

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

            {summary && (
                <div className="summary-cards">
                    <div className="card">
                        <div className="card-label">Total Violations</div>
                        <div className="card-value">{summary.totalViolations}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">High Risk</div>
                        <div className="card-value">{summary.highRiskCount}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">Medium Risk</div>
                        <div className="card-value">{summary.mediumRiskCount}</div>
                    </div>

                    <div className="card">
                        <div className="card-label">Low Risk</div>
                        <div className="card-value">{summary.lowRiskCount}</div>
                    </div>
                </div>
            )}

            <h2>Violations</h2>

            <table className="manager-table">
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Trip</th>
                    <th>Rule</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th>Value</th>
                </tr>
                </thead>
                <tbody>
                {items.length === 0 ? (
                    <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>
                            No violations found
                        </td>
                    </tr>
                ) : (
                    items.map((x, idx) => (
                        <tr key={idx}>
                            <td>{x.date ?? "-"}</td>
                            <td>{x.tripId ?? "-"}</td>
                            <td>{x.ruleCode ?? "-"}</td>
                            <td>{x.severity ?? "-"}</td>
                            <td>{x.description ?? "-"}</td>
                            <td>{x.value != null ? x.value : "-"}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
};

export default CompliancePage;
