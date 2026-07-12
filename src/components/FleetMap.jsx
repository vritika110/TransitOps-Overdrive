import React, { useState, useEffect } from "react";

export default function FleetMap({ user, state }) {
  const isClient = user?.role === "Logistics Client";
  
  // For Client
  const [tokenInput, setTokenInput] = useState("");
  const [trackedTrip, setTrackedTrip] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // For Admin
  const [selectedAdminTrip, setSelectedAdminTrip] = useState(null);
  const [adminTrips, setAdminTrips] = useState([]);
  const [showFinancials, setShowFinancials] = useState(false);

  useEffect(() => {
    if (!isClient && state && state.trips) {
      // Admin sees active trips (not Scheduled unless they want to see it, let's include all non-completed for operations)
      setAdminTrips(state.trips.filter(t => t.status !== "Completed" && t.status !== "Cancelled"));
    }
  }, [state, isClient]);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    
    setLoading(true);
    setError(null);
    setTrackedTrip(null);
    
    try {
      const res = await fetch(`/api/trips/track/${tokenInput.trim()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error("Tracking token not found or invalid."); // Generic 404 message
      }
      
      setTrackedTrip(data);
    } catch (err) {
      setError(err.message || "Tracking token not found or invalid.");
    } finally {
      setLoading(false);
    }
  };

  const renderMap = (trip) => {
    if (!trip) return null;

    const now = new Date();
    const plannedStart = new Date(trip.plannedStart);
    const expectedEnd = new Date(trip.expectedCompletion);
    const actualStart = trip.actualStart ? new Date(trip.actualStart) : null;

    const effectiveStart = actualStart || plannedStart;
    
    let progress = 0;
    let progressLabel = "Progress unavailable";

    if (!isNaN(effectiveStart.getTime()) && !isNaN(expectedEnd.getTime()) && expectedEnd > effectiveStart) {
      if (trip.status === "Scheduled") {
        progress = 0;
        progressLabel = "0% (Scheduled)";
      } else if (trip.status === "Completed") {
        progress = 1;
        progressLabel = "100% (Completed)";
      } else if (trip.status === "Cancelled") {
        progress = 0;
        progressLabel = "Operation Terminated";
      } else {
        const totalDuration = expectedEnd - effectiveStart;
        const elapsed = now - effectiveStart;
        progress = Math.max(0, Math.min(1, elapsed / totalDuration));
        progressLabel = `${(progress * 100).toFixed(0)}%`;
      }
    }

    return (
      <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem", overflow: "hidden" }}>
        
        {/* Status Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", margin: 0, color: "var(--text-main)" }}>
              {trip.source} → {trip.destination}
            </h2>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
              {isClient ? "Tracking ID" : "Trip ID"}: <code style={{ background: "var(--bg-tertiary)", padding: "2px 4px", borderRadius: "2px" }}>{isClient ? trip.id : trip.id}</code>
            </div>
          </div>
          <div style={{ padding: "6px 12px", borderRadius: "var(--radius-full)", fontSize: "0.8rem", fontWeight: 600, 
            background: trip.status === "Completed" ? "var(--success-bg)" : trip.status === "Cancelled" ? "var(--danger-bg)" : "var(--info-bg)",
            color: trip.status === "Completed" ? "var(--success-base)" : trip.status === "Cancelled" ? "var(--danger-base)" : "var(--info-base)"
          }}>
            {trip.status}
          </div>
        </div>

        {/* Abstract SVG Route Visualization */}
        <div style={{ position: "relative", height: "120px", width: "100%", background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", padding: "0 40px" }}>
          <svg width="100%" height="40" style={{ overflow: "visible" }}>
            {/* Background Track */}
            <line x1="0" y1="20" x2="100%" y2="20" stroke="var(--border-hover)" strokeWidth="4" strokeLinecap="round" />
            
            {/* Active Progress Track */}
            {progress > 0 && trip.status !== "Cancelled" && (
              <line 
                x1="0" y1="20" 
                x2={`${progress * 100}%`} y2="20" 
                stroke="var(--accent)" 
                strokeWidth="4" 
                strokeLinecap="round"
                style={{ transition: "x2 1s ease-in-out" }}
              />
            )}
            
            {/* Nodes */}
            <circle cx="0" cy="20" r="8" fill="var(--bg-primary)" stroke={progress > 0 ? "var(--accent)" : "var(--border-hover)"} strokeWidth="3" />
            <circle cx="100%" cy="20" r="8" fill="var(--bg-primary)" stroke={progress >= 1 && trip.status !== "Cancelled" ? "var(--accent)" : "var(--border-hover)"} strokeWidth="3" />
            
            {/* Moving Vehicle Marker */}
            {trip.status !== "Cancelled" && (
              <g style={{ transform: `translateX(calc(${progress * 100}% - ${progress > 0.5 ? 20 : 0}px))`, transition: "transform 1s ease-in-out" }}>
                <circle cx="0" cy="20" r="12" fill="var(--accent)" />
                <circle cx="0" cy="20" r="4" fill="white" />
                <text x="0" y="-15" textAnchor="middle" fill="var(--text-main)" fontSize="0.75rem" fontWeight="600">{progressLabel}</text>
              </g>
            )}
          </svg>
        </div>

        {/* Journey Timeline Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={{ background: "var(--bg-primary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Departure</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)" }}>{trip.source}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              {effectiveStart && !isNaN(effectiveStart.getTime()) ? effectiveStart.toLocaleString() : "Pending"}
            </div>
          </div>
          
          <div style={{ background: "var(--bg-primary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Expected Arrival (ETA)</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)" }}>{trip.destination}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              {expectedEnd && !isNaN(expectedEnd.getTime()) ? expectedEnd.toLocaleString() : "Pending"}
            </div>
          </div>
        </div>

        {!isClient && trip.cargoDescription && (
          <div style={{ background: "var(--bg-primary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
             <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Manifest</div>
             <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{trip.cargoDescription}</div>
          </div>
        )}

      </div>
    );
  };

  // ---------------------------------------------------------
  // RENDER: LOGISTICS CLIENT (Token Tracking Mode)
  // ---------------------------------------------------------
  if (isClient) {
    return (
      <div style={{ height: "100%", width: "100%", overflowY: "auto", padding: "2rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          <div style={{ marginBottom: "2rem", textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "0.5rem" }}>Track Shipment</h1>
            <p style={{ color: "var(--text-secondary)" }}>Enter your secure tracking token to view estimated journey progress.</p>
          </div>

          <form onSubmit={handleTrack} style={{ display: "flex", gap: "10px", marginBottom: "2rem" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 8f3d9k2m7q4..." 
              value={tokenInput} 
              onChange={e => setTokenInput(e.target.value)}
              style={{ flex: 1, padding: "14px", fontSize: "1rem" }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "0 24px" }} disabled={loading}>
              {loading ? "Locating..." : "Track"}
            </button>
          </form>

          {error && (
            <div style={{ padding: "1rem", background: "var(--danger-bg)", color: "var(--danger-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--danger-base)", marginBottom: "2rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          {trackedTrip && renderMap(trackedTrip)}

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER: SYSTEM ADMINISTRATOR (Full Operational Mode)
  // ---------------------------------------------------------
  return (
    <div style={{ height: "100%", display: "flex", overflow: "hidden" }}>
      
      {/* Admin Sidebar List */}
      <div style={{ width: "320px", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", background: "var(--bg-secondary)" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", margin: 0 }}>Active Operations</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Select a trip to view Estimated Journey Progress.</p>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {adminTrips.length === 0 ? (
             <div style={{ textAlign: "center", color: "var(--text-tertiary)", marginTop: "2rem", fontSize: "0.875rem" }}>No active operations.</div>
          ) : (
            adminTrips.map(t => (
              <div 
                key={t.id} 
                onClick={() => { setSelectedAdminTrip(t); setShowFinancials(false); }}
                style={{ 
                  padding: "1rem", 
                  background: selectedAdminTrip?.id === t.id ? "var(--bg-tertiary)" : "transparent",
                  border: `1px solid ${selectedAdminTrip?.id === t.id ? "var(--accent)" : "var(--border-color)"}`,
                  borderRadius: "var(--radius-md)",
                  marginBottom: "0.75rem",
                  cursor: "pointer",
                  transition: "var(--transition-fast)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t.id}</span>
                  <span style={{ fontSize: "0.75rem", color: t.status === "In Transit" ? "var(--info-base)" : "var(--text-secondary)" }}>{t.status}</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  {t.source} → {t.destination}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Main Map Area */}
      <div style={{ flex: 1, padding: "2rem", overflowY: "auto", background: "var(--bg-primary)" }}>
        {!selectedAdminTrip ? (
           <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)" }}>
             Select an operation to view its Fleet Map.
           </div>
        ) : (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            
            {renderMap(selectedAdminTrip)}
            
            {/* Operational Details (Admin Only) */}
            <div style={{ marginTop: "1.5rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.15)" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Internal Operational Intelligence</h3>
              </div>
              
              <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.875rem" }}>
                <div><span style={{ color: "var(--text-tertiary)", display: "inline-block", width: "100px" }}>Driver ID:</span> {selectedAdminTrip.driverId}</div>
                <div><span style={{ color: "var(--text-tertiary)", display: "inline-block", width: "100px" }}>Vehicle ID:</span> {selectedAdminTrip.vehicleId}</div>
                <div><span style={{ color: "var(--text-tertiary)", display: "inline-block", width: "100px" }}>Created At:</span> {new Date(selectedAdminTrip.createdAt).toLocaleString()}</div>
                <div><span style={{ color: "var(--text-tertiary)", display: "inline-block", width: "100px" }}>Auth Token:</span> <code style={{ fontSize: "0.75rem", userSelect: "all" }}>{selectedAdminTrip.trackingToken}</code></div>
              </div>
              
              {/* Expandable Financials */}
              <div style={{ borderTop: "1px solid var(--border-color)" }}>
                <button 
                  onClick={() => setShowFinancials(!showFinancials)}
                  style={{ width: "100%", padding: "1rem 1.5rem", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-main)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
                >
                  Financial Details
                  <span>{showFinancials ? "▲" : "▼"}</span>
                </button>
                
                {showFinancials && (
                  <div style={{ padding: "1.5rem", background: "var(--bg-tertiary)", borderTop: "1px solid var(--border-color)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.875rem" }}>
                    <div><span style={{ color: "var(--text-tertiary)", display: "inline-block", width: "120px" }}>Quoted Revenue:</span> <span style={{ color: "var(--success-base)", fontWeight: 600 }}>${selectedAdminTrip.revenue?.toLocaleString()}</span></div>
                    <div><span style={{ color: "var(--text-tertiary)", display: "inline-block", width: "120px" }}>Base Cost (Est):</span> ${((selectedAdminTrip.revenue || 0) * 0.7).toLocaleString()}</div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
