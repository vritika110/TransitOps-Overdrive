import React, { useState, useEffect } from "react";

export default function Maintenance({ user, state, onUpdateState }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedCompletion, setExpectedCompletion] = useState("");
  const [cost, setCost] = useState("");
  const [formError, setFormError] = useState(null);
  
  const [intelligence, setIntelligence] = useState([]);
  const [isIntelligenceLoading, setIsIntelligenceLoading] = useState(false);

  const canManage = user.role === "Fleet Manager" || user.role === "System Administrator";
  const canViewFinancials = user.role === "Fleet Manager" || user.role === "Financial Analyst" || user.role === "System Administrator";

  useEffect(() => {
    async function fetchIntelligence() {
      if (user.role === "Dispatcher" || user.role === "Safety Officer") return;
      setIsIntelligenceLoading(true);
      try {
        const res = await fetch("/api/maintenance/intelligence", {
          headers: { "x-user-role": user.role, "x-user-emp": user.employeeId }
        });
        const data = await res.json();
        setIntelligence(data.actionable || []);
      } catch (e) {
        console.error("Failed to load intelligence", e);
      } finally {
        setIsIntelligenceLoading(false);
      }
    }
    fetchIntelligence();
  }, [user.role, user.employeeId]);

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!canManage) return;

    try {
      const payload = { vehicleId, serviceType, description, startDate, expectedCompletion, cost: canViewFinancials ? Number(cost) : 0 };
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdateState();
      setShowAddForm(false);
      setVehicleId(""); setServiceType(""); setDescription(""); setCost("");
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleCompleteMaintenance = async (id) => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/maintenance/${id}/complete`, {
        method: "POST",
        headers: { "x-user-role": user.role, "x-user-emp": user.employeeId }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdateState();
    } catch (err) {
      alert(err.message);
    }
  };
  
  const scheduleFromIntelligence = (vId) => {
    setVehicleId(vId);
    setServiceType("Proactive Maintenance");
    setStartDate(new Date().toISOString().split("T")[0]);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3);
    setExpectedCompletion(nextWeek.toISOString().split("T")[0]);
    setShowAddForm(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Shop & Maintenance Logs</h2>
          <p>Active shop tickets and proactive diagnostics intelligence</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "View Active Work Orders" : "➕ Open Work Order"}
          </button>
        )}
      </div>

      {!showAddForm && intelligence.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "4px solid var(--accent)", backgroundColor: "rgba(245, 158, 11, 0.05)" }}>
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>🧠</span> Proactive Health Intelligence
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            The system has identified vehicles at elevated risk based on real-time performance data, historical wear, and current compliance data.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {intelligence.map(intel => (
              <div key={intel.vehicleId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600 }}>{intel.vehicle.name}</span>
                    <span className={`badge ${intel.riskScore >= 80 ? 'badge-danger' : 'badge-warning'}`}>
                      Risk Score: {intel.riskScore}/100
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Diagnosis:</span> {intel.classification}. {intel.factors.join(" ")}
                  </div>
                </div>
                {canManage && (
                  <button className="btn btn-secondary btn-sm" onClick={() => scheduleFromIntelligence(intel.vehicleId)}>
                    Schedule Service
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddForm && canManage ? (
        <div className="card" style={{ maxWidth: "640px" }}>
          <h3 className="card-title" style={{ marginBottom: "1.25rem" }}>Open Maintenance Work Order</h3>
          {formError && <div className="inline-error">⚠️ {formError}</div>}
          <form onSubmit={handleCreateMaintenance} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group"><label className="form-label">Select Asset</label><select className="form-select" required value={vehicleId} onChange={e => setVehicleId(e.target.value)}><option value="">-- Choose asset --</option>{state.vehicles.filter(v => v.operationalStatus !== "Retired").map(v => (<option key={v.id} value={v.id}>{v.name} ({v.registrationNumber}) - {v.operationalStatus}</option>))}</select></div>
            <div className="form-group"><label className="form-label">Service Type</label><input type="text" className="form-input" required value={serviceType} onChange={e => setServiceType(e.target.value)} placeholder="e.g. Brake Pad Replacement" /></div>
            <div className="form-group" style={{ gridColumn: "span 2" }}><label className="form-label">Diagnostics Details</label><textarea className="form-textarea" required rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter details..." /></div>
            <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" required value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Expected Completion</label><input type="date" className="form-input" required value={expectedCompletion} onChange={e => setExpectedCompletion(e.target.value)} /></div>
            {canViewFinancials && (
              <div className="form-group"><label className="form-label">Estimated Cost ($)</label><input type="number" className="form-input" value={cost} onChange={e => setCost(e.target.value)} placeholder="1200" /></div>
            )}
            <div style={{ gridColumn: "span 2", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Create Work Order</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Asset ID</th>
                <th>Service Type</th>
                <th>Schedule</th>
                {canViewFinancials && <th>Cost</th>}
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {state.maintenance.length === 0 && (
                <tr>
                  <td colSpan={canManage ? (canViewFinancials ? 7 : 6) : (canViewFinancials ? 6 : 5)} style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                    No maintenance orders.
                  </td>
                </tr>
              )}
              {state.maintenance.map(m => (
                <tr key={m.id}>
                  <td className="font-semibold text-secondary">{m.id}</td>
                  <td>{m.vehicleId}</td>
                  <td>
                    <div className="font-semibold">{m.serviceType}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>{m.description}</div>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{m.startDate} ➔ {m.expectedCompletion}</td>
                  {canViewFinancials && (
                    <td className="text-mono">{m.cost ? `$${m.cost.toLocaleString()}` : '—'}</td>
                  )}
                  <td>
                    <span className={`badge ${m.status === "Completed" ? "badge-success" : "badge-warning"}`}>{m.status}</span>
                  </td>
                  {canManage && (
                    <td>
                      {m.status === "Active" && (
                        <button className="btn btn-primary btn-sm" style={{ backgroundColor: "var(--success-base)" }} onClick={() => handleCompleteMaintenance(m.id)}>Sign Off</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
