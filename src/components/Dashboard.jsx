import React, { useState } from "react";
import FleetPulse from "./FleetPulse";


export default function Dashboard({ user, state, onNavigate }) {
  const { role } = user;
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);

  const generateCSV = (filename, data) => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join(","),
      ...data.map(row => keys.map(k => {
        const val = row[k];
        return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowReportsDropdown(false);
  };

  // Global Metrics
  const activeVehicles = state.vehicles.filter(v => v.operationalStatus === "On Trip").length;
  const totalVehicles = state.vehicles.filter(v => v.operationalStatus !== "Retired").length;
  const activeTrips = state.trips.filter(t => t.status === "In Transit").length;
  const scheduledTrips = state.trips.filter(t => t.status === "Scheduled").length;
  const shopVehicles = state.vehicles.filter(v => v.maintenanceStatus === "In Shop").length;
  
  // Finance Metrics
  const totalRevenue = state.trips.filter(t => t.status === "Completed").reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalCosts = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  const renderSystemAdminView = () => (
    <>
      <FleetPulse state={state} />
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--info-base)" }}>
          <div className="kpi-label">Active Operations</div>
          <div className="kpi-val">{activeTrips} <span style={{ fontSize: "1rem", color: "var(--text-tertiary)", fontWeight: 500 }}>/ {totalVehicles} Assets</span></div>
          <div className="kpi-sub">{scheduledTrips} scheduled trips pending</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--warning-base)" }}>
          <div className="kpi-label">Shop Status</div>
          <div className="kpi-val">{shopVehicles}</div>
          <div className="kpi-sub">Assets currently offline for maintenance</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--success-base)" }}>
          <div className="kpi-label">Gross Revenue</div>
          <div className="kpi-val">${totalRevenue.toLocaleString()}</div>
          <div className="kpi-sub">Total realized from completed trips</div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Recent System Activity</h3>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Actor</th><th>Action</th></tr></thead>
              <tbody>
                {state.auditTrail.slice().reverse().slice(0, 5).map(aud => (
                  <tr key={aud.id}>
                    <td className="text-mono" style={{ fontSize: "0.75rem" }}>{new Date(aud.timestamp).toLocaleTimeString()}</td>
                    <td className="font-semibold">{aud.actor}</td>
                    <td>{aud.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  const renderFleetManagerView = () => (
    <>
      <FleetPulse state={state} />
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--info-base)" }}>
          <div className="kpi-label">Fleet Utilization</div>
          <div className="kpi-val">{totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0}%</div>
          <div className="kpi-sub">{activeVehicles} of {totalVehicles} assets on road</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--warning-base)" }}>
          <div className="kpi-label">Maintenance Pipeline</div>
          <div className="kpi-val">{shopVehicles}</div>
          <div className="kpi-sub">Active shop tickets</div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Assets In Shop</h3>
          {state.maintenance.filter(m => m.status === "Active").map(m => (
            <div key={m.id} className="detail-row">
              <span className="detail-label">{m.vehicleId}</span>
              <span className="detail-value">{m.serviceType}</span>
            </div>
          ))}
          {shopVehicles === 0 && <div className="text-secondary" style={{ fontSize: "0.875rem" }}>No vehicles currently in maintenance.</div>}
        </div>
      </div>
    </>
  );

  const renderDispatcherView = () => (
    <>
      <FleetPulse state={state} />
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--info-base)" }}>
          <div className="kpi-label">Active Trips</div>
          <div className="kpi-val">{activeTrips}</div>
          <div className="kpi-sub">Currently in transit</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--success-base)" }}>
          <div className="kpi-label">Available Assets</div>
          <div className="kpi-val">{state.vehicles.filter(v => v.operationalStatus === "Available").length}</div>
          <div className="kpi-sub">Ready for dispatch</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "3px solid var(--success-base)" }}>
          <div className="kpi-label">Available Drivers</div>
          <div className="kpi-val">{state.drivers.filter(d => d.operationalStatus === "Available").length}</div>
          <div className="kpi-sub">Cleared and on duty</div>
        </div>
      </div>
    </>
  );

  const renderFinancialAnalystView = () => {
    return <DataDashboardView state={state} totalRevenue={totalRevenue} totalCosts={totalCosts} />;
  };

  const renderSafetyOfficerView = () => {
    const avgSafety = state.drivers.length > 0 
      ? Math.round(state.drivers.reduce((sum, d) => sum + d.safetyScore, 0) / state.drivers.length)
      : 0;
    
    const complianceIssues = state.drivers.filter(d => d.complianceStatus !== "Valid").length + 
                             state.vehicles.filter(v => v.complianceStatus !== "Compliant").length;

    return (
      <>
        <div className="kpi-grid">
          <div className="kpi-card" style={{ borderLeft: `3px solid ${avgSafety >= 90 ? 'var(--success-base)' : 'var(--warning-base)'}` }}>
            <div className="kpi-label">Average Fleet Safety Score</div>
            <div className="kpi-val">{avgSafety}/100</div>
          </div>
          <div className="kpi-card" style={{ borderLeft: `3px solid ${complianceIssues > 0 ? 'var(--danger-base)' : 'var(--success-base)'}` }}>
            <div className="kpi-label">Active Compliance Flags</div>
            <div className="kpi-val">{complianceIssues}</div>
            <div className="kpi-sub">Requires immediate review</div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="page-header" style={{ position: "relative" }}>
        <div>
          <h2>Welcome back, {user.name.split(" ")[0]}</h2>
          <p>{user.role} Dashboard</p>
        </div>
        <div style={{ position: "relative" }}>
          <button className="btn btn-secondary" onClick={() => setShowReportsDropdown(!showReportsDropdown)}>
            ⬇️ Download Reports
          </button>
          {showReportsDropdown && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 100, width: "220px", overflow: "hidden" }}>
              {(role === "System Administrator" || role === "Fleet Manager" || role === "Dispatcher") && (
                <button className="btn" style={{ display: "block", width: "100%", textAlign: "left", borderRadius: 0, padding: "10px 16px", background: "transparent", border: "none", borderBottom: "1px solid var(--border-color)" }} onClick={() => generateCSV('transitops_vehicles.csv', state.vehicles)}>
                  📄 Vehicle Assets
                </button>
              )}
              {(role === "System Administrator" || role === "Fleet Manager" || role === "Dispatcher") && (
                <button className="btn" style={{ display: "block", width: "100%", textAlign: "left", borderRadius: 0, padding: "10px 16px", background: "transparent", border: "none", borderBottom: "1px solid var(--border-color)" }} onClick={() => generateCSV('transitops_trips.csv', state.trips)}>
                  📄 Trip Records
                </button>
              )}
              {(role === "System Administrator" || role === "Fleet Manager" || role === "Financial Analyst") && (
                <button className="btn" style={{ display: "block", width: "100%", textAlign: "left", borderRadius: 0, padding: "10px 16px", background: "transparent", border: "none", borderBottom: "1px solid var(--border-color)" }} onClick={() => generateCSV('transitops_expenses.csv', state.expenses)}>
                  📄 Financial Ledgers
                </button>
              )}
              {(role === "System Administrator" || role === "Safety Officer") && (
                <button className="btn" style={{ display: "block", width: "100%", textAlign: "left", borderRadius: 0, padding: "10px 16px", background: "transparent", border: "none" }} onClick={() => generateCSV('transitops_drivers.csv', state.drivers)}>
                  📄 Personnel & Safety
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {role === "System Administrator" && renderSystemAdminView()}
      {role === "Fleet Manager" && renderFleetManagerView()}
      {role === "Dispatcher" && renderDispatcherView()}
      {role === "Financial Analyst" && renderFinancialAnalystView()}
      {role === "Safety Officer" && renderSafetyOfficerView()}
    </div>
  );
}
