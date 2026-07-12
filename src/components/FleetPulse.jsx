import React, { useEffect, useState } from "react";

export default function FleetPulse({ state }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Update progress every 5 seconds for smooth movement
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTrips = state.trips.filter(t => t.status === "In Transit" || t.status === "Delayed" || t.status === "Dispatched");
  
  return (
    <div className="card" style={{ marginBottom: "1.5rem", overflow: "hidden" }}>
      <div className="card-header" style={{ marginBottom: "1rem" }}>
        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <span style={{ 
            display: "inline-block", 
            width: "10px", 
            height: "10px", 
            borderRadius: "50%", 
            backgroundColor: "var(--accent)",
            boxShadow: "0 0 10px 2px var(--accent-glow)",
            animation: "pulse 2s infinite"
          }}></span>
          Fleet Pulse: Operational Status
        </h3>
        <span className="badge badge-info" style={{ backgroundColor: "var(--info-subtle)", color: "var(--info-base)", transition: "all 0.5s ease" }}>
          {activeTrips.length} Active Node{activeTrips.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div style={{ 
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        backgroundColor: "var(--bg-primary)", 
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-color)",
        padding: "1.5rem",
        maxHeight: "350px",
        overflowY: "auto",
        scrollBehavior: "smooth"
      }}>
        {activeTrips.length === 0 ? (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: "0.85rem", padding: "2rem 0" }}>
            No active operational streams.
          </div>
        ) : (
          activeTrips.map((trip) => {
            const start = new Date(trip.startTime || trip.actualDispatchTimestamp || trip.createdAt).getTime();
            const end = trip.eta ? new Date(trip.eta).getTime() : start + 3600000 * 4; // Default 4 hrs
            const totalDuration = end - start;
            const elapsed = now - start;
            
            let progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
            if (isNaN(progress)) progress = 50;
            if (trip.status === "Dispatched") progress = Math.min(progress, 5); // Dispatched just starting

            const vehicle = state.vehicles.find(v => v.id === trip.vehicleId);
            const driver = state.drivers.find(d => d.id === trip.driverId);
            
            const isDelayed = trip.status === "Delayed";
            const needsMaintenance = vehicle && vehicle.maintenanceStatus === "Maintenance Required";
            
            let statusColor = "var(--info-base)";
            let statusBg = "var(--info-subtle)";
            let pulseColor = "rgba(111, 167, 255, 0.4)";
            
            if (needsMaintenance) {
              statusColor = "var(--danger-base)";
              statusBg = "var(--danger-subtle)";
              pulseColor = "rgba(236, 107, 98, 0.4)";
            } else if (isDelayed) {
              statusColor = "var(--warning-base)";
              statusBg = "var(--warning-subtle)";
              pulseColor = "rgba(231, 174, 60, 0.4)";
            }

            return (
              <div key={trip.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)" }}>
                      {trip.id} <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>•</span> {vehicle ? vehicle.name : trip.vehicleId}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {driver ? driver.fullName : trip.driverId}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "right" }}>
                    ETA: {trip.eta ? new Date(trip.eta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown'}
                  </div>
                </div>
                
                <div style={{ position: "relative", height: "30px", display: "flex", alignItems: "center" }}>
                  {/* Route Line */}
                  <div style={{ 
                    position: "absolute", 
                    left: "24px", right: "24px", 
                    height: "4px", 
                    backgroundColor: "var(--border-color)", 
                    borderRadius: "2px",
                    zIndex: 1
                  }}></div>
                  
                  {/* Active Progress Line */}
                  <div style={{ 
                    position: "absolute", 
                    left: "24px", 
                    width: `calc(${progress}% - 24px)`, 
                    height: "4px", 
                    backgroundColor: statusColor, 
                    borderRadius: "2px",
                    transition: "width 1s linear",
                    zIndex: 2
                  }}></div>

                  {/* Origin Node */}
                  <div style={{ 
                    position: "absolute", 
                    left: 0, 
                    width: "12px", height: "12px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--bg-primary)", 
                    border: `2px solid var(--text-tertiary)`,
                    zIndex: 3
                  }}></div>
                  <div style={{ position: "absolute", left: 0, top: "24px", fontSize: "0.65rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                    {trip.origin}
                  </div>

                  {/* Destination Node */}
                  <div style={{ 
                    position: "absolute", 
                    right: 0, 
                    width: "12px", height: "12px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--bg-primary)", 
                    border: `2px solid var(--text-tertiary)`,
                    zIndex: 3
                  }}></div>
                  <div style={{ position: "absolute", right: 0, top: "24px", fontSize: "0.65rem", color: "var(--text-tertiary)", whiteSpace: "nowrap", transform: "translateX(25%)" }}>
                    {trip.destination}
                  </div>

                  {/* Vehicle Marker */}
                  <div style={{ 
                    position: "absolute", 
                    left: `calc(${progress}%)`,
                    transform: "translateX(-50%)",
                    width: "16px", height: "16px", 
                    borderRadius: "50%", 
                    backgroundColor: statusColor,
                    boxShadow: `0 0 0 4px ${statusBg}, 0 0 12px 2px ${pulseColor}`,
                    transition: "left 1s linear",
                    zIndex: 4
                  }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`
        @keyframes pulse { 
          0% { opacity: 0.6; transform: scale(0.95); } 
          50% { opacity: 1; transform: scale(1.1); } 
          100% { opacity: 0.6; transform: scale(0.95); } 
        }
      `}</style>
    </div>
  );
}
