import React, { useState, useEffect } from "react";

export default function TripTracker({ token }) {
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/trips/track/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load trip information.");
        }
        
        setTrip(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrip();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-main)" }}>
        <p>Locating shipment...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-main)" }}>
        <div style={{ textAlign: "center" }}>
          <h2>Tracking Unavailable</h2>
          <p style={{ color: "var(--text-dim)" }}>{error || "Invalid tracking token"}</p>
        </div>
      </div>
    );
  }

  const stages = ["Scheduled", "Dispatched", "In Transit", "Completed"];
  const currentStageIndex = stages.indexOf(trip.status) >= 0 ? stages.indexOf(trip.status) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-main)", padding: "2rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", background: "rgba(0,0,0,0.15)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            TransitOps Secure Tracking
          </div>
          <h2 style={{ margin: "0.5rem 0 0 0", fontFamily: "var(--font-display)", color: "var(--text-main)" }}>
            Tracking ID: {trip.id}
          </h2>
        </div>
        
        <div style={{ padding: "2rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Origin</div>
              <div style={{ fontWeight: 600 }}>{trip.source}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Destination</div>
              <div style={{ fontWeight: 600 }}>{trip.destination}</div>
            </div>
          </div>

          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem", fontWeight: 600 }}>Trip Status Tracking</div>
          
          <div style={{ position: "relative", paddingLeft: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ position: "absolute", left: "7px", top: "10px", bottom: "10px", width: "2px", background: "var(--border-color)" }}></div>
            
            {stages.map((stage, idx) => {
              const isActive = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stage} style={{ position: "relative", paddingBottom: idx === stages.length - 1 ? "0" : "2rem" }}>
                  <div style={{ 
                    position: "absolute", left: "-1.5rem", top: "2px", width: "16px", height: "16px", 
                    borderRadius: "50%", background: isActive ? "var(--accent)" : "var(--bg-primary)",
                    border: `2px solid ${isActive ? "var(--accent)" : "var(--border-color)"}`,
                    boxShadow: isCurrent ? "0 0 10px var(--accent-glow)" : "none",
                    zIndex: 2
                  }}></div>
                  <div style={{ fontWeight: isActive ? 600 : 400, color: isActive ? "var(--text-main)" : "var(--text-dim)" }}>
                    {stage}
                  </div>
                  {isCurrent && stage === "Dispatched" && trip.actualDispatch && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>
                      Updated at {new Date(trip.actualDispatch).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Expected Completion</div>
            <div style={{ fontWeight: 600 }}>{new Date(trip.expectedCompletion).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
