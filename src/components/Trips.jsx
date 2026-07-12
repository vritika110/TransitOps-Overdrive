import React, { useState } from "react";

export default function Trips({ user, state, onUpdateState }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'complete', 'cancel', 'smart-assign'
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  const [formData, setFormData] = useState({
    source: "", destination: "", vehicleId: "", driverId: "",
    cargoDescription: "", cargoWeight: "", plannedDistance: "",
    plannedStart: "", expectedCompletion: "", revenue: ""
  });
  
  const [completionData, setCompletionData] = useState({ finalOdometer: "", fuelConsumed: "" });
  const [cancellationReason, setCancellationReason] = useState("");
  const [formError, setFormError] = useState(null);
  const [modalError, setModalError] = useState(null);
  
  const [smartRecommendations, setSmartRecommendations] = useState([]);
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  
  const [priceEstimate, setPriceEstimate] = useState(null);

  // RBAC
  const canManage = user.role === "Dispatcher" || user.role === "System Administrator";
  const canViewFinancials = user.role === "Fleet Manager" || user.role === "Financial Analyst" || user.role === "System Administrator";

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  React.useEffect(() => {
    if (canViewFinancials && formData.plannedDistance && formData.vehicleId) {
      const fetchEstimate = async () => {
        try {
          const res = await fetch("/api/trips/price-estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
            body: JSON.stringify({ distance: formData.plannedDistance, vehicleId: formData.vehicleId })
          });
          if (res.ok) {
            const data = await res.json();
            setPriceEstimate(data);
          }
        } catch (e) {
          console.error("Price estimation failed", e);
        }
      };
      // Debounce slightly to avoid spamming
      const timeoutId = setTimeout(fetchEstimate, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setPriceEstimate(null);
    }
  }, [formData.plannedDistance, formData.vehicleId, canViewFinancials, user]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!canManage) return;

    try {
      const payload = { ...formData };
      if (!canViewFinancials) {
        payload.revenue = 1000; 
      }

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onUpdateState();
      setShowAddForm(false);
      setFormData({ source: "", destination: "", vehicleId: "", driverId: "", cargoDescription: "", cargoWeight: "", plannedDistance: "", plannedStart: "", expectedCompletion: "", revenue: "" });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDispatch = async (tripId) => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/trips/${tripId}/dispatch`, {
        method: "POST", headers: { "x-user-role": user.role, "x-user-emp": user.employeeId }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdateState();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setModalError(null);
    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify(completionData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdateState();
      setActiveModal(null);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    setModalError(null);
    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify({ cancellationReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdateState();
      setActiveModal(null);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const invokeSmartAssign = async () => {
    if (!formData.cargoWeight || !formData.plannedStart || !formData.expectedCompletion) {
      setFormError("Smart Assign requires Cargo Weight, Planned Departure, and Expected Arrival fields to be filled first.");
      return;
    }
    setFormError(null);
    setIsSmartLoading(true);
    setActiveModal('smart-assign');
    
    try {
      const res = await fetch("/api/trips/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify({
          cargoWeight: formData.cargoWeight,
          plannedStart: formData.plannedStart,
          expectedCompletion: formData.expectedCompletion
        })
      });
      const data = await res.json();
      setSmartRecommendations(data.recommendations || []);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSmartLoading(false);
    }
  };

  const acceptRecommendation = (rec) => {
    setFormData({ ...formData, vehicleId: rec.vehicle.id, driverId: rec.driver.id });
    setActiveModal(null);
  };

  const getStatusBadge = (status) => {
    if (status === "Completed") return <span className="badge badge-success">Completed</span>;
    if (status === "In Transit" || status === "Dispatched") return <span className="badge badge-info">{status}</span>;
    if (status === "Cancelled") return <span className="badge badge-danger">Cancelled</span>;
    return <span className="badge badge-neutral">{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Operations & Dispatch</h2>
          <p>Active route tracking and lifecycle management</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "View Active Operations" : "➕ Plan Route"}
          </button>
        )}
      </div>

      {showAddForm && canManage ? (
        <div className="card" style={{ maxWidth: "800px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 className="card-title" style={{ margin: 0 }}>Route Planning Engine</h3>
            <button type="button" className="btn btn-sm" style={{ backgroundColor: "var(--accent)", color: "white" }} onClick={invokeSmartAssign}>
              🪄 Smart Assign
            </button>
          </div>
          
          {formError && <div className="inline-error" style={{ marginBottom: "1rem" }}>⚠️ {formError}</div>}
          
          <form onSubmit={handleCreateTrip} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group"><label className="form-label">Origin / Source</label><input type="text" className="form-input" name="source" required value={formData.source} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Destination</label><input type="text" className="form-input" name="destination" required value={formData.destination} onChange={handleInputChange} /></div>
            
            <div className="form-group" style={{ gridColumn: "span 2" }}><label className="form-label">Manifest / Cargo Description</label><input type="text" className="form-input" name="cargoDescription" required value={formData.cargoDescription} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Cargo Weight (kg)</label><input type="number" className="form-input" name="cargoWeight" required min="1" value={formData.cargoWeight} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Estimated Distance (km)</label><input type="number" className="form-input" name="plannedDistance" required min="1" value={formData.plannedDistance} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Planned Departure</label><input type="datetime-local" className="form-input" name="plannedStart" required value={formData.plannedStart} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Expected Arrival</label><input type="datetime-local" className="form-input" name="expectedCompletion" required value={formData.expectedCompletion} onChange={handleInputChange} /></div>
            
            <div className="form-group" style={{ gridColumn: "span 2" }}><hr style={{ borderColor: "var(--border-color)", margin: "0.5rem 0" }}/></div>
            
            <div className="form-group">
              <label className="form-label">Assigned Asset</label>
              <select className="form-select" name="vehicleId" required value={formData.vehicleId} onChange={handleInputChange}>
                <option value="">-- Select Available Vehicle --</option>
                {state.vehicles.filter(v => v.operationalStatus === "Available" && v.maintenanceStatus === "Clear" && v.complianceStatus === "Compliant" && (!formData.cargoWeight || v.maxLoadCapacity >= Number(formData.cargoWeight))).map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber}) - {v.maxLoadCapacity}kg cap</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Assigned Driver</label>
              <select className="form-select" name="driverId" required value={formData.driverId} onChange={handleInputChange}>
                <option value="">-- Select Available Driver --</option>
                {state.drivers.filter(d => {
                  if (d.operationalStatus !== "Available" || d.complianceStatus === "Expired" || d.complianceStatus === "Suspended") return false;
                  if (formData.vehicleId) {
                    const selectedVehicle = state.vehicles.find(v => v.id === formData.vehicleId);
                    if (selectedVehicle && !d.permittedVehicleCategories.includes(selectedVehicle.vehicleType)) return false;
                  }
                  return true;
                }).map(d => (
                  <option key={d.id} value={d.id}>{d.fullName} (Class: {d.licenceCategory})</option>
                ))}
              </select>
            </div>

            {canViewFinancials && (
              <div style={{ gridColumn: "span 2", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Quoted Revenue ($)</label>
                  <input type="number" className="form-input" name="revenue" required min="0" value={formData.revenue} onChange={handleInputChange} />
                </div>
                
                {priceEstimate && (
                  <div style={{ flex: 2, background: "var(--bg-tertiary)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: 600 }}>
                      <span style={{ color: "var(--accent)" }}>Dynamic Pricing Estimate</span>
                      <span>Target Price: ${priceEstimate.suggestedPrice.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", color: "var(--text-secondary)" }}>
                      <div>Fuel: ${priceEstimate.fuelCost.toFixed(2)}</div>
                      <div>Wear & Tear: ${priceEstimate.wearCost.toFixed(2)}</div>
                      <div>Base Ops Cost: ${priceEstimate.baseCost.toFixed(2)}</div>
                      <div>Demand Multiplier: {priceEstimate.demandMultiplier}x</div>
                      <div>Markup Target: {((priceEstimate.targetMarkupMultiplier - 1) * 100).toFixed(0)}%</div>
                    </div>
                    
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      <div style={{ marginBottom: "4px", fontWeight: 600, color: "var(--text-secondary)" }}>Pricing Variables & Fallbacks:</div>
                      <div>• Fuel Efficiency: {priceEstimate.appliedEfficiency} km/L {priceEstimate.isFallbackEfficiency ? <span style={{ color: "var(--warning)" }}>(System Default)</span> : <span>(Vehicle Actual)</span>}</div>
                      <div>• Fuel Price: ${priceEstimate.appliedFuelPrice.toFixed(2)}/L (System Default)</div>
                      <div>• Wear Factor: ${priceEstimate.appliedWearFactor.toFixed(2)}/km (System Default)</div>
                    </div>
                    <button type="button" className="btn btn-sm btn-secondary" style={{ marginTop: "8px" }} onClick={() => setFormData({ ...formData, revenue: Math.round(priceEstimate.suggestedPrice) })}>
                      Apply Suggested Quote
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ gridColumn: "span 2", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Draft Route Plan</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Routing & Tracking</th>
                <th>Manifest</th>
                <th>Assigned To</th>
                <th>Schedule</th>
                <th>Status</th>
                {canViewFinancials && <th>Financials</th>}
                {canManage && <th>Command Actions</th>}
              </tr>
            </thead>
            <tbody>
              {state.trips.length === 0 && (
                <tr>
                  <td colSpan={canManage ? (canViewFinancials ? 7 : 6) : (canViewFinancials ? 6 : 5)} style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                    No active operations found.
                  </td>
                </tr>
              )}
              {state.trips.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.source}</div>
                    <div style={{ color: "var(--text-tertiary)", margin: "2px 0", fontSize: "0.8rem" }}>↓</div>
                    <div style={{ fontWeight: 600 }}>{t.destination}</div>
                    {t.trackingToken && (
                      <div style={{ marginTop: "8px", fontSize: "0.7rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Tracking ID:</span><br/>
                        <code style={{ background: "var(--bg-tertiary)", padding: "2px 4px", borderRadius: "2px", display: "inline-block", marginTop: "2px", userSelect: "all" }}>{t.trackingToken}</code>
                        <button 
                          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", marginLeft: "4px", fontSize: "0.7rem", padding: 0 }}
                          onClick={() => { navigator.clipboard.writeText(t.trackingToken); alert("Tracking ID copied to clipboard!"); }}
                          title="Copy Tracking ID"
                        >
                          [Copy]
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{t.cargoDescription}</div>
                    <div className="text-secondary" style={{ fontSize: "0.75rem", marginTop: "2px" }}>{t.cargoWeight} kg · {t.plannedDistance} km</div>
                  </td>
                  <td>
                    <div className="text-secondary" style={{ fontSize: "0.8rem" }}>{t.vehicleId}</div>
                    <div className="text-secondary" style={{ fontSize: "0.8rem" }}>{t.driverId}</div>
                  </td>
                  <td style={{ fontSize: "0.8rem" }}>
                    <div><span className="text-tertiary">Dep:</span> {new Date(t.plannedStart).toLocaleDateString()}</div>
                    <div><span className="text-tertiary">Arr:</span> {new Date(t.expectedCompletion).toLocaleDateString()}</div>
                  </td>
                  <td>{getStatusBadge(t.status)}</td>
                  {canViewFinancials && (
                    <td className="font-semibold">{t.revenue ? `$${t.revenue.toLocaleString()}` : "—"}</td>
                  )}
                  {canManage && (
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {t.status === "Scheduled" && <button className="btn btn-primary btn-sm" onClick={() => handleDispatch(t.id)}>Dispatch</button>}
                        {(t.status === "Scheduled" || t.status === "Dispatched" || t.status === "In Transit") && (
                          <button className="btn btn-danger btn-sm" onClick={() => { setSelectedTrip(t); setActiveModal('cancel'); }}>Abort</button>
                        )}
                        {(t.status === "Dispatched" || t.status === "In Transit") && (
                          <button className="btn btn-primary btn-sm" style={{ backgroundColor: "var(--success-base)" }} onClick={() => { setSelectedTrip(t); setActiveModal('complete'); }}>Complete</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Smart Assign Modal */}
      {activeModal === 'smart-assign' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <h3 className="card-title">Intelligent Recommendation Engine</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Analyzing operational data to suggest optimal resource pairing.
            </p>
            
            {isSmartLoading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>Processing variables...</div>
            ) : smartRecommendations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--danger)" }}>No eligible vehicle-driver combinations found.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {smartRecommendations.map((rec, idx) => (
                  <div key={idx} style={{ 
                    border: `1px solid ${idx === 0 ? 'var(--accent)' : 'var(--border-color)'}`, 
                    borderRadius: "var(--radius-md)", 
                    padding: "16px",
                    backgroundColor: idx === 0 ? "rgba(245,158,11,0.05)" : "var(--bg-card)", /* Using amber accent for primary */
                    position: "relative"
                  }}>
                    {idx === 0 && <span className="badge" style={{ backgroundColor: "var(--accent)", color: "white", position: "absolute", top: "-10px", right: "16px" }}>Optimal Match — {rec.score}%</span>}
                    {idx > 0 && <span className="badge badge-neutral" style={{ position: "absolute", top: "16px", right: "16px" }}>Alternative — {rec.score}%</span>}
                    
                    <div style={{ display: "flex", gap: "24px" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Asset</div>
                        <div style={{ fontWeight: 600 }}>{rec.vehicle.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{rec.vehicle.maxLoadCapacity}kg • {rec.vehicle.vehicleType}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Driver</div>
                        <div style={{ fontWeight: 600 }}>{rec.driver.fullName}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Safety: {rec.driver.safetyScore}/100</div>
                      </div>
                    </div>
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-color)", fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--text-tertiary)", marginRight: "8px" }}>Reasoning:</span>
                      <span style={{ color: "var(--text-secondary)" }}>{rec.reasons}</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: "100%", marginTop: "12px", borderColor: idx === 0 ? "var(--accent)" : "" }} onClick={() => acceptRecommendation(rec)}>
                      Use Assignment
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {activeModal === 'complete' && selectedTrip && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="card-title">Finalize Operation {selectedTrip.id}</h3>
            {modalError && <div className="inline-error">{modalError}</div>}
            <form onSubmit={handleComplete}>
              <div className="form-group">
                <label className="form-label">Final Odometer Reading</label>
                <input type="number" className="form-input" required min={selectedTrip.startingOdometer} value={completionData.finalOdometer} onChange={e => setCompletionData({...completionData, finalOdometer: e.target.value})} />
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "4px" }}>Must be ≥ {selectedTrip.startingOdometer} km</div>
              </div>
              <div className="form-group">
                <label className="form-label">Total Fuel Consumed (Liters)</label>
                <input type="number" className="form-input" required min="0" value={completionData.fuelConsumed} onChange={e => setCompletionData({...completionData, fuelConsumed: e.target.value})} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: "var(--success-base)" }}>Confirm Completion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {activeModal === 'cancel' && selectedTrip && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="card-title">Abort Operation {selectedTrip.id}</h3>
            {modalError && <div className="inline-error">{modalError}</div>}
            <form onSubmit={handleCancel}>
              <div className="form-group">
                <label className="form-label">Reason for Abort</label>
                <textarea className="form-textarea" required rows="3" value={cancellationReason} onChange={e => setCancellationReason(e.target.value)} placeholder="Enter details..." />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Back</button>
                <button type="submit" className="btn btn-danger">Confirm Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
