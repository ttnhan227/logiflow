import React, { useEffect, useMemo, useState } from "react";
import { getRecommendations } from "../../../services/manager/managerService";
import "../manager.css";

const RecommendationsPage = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [items, setItems] = useState([]);

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
            const data = await getRecommendations(s, e);
            const arr = Array.isArray(data) ? data : [];
            setItems(arr);
            if (arr.length === 0) setError("No recommendations found.");
        } catch (err) {
            console.error(err);
            setItems([]);
            setError("Failed to load recommendations.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        void loadData(startDate, endDate);
    };

    const sorted = useMemo(() => {
        const clone = [...items];
        clone.sort((a, b) => {
            const sa = sevScore(a?.severity);
            const sb = sevScore(b?.severity);
            if (sb !== sa) return sb - sa;
            return String(a?.code ?? "").localeCompare(String(b?.code ?? ""));
        });
        return clone;
    }, [items]);

    return (
        <div className="monitor-operations-page">
            <h1>Recommendations</h1>

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
                    {loading ? "Loading..." : "Search"}
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {!error && sorted.length > 0 && (
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
                    {sorted.map((x, idx) => (
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
        </div>
    );
};

export default RecommendationsPage;
