import React, { useEffect, useMemo, useState } from "react";
import {
    getOperationsPerformance,
    getFleetStatus,
    getDeliveryReport,
    getAlerts,
} from "../../../services/manager/managerService.js";
import "../manager.css";

const MonitorOperations = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [alerts, setAlertsState] = useState([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [summary, setSummary] = useState(null);
    const [fleet, setFleet] = useState(null);

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

    const formatPercent = (v) => {
        if (v === null || v === undefined) return "0%";
        const n = Number(v);
        if (Number.isNaN(n)) return "0%";
        return `${Math.round(n * 10) / 10}%`;
    };

    const toTons = (kg) => {
        const n = Number(kg);
        if (Number.isNaN(n) || kg === null || kg === undefined) return null;
        return n / 1000;
    };

    const formatDateTime = (s) => {
        if (!s) return "-";
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleString();
    };

    useEffect(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const defaultStart = toInputDate(sevenDaysAgo);
        const defaultEnd = toInputDate(today);

        setStartDate(defaultStart);
        setEndDate(defaultEnd);

        void loadData(defaultStart, defaultEnd);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async (from, to) => {
        setLoading(true);
        setError("");

        const s = from ?? startDate;
        const e = to ?? endDate;

        let operationsData = null;
        let fleetData = null;
        let deliveryData = [];
        let alertsData = [];

        const failed = [];

        try {
            operationsData = await getOperationsPerformance(s, e);
        } catch {
            failed.push("performance");
        }

        try {
            fleetData = await getFleetStatus();
        } catch {
            failed.push("fleet");
        }

        try {
            deliveryData = await getDeliveryReport(s, e);
        } catch {
            failed.push("deliveries");
        }

        try {
            alertsData = await getAlerts(s, e);
        } catch {
            failed.push("alerts");
        }

        setSummary(operationsData || null);
        setFleet(fleetData || null);
        setDeliveries(Array.isArray(deliveryData) ? deliveryData : []);
        setAlertsState(Array.isArray(alertsData) ? alertsData : []);

        if (failed.length > 0) {
            setError(`Failed to load: ${failed.join(", ")}`);
        } else {
            setError("");
        }

        setLoading(false);
    };

    const handleSearch = () => {
        void loadData(startDate, endDate);
    };

    const deliveriesSorted = useMemo(() => {
        const clone = [...deliveries];
        clone.sort((a, b) => {
            const da = a?.date ? new Date(a.date).getTime() : 0;
            const db = b?.date ? new Date(b.date).getTime() : 0;
            return da - db;
        });
        return clone;
    }, [deliveries]);

    // Deliveries summary:
    // - totals/distance/avgDelay/cargo from API4 (deliveries)
    // - on-time rate from API2 (summary.onTimeRatePercent)
    const deliveriesSummary = useMemo(() => {
        const totalTrips = deliveries.reduce((a, x) => a + (Number(x.totalTrips) || 0), 0);
        const completedTrips = deliveries.reduce((a, x) => a + (Number(x.completedTrips) || 0), 0);
        const cancelledTrips = deliveries.reduce((a, x) => a + (Number(x.cancelledTrips) || 0), 0);
        const delayedTrips = deliveries.reduce((a, x) => a + (Number(x.delayedTrips) || 0), 0);
        const totalDistanceKm = deliveries.reduce((a, x) => a + (Number(x.totalDistanceKm) || 0), 0);
        const totalCargoWeightKg = deliveries.reduce((a, x) => a + (Number(x.totalCargoWeightKg) || 0), 0);

        // avg delay: weighted by delayedTrips so it reflects volume
        const delayWeightedSum = deliveries.reduce((a, x) => {
            const d = Number(x.averageDelayMinutes) || 0;
            const k = Number(x.delayedTrips) || 0;
            return a + d * k;
        }, 0);

        const avgDelayMinutes = delayedTrips === 0 ? 0 : delayWeightedSum / delayedTrips;

        const onTimeRatePercent = Number(summary?.onTimeRatePercent) || 0;

        return {
            totalTrips,
            completedTrips,
            cancelledTrips,
            delayedTrips,
            onTimeRatePercent,
            avgDelayMinutes,
            totalDistanceKm,
            totalCargoWeightKg,
        };
    }, [deliveries, summary]);

    const topAlerts = useMemo(() => {
        const sorted = [...alerts].sort((a, b) => {
            const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return db - da;
        });
        return sorted.slice(0, 10);
    }, [alerts]);

    // ===== Simple SVG charts (no libraries) =====
    const LineChart = ({ title, labels, values, valueSuffix }) => {
        const [hoverIdx, setHoverIdx] = useState(null);

        const w = 760;
        const h = 220;
        const padL = 44;
        const padR = 16;
        const padT = 24;
        const padB = 34;

        const clean = values.map((v) => {
            const n = Number(v);
            return Number.isNaN(n) ? 0 : n;
        });

        const minV0 = Math.min(...clean);
        const maxV0 = Math.max(...clean);
        const span0 = maxV0 - minV0 || 1;

        // nice scale
        const niceMax = Math.ceil(maxV0 / 10) * 10;
        const niceMin = Math.floor(minV0 / 10) * 10;
        const span = niceMax - niceMin || 1;

        const xOf = (i) =>
            padL + (labels.length <= 1 ? 0 : (i * (w - padL - padR)) / (labels.length - 1));
        const yOf = (v) => padT + ((niceMax - v) * (h - padT - padB)) / span;

        const points = clean.map((v, i) => ({ x: xOf(i), y: yOf(v), v, lb: labels[i] }));

        const poly = points.map((p) => `${p.x},${p.y}`).join(" ");

        const yTicks = 4;
        const yTickVals = Array.from({ length: yTicks + 1 }, (_, k) => niceMin + (k * span) / yTicks).reverse();

        return (
            <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>

                <div style={{ position: "relative" }}>
                    <svg
                        viewBox={`0 0 ${w} ${h}`}
                        style={{ width: "100%", background: "#fff", border: "1px solid #ddd", borderRadius: 8 }}
                        onMouseLeave={() => setHoverIdx(null)}
                    >
                        {/* Grid + Y axis labels */}
                        {yTickVals.map((tv, i) => {
                            const y = yOf(tv);
                            return (
                                <g key={i}>
                                    <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#eee" strokeWidth="1" />
                                    <text x={padL - 8} y={y + 3} fontSize="10" textAnchor="end" fill="#444">
                                        {Number(tv).toFixed(0)}
                                        {valueSuffix}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Axes */}
                        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#333" strokeWidth="1" />
                        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#333" strokeWidth="1" />

                        {/* Line */}
                        <polyline fill="none" stroke="black" strokeWidth="2" points={poly} />

                        {/* Points + hover capture */}
                        {points.map((p, i) => (
                            <g key={i}>
                                <circle cx={p.x} cy={p.y} r="3.5" fill="black" />
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="10"
                                    fill="transparent"
                                    onMouseEnter={() => setHoverIdx(i)}
                                />
                            </g>
                        ))}

                        {/* X labels (show MM-DD every tick if short, else step) */}
                        {labels.map((lb, i) => {
                            const step = labels.length > 10 ? 2 : 1;
                            if (i % step !== 0) return null;
                            const x = xOf(i);
                            return (
                                <text key={lb} x={x} y={h - 10} fontSize="10" textAnchor="middle" fill="#444">
                                    {lb ? lb.slice(5) : ""}
                                </text>
                            );
                        })}

                        {/* Tooltip */}
                        {hoverIdx !== null && points[hoverIdx] && (
                            <g>
                                <line
                                    x1={points[hoverIdx].x}
                                    y1={padT}
                                    x2={points[hoverIdx].x}
                                    y2={h - padB}
                                    stroke="#999"
                                    strokeWidth="1"
                                    strokeDasharray="3,3"
                                />
                                <rect
                                    x={Math.min(points[hoverIdx].x + 10, w - 160)}
                                    y={Math.max(points[hoverIdx].y - 34, padT)}
                                    width="150"
                                    height="40"
                                    rx="6"
                                    fill="#fff"
                                    stroke="#ddd"
                                />
                                <text
                                    x={Math.min(points[hoverIdx].x + 18, w - 152)}
                                    y={Math.max(points[hoverIdx].y - 18, padT + 16)}
                                    fontSize="11"
                                    fill="#111"
                                >
                                    {points[hoverIdx].lb}
                                </text>
                                <text
                                    x={Math.min(points[hoverIdx].x + 18, w - 152)}
                                    y={Math.max(points[hoverIdx].y - 3, padT + 31)}
                                    fontSize="11"
                                    fill="#111"
                                    fontWeight="700"
                                >
                                    {Number(points[hoverIdx].v).toFixed(1)}
                                    {valueSuffix}
                                </text>
                            </g>
                        )}
                    </svg>
                </div>
            </div>
        );
    };

    const BarChart = ({ title, labels, values, valueSuffix }) => {
        const [hoverIdx, setHoverIdx] = useState(null);

        const w = 760;
        const h = 220;
        const padL = 44;
        const padR = 16;
        const padT = 24;
        const padB = 34;

        const clean = values.map((v) => {
            const n = Number(v);
            return Number.isNaN(n) ? 0 : n;
        });

        const maxV0 = Math.max(...clean) || 1;
        const niceMax = Math.ceil(maxV0 / 10) * 10 || 10;

        const yOf = (v) => padT + ((niceMax - v) * (h - padT - padB)) / (niceMax || 1);
        const xStart = padL;
        const chartW = w - padL - padR;
        const barSlot = chartW / Math.max(labels.length, 1);
        const barW = Math.max(6, barSlot - 10);

        const yTicks = 4;
        const yTickVals = Array.from({ length: yTicks + 1 }, (_, k) => (k * niceMax) / yTicks).reverse();

        return (
            <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>

                <svg
                    viewBox={`0 0 ${w} ${h}`}
                    style={{ width: "100%", background: "#fff", border: "1px solid #ddd", borderRadius: 8 }}
                    onMouseLeave={() => setHoverIdx(null)}
                >
                    {/* Grid + Y labels */}
                    {yTickVals.map((tv, i) => {
                        const y = yOf(tv);
                        return (
                            <g key={i}>
                                <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#eee" strokeWidth="1" />
                                <text x={padL - 8} y={y + 3} fontSize="10" textAnchor="end" fill="#444">
                                    {Number(tv).toFixed(0)}
                                    {valueSuffix}
                                </text>
                            </g>
                        );
                    })}

                    {/* Axes */}
                    <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#333" strokeWidth="1" />
                    <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#333" strokeWidth="1" />

                    {/* Bars */}
                    {clean.map((v, i) => {
                        const x = xStart + i * barSlot + (barSlot - barW) / 2;
                        const y = yOf(v);
                        const bh = h - padB - y;
                        return (
                            <g key={i}>
                                <rect x={x} y={y} width={barW} height={bh} fill="black" rx="3" />
                                <rect
                                    x={x}
                                    y={padT}
                                    width={barW}
                                    height={h - padT - padB}
                                    fill="transparent"
                                    onMouseEnter={() => setHoverIdx(i)}
                                />
                            </g>
                        );
                    })}

                    {/* X labels */}
                    {labels.map((lb, i) => {
                        const step = labels.length > 10 ? 2 : 1;
                        if (i % step !== 0) return null;
                        const x = xStart + i * barSlot + barSlot / 2;
                        return (
                            <text key={lb} x={x} y={h - 10} fontSize="10" textAnchor="middle" fill="#444">
                                {lb ? lb.slice(5) : ""}
                            </text>
                        );
                    })}

                    {/* Tooltip */}
                    {hoverIdx !== null && labels[hoverIdx] && (
                        <g>
                            <rect x={Math.min(xStart + hoverIdx * barSlot + 10, w - 160)} y={padT} width="150" height="40" rx="6" fill="#fff" stroke="#ddd" />
                            <text x={Math.min(xStart + hoverIdx * barSlot + 18, w - 152)} y={padT + 16} fontSize="11" fill="#111">
                                {labels[hoverIdx]}
                            </text>
                            <text x={Math.min(xStart + hoverIdx * barSlot + 18, w - 152)} y={padT + 31} fontSize="11" fill="#111" fontWeight="700">
                                {Number(clean[hoverIdx]).toFixed(2)}
                                {valueSuffix}
                            </text>
                        </g>
                    )}
                </svg>
            </div>
        );
    };

    const dailyOnTime = useMemo(() => deliveriesSorted.map((x) => Number(x.onTimeRatePercent) || 0), [deliveriesSorted]);
    const dailyCargoTons = useMemo(
        () => deliveriesSorted.map((x) => (toTons(x.totalCargoWeightKg) != null ? toTons(x.totalCargoWeightKg) : 0)),
        [deliveriesSorted]
    );
    const dailyLabels = useMemo(() => deliveriesSorted.map((x) => x.date ?? ""), [deliveriesSorted]);

    return (
        <div className="monitor-operations-page">
            <h1>🚚 Monitor Operations</h1>

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
                    {loading ? "Loading..." : "Search"}
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {/* DELIVERY PERFORMANCE (API2) */}
            {summary && (
                <>
                    <h2>Delivery Performance</h2>
                    <div className="summary-cards">
                        <div className="card">
                            <div className="card-label">Total Trips</div>
                            <div className="card-value">{formatNumber(summary.totalTrips)}</div>
                        </div>

                        <div className="card">
                            <div className="card-label">Completed</div>
                            <div className="card-value">{formatNumber(summary.completedTrips)}</div>
                        </div>

                        <div className="card">
                            <div className="card-label">Cancelled</div>
                            <div className="card-value">{formatNumber(summary.cancelledTrips)}</div>
                        </div>

                        <div className="card">
                            <div className="card-label">Delayed</div>
                            <div className="card-value">{formatNumber(summary.delayedTrips)}</div>
                        </div>

                        <div className="card">
                            <div className="card-label">On-time Rate</div>
                            <div className="card-value">{formatPercent(summary.onTimeRatePercent)}</div>
                        </div>

                        <div className="card">
                            <div className="card-label">Avg Delay</div>
                            <div className="card-value">
                                {summary.averageDelayMinutes != null
                                    ? `${Number(summary.averageDelayMinutes).toFixed(1)} min`
                                    : "-"}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-label">Total Distance</div>
                            <div className="card-value">
                                {summary.totalDistanceKm != null ? `${Number(summary.totalDistanceKm).toFixed(1)} km` : "-"}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-label">Avg Distance / Trip</div>
                            <div className="card-value">
                                {summary.averageDistanceKm != null ? `${Number(summary.averageDistanceKm).toFixed(1)} km` : "-"}
                            </div>
                        </div>

                        {/* TONNAGE (display in tons; BE stays in kg) */}
                        <div className="card">
                            <div className="card-label">Total Cargo</div>
                            <div className="card-value">
                                {toTons(summary.totalCargoWeightKg) != null ? `${toTons(summary.totalCargoWeightKg).toFixed(2)} t` : "-"}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-label">Total Capacity</div>
                            <div className="card-value">
                                {toTons(summary.totalVehicleCapacityKg) != null ? `${toTons(summary.totalVehicleCapacityKg).toFixed(2)} t` : "-"}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-label">Avg Tonnage Utilization</div>
                            <div className="card-value">
                                {summary.averageTonnageUtilizationPercent != null
                                    ? `${Number(summary.averageTonnageUtilizationPercent).toFixed(1)}%`
                                    : "-"}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-label">Over Capacity Trips</div>
                            <div className="card-value">{formatNumber(summary.overCapacityTrips ?? 0)}</div>
                        </div>
                    </div>

                    <div className="note">
                        Delayed includes trips late vs schedule (completed or still in progress). On-time rate is based on eligible completed trips only.
                    </div>
                </>
            )}

            {/* FLEET STATUS (API3) */}
            {fleet && (
                <>
                    <h2>Fleet Status</h2>
                    <div className="summary-cards">
                        <div className="card">
                            <div className="card-label">Total Vehicles</div>
                            <div className="card-value">{formatNumber(fleet.totalVehicles)}</div>
                        </div>
                        <div className="card">
                            <div className="card-label">Active Vehicles</div>
                            <div className="card-value">{formatNumber(fleet.activeVehicles)}</div>
                        </div>
                        <div className="card">
                            <div className="card-label">Idle Vehicles</div>
                            <div className="card-value">{formatNumber(fleet.idleVehicles)}</div>
                        </div>
                        <div className="card">
                            <div className="card-label">In Maintenance</div>
                            <div className="card-value">{formatNumber(fleet.inMaintenanceVehicles)}</div>
                        </div>
                        <div className="card">
                            <div className="card-label">Unavailable</div>
                            <div className="card-value">{formatNumber(fleet.unavailableVehicles)}</div>
                        </div>
                        <div className="card">
                            <div className="card-label">Fleet Utilization</div>
                            <div className="card-value">{formatPercent(fleet.averageUtilizationPercent)}</div>
                        </div>
                    </div>
                </>
            )}

            {/* ALERTS (API8) */}
            <h2>Alerts</h2>
            {topAlerts.length === 0 ? (
                <p>No alerts.</p>
            ) : (
                <table className="table">
                    <thead>
                    <tr>
                        <th>Severity</th>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Created At</th>
                        <th>Trip</th>
                        <th>Vehicle</th>
                        <th>Driver</th>
                    </tr>
                    </thead>
                    <tbody>
                    {topAlerts.map((a) => (
                        <tr key={a.alertId}>
                            <td>{a.severity ?? "-"}</td>
                            <td>{a.type ?? "-"}</td>
                            <td title={a.message ?? ""}>{a.title ?? "-"}</td>
                            <td>{formatDateTime(a.createdAt)}</td>
                            <td>{a.relatedTripId ?? "-"}</td>
                            <td>{a.relatedVehicleId ?? "-"}</td>
                            <td>{a.relatedDriverName ?? a.relatedDriverId ?? "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* DELIVERIES REPORT (API4) */}
            <h2>Deliveries Report</h2>

            <div className="summary-cards">
                <div className="card">
                    <div className="card-label">Total Trips</div>
                    <div className="card-value">{formatNumber(deliveriesSummary.totalTrips)}</div>
                </div>

                <div className="card">
                    <div className="card-label">Completed</div>
                    <div className="card-value">{formatNumber(deliveriesSummary.completedTrips)}</div>
                </div>

                <div className="card">
                    <div className="card-label">Cancelled</div>
                    <div className="card-value">{formatNumber(deliveriesSummary.cancelledTrips)}</div>
                </div>

                <div className="card">
                    <div className="card-label">Delayed</div>
                    <div className="card-value">{formatNumber(deliveriesSummary.delayedTrips)}</div>
                </div>

                <div className="card">
                    <div className="card-label">On-time Rate</div>
                    <div className="card-value">{formatPercent(deliveriesSummary.onTimeRatePercent)}</div>
                </div>

                <div className="card">
                    <div className="card-label">Avg Delay</div>
                    <div className="card-value">{`${Number(deliveriesSummary.avgDelayMinutes).toFixed(1)} min`}</div>
                </div>

                <div className="card">
                    <div className="card-label">Total Distance</div>
                    <div className="card-value">{formatNumber(deliveriesSummary.totalDistanceKm)} km</div>
                </div>

                <div className="card">
                    <div className="card-label">Total Cargo</div>
                    <div className="card-value">
                        {toTons(deliveriesSummary.totalCargoWeightKg) != null
                            ? `${toTons(deliveriesSummary.totalCargoWeightKg).toFixed(2)} t`
                            : "-"}
                    </div>
                </div>
            </div>

            {/* Charts (API4 daily) */}
            {deliveriesSorted.length > 0 && (
                <>
                    <LineChart title="Daily On-time Rate (%)" labels={dailyLabels} values={dailyOnTime} valueSuffix="%" />
                    <BarChart title="Daily Cargo (tons)" labels={dailyLabels} values={dailyCargoTons} valueSuffix="t" />
                </>
            )}

            {deliveries.length === 0 ? (
                <p>No delivery records.</p>
            ) : (
                <table className="table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Completed</th>
                        <th>Cancelled</th>
                        <th>Delayed</th>
                        <th>On-time</th>
                        <th>Avg Delay (min)</th>
                        <th>Distance (km)</th>
                        <th>Cargo (t)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {deliveries.map((x) => (
                        <tr key={x.date}>
                            <td>{x.date}</td>
                            <td>{formatNumber(x.totalTrips)}</td>
                            <td>{formatNumber(x.completedTrips)}</td>
                            <td>{formatNumber(x.cancelledTrips)}</td>
                            <td>{formatNumber(x.delayedTrips)}</td>
                            <td>{formatPercent(x.onTimeRatePercent)}</td>
                            <td>{Number(x.averageDelayMinutes ?? 0).toFixed(1)}</td>
                            <td>{formatNumber(x.totalDistanceKm)}</td>
                            <td>
                                {toTons(x.totalCargoWeightKg) != null ? toTons(x.totalCargoWeightKg).toFixed(2) : "-"}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MonitorOperations;
