import React, { useState, useEffect } from "react";

export default function Shell({ user, activeTab, setActiveTab, onLogout, state, globalSearchQuery, setGlobalSearchQuery, onSelectSearchEntity, children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");
  
  // View permissions logic
  const canViewVehicles = ["System Administrator", "Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"].includes(user.role);
  const canViewDrivers = ["System Administrator", "Fleet Manager", "Dispatcher", "Safety Officer"].includes(user.role);
  const canViewTrips = ["System Administrator", "Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"].includes(user.role);
  const canViewMaintenance = ["System Administrator", "Fleet Manager", "Financial Analyst"].includes(user.role);
  const canViewFinance = ["System Administrator", "Fleet Manager", "Financial Analyst"].includes(user.role);
  const canViewAdmin = ["System Administrator"].includes(user.role);

  const isClient = user.role === "Logistics Client";
  const canViewMap = ["System Administrator", "Logistics Client"].includes(user.role);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", show: !isClient },
    { id: "data-dashboard", label: "Data Dashboard", icon: "📈", show: !isClient },
    { id: "vehicles", label: "Fleet Assets", icon: "🚛", show: canViewVehicles },
    { id: "drivers", label: "Personnel", icon: "👷", show: canViewDrivers },
    { id: "trips", label: "Active Operations", icon: "🛣️", show: canViewTrips },
    { id: "maintenance", label: "Maintenance", icon: "🔧", show: canViewMaintenance },
    { id: "finance", label: "Financials", icon: "💵", show: canViewFinance },
    { id: "admin", label: "Administration", icon: "⚙️", show: canViewAdmin },
    { id: "fleet-map", label: isClient ? "Track Shipment" : "Fleet Map", icon: "📍", show: canViewMap },
  ];

  // Global search filtering
  const allSearchableEntities = [
    ...(canViewVehicles ? state.vehicles.map(v => ({ type: "Vehicle", id: v.id, label: `${v.name} (${v.registrationNumber})`, tab: "vehicles" })) : []),
    ...(canViewDrivers ? state.drivers.map(d => ({ type: "Driver", id: d.id, label: `${d.fullName} (${d.employeeId})`, tab: "drivers" })) : []),
    ...(canViewTrips ? state.trips.map(t => ({ type: "Trip", id: t.id, label: `${t.source} ➔ ${t.destination}`, tab: "trips" })) : [])
  ];

  const searchResults = globalSearchQuery.trim() === "" ? [] : allSearchableEntities.filter(e => 
    e.label.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
    e.id.toLowerCase().includes(globalSearchQuery.toLowerCase())
  ).slice(0, 5);

  const handleSearchSelect = (result) => {
    setActiveTab(result.tab);
    onSelectSearchEntity(result.tab, result.id);
    setGlobalSearchQuery("");
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    onSelectSearchEntity(tabId, null);
  };

  const unreadAlerts = state.alerts?.filter(a => !a.read) || [];
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <div className="app-sidebar">
        <div className="sidebar-logo">
          <div className="brand">TRANSIT<span>OPS</span></div>
        </div>
        
        <div className="sidebar-nav">
          {menuItems.filter(item => item.show).map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleTabClick(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user.role.charAt(0)}</div>
            <div>
              <div className="user-name">{user.role}</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: "100%" }} onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="app-main">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="search-box">
            {!isClient && (
              <>
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search across accessible vehicles, drivers, or trips (Ctrl+K)..." 
                  value={globalSearchQuery}
                  onChange={e => setGlobalSearchQuery(e.target.value)}
                />
                {globalSearchQuery && searchResults.length > 0 && (
                  <div className="search-results">
                    <div className="result-header">Global Search Results</div>
                    {searchResults.map(res => (
                      <div key={`${res.type}-${res.id}`} className="result-item" onClick={() => handleSearchSelect(res)}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{res.label}</span>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{res.id}</div>
                        </div>
                        <span className="badge badge-neutral">{res.type}</span>
                      </div>
                    ))}
                  </div>
                )}
                {globalSearchQuery && searchResults.length === 0 && (
                  <div className="search-results">
                    <div className="result-item" style={{ color: "var(--text-tertiary)", justifyContent: "center" }}>
                      No matches found in accessible modules.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>


          <div className="topbar-right">
            <button className="notification-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
              🔔
              {unreadAlerts.length > 0 && <span className="notification-badge">{unreadAlerts.length}</span>}
            </button>
            
            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-panel-header">
                  <span>System Alerts</span>
                  {unreadAlerts.length > 0 && <span className="badge badge-danger">{unreadAlerts.length} New</span>}
                </div>
                <div className="notification-panel-body">
                  {state.alerts.length === 0 ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>No active alerts.</div>
                  ) : (
                    state.alerts.map(a => (
                      <div key={a.id} className={`alert-item ${a.severity === 'High' ? 'critical' : ''}`}>
                        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{a.type}</div>
                        <div style={{ color: "var(--text-secondary)" }}>{a.message}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "6px" }}>
                          {new Date(a.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  );
}
