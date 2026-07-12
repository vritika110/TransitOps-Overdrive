import React, { useState } from "react";

export default function Vehicles({ user, state, onUpdateState }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: "", name: "", make: "", model: "",
    vehicleType: "Heavy Truck", maxLoadCapacity: "", odometer: "",
    acquisitionCost: "", fuelType: "Diesel"
  });
  const [formError, setFormError] = useState(null);

  // Role-Based Authorization
  const canManage = user.role === "Fleet Manager" || user.role === "System Administrator";
  const canViewFinancials = user.role === "Fleet Manager" || user.role === "System Administrator" || user.role === "Financial Analyst";

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!canManage) return;

    try {
      const res = await fetch("http://localhost:3001/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onUpdateState();
      setShowAddForm(false);
      setFormData({ registrationNumber: "", name: "", make: "", model: "", vehicleType: "Heavy Truck", maxLoadCapacity: "", odometer: "", acquisitionCost: "", fuelType: "Diesel" });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Available") return <span className="badge badge-success">Available</span>;
    if (status === "On Trip") return <span className="badge badge-info">On Trip</span>;
    if (status === "Retired" || status === "Off Road") return <span className="badge badge-danger">{status}</span>;
    return <span className="badge badge-neutral">{status}</span>;
  };

  const getMaintBadge = (status) => {
    if (status === "Clear") return <span className="badge badge-success">Clear</span>;
    if (status === "In Shop") return <span className="badge badge-warning">In Shop</span>;
    return <span className="badge badge-neutral">{status}</span>;
  };

  const renderCompliance = (v) => {
    const now = new Date();
    const checks = [
      { name: "Insurance", date: v.insuranceExpiry ? new Date(v.insuranceExpiry) : null },
      { name: "PUC", date: v.pucExpiry ? new Date(v.pucExpiry) : null },
      { name: "Permit", date: v.permitExpiry ? new Date(v.permitExpiry) : null },
      { name: "Road Tax", date: v.roadTaxExpiry ? new Date(v.roadTaxExpiry) : null }
    ];

    let highestSeverity = -1;
    const activeWarnings = [];

    checks.forEach(check => {
      if (!check.date) return;
      const diffTime = check.date - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        if (highestSeverity < 3) highestSeverity = 3;
        activeWarnings.push(`${check.name} (Expired)`);
      } else if (diffDays <= 7) {
        if (highestSeverity < 2) highestSeverity = 2;
        activeWarnings.push(`${check.name} (${diffDays}d)`);
      } else if (diffDays <= 15) {
        if (highestSeverity < 1) highestSeverity = 1;
        activeWarnings.push(`${check.name} (${diffDays}d)`);
      } else if (diffDays <= 30) {
        if (highestSeverity < 0) highestSeverity = 0;
        activeWarnings.push(`${check.name} (${diffDays}d)`);
      }
    });

    if (highestSeverity === 3) {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--danger)", fontWeight: 600 }}>⚠️ Non-Compliant</span>
          <div style={{ fontSize: "0.7rem", color: "var(--danger)", marginTop: "2px" }}>{activeWarnings.join(", ")}</div>
        </div>
      );
    }
    if (highestSeverity === 2) {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--danger-base)", fontWeight: 600 }}>⚠️ Urgent (7d)</span>
          <div style={{ fontSize: "0.7rem", color: "var(--danger-base)", marginTop: "2px" }}>{activeWarnings.join(", ")}</div>
        </div>
      );
    }
    if (highestSeverity === 1) {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--warning)", fontWeight: 600 }}>⚠️ Attention (15d)</span>
          <div style={{ fontSize: "0.7rem", color: "var(--warning)", marginTop: "2px" }}>{activeWarnings.join(", ")}</div>
        </div>
      );
    }
    if (highestSeverity === 0) {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--warning-base)", fontWeight: 600 }}>⚠️ Early Warning (30d)</span>
          <div style={{ fontSize: "0.7rem", color: "var(--warning-base)", marginTop: "2px" }}>{activeWarnings.join(", ")}</div>
        </div>
      );
    }

    return <span style={{ fontSize: "0.8rem", color: "var(--success-base)", fontWeight: 600 }}>Compliant</span>;
  };

  const renderSmartMaintenanceRisk = (v) => {
    let score = 0;
    const reasons = [];

    // Find last maintenance completion date
    const vehicleMaint = state.maintenance.filter(m => m.vehicleId === v.id && m.status === "Completed")
                                        .sort((a,b) => new Date(b.actualCompletion) - new Date(a.actualCompletion));
    const lastMaint = vehicleMaint[0];
    
    // Find distance driven since last maintenance
    let distanceSinceService = v.odometer; // Fallback if no maint history
    if (lastMaint) {
      const tripsSinceMaint = state.trips.filter(t => t.vehicleId === v.id && t.status === "Completed" && new Date(t.actualCompletionTimestamp) > new Date(lastMaint.actualCompletion));
      const dist = tripsSinceMaint.reduce((sum, t) => sum + t.actualDistance, 0);
      distanceSinceService = dist > 0 ? dist : 0;
      reasons.push(`${distanceSinceService.toLocaleString()}km since last service`);
    } else {
      reasons.push("No recorded service history");
    }

    // Distance Risk Contribution
    if (distanceSinceService > 20000) { score += 40; }
    else if (distanceSinceService > 10000) { score += 20; }
    else if (distanceSinceService > 5000) { score += 10; }

    // Recent Maintenance Frequency Contribution
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const recentMaintCount = vehicleMaint.filter(m => new Date(m.actualCompletion) > sixtyDaysAgo).length;
    
    if (recentMaintCount >= 2) {
      score += 30;
      reasons.push(`${recentMaintCount} services in last 60 days`);
    } else if (recentMaintCount === 1) {
      score += 10;
    }

    // Baseline age/odometer contribution
    if (v.odometer > 200000) {
      score += 15;
      reasons.push(`High global odometer (${v.odometer.toLocaleString()}km)`);
    }

    // Limit score
    score = Math.min(score, 100);

    let classification = "Healthy";
    let color = "var(--success)";
    if (score >= 80) { classification = "Critical Attention"; color = "var(--danger)"; }
    else if (score >= 60) { classification = "Maintenance Recommended"; color = "var(--warning)"; }
    else if (score >= 30) { classification = "Monitor"; color = "var(--warning-base)"; }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }}></div>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: color }}>{score} — {classification}</span>
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
          {reasons.join(" • ")}
        </div>
      </div>
    );
  };


  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Fleet Assets Registry</h2>
          <p>Global vehicle inventory and real-time operational status</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "View Registry" : "➕ Register Asset"}
          </button>
        )}
      </div>

      {showAddForm && canManage ? (
        <div className="card" style={{ maxWidth: "700px" }}>
          <h3 className="card-title" style={{ marginBottom: "1.25rem" }}>Register New Vehicle Asset</h3>
          {formError && <div className="inline-error">⚠️ {formError}</div>}
          
          <form onSubmit={handleCreateVehicle} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group"><label className="form-label">Asset Name / Callsign</label><input type="text" className="form-input" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Atlas Hauler" /></div>
            <div className="form-group"><label className="form-label">Registration / License Plate</label><input type="text" className="form-input" name="registrationNumber" required value={formData.registrationNumber} onChange={handleInputChange} placeholder="e.g. KA-01-AB-1234" /></div>
            <div className="form-group"><label className="form-label">Make</label><input type="text" className="form-input" name="make" required value={formData.make} onChange={handleInputChange} placeholder="Volvo" /></div>
            <div className="form-group"><label className="form-label">Model</label><input type="text" className="form-input" name="model" required value={formData.model} onChange={handleInputChange} placeholder="FH16" /></div>
            <div className="form-group"><label className="form-label">Classification</label><select className="form-select" name="vehicleType" value={formData.vehicleType} onChange={handleInputChange}><option value="Heavy Truck">Heavy Truck</option><option value="LGC/Van">LGC / Van</option><option value="Electric Semi">Electric Semi</option></select></div>
            <div className="form-group"><label className="form-label">Max Load Capacity (kg)</label><input type="number" className="form-input" name="maxLoadCapacity" required min="1" value={formData.maxLoadCapacity} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Initial Odometer (km)</label><input type="number" className="form-input" name="odometer" required min="0" value={formData.odometer} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Fuel Type</label><select className="form-select" name="fuelType" value={formData.fuelType} onChange={handleInputChange}><option value="Diesel">Diesel</option><option value="Petrol">Petrol</option><option value="Electric">Electric</option></select></div>
            
            {canViewFinancials && (
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Acquisition Cost ($)</label>
                <input type="number" className="form-input" name="acquisitionCost" required min="0" value={formData.acquisitionCost} onChange={handleInputChange} />
              </div>
            )}
            
            <div style={{ gridColumn: "span 2", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Register Asset</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Classification</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Maintenance</th>
                <th>Risk Score</th>
                <th>Compliance</th>
                {canViewFinancials && <th>Acq Cost</th>}
              </tr>
            </thead>
            <tbody>
              {state.vehicles.length === 0 && (
                <tr>
                  <td colSpan={canViewFinancials ? 8 : 7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                    No vehicles registered.
                  </td>
                </tr>
              )}
              {state.vehicles.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.registrationNumber}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{v.name} ({v.make} {v.model})</div>
                  </td>
                  <td>{v.vehicleType}</td>
                  <td>{v.maxLoadCapacity.toLocaleString()} kg</td>
                  <td>{getStatusBadge(v.operationalStatus)}</td>
                  <td>{getMaintBadge(v.maintenanceStatus)}</td>
                  <td>{renderSmartMaintenanceRisk(v)}</td>
                  <td>{renderCompliance(v)}</td>
                  {canViewFinancials && (
                    <td className="text-mono">
                      {v.acquisitionCost ? `$${v.acquisitionCost.toLocaleString()}` : '-'}
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
