import React, { useState } from "react";

export default function Drivers({ user, state, onUpdateState }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "", fullName: "", contactNumber: "", emergencyContact: "",
    licenceNumber: "", licenceCategory: "Heavy Truck", licenceExpiryDate: "", licenceIssueDate: ""
  });
  const [formError, setFormError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // View vs Manage logic
  const canManage = user.role === "Safety Officer" || user.role === "System Administrator";

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!canManage) return;

    try {
      const res = await fetch("http://localhost:3001/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": user.role, "x-user-emp": user.employeeId },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onUpdateState();
      setShowAddForm(false);
      setFormData({ employeeId: "", fullName: "", contactNumber: "", emergencyContact: "", licenceNumber: "", licenceCategory: "Heavy Truck", licenceExpiryDate: "", licenceIssueDate: "" });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Available") return <span className="badge badge-success">Available</span>;
    if (status === "On Trip") return <span className="badge badge-info">On Trip</span>;
    if (status === "Off Duty") return <span className="badge badge-neutral">Off Duty</span>;
    return <span className="badge badge-warning">{status}</span>;
  };

  const renderCompliance = (d) => {
    const now = new Date();
    const expiry = new Date(d.licenceExpiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (d.complianceStatus === "Suspended") {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--danger)", fontWeight: 600 }}>⚠️ Suspended</span>
        </div>
      );
    }
    
    if (diffDays <= 0) {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--danger)", fontWeight: 600 }}>⚠️ Expired</span>
          <div style={{ fontSize: "0.7rem", color: "var(--danger)", marginTop: "2px" }}>Licence expired</div>
        </div>
      );
    }
    
    if (diffDays <= 7) {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--danger-base)", fontWeight: 600 }}>⚠️ Urgent (7d)</span>
          <div style={{ fontSize: "0.7rem", color: "var(--danger-base)", marginTop: "2px" }}>Licence exp: {diffDays}d</div>
        </div>
      );
    }
    
    if (diffDays <= 15) {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--warning)", fontWeight: 600 }}>⚠️ Attention (15d)</span>
          <div style={{ fontSize: "0.7rem", color: "var(--warning)", marginTop: "2px" }}>Licence exp: {diffDays}d</div>
        </div>
      );
    }
    
    if (diffDays <= 30) {
      return (
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--warning-base)", fontWeight: 600 }}>⚠️ Early Warning (30d)</span>
          <div style={{ fontSize: "0.7rem", color: "var(--warning-base)", marginTop: "2px" }}>Licence exp: {diffDays}d</div>
        </div>
      );
    }

    return <span style={{ fontSize: "0.8rem", color: "var(--success-base)", fontWeight: 600 }}>Compliant</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Personnel Registry</h2>
          <p>Driver performance, availability, and compliance tracking</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "View Personnel List" : "➕ Onboard Driver"}
          </button>
        )}
      </div>

      {showAddForm && canManage ? (
        <div className="card" style={{ maxWidth: "700px" }}>
          <h3 className="card-title" style={{ marginBottom: "1.25rem" }}>Onboard New Driver</h3>
          {formError && <div className="inline-error">⚠️ {formError}</div>}
          
          <form onSubmit={handleCreateDriver} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="form-input" name="fullName" required value={formData.fullName} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Employee ID</label><input type="text" className="form-input" name="employeeId" required value={formData.employeeId} onChange={handleInputChange} placeholder="EMP-XXX" /></div>
            <div className="form-group"><label className="form-label">Contact Number</label><input type="tel" className="form-input" name="contactNumber" required value={formData.contactNumber} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Emergency Contact</label><input type="tel" className="form-input" name="emergencyContact" required value={formData.emergencyContact} onChange={handleInputChange} /></div>
            <div className="form-group" style={{ gridColumn: "span 2" }}><hr style={{ borderColor: "var(--border-subtle)", margin: "0.5rem 0" }}/></div>
            <div className="form-group"><label className="form-label">Licence Number</label><input type="text" className="form-input" name="licenceNumber" required value={formData.licenceNumber} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Licence Class</label><select className="form-select" name="licenceCategory" value={formData.licenceCategory} onChange={handleInputChange}><option value="Heavy Truck">Heavy Truck</option><option value="LGC/Van">LGC/Van</option><option value="Electric Semi">Electric Semi</option></select></div>
            <div className="form-group"><label className="form-label">Issue Date</label><input type="date" className="form-input" name="licenceIssueDate" required value={formData.licenceIssueDate} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">Expiry Date</label><input type="date" className="form-input" name="licenceExpiryDate" required value={formData.licenceExpiryDate} onChange={handleInputChange} /></div>
            
            <div style={{ gridColumn: "span 2", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Complete Onboarding</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Identity</th>
                <th>Licence Data</th>
                <th>Ops Status</th>
                <th>Compliance</th>
                <th>Safety Score</th>
                <th>Experience</th>
              </tr>
            </thead>
            <tbody>
              {state.drivers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
                    No personnel records found.
                  </td>
                </tr>
              )}
              {state.drivers.map(d => {
                const isExpiring = d.complianceStatus === "Expiring Soon";
                const isInvalid = d.complianceStatus === "Expired" || d.complianceStatus === "Suspended";
                return (
                  <tr key={d.id} onClick={() => setSelectedDriver(d)} style={{ cursor: "pointer", transition: "background-color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.fullName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>{d.employeeId}</div>
                    </td>
                    <td>
                      <div className="text-mono" style={{ fontSize: "0.8rem" }}>{d.licenceNumber}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>Class: {d.licenceCategory}</div>
                    </td>
                    <td>{getStatusBadge(d.operationalStatus)}</td>
                    <td>{renderCompliance(d)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "60px", height: "6px", backgroundColor: "var(--bg-elevated)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ 
                            height: "100%", width: `${d.safetyScore}%`, 
                            backgroundColor: d.safetyScore > 85 ? "var(--success-base)" : d.safetyScore > 70 ? "var(--warning-base)" : "var(--danger-base)" 
                          }} />
                        </div>
                        <span style={{ fontSize: "0.75rem" }}>{d.safetyScore}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.8rem" }}>
                      <div>{d.totalCompletedTrips} trips</div>
                      <div style={{ color: "var(--text-tertiary)" }}>{d.totalDistanceDriven.toLocaleString()} km</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedDriver && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease" }} 
             onClick={() => setSelectedDriver(null)}
             onKeyDown={(e) => { if(e.key === 'Escape') setSelectedDriver(null); }} 
             tabIndex={0} autoFocus>
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)", animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onClick={e => e.stopPropagation()}>
            {/* HEADER */}
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem", fontWeight: "bold" }}>
                  {selectedDriver.fullName.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.5rem" }}>{selectedDriver.fullName}</h3>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", gap: "10px", marginTop: "4px" }}>
                    <span>{selectedDriver.employeeId}</span>
                    <span>•</span>
                    <span>{selectedDriver.employmentStatus}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    {getStatusBadge(selectedDriver.operationalStatus)}
                    <span className={`badge ${selectedDriver.complianceStatus === 'Compliant' || selectedDriver.complianceStatus === 'Valid' ? 'badge-success' : 'badge-danger'}`}>{selectedDriver.complianceStatus}</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDriver(null)}>✕ Close</button>
            </div>
            
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* LICENCE & ELIGIBILITY */}
              <div>
                <h4 style={{ marginBottom: "1rem", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Licence & Eligibility</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ background: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Licence Details</div>
                    {["System Administrator", "Safety Officer", "Fleet Manager"].includes(user.role) ? (
                      <div style={{ fontSize: "1rem", fontFamily: "monospace", fontWeight: 600 }}>{selectedDriver.licenceNumber}</div>
                    ) : (
                      <div style={{ fontSize: "1rem", fontFamily: "monospace", color: "var(--text-tertiary)" }}>••••-••••-•••• (Masked)</div>
                    )}
                    <div style={{ fontSize: "0.875rem", marginTop: "4px" }}>Class: {selectedDriver.licenceCategory}</div>
                    <div style={{ fontSize: "0.875rem" }}>Expires: {new Date(selectedDriver.licenceExpiryDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ background: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Dispatch Eligibility</div>
                    {selectedDriver.operationalStatus === "Available" && selectedDriver.complianceStatus !== "Suspended" && selectedDriver.complianceStatus !== "Expired" ? (
                      <div>
                        <div style={{ color: "var(--success)", fontWeight: 600 }}>Eligible for Dispatch</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Can drive: {selectedDriver.licenceCategory} vehicles</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ color: "var(--danger)", fontWeight: 600 }}>Not Eligible</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Blocker: {selectedDriver.operationalStatus !== "Available" ? selectedDriver.operationalStatus : selectedDriver.complianceStatus}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PERFORMANCE */}
              <div>
                <h4 style={{ marginBottom: "1rem", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Performance Metrics</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div style={{ background: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Completed Trips</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{selectedDriver.totalCompletedTrips}</div>
                  </div>
                  <div style={{ background: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Total Distance</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{selectedDriver.totalDistanceDriven.toLocaleString()} km</div>
                  </div>
                  <div style={{ background: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Safety Score</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: selectedDriver.safetyScore > 85 ? "var(--success)" : selectedDriver.safetyScore > 70 ? "var(--warning)" : "var(--danger)" }}>
                      {selectedDriver.safetyScore}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* ASSIGNMENTS */}
              <div>
                <h4 style={{ marginBottom: "1rem", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Recent Assignments</h4>
                {(() => {
                  const driverTrips = state.trips.filter(t => t.driverId === selectedDriver.id).sort((a,b) => new Date(b.date) - new Date(a.date));
                  const activeTrip = driverTrips.find(t => ["Dispatched", "In Transit", "Arrived"].includes(t.status));
                  const pastTrips = driverTrips.filter(t => t.status === "Completed").slice(0,3);

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {activeTrip ? (
                        <div style={{ padding: "1rem", border: "1px solid var(--info-base)", borderRadius: "var(--radius-md)", background: "var(--info-bg)" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--info)", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>Current Active Trip</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontWeight: 600 }}>{activeTrip.source} ➔ {activeTrip.destination}</div>
                            <span className="badge badge-info">{activeTrip.status}</span>
                          </div>
                          <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>Vehicle: {state.vehicles.find(v => v.id === activeTrip.vehicleId)?.registrationNumber || activeTrip.vehicleId}</div>
                        </div>
                      ) : (
                        <div style={{ color: "var(--text-tertiary)", fontStyle: "italic", fontSize: "0.85rem" }}>No current active trip.</div>
                      )}
                      
                      {pastTrips.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Last 3 Completed Trips</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {pastTrips.map(t => (
                              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{t.source} ➔ {t.destination}</div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{new Date(t.date).toLocaleDateString()}</div>
                                </div>
                                <div><span className="badge badge-success">Completed</span></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* CONTACT DETAILS (RBAC PROTECTED) */}
              {["System Administrator", "Safety Officer", "Fleet Manager"].includes(user.role) && (
                <div>
                  <h4 style={{ marginBottom: "1rem", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Contact Details (Restricted)</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ background: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Primary Phone</div>
                      <div style={{ fontSize: "1rem" }}>📞 {selectedDriver.contactNumber}</div>
                    </div>
                    <div style={{ background: "var(--danger-bg)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginBottom: "4px", fontWeight: 600 }}>Emergency Contact</div>
                      <div style={{ fontSize: "1rem", color: "var(--text-main)" }}>⚠️ {selectedDriver.emergencyContact}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
