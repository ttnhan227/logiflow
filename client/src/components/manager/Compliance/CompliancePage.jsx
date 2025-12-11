import React, { useEffect, useState } from "react";
import { getComplianceCheck } from "../../../services/manager/managerService";

const CompliancePage = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [data, setData] = useState(null);
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
            const res = await getComplianceCheck(s, e);
            setData(res);
        } catch (err) {
            console.error("Error loading compliance:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleView = () => {
        load(startDate, endDate);
    };

    return (
        <div className="driver-manager-page">
            <h1>✅ Compliance Check</h1>

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

            {!data && !loading && <p>No data.</p>}

            {data && (
                <div className="summary-cards">
                    <div className="card">
                        <div className="card-label">Trips Checked</div>
                        <div className="card-value">{data.totalTripsChecked}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Compliant Trips</div>
                        <div className="card-value">{data.compliantTrips}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Trips With Violations</div>
                        <div className="card-value">{data.tripsWithViolations}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Total Violations</div>
                        <div className="card-value">{data.totalViolations}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Speeding</div>
                        <div className="card-value">{data.speedingViolations}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Route Deviation</div>
                        <div className="card-value">
                            {data.routeDeviationViolations}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-label">Late Deliveries</div>
                        <div className="card-value">
                            {data.lateDeliveryViolations}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-label">Drivers With Violations</div>
                        <div className="card-value">{data.driversWithViolations}</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Compliance Rate</div>
                        <div className="card-value">
                            {data.complianceRatePercent != null
                                ? data.complianceRatePercent.toFixed(1)
                                : "-"}
                            %
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompliancePage;
