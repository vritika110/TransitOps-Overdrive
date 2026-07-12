import React, { useState, useMemo } from 'react';
import { getSafetyRatingBand, calculateROI } from '../utils/businessRules';
import { exportDashboardData } from '../utils/csvExport';

const RBAC_MAPPING = {
  "Financial Analyst": ["Revenue", "Expenses", "Profitability", "Expense Anomalies", "Dynamic Pricing", "Fleet ROI Yield"],
  "Fleet Manager": ["Fleet Utilization", "Vehicle Status", "Maintenance Risk", "Trip Operations", "Fleet ROI Yield"],
  "Dispatcher": ["Trip Operations", "Fleet Availability", "Driver Availability"],
  "Safety Officer": ["Driver Performance", "Safety", "Compliance", "Maintenance Risk"],
  "System Administrator": [
    "Revenue", "Expenses", "Profitability", "Expense Anomalies", "Dynamic Pricing", "Fleet ROI Yield",
    "Fleet Utilization", "Vehicle Status", "Maintenance Risk", "Trip Operations",
    "Fleet Availability", "Driver Availability", "Driver Performance", "Safety", "Compliance"
  ]
};

// --- Custom Mini-Chart Components (Lightweight, CSS/SVG) ---

const DonutChart = ({ data, total, title }) => {
  let currentOffset = 0;
  const radius = 15.91549430918954;
  const circumference = 100;

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <svg width="120" height="120" viewBox="0 0 42 42" className="donut">
        <circle className="donut-hole" cx="21" cy="21" r={radius} fill="transparent" />
        <circle className="donut-ring" cx="21" cy="21" r={radius} fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="8" />
        {data.map((item, i) => {
          if (item.value <= 0) return null;
          const strokeDasharray = `${(item.value / total) * 100} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += (item.value / total) * 100;
          return (
            <circle key={i} cx="21" cy="21" r={radius} fill="transparent"
              stroke={item.color} strokeWidth="8" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out" }}
            >
              <title>{item.label}: {item.value}</title>
            </circle>
          );
        })}
        <text x="21" y="21" textAnchor="middle" dy="3px" fontSize="0.4rem" fill="var(--text-main)" fontWeight="bold">{total}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h5 style={{ margin: 0, color: 'var(--text-secondary)' }}>{title}</h5>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></div>
              <span>{item.label}</span>
            </div>
            <span style={{ fontWeight: 600 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChart = ({ data, maxVal }) => {
  if (!data.length) return <div style={{ color: "var(--text-tertiary)", fontStyle: "italic", padding: "1rem 0" }}>Insufficient data</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {data.map((item, i) => {
        const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span>{item.label}</span>
              <span>{item.displayValue || item.value}</span>
            </div>
            <div style={{ width: '100%', background: 'var(--bg-tertiary)', height: '12px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, background: item.color || 'var(--accent)', height: '100%', transition: 'width 1.2s cubic-bezier(0.25, 1, 0.5, 1)' }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Dashboards ---

export default function DataDashboard({ user, state }) {
  const allowedCategories = RBAC_MAPPING[user.role] || [];
  const [selectedCategory, setSelectedCategory] = useState(allowedCategories[0] || "");
  const [dateFilter, setDateFilter] = useState("all");

  if (allowedCategories.length === 0) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
        <h3>No Analytics Access</h3>
        <p>Your current role ({user.role}) does not have permission to view analytical categories.</p>
      </div>
    );
  }

  const handleExport = (type) => {
    if (type === "csv") {
      exportDashboardData(selectedCategory, state, user, { dateFilter });
    } else if (type === "pdf") {
      window.print();
    }
  };

  const renderDashboardContent = () => {
    switch (selectedCategory) {
      case "Revenue": return <RevenueDashboard state={state} dateFilter={dateFilter} />;
      case "Expenses": return <ExpensesDashboard state={state} dateFilter={dateFilter} />;
      case "Profitability": return <ProfitabilityDashboard state={state} dateFilter={dateFilter} />;
      case "Trip Operations": return <TripOperationsDashboard state={state} dateFilter={dateFilter} />;
      case "Fleet Utilization": return <FleetUtilizationDashboard state={state} />;
      case "Vehicle Status": return <VehicleStatusDashboard state={state} />;
      case "Maintenance Risk": return <MaintenanceRiskDashboard state={state} />;
      case "Driver Performance": return <DriverPerformanceDashboard state={state} />;
      case "Safety": return <SafetyDashboard state={state} />;
      case "Compliance": return <ComplianceDashboard state={state} />;
      case "Expense Anomalies": return <ExpenseAnomaliesDashboard state={state} />;
      case "Dynamic Pricing": return <DynamicPricingDashboard state={state} />;
      case "Fleet ROI Yield": return <FleetRoiDashboard state={state} />;
      case "Fleet Availability": return <FleetAvailabilityDashboard state={state} />;
      case "Driver Availability": return <DriverAvailabilityDashboard state={state} />;
      default: return <div>Select a category</div>;
    }
  };

  return (
    <div className="main-content" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      
      {/* Print-Only Header */}
      <div className="print-only-header">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: 0 }}>TRANSITOPS</h1>
        <h3 style={{ margin: 0, fontWeight: 400, color: "#555" }}>Transit Command Intelligence</h3>
        <div style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "#333", lineHeight: 1.5 }}>
          <strong>{selectedCategory} Analytics Report</strong><br />
          Generated: {new Date().toLocaleString()}<br />
          Generated By Role: {user.role}<br />
          Applied Filters: {["Revenue", "Expenses", "Profitability", "Trip Operations"].includes(selectedCategory) ? (dateFilter === "30" ? "Last 30 Days" : "All Time") : "None"}
        </div>
        <hr style={{ margin: "1.5rem 0", borderTop: "2px solid #000" }} />
      </div>

      <div className="page-header hide-on-print" style={{ marginBottom: "2rem" }}>
        <div>
          <h2>Data Dashboard</h2>
          <p>Role-aware interactive operational analytics</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {["Revenue", "Expenses", "Profitability", "Trip Operations"].includes(selectedCategory) && (
            <select className="form-select" style={{ width: "160px" }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
            </select>
          )}
          <select 
            className="form-select" 
            style={{ width: "260px", borderColor: "var(--accent)", fontWeight: 600 }} 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {allowedCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-secondary" onClick={() => handleExport("csv")}>Export CSV</button>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <button className="btn btn-primary" onClick={() => handleExport("pdf")}>Print / Save as PDF</button>
              <span style={{ fontSize: "0.6rem", color: "var(--text-tertiary)", textAlign: "center" }}>Choose 'Save as PDF' in dialog</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-render-area" style={{ animation: "slideUp 0.4s ease-out" }} key={selectedCategory}>
        {renderDashboardContent()}
      </div>

      {/* Print-Only Footer */}
      <div className="print-only-footer">
        <hr style={{ margin: "2rem 0", borderTop: "1px solid #000" }} />
        <div style={{ fontSize: "0.8rem", color: "#666", textAlign: "right" }}>Engineered by Overdrive</div>
      </div>
    </div>
  );
}

// --- Specific Dashboard Implementations ---

function RevenueDashboard({ state, dateFilter }) {
  const completedTrips = state.trips.filter(t => t.status === "Completed");
  const totalRev = completedTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const avgRev = completedTrips.length > 0 ? totalRev / completedTrips.length : 0;
  
  const routeRev = {};
  completedTrips.forEach(t => {
    const route = `${t.source} ➔ ${t.destination}`;
    routeRev[route] = (routeRev[route] || 0) + (t.revenue || 0);
  });
  
  const routeData = Object.entries(routeRev).map(([k, v]) => ({ label: k, value: v, displayValue: `$${v.toLocaleString()}`, color: "var(--info-base)" })).sort((a,b) => b.value - a.value).slice(0, 5);
  const maxRoute = routeData.length > 0 ? routeData[0].value : 0;

  const vehTypeRev = { "Heavy Truck": 0, "LGC/Van": 0, "Electric Semi": 0 };
  completedTrips.forEach(t => {
    const v = state.vehicles.find(vh => vh.id === t.vehicleId);
    if (v) vehTypeRev[v.vehicleType] += (t.revenue || 0);
  });

  const vehData = [
    { label: "Heavy Truck", value: vehTypeRev["Heavy Truck"], color: "var(--accent)" },
    { label: "LGC/Van", value: vehTypeRev["LGC/Van"], color: "var(--info-base)" },
    { label: "Electric Semi", value: vehTypeRev["Electric Semi"], color: "var(--success-base)" }
  ].filter(d => d.value > 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      <div className="card" style={{ gridColumn: "span 2", display: "flex", gap: "2rem", justifyContent: "space-around", textAlign: "center" }}>
        <div><div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Total Revenue</div><div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--success-base)" }}>${totalRev.toLocaleString()}</div></div>
        <div><div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Completed Trips</div><div style={{ fontSize: "2rem", fontWeight: 700 }}>{completedTrips.length}</div></div>
        <div><div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Avg Rev/Trip</div><div style={{ fontSize: "2rem", fontWeight: 700 }}>${Math.round(avgRev).toLocaleString()}</div></div>
      </div>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Revenue by Route (Top 5)</h4>
        <BarChart data={routeData} maxVal={maxRoute} />
      </div>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Revenue by Vehicle Class</h4>
        {totalRev > 0 ? <DonutChart data={vehData} total={totalRev} title="Distribution" /> : <p style={{ color: "var(--text-tertiary)" }}>No revenue data.</p>}
      </div>
    </div>
  );
}

function ExpensesDashboard({ state }) {
  const totalExp = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const catMap = {};
  state.expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  
  const colors = { Fuel: "var(--warning-base)", Maintenance: "var(--danger-base)", Toll: "var(--info-base)", Permit: "var(--accent-base)" };
  const donutData = Object.entries(catMap).map(([k, v]) => ({ label: k, value: v, color: colors[k] || "var(--text-tertiary)" }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h4 style={{ marginBottom: "1.5rem" }}>Expense Distribution</h4>
        {totalExp > 0 ? <DonutChart data={donutData} total={totalExp} title={`Total: $${totalExp.toLocaleString()}`} /> : <p style={{ color: "var(--text-tertiary)" }}>No expenses logged.</p>}
      </div>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Recent Expense Records</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {state.expenses.slice().reverse().slice(0, 6).map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
              <span>{e.category} <span style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>{e.date}</span></span>
              <span style={{ fontWeight: 600 }}>${e.amount.toLocaleString()}</span>
            </div>
          ))}
          {state.expenses.length === 0 && <span style={{ color: "var(--text-tertiary)" }}>No expenses logged.</span>}
        </div>
      </div>
    </div>
  );
}

function ProfitabilityDashboard({ state }) {
  const completedTrips = state.trips.filter(t => t.status === "Completed");
  const totalRev = completedTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalCost = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalRev - totalCost;
  const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;

  return (
    <div className="card">
      <h3 style={{ marginBottom: "1.5rem" }}>Gross Profitability</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--success-base)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total Revenue</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>${totalRev.toLocaleString()}</div>
        </div>
        <div style={{ padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--danger-base)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total Costs</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>${totalCost.toLocaleString()}</div>
        </div>
        <div style={{ padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", borderLeft: `3px solid ${profit >= 0 ? 'var(--success-base)' : 'var(--danger-base)'}` }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Gross Profit</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>${profit.toLocaleString()}</div>
        </div>
        <div style={{ padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Profit Margin</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: profit >= 0 ? 'var(--success-base)' : 'var(--danger-base)' }}>{margin.toFixed(1)}%</div>
        </div>
      </div>
      
      <h4 style={{ marginBottom: "1rem" }}>Cost vs Revenue Ratio</h4>
      <div style={{ width: "100%", background: "var(--bg-tertiary)", height: "30px", borderRadius: "var(--radius-full)", overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${totalRev > 0 ? Math.min((totalCost/totalRev)*100, 100) : 0}%`, background: "var(--danger-base)", height: "100%", transition: "width 1.5s ease" }} title="Costs"></div>
        <div style={{ flex: 1, background: "var(--success-base)", height: "100%", transition: "flex 1.5s ease" }} title="Profit"></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
        <span>Cost</span><span>Profit</span>
      </div>
    </div>
  );
}

