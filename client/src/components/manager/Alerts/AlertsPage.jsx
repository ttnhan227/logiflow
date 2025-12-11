import React, { useEffect, useState } from "react";
import { getAlerts } from "../../../services/manager/managerService";

const AlertsPage = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [alerts, setAlerts] = useState([]);
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
            const data = await getAlerts(s, e);
            setAlerts(data || []);
        } catch (err) {
            console.error("Error loading alerts:", err);
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = () => {
        load(startDate, endDate);
    };

    const severityColor = (sev) => {
        switch (sev) {
            case "CRITICAL": return "red";
            case "HIGH": return "orangered";
            case "MEDIUM": return "orange";
            default: return "green";
        }
    };

    return (
        <div className="driver-manager-page">
            <h1>🚨 Alerts</h1>

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

            {!loading && alerts.length === 0 && <p>No alerts.</p>}

            {alerts.length > 0 && (
                <table className="driver-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Severity</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Driver</th>
                        <th>Vehicle</th>
                        <th>Created At</th>
                        <th>Acknowledged</th>
                    </tr>
                    </thead>
                    <tbody>
                    {alerts.map((a, idx) => (
                        <tr key={a.alertId ?? idx}>
                            <td>{idx + 1}</td>
                            <td style={{ color: severityColor(a.severity), fontWeight: "bold" }}>
                                {a.severity}
                            </td>
                            <td>{a.title}</td>
                            <td>{a.type}</td>
                            <td>{a.relatedDriverName || "-"}</td>
                            <td>{a.relatedVehicleId || "-"}</td>
                            <td>{a.createdAt}</td>
                            <td>{a.acknowledged ? "Yes" : "No"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AlertsPage;
