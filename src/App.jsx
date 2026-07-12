import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Shell from "./components/Shell";
import Dashboard from "./components/Dashboard";
import DataDashboard from "./components/DataDashboard";
import Vehicles from "./components/Vehicles";
import Drivers from "./components/Drivers";
import Trips from "./components/Trips";
import Maintenance from "./components/Maintenance";
import Finance from "./components/Finance";
import Admin from "./components/Admin";
import TripTracker from "./components/TripTracker";
import FleetMap from "./components/FleetMap";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchTriggeredEntity, setSearchTriggeredEntity] = useState(null);

  const [state, setState] = useState({
    vehicles: [],
    drivers: [],
    trips: [],
    maintenance: [],
    fuelLogs: [],
    expenses: [],
    auditTrail: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const syncState = async () => {
    // SECURITY BOUNDARY: Do not fetch internal state for Logistics Client
    if (user && user.role === "Logistics Client") {
      setLoading(false);
      return;
    }

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (user) {
        headers["x-user-role"] = user.role;
        headers["x-user-emp"] = user.employeeId;
      }

      const res = await fetch("http://localhost:3001/api/state", { headers });
      if (!res.ok) throw new Error("Failed to synchronize state with server registry.");
      const data = await res.json();
      setState(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    syncState();

    // SECURITY BOUNDARY: Do not poll internal state for Logistics Client
    if (user.role === "Logistics Client") return;

    const timer = setInterval(() => { syncState(); }, 5000);
    return () => clearInterval(timer);
  }, [user, token]);

  const handleLogin = (authenticatedUser, userToken) => {
    setUser(authenticatedUser);
    setToken(userToken);
    setLoading(true);
    if (authenticatedUser.role === "Logistics Client") {
      setActiveTab("fleet-map");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setState({
      vehicles: [], drivers: [], trips: [], maintenance: [],
      fuelLogs: [], expenses: [], auditTrail: [], alerts: []
    });
  };

  const handleSearchEntitySelect = (tabId, entity) => {
    setSearchTriggeredEntity(entity);
  };

  const path = window.location.pathname;
  if (path.startsWith("/track/")) {
    const token = path.replace("/track/", "");
    return <TripTracker token={token} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading && state.vehicles.length === 0) {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)", color: "var(--text-main)"
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "10px" }}>⚡ TRANSIT<span style={{ color: "var(--accent)" }}>OPS</span></div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
          Synchronizing telemetry nodes...
        </div>
      </div>
    );
  }

  return (
    <Shell
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      state={state}
      globalSearchQuery={globalSearchQuery}
      setGlobalSearchQuery={setGlobalSearchQuery}
      onSelectSearchEntity={handleSearchEntitySelect}
    >
      {error && (
        <div className="inline-error" style={{ marginBottom: "1rem" }}>
          ⚠️ Registry Sync Offline: {error}
        </div>
      )}

      {activeTab === "dashboard" && (
        <Dashboard user={user} state={state} onNavigate={setActiveTab} />
      )}

      {activeTab === "data-dashboard" && (
        <DataDashboard user={user} state={state} onNavigate={setActiveTab} />
      )}

      {activeTab === "vehicles" && (
        <Vehicles user={user} state={state} onUpdateState={syncState} />
      )}

      {activeTab === "drivers" && (
        <Drivers user={user} state={state} onUpdateState={syncState} />
      )}

      {activeTab === "trips" && (
        <Trips user={user} state={state} onUpdateState={syncState} />
      )}

      {activeTab === "maintenance" && (
        <Maintenance user={user} state={state} onUpdateState={syncState} />
      )}

      {activeTab === "finance" && (
        <Finance user={user} state={state} onUpdateState={syncState} />
      )}

      {activeTab === "admin" && (
        <Admin user={user} state={state} onUpdateState={syncState} />
      )}

      {activeTab === "fleet-map" && (
        <FleetMap user={user} state={state} />
      )}
    </Shell>
  );
}

export default App;