function TripOperationsDashboard({ state }) {
  const tMap = { Draft: 0, Scheduled: 0, "Ready for Dispatch": 0, Dispatched: 0, "In Transit": 0, Arrived: 0, Completed: 0, Cancelled: 0 };
  state.trips.forEach(t => { tMap[t.status] = (tMap[t.status] || 0) + 1; });
  const total = state.trips.length;
  const active = tMap["Dispatched"] + tMap["In Transit"] + tMap["Arrived"];
  
  const dData = [
    { label: "Completed", value: tMap.Completed, color: "var(--success-base)" },
    { label: "Active", value: active, color: "var(--info-base)" },
    { label: "Pending", value: tMap.Draft + tMap.Scheduled + tMap["Ready for Dispatch"], color: "var(--warning-base)" },
    { label: "Cancelled", value: tMap.Cancelled, color: "var(--danger-base)" }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Operations Status</h4>
        {total === 0 ? <p style={{ color: "var(--text-tertiary)" }}>No trips found.</p> : <DonutChart data={dData} total={total} title="All Trips" />}
      </div>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Completion Rate</h4>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "4rem", fontWeight: 700, color: "var(--success-base)", lineHeight: 1 }}>
            {total > 0 ? Math.round((tMap.Completed / total) * 100) : 0}%
          </div>
          <div style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>{tMap.Completed} completed out of {total} total trips</div>
        </div>
      </div>
    </div>
  );
}

