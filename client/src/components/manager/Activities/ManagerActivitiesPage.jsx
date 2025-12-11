import React, { useEffect, useState } from "react";
import { getManagerActivities } from "../../../services/manager/managerService";

const ManagerActivitiesPage = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [activities, setActivities] = useState([]);
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
            const data = await getManagerActivities(s, e);
            setActivities(data || []);
        } catch (err) {
            console.error("Error loading manager activities:", err);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = () => {
        load(startDate, endDate);
    };

    return (
        <div className="driver-manager-page">
            <h1>📜 Manager Activities</h1>

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

            {!loading && activities.length === 0 && <p>No activities.</p>}

            {activities.length > 0 && (
                <table className="driver-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Description</th>
                        <th>IP</th>
                    </tr>
                    </thead>
                    <tbody>
                    {activities.map((a, idx) => (
                        <tr key={a.activityId ?? idx}>
                            <td>{idx + 1}</td>
                            <td>{a.timestamp}</td>
                            <td>{a.username}</td>
                            <td>{a.action}</td>
                            <td>
                                {a.entityType}
                                {a.entityId ? ` (${a.entityId})` : ""}
                            </td>
                            <td>{a.description}</td>
                            <td>{a.ipAddress}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ManagerActivitiesPage;
