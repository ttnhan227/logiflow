import React, { useEffect, useState } from "react";
import { getIssueReports } from "../../../services/manager/managerService";

const IssueReports = () => {
    const [issues, setIssues] = useState([]);

    // load default 7 ngày gần nhất
    useEffect(() => {
        const today = new Date();
        const past = new Date();
        past.setDate(today.getDate() - 6);

        const start = past.toISOString().slice(0, 10);
        const end = today.toISOString().slice(0, 10);

        load(start, end);
    }, []);

    const load = async (s, e) => {
        try {
            const res = await getIssueReports(s, e);
            setIssues(res || []);
        } catch (err) {
            console.error("Error loading issue reports:", err);
        }
    };

    return (
        <div className="issue-reports-page" style={{ padding: "20px" }}>
            <h1>🚨 Issue Reports</h1>

            {issues.length === 0 && <p>No issues found.</p>}

            {issues.length > 0 && (
                <table className="issue-table">
                    <thead>
                    <tr>
                        <th>Trip</th>
                        <th>Driver</th>
                        <th>Vehicle</th>
                        <th>Date</th>
                        <th>Issue</th>
                        <th>Description</th>
                        <th>Delay (min)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {issues.map((i, idx) => (
                        <tr key={idx}>
                            <td>{i.tripId}</td>
                            <td>{i.driverName}</td>
                            <td>{i.vehicleId}</td>
                            <td>{i.date}</td>
                            <td>{i.issueType}</td>
                            <td>{i.description}</td>
                            <td>{i.delayMinutes ?? "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default IssueReports;