function FleetUtilizationDashboard({ state }) {
  const vMap = { Available: 0, "On Trip": 0, "Off Road": 0, "In Shop": 0, Retired: 0 };
  state.vehicles.forEach(v => { vMap[v.operationalStatus] = (vMap[v.operationalStatus] || 0) + 1; });
  const total = state.vehicles.length;
  const totalActive = total - vMap.Retired;
  
  const dData = [
    { label: "Available", value: vMap.Available, color: "var(--success-base)" },
    { label: "On Trip", value: vMap["On Trip"], color: "var(--info-base)" },
    { label: "Off Road", value: vMap["Off Road"], color: "var(--warning-base)" },
    { label: "In Shop", value: vMap["In Shop"], color: "var(--danger-base)" },
  ];

  return (
    <div className="card">
      <h3 style={{ marginBottom: "1.5rem" }}>Fleet Utilization</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {totalActive === 0 ? <p>No vehicles found.</p> : <DonutChart data={dData} total={totalActive} title="Active Fleet Status" />}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Utilization (On Trip)</span>
              <span style={{ fontWeight: 600 }}>{totalActive > 0 ? Math.round((vMap["On Trip"] / totalActive) * 100) : 0}%</span>
            </div>
            <div style={{ width: "100%", background: "var(--bg-tertiary)", height: "12px", borderRadius: "var(--radius-full)" }}>
              <div style={{ width: `${totalActive > 0 ? (vMap["On Trip"] / totalActive) * 100 : 0}%`, background: "var(--info-base)", height: "100%", borderRadius: "var(--radius-full)", transition: "width 1s ease" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleStatusDashboard({ state }) {
  const offRoad = state.vehicles.filter(v => v.operationalStatus === "Off Road");
  return (
    <div className="card">
      <h4 style={{ marginBottom: "1.5rem" }}>Vehicle Attention Queue</h4>
      {offRoad.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>All vehicles are operational.</div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Asset</th><th>Status</th><th>Maintenance Blocker</th><th>Compliance Blocker</th></tr></thead>
          <tbody>
            {offRoad.map(v => (
              <tr key={v.id}>
                <td>{v.registrationNumber}</td>
                <td><span className="badge badge-warning">{v.operationalStatus}</span></td>
                <td style={{ color: v.maintenanceStatus !== "Clear" ? "var(--danger)" : "var(--text-secondary)" }}>{v.maintenanceStatus}</td>
                <td style={{ color: v.complianceStatus !== "Compliant" ? "var(--danger)" : "var(--text-secondary)" }}>{v.complianceStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MaintenanceRiskDashboard({ state }) {
  const riskGroups = { "Healthy": 0, "Monitor": 0, "Maintenance Recommended": 0, "Critical Attention": 0 };
  
  state.vehicles.forEach(v => {
    const distSince = v.totalDistanceDriven - (v.lastServiceOdometer || 0);
    let risk = (distSince / 20000) * 100;
    if (v.maintenanceStatus === "Overdue" || v.maintenanceStatus === "In Shop") risk = 100;
    
    if (risk >= 85) riskGroups["Critical Attention"]++;
    else if (risk >= 60) riskGroups["Maintenance Recommended"]++;
    else if (risk >= 30) riskGroups["Monitor"]++;
    else riskGroups["Healthy"]++;
  });

  const total = state.vehicles.length;
  const bData = [
    { label: "Healthy (0-29)", value: riskGroups["Healthy"], color: "var(--success-base)" },
    { label: "Monitor (30-59)", value: riskGroups["Monitor"], color: "var(--info-base)" },
    { label: "Recommended (60-84)", value: riskGroups["Maintenance Recommended"], color: "var(--warning-base)" },
    { label: "Critical (85+)", value: riskGroups["Critical Attention"], color: "var(--danger-base)" }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Smart Maintenance Risk Distribution</h4>
        <BarChart data={bData} maxVal={total} />
      </div>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Highest Risk Assets</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {state.vehicles.filter(v => v.operationalStatus !== "Retired").slice(0,4).map(v => (
            <div key={v.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
              <span>{v.registrationNumber}</span>
              <span style={{ color: v.maintenanceStatus !== "Clear" ? "var(--danger)" : "var(--text-secondary)" }}>{v.maintenanceStatus}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DriverPerformanceDashboard({ state }) {
  const bands = { Excellent: 0, Good: 0, Fair: 0, "Risk Check Required": 0 };
  state.drivers.forEach(d => {
    const band = getSafetyRatingBand(d.safetyScore).band;
    bands[band] = (bands[band] || 0) + 1;
  });

  const bData = [
    { label: "Excellent (90-100)", value: bands.Excellent, color: "#10b981" },
    { label: "Good (75-89)", value: bands.Good, color: "#3b82f6" },
    { label: "Fair (60-74)", value: bands.Fair, color: "#f59e0b" },
    { label: "Risk (0-59)", value: bands["Risk Check Required"], color: "#ef4444" },
  ];

  return (
    <div className="card">
      <h4 style={{ marginBottom: "1.5rem" }}>Safety Score Distribution</h4>
      <div style={{ maxWidth: "500px" }}>
        <BarChart data={bData} maxVal={state.drivers.length} />
      </div>
    </div>
  );
}

function SafetyDashboard({ state }) {
  return (
    <div className="card">
      <h4 style={{ marginBottom: "1.5rem" }}>Safety Attention Queue</h4>
      {state.drivers.filter(d => d.safetyScore < 70).length === 0 ? (
        <p style={{ color: "var(--text-tertiary)" }}>No personnel in high-risk bracket.</p>
      ) : (
        <table className="data-table">
          <thead><tr><th>Driver</th><th>Score</th><th>Completed Trips</th></tr></thead>
          <tbody>
            {state.drivers.filter(d => d.safetyScore < 70).sort((a,b) => a.safetyScore - b.safetyScore).map(d => (
              <tr key={d.id}>
                <td>{d.fullName}</td>
                <td style={{ color: "var(--danger)", fontWeight: 600 }}>{d.safetyScore}</td>
                <td>{d.totalCompletedTrips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ComplianceDashboard({ state }) {
  const vExp = { "Compliant": 0, "Expiring Soon": 0, "Non-Compliant": 0 };
  const dExp = { "Valid": 0, "Expiring Soon": 0, "Expired": 0, "Suspended": 0 };
  
  state.vehicles.forEach(v => { vExp[v.complianceStatus] = (vExp[v.complianceStatus] || 0) + 1; });
  state.drivers.forEach(d => { dExp[d.complianceStatus] = (dExp[d.complianceStatus] || 0) + 1; });

  const vData = [
    { label: "Compliant", value: vExp["Compliant"], color: "var(--success-base)" },
    { label: "Expiring", value: vExp["Expiring Soon"], color: "var(--warning-base)" },
    { label: "Non-Compliant", value: vExp["Non-Compliant"], color: "var(--danger-base)" }
  ];

  const dData = [
    { label: "Valid", value: dExp["Valid"], color: "var(--success-base)" },
    { label: "Expiring", value: dExp["Expiring Soon"], color: "var(--warning-base)" },
    { label: "Expired/Suspended", value: dExp["Expired"] + dExp["Suspended"], color: "var(--danger-base)" }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Vehicle Compliance</h4>
        {state.vehicles.length > 0 ? <DonutChart data={vData} total={state.vehicles.length} title="Assets" /> : <p style={{ color: "var(--text-tertiary)" }}>No vehicle data.</p>}
      </div>
      <div className="card">
        <h4 style={{ marginBottom: "1.5rem" }}>Personnel Compliance</h4>
        {state.drivers.length > 0 ? <DonutChart data={dData} total={state.drivers.length} title="Drivers" /> : <p style={{ color: "var(--text-tertiary)" }}>No driver data.</p>}
      </div>
    </div>
  );
}

function ExpenseAnomaliesDashboard({ state }) {
  const flagged = [];
  state.expenses.forEach(exp => {
    if (exp.category === "Fuel") {
      const similarTypeExp = state.expenses.filter(e => e.category === "Fuel");
      const baselineVal = similarTypeExp.length > 0 ? similarTypeExp.reduce((sum, e) => sum + e.amount, 0) / similarTypeExp.length : null;
      if (baselineVal !== null && baselineVal > 0 && exp.amount > baselineVal * 1.2) {
        flagged.push({ ...exp, baseline: baselineVal, deviation: ((exp.amount - baselineVal) / baselineVal) * 100 });
      }
    }
  });

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h4 style={{ margin: 0 }}>Automated Anomaly Detection Queue</h4>
        <span className="badge badge-danger">{flagged.length} Pending Review</span>
      </div>
      {flagged.length === 0 ? <p style={{ color: "var(--text-tertiary)" }}>No anomalies detected in the ledger.</p> : (
        <table className="data-table">
          <thead><tr><th>Asset</th><th>Date</th><th>Recorded Value</th><th>Expected Baseline</th><th>Deviation</th></tr></thead>
          <tbody>
            {flagged.map((f, i) => {
              const v = state.vehicles.find(vh => vh.id === f.vehicleId);
              return (
                <tr key={i} style={{ borderLeft: "3px solid var(--danger-base)" }}>
                  <td>{v ? v.registrationNumber : f.vehicleId}</td>
                  <td>{f.date}</td>
                  <td style={{ color: "var(--danger)", fontWeight: 600 }}>${f.amount.toFixed(2)}</td>
                  <td>${f.baseline.toFixed(2)}</td>
                  <td><span className="badge badge-danger">+{f.deviation.toFixed(1)}%</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DynamicPricingDashboard({ state }) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: "1.5rem" }}>Dynamic Pricing Transparency</h3>
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-tertiary)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)" }}>
        <div>No historical price estimation data is persisted.</div>
        <div style={{ fontSize: "0.85rem", marginTop: "8px" }}>Dynamic pricing estimates are calculated statelessly during dispatch creation.</div>
      </div>
    </div>
  );
}

function FleetRoiDashboard({ state }) {
  const bData = [];
  let maxNet = 0;
  
  state.vehicles.forEach(v => {
    if (v.operationalStatus === "Retired") return;
    const tripsForVehicle = state.trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
    const rev = tripsForVehicle.reduce((sum, t) => sum + (t.revenue || 0), 0);
    const cost = state.expenses.filter(e => e.vehicleId === v.id).reduce((sum, e) => sum + e.amount, 0);
    const net = rev - cost;
    if (net > maxNet) maxNet = net;
    bData.push({ label: v.registrationNumber, value: Math.max(0, net), displayValue: `$${net.toLocaleString()}`, color: net >= 0 ? "var(--success-base)" : "var(--danger-base)", originalNet: net });
  });

  bData.sort((a,b) => b.originalNet - a.originalNet);

  return (
    <div className="card">
      <h4 style={{ marginBottom: "1.5rem" }}>Asset Lifetime Yield (Net Margin)</h4>
      <div style={{ maxWidth: "600px" }}>
        <BarChart data={bData.slice(0, 10)} maxVal={maxNet} />
      </div>
    </div>
  );
}

function FleetAvailabilityDashboard({ state }) {
  const avail = state.vehicles.filter(v => v.operationalStatus === "Available").length;
  const total = state.vehicles.filter(v => v.operationalStatus !== "Retired").length;
  return (
    <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
      <div style={{ fontSize: "5rem", fontWeight: 700, color: "var(--success-base)", lineHeight: 1 }}>{total > 0 ? Math.round((avail/total)*100) : 0}%</div>
      <div style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginTop: "1rem" }}>Fleet Readily Available</div>
      <div style={{ color: "var(--text-tertiary)", marginTop: "0.5rem" }}>{avail} assets immediately dispatchable</div>
    </div>
  );
}

function DriverAvailabilityDashboard({ state }) {
  const avail = state.drivers.filter(d => d.operationalStatus === "Available" && d.complianceStatus !== "Suspended" && d.complianceStatus !== "Expired").length;
  const total = state.drivers.filter(d => d.employmentStatus !== "Terminated").length;
  return (
    <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
      <div style={{ fontSize: "5rem", fontWeight: 700, color: "var(--info-base)", lineHeight: 1 }}>{total > 0 ? Math.round((avail/total)*100) : 0}%</div>
      <div style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginTop: "1rem" }}>Personnel Readily Available</div>
      <div style={{ color: "var(--text-tertiary)", marginTop: "0.5rem" }}>{avail} compliant drivers ready for dispatch</div>
    </div>
  );
}
