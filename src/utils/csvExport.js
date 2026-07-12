// Utility to sanitize and format CSV cells
const sanitizeCell = (value, type = "string") => {
  if (value === null || value === undefined || Number.isNaN(value) || value === Infinity || value === -Infinity) {
    return "";
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }

  let str = String(value);

  // Prevent formula injection if it's text
  if (type === "string" && /^[=\-+@]/.test(str)) {
    str = "'" + str;
  }

  // Escape quotes
  if (str.includes('"')) {
    str = str.replace(/"/g, '""');
  }

  // Wrap in quotes if it contains comma, newline, or quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    str = `"${str}"`;
  }

  return str;
};

const generateCSV = (headers, rows) => {
  const headerRow = headers.map(h => sanitizeCell(h, "string")).join(",");
  const dataRows = rows.map(row => 
    row.map(cell => sanitizeCell(cell.value, cell.type)).join(",")
  );
  return "\uFEFF" + [headerRow, ...dataRows].join("\n");
};

const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Main Export Function, category-aware based on DataDashboard view
export const exportDashboardData = (category, state, user, filters = {}) => {
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  let headers = [];
  let rows = [];
  let filename = `transitops-${category.toLowerCase().replace(/\s+/g, "-")}-report-${today}.csv`;

  // Pre-filter state based on dateFilter if applicable
  let filteredTrips = state.trips;
  let filteredExpenses = state.expenses;
  
  if (filters.dateFilter === "30") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filterDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    filteredTrips = state.trips.filter(t => (t.actualDispatchTimestamp || t.plannedStart) >= filterDate);
    filteredExpenses = state.expenses.filter(e => e.date >= filterDate);
  }

  const role = user?.role;
  const canViewFinancials = ["System Administrator", "Fleet Manager", "Financial Analyst"].includes(role);
  const canViewCompliance = ["System Administrator", "Safety Officer"].includes(role);
  const canViewPersonnel = ["System Administrator", "Fleet Manager", "Dispatcher", "Safety Officer"].includes(role);
  
  try {
    if (category === "Revenue" && canViewFinancials) {
      headers = ["Internal ID", "Route", "Revenue Amount", "Completion Date"];
      const completedTrips = filteredTrips.filter(t => t.status === "Completed");
      rows = completedTrips.map(t => [
        { value: t.id, type: "string" },
        { value: `${t.source} -> ${t.destination}`, type: "string" },
        { value: t.revenue || 0, type: "number" },
        { value: t.expectedCompletion || t.actualDispatchTimestamp || "", type: "string" }
      ]);
    } 
    else if (category === "Expenses" && canViewFinancials) {
      headers = ["Expense ID", "Category", "Amount", "Vehicle ID", "Date", "Anomaly Status"];
      rows = filteredExpenses.map(e => [
        { value: e.id, type: "string" },
        { value: e.category, type: "string" },
        { value: e.amount, type: "number" },
        { value: e.vehicleId || "N/A", type: "string" },
        { value: e.date, type: "string" },
        { value: e.isAnomaly ? "Anomaly" : "Normal", type: "string" }
      ]);
    }
    else if (category === "Profitability" && canViewFinancials) {
      headers = ["Metric", "Value", "Notes"];
      const completedTrips = filteredTrips.filter(t => t.status === "Completed");
      const totalRev = completedTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const totalCost = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = totalRev - totalCost;
      const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;
      rows = [
        [
          { value: "Total Revenue", type: "string" },
          { value: totalRev, type: "number" },
          { value: "Completed trips only", type: "string" }
        ],
        [
          { value: "Total Cost", type: "string" },
          { value: totalCost, type: "number" },
          { value: "All logged expenses", type: "string" }
        ],
        [
          { value: "Gross Profit", type: "string" },
          { value: profit, type: "number" },
          { value: "", type: "string" }
        ],
        [
          { value: "Profit Margin %", type: "string" },
          { value: margin, type: "number" },
          { value: "", type: "string" }
        ]
      ];
    }
    else if (category === "Trip Operations") {
      headers = ["Trip ID", "Status", "Source", "Destination", "Planned Start", "Expected Completion"];
      rows = filteredTrips.map(t => [
        { value: t.id, type: "string" },
        { value: t.status, type: "string" },
        { value: t.source, type: "string" },
        { value: t.destination, type: "string" },
        { value: t.plannedStart || "", type: "string" },
        { value: t.expectedCompletion || "", type: "string" }
      ]);
    }
    else if (category === "Fleet Utilization") {
      headers = ["Vehicle ID", "Registration", "Type", "Operational Status"];
      rows = state.vehicles.map(v => [
        { value: v.id, type: "string" },
        { value: v.registrationNumber, type: "string" },
        { value: v.vehicleType, type: "string" },
        { value: v.operationalStatus, type: "string" }
      ]);
    }
    else if (category === "Vehicle Status") {
      headers = ["Vehicle ID", "Registration", "Current Status", "Compliance", "Maintenance", "Attention Reason"];
      rows = state.vehicles.map(v => [
        { value: v.id, type: "string" },
        { value: v.registrationNumber, type: "string" },
        { value: v.operationalStatus, type: "string" },
        { value: v.complianceStatus, type: "string" },
        { value: v.maintenanceStatus, type: "string" },
        { value: v.flagReason || "", type: "string" }
      ]);
    }
    else if (category === "Maintenance Risk") {
      headers = ["Vehicle ID", "Registration", "Risk Score", "Risk Classification", "Maintenance Status", "Explainable Factor"];
      rows = state.vehicles.map(v => [
        { value: v.id, type: "string" },
        { value: v.registrationNumber, type: "string" },
        { value: v.healthScore || 0, type: "number" },
        { value: (v.healthScore > 85 ? "Low Risk" : v.healthScore > 65 ? "Moderate Risk" : "High Risk"), type: "string" },
        { value: v.maintenanceStatus, type: "string" },
        { value: v.flagReason || "N/A", type: "string" }
      ]);
    }
    else if (category === "Driver Performance" && canViewPersonnel) {
      headers = ["Driver ID", "Name", "Completed Trips", "Safety Score", "Operational Status"];
      rows = state.drivers.map(d => [
        { value: d.id, type: "string" },
        { value: d.fullName, type: "string" },
        { value: d.completedTrips || 0, type: "number" },
        { value: d.safetyScore || 0, type: "number" },
        { value: d.operationalStatus, type: "string" }
      ]);
    }
    else if (category === "Safety" && canViewPersonnel) {
      headers = ["Driver ID", "Name", "Safety Score", "Suspension State", "Attention Reason"];
      rows = state.drivers.map(d => [
        { value: d.id, type: "string" },
        { value: d.fullName, type: "string" },
        { value: d.safetyScore || 0, type: "number" },
        { value: d.complianceStatus === "Suspended" ? "Suspended" : "Active", type: "string" },
        { value: d.flagReason || "N/A", type: "string" }
      ]);
    }
    else if (category === "Compliance" && canViewCompliance) {
      headers = ["Entity Type", "Entity ID", "Entity Name", "Compliance Status", "Escalation Level", "Blocker Reason"];
      // Combine drivers and vehicles
      const entities = [
        ...state.drivers.map(d => ({ type: "Driver", id: d.id, name: d.fullName, status: d.complianceStatus, reason: d.flagReason })),
        ...state.vehicles.map(v => ({ type: "Vehicle", id: v.id, name: v.registrationNumber, status: v.complianceStatus, reason: v.flagReason }))
      ];
      rows = entities.map(e => [
        { value: e.type, type: "string" },
        { value: e.id, type: "string" },
        { value: e.name, type: "string" },
        { value: e.status, type: "string" },
        { value: (e.status === "Expired" || e.status === "Suspended" || e.status === "Grounded") ? "Critical" : (e.status === "Warning" ? "Warning" : "Clear"), type: "string" },
        { value: e.reason || "", type: "string" }
      ]);
    }
    else if (category === "Expense Anomalies" && canViewFinancials) {
      headers = ["Expense ID", "Category", "Actual Amount", "Expected Baseline", "Percentage Deviation", "Baseline Source", "Review Status"];
      const anomalies = filteredExpenses.filter(e => e.isAnomaly);
      rows = anomalies.map(e => [
        { value: e.id, type: "string" },
        { value: e.category, type: "string" },
        { value: e.amount, type: "number" },
        { value: e.baseline || 0, type: "number" },
        { value: e.deviation || 0, type: "number" },
        { value: "Historical Average", type: "string" },
        { value: "Pending Review", type: "string" }
      ]);
    }
    else if (category === "Fleet ROI Yield" && canViewFinancials) {
      headers = ["Vehicle ID", "Registration", "Revenue Contribution", "Operating Cost", "Net Yield (ROI)"];
      rows = state.vehicles.filter(v => v.operationalStatus !== "Retired").map(v => {
        const tripsForVehicle = filteredTrips.filter(t => t.vehicleId === v.id && t.status === "Completed");
        const rev = tripsForVehicle.reduce((sum, t) => sum + (t.revenue || 0), 0);
        const cost = filteredExpenses.filter(e => e.vehicleId === v.id).reduce((sum, e) => sum + e.amount, 0);
        const net = rev - cost;
        return [
          { value: v.id, type: "string" },
          { value: v.registrationNumber, type: "string" },
          { value: rev, type: "number" },
          { value: cost, type: "number" },
          { value: net, type: "number" }
        ];
      });
    }
    else if (category === "Fleet Availability") {
      headers = ["Vehicle ID", "Registration", "Availability State", "Capacity (kg)", "Blocking Reason"];
      rows = state.vehicles.map(v => [
        { value: v.id, type: "string" },
        { value: v.registrationNumber, type: "string" },
        { value: v.operationalStatus, type: "string" },
        { value: v.maxLoadCapacity || 0, type: "number" },
        { value: v.operationalStatus !== "Available" ? v.flagReason || "Unavailable" : "", type: "string" }
      ]);
    }
    else if (category === "Driver Availability") {
      headers = ["Driver ID", "Name", "Operational Status", "Compliance Status", "Dispatch Blocker"];
      rows = state.drivers.map(d => {
        let blocker = "";
        if (d.operationalStatus !== "Available") blocker = "Not Available";
        if (d.complianceStatus === "Expired" || d.complianceStatus === "Suspended") blocker = "Compliance Failure";
        return [
          { value: d.id, type: "string" },
          { value: d.fullName, type: "string" },
          { value: d.operationalStatus, type: "string" },
          { value: d.complianceStatus, type: "string" },
          { value: blocker, type: "string" }
        ];
      });
    }
    else if (category === "Dynamic Pricing") {
      alert("Dynamic pricing estimates are calculated statelessly and not persisted historically. CSV export is not available for this category.");
      return;
    }
    else {
      alert("No exportable data available for the current category, or you are unauthorized.");
      return;
    }

    if (rows.length === 0) {
      alert("No report data is available for the current category and filters.");
      return;
    }

    const csvContent = generateCSV(headers, rows);
    downloadCSV(csvContent, filename);
    
  } catch (err) {
    console.error("Export Error: ", err);
    alert("An error occurred while generating the report.");
  }
};
