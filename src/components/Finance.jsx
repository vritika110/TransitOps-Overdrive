import React, { useState, useMemo } from "react";
import { calculateROI } from "../utils/businessRules";

export default function Finance({ user, state, onUpdateState }) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [category, setCategory] = useState("Toll");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState(null);

  const canManage = user.role === "Financial Analyst" || user.role === "System Administrator";

  const anomalies = useMemo(() => {
    const fuelExpenses = state.expenses.filter(e => e.category === "Fuel" && (!e.reviewStatus || e.reviewStatus === "Pending Review"));
    const flagged = [];

    fuelExpenses.forEach(exp => {
      const trip = state.trips.find(t => t.id === exp.tripId);
      const vehicle = state.vehicles.find(v => v.id === exp.vehicleId);

      let baselineVal = null;
      let baselineType = "Insufficient Data";

      if (trip && trip.source && trip.destination) {
        const sameRouteExp = state.expenses.filter(e => {
          if (e.id === exp.id || e.category !== "Fuel") return false;
          const t = state.trips.find(tr => tr.id === e.tripId);
          return t && t.source === trip.source && t.destination === trip.destination;
        });
        if (sameRouteExp.length > 0) {
          baselineVal = sameRouteExp.reduce((sum, e) => sum + e.amount, 0) / sameRouteExp.length;
          baselineType = "Same Route Average";
        }
      }

      if (baselineVal === null && vehicle) {
        const sameVehicleExp = state.expenses.filter(e => e.id !== exp.id && e.category === "Fuel" && e.vehicleId === vehicle.id);
        if (sameVehicleExp.length > 0) {
          baselineVal = sameVehicleExp.reduce((sum, e) => sum + e.amount, 0) / sameVehicleExp.length;
          baselineType = "Same Vehicle Average";
        }
      }

      if (baselineVal === null && vehicle) {
        const similarTypeExp = state.expenses.filter(e => {
          if (e.id === exp.id || e.category !== "Fuel") return false;
          const v = state.vehicles.find(veh => veh.id === e.vehicleId);
          return v && v.vehicleType === vehicle.vehicleType;
        });
        if (similarTypeExp.length > 0) {
          baselineVal = similarTypeExp.reduce((sum, e) => sum + e.amount, 0) / similarTypeExp.length;
          baselineType = "Similar Vehicle Type Average";
        }
      }

      if (baselineVal !== null && baselineVal > 0 && exp.amount > baselineVal * 1.2) {
        const deviation = ((exp.amount - baselineVal) / baselineVal) * 100;
        flagged.push({
          ...exp,
          expectedValue: baselineVal,
          deviation,
          baselineType,
          severity: deviation > 35 ? "High" : "Medium",
          reason: `Fuel cost is ${deviation.toFixed(0)}% higher than the historical average.`
        });
      }
    });
    return flagged;
  }, [state.expenses, state.trips, state.vehicles]);

  const handleReviewAnomaly = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:3001/api/expenses/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify({ reviewStatus: status })
      });
      if (res.ok) onUpdateState();
    } catch (err) {
      console.error("Failed to review anomaly", err);
    }
  };


  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!canManage) return;

    try {
      const res = await fetch("http://localhost:3001/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify({ category, amount: Number(amount), date, vehicleId, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onUpdateState();
      setShowAddExpense(false);
      setAmount(""); setDescription(""); setVehicleId("");
    } catch (err) {
      setFormError(err.message);
    }
  };

  const totalRevenue = state.trips.filter(t => t.status === "Completed").reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalFuelCost = state.expenses.filter(e => e.category === "Fuel").reduce((sum, e) => sum + e.amount, 0);
  const totalMaintCost = state.expenses.filter(e => e.category === "Maintenance").reduce((sum, e) => sum + e.amount, 0);
  const totalOtherCost = state.expenses.filter(e => e.category !== "Fuel" && e.category !== "Maintenance").reduce((sum, e) => sum + e.amount, 0);
  const coreOpsCost = totalFuelCost + totalMaintCost;
  const totalCost = coreOpsCost + totalOtherCost;
  const totalProfit = totalRevenue - totalCost;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Financial Ledger</h2>
          <p>Operational costs, fuel efficiencies, and asset ROI tracking</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowAddExpense(!showAddExpense)}>
            {showAddExpense ? "View Financial Ledgers" : "➕ File Expense Log"}
          </button>
        )}
      </div>

      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--success-base)" }}>
          <div className="kpi-label">Attributed Revenue</div>
          <div className="kpi-val">${totalRevenue.toLocaleString()}</div>
          <div className="kpi-sub">Actual realized trip earnings</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--danger-base)" }}>
          <div className="kpi-label">Core Operational Cost</div>
          <div className="kpi-val">${coreOpsCost.toLocaleString()}</div>
          <div className="kpi-sub">Fuel: ${totalFuelCost.toLocaleString()} · Maint: ${totalMaintCost.toLocaleString()}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--warning-base)" }}>
          <div className="kpi-label">Total Cumulative Cost</div>
          <div className="kpi-val">${totalCost.toLocaleString()}</div>
          <div className="kpi-sub">Includes tolls, parking and misc</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: `3px solid ${totalProfit >= 0 ? 'var(--success-base)' : 'var(--danger-base)'}` }}>
          <div className="kpi-label">Net Profitability</div>
          <div className="kpi-val" style={{ color: totalProfit >= 0 ? "var(--success-base)" : "var(--danger-base)" }}>
            ${totalProfit.toLocaleString()}
          </div>
          <div className="kpi-sub">Revenue less total applicable costs</div>
        </div>
      </div>

      {showAddExpense && canManage ? (
        <div className="card" style={{ maxWidth: "640px" }}>
          <h3 className="card-title" style={{ marginBottom: "1.25rem" }}>Record Expense Line</h3>
          {formError && <div className="inline-error">⚠️ {formError}</div>}
          <form onSubmit={handleAddExpense} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group"><label className="form-label">Expense Category</label><select className="form-select" value={category} onChange={e => setCategory(e.target.value)}><option value="Toll">Toll</option><option value="Parking">Parking</option><option value="Miscellaneous">Miscellaneous</option></select></div>
            <div className="form-group"><label className="form-label">Amount ($)</label><input type="number" className="form-input" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="45.00" /></div>
            <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Linked Asset (Optional)</label><select className="form-select" value={vehicleId} onChange={e => setVehicleId(e.target.value)}><option value="">-- No vehicle --</option>{state.vehicles.map(v => (<option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>))}</select></div>
            <div className="form-group" style={{ gridColumn: "span 2" }}><label className="form-label">Description</label><input type="text" className="form-input" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Toll tags or parking bills details..." /></div>
            <div style={{ gridColumn: "span 2", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>File Ledger Record</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="split-view">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "1rem" }}>Expense Line Items</h3>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Category</th><th>Asset</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {state.expenses.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>No expenses recorded.</td></tr>
                  )}
                  {state.expenses.slice().reverse().map(e => (
                    <tr key={e.id}>
                      <td className="text-secondary" style={{ fontSize: "0.8rem" }}>{e.date}</td>
                      <td>
                        <span className={`badge ${e.category === "Fuel" ? "badge-info" : e.category === "Maintenance" ? "badge-warning" : "badge-neutral"}`}>
                          {e.category}
                        </span>
                      </td>
                      <td className="text-secondary" style={{ fontSize: "0.8rem" }}>{e.vehicleId || "N/A"}</td>
                      <td className="font-semibold text-mono">${e.amount?.toFixed(2)}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {e.reviewStatus ? (
                          <span className={`badge ${e.reviewStatus === "Reviewed — Valid" ? "badge-success" : "badge-danger"}`}>
                            {e.reviewStatus}
                          </span>
                        ) : "Logged"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {anomalies.length > 0 && canManage && (
              <div className="card" style={{ borderColor: "var(--warning)" }}>
                <h3 className="card-title" style={{ marginBottom: "1rem", color: "var(--warning)" }}>⚠️ Expense Anomaly Review Queue</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {anomalies.map(a => (
                    <div key={a.id} style={{ background: "var(--bg-tertiary)", padding: "12px", borderRadius: "var(--radius-sm)", borderLeft: `3px solid ${a.severity === 'High' ? 'var(--danger)' : 'var(--warning)'}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "1rem" }}>{a.category} Expense Flag</span>
                        <span className={`badge ${a.severity === 'High' ? 'badge-danger' : 'badge-warning'}`}>{a.severity} Severity Anomaly</span>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px", fontSize: "0.85rem" }}>
                        <div style={{ background: "var(--bg-base)", padding: "8px", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "4px" }}>Actual Value</div>
                          <div style={{ fontWeight: 700, color: "var(--danger)" }}>${a.amount.toFixed(2)}</div>
                        </div>
                        <div style={{ background: "var(--bg-base)", padding: "8px", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "4px" }}>Expected (Baseline)</div>
                          <div style={{ fontWeight: 600 }}>${a.expectedValue.toFixed(2)}</div>
                        </div>
                        <div style={{ background: "var(--bg-base)", padding: "8px", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "4px" }}>Deviation</div>
                          <div style={{ fontWeight: 600, color: "var(--warning)" }}>+{a.deviation.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                        <div><strong>Baseline Source:</strong> {a.baselineType}</div>
                        <div><strong>Asset:</strong> {a.vehicleId} {a.tripId ? `| Trip: ${a.tripId}` : ''}</div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleReviewAnomaly(a.id, "Reviewed — Valid")}>Verify as Valid</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleReviewAnomaly(a.id, "Reviewed — Requires Action")}>Flag for Investigation</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "1rem" }}>Asset ROI Yield</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {state.vehicles.filter(v => v.operationalStatus !== "Retired").map(v => {
                const tripsForVehicle = state.trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
                const rev = tripsForVehicle.reduce((sum, t) => sum + (t.revenue || 0), 0);
                const fuel = state.expenses.filter(e => e.vehicleId === v.id && e.category === "Fuel").reduce((sum, e) => sum + e.amount, 0);
                const maint = state.expenses.filter(e => e.vehicleId === v.id && e.category === "Maintenance").reduce((sum, e) => sum + e.amount, 0);
                const other = state.expenses.filter(e => e.vehicleId === v.id && e.category !== "Fuel" && e.category !== "Maintenance").reduce((sum, e) => sum + e.amount, 0);
                const roi = calculateROI(rev, fuel, maint, other, v.acquisitionCost);
                const isPositive = roi !== null && roi >= 0;

                return (
                  <div key={v.id} style={{ border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-base)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: "0.875rem" }}>
                      <span>{v.name}</span>
                      <span style={{ color: isPositive ? "var(--success-base)" : "var(--danger-base)" }}>
                        {roi !== null ? `ROI: ${roi.toFixed(2)}%` : "N/A"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "6px" }}>
                      <span>Rev: ${rev.toLocaleString()}</span>
                      <span>OpEx: ${(fuel + maint + other).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
