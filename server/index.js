import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// In-Memory Database Registry
let db = {
  vehicles: [
    {
      id: "V-01",
      registrationNumber: "KA-01-AB-1234",
      normalizedRegistrationNumber: "KA01AB1234",
      name: "Atlas Hauler",
      make: "Volvo",
      model: "FH16",
      vehicleType: "Heavy Truck",
      maxLoadCapacity: 15000,
      odometer: 124500,
      acquisitionCost: 145000,
      acquisitionDate: "2024-01-15",
      fuelType: "Diesel",
      operationalStatus: "Available",
      maintenanceStatus: "Clear",
      complianceStatus: "Compliant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "V-02",
      registrationNumber: "MH-12-PQ-9876",
      normalizedRegistrationNumber: "MH12PQ9876",
      name: "Metro Transit Van",
      make: "Ford",
      model: "Transit",
      vehicleType: "LGC/Van",
      maxLoadCapacity: 2000,
      odometer: 84200,
      acquisitionCost: 45000,
      acquisitionDate: "2024-06-10",
      fuelType: "Diesel",
      operationalStatus: "On Trip",
      maintenanceStatus: "Clear",
      complianceStatus: "Compliant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "V-03",
      registrationNumber: "DL-03-XY-4321",
      normalizedRegistrationNumber: "DL03XY4321",
      name: "Volt Express",
      make: "Tesla",
      model: "Semi",
      vehicleType: "Electric Semi",
      maxLoadCapacity: 20000,
      odometer: 15200,
      acquisitionCost: 180000,
      acquisitionDate: "2025-02-20",
      fuelType: "Electric",
      operationalStatus: "Off Road",
      maintenanceStatus: "In Shop",
      complianceStatus: "Compliant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "V-04",
      registrationNumber: "KA-05-MM-5555",
      normalizedRegistrationNumber: "KA05MM5555",
      name: "City Sprinter",
      make: "Mercedes-Benz",
      model: "Sprinter",
      vehicleType: "LGC/Van",
      maxLoadCapacity: 2500,
      odometer: 210000,
      acquisitionCost: 55000,
      acquisitionDate: "2021-11-05",
      fuelType: "Diesel",
      operationalStatus: "Retired",
      maintenanceStatus: "Clear",
      complianceStatus: "Non-Compliant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "VAN-05",
      registrationNumber: "KA-03-ZZ-9999",
      normalizedRegistrationNumber: "KA03ZZ9999",
      name: "Overdrive Express Cargo",
      make: "Ford",
      model: "Transit Custom",
      vehicleType: "LGC/Van",
      maxLoadCapacity: 500,
      odometer: 45000,
      acquisitionCost: 38000,
      acquisitionDate: "2024-03-01",
      fuelType: "Petrol",
      operationalStatus: "Available",
      maintenanceStatus: "Clear",
      complianceStatus: "Compliant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  drivers: [
    {
      id: "D-01",
      employeeId: "EMP-410",
      fullName: "Marcus Vance",
      contactNumber: "+1-555-0192",
      emergencyContact: "+1-555-0199",
      licenceNumber: "LIC-88219-MV",
      normalizedLicenceNumber: "LIC88219MV",
      licenceCategory: "Heavy Truck",
      licenceIssueDate: "2020-05-12",
      licenceExpiryDate: "2028-05-12",
      permittedVehicleCategories: ["Heavy Truck", "LGC/Van", "Electric Semi"],
      safetyScore: 94,
      tripCompletionRate: 98.2,
      operationalStatus: "Available",
      complianceStatus: "Valid",
      employmentStatus: "Active",
      totalCompletedTrips: 142,
      totalDistanceDriven: 45000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "D-02",
      employeeId: "EMP-512",
      fullName: "Sarah Jenkins",
      contactNumber: "+1-555-0248",
      emergencyContact: "+1-555-0249",
      licenceNumber: "LIC-77123-SJ",
      normalizedLicenceNumber: "LIC77123SJ",
      licenceCategory: "LGC/Van",
      licenceIssueDate: "2021-08-20",
      licenceExpiryDate: "2026-08-20",
      permittedVehicleCategories: ["LGC/Van"],
      safetyScore: 88,
      tripCompletionRate: 95.0,
      operationalStatus: "On Trip",
      complianceStatus: "Valid",
      employmentStatus: "Active",
      totalCompletedTrips: 87,
      totalDistanceDriven: 24300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "D-03",
      employeeId: "EMP-609",
      fullName: "Robert Chen",
      contactNumber: "+1-555-0371",
      emergencyContact: "+1-555-0372",
      licenceNumber: "LIC-11092-RC",
      normalizedLicenceNumber: "LIC11092RC",
      licenceCategory: "Heavy Truck",
      licenceIssueDate: "2015-01-10",
      licenceExpiryDate: "2026-07-20", // Expiring soon relative to 2026-07-12
      permittedVehicleCategories: ["Heavy Truck", "Electric Semi"],
      safetyScore: 78,
      tripCompletionRate: 92.1,
      operationalStatus: "Available",
      complianceStatus: "Expiring Soon",
      employmentStatus: "Active",
      totalCompletedTrips: 210,
      totalDistanceDriven: 85000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "D-04",
      employeeId: "EMP-902",
      fullName: "David Miller",
      contactNumber: "+1-555-0901",
      emergencyContact: "+1-555-0902",
      licenceNumber: "LIC-44556-DM",
      normalizedLicenceNumber: "LIC44556DM",
      licenceCategory: "Heavy Truck",
      licenceIssueDate: "2010-04-01",
      licenceExpiryDate: "2026-06-01", // Expired
      permittedVehicleCategories: ["Heavy Truck"],
      safetyScore: 65,
      tripCompletionRate: 85.5,
      operationalStatus: "Off Duty",
      complianceStatus: "Expired",
      employmentStatus: "Active",
      totalCompletedTrips: 340,
      totalDistanceDriven: 154000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "D-05",
      employeeId: "EMP-103",
      fullName: "James Peterson",
      contactNumber: "+1-555-1030",
      emergencyContact: "+1-555-1039",
      licenceNumber: "LIC-99388-JP",
      normalizedLicenceNumber: "LIC99388JP",
      licenceCategory: "Heavy Truck",
      licenceIssueDate: "2022-09-15",
      licenceExpiryDate: "2027-09-15",
      permittedVehicleCategories: ["Heavy Truck"],
      safetyScore: 45,
      tripCompletionRate: 70.0,
      operationalStatus: "Off Duty",
      complianceStatus: "Suspended",
      employmentStatus: "Active",
      totalCompletedTrips: 32,
      totalDistanceDriven: 11000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  trips: [
    {
      id: "T-1001",
      source: "Chicago Depot",
      destination: "Detroit Hub",
      vehicleId: "V-02",
      driverId: "D-02",
      cargoDescription: "Automotive Precision Castings",
      cargoWeight: 1400,
      plannedDistance: 280,
      plannedStart: "2026-07-12T08:00:00.000Z",
      expectedCompletion: "2026-07-12T14:00:00.000Z",
      status: "In Transit",
      startingOdometer: 83920,
      revenue: 2500,
      createdBy: "EMP-001",
      createdAt: "2026-07-11T12:00:00.000Z"
    },
    {
      id: "T-1002",
      source: "Seattle Terminal",
      destination: "Portland Depot",
      vehicleId: "V-01",
      driverId: "D-01",
      cargoDescription: "Electronics Shipment",
      cargoWeight: 8000,
      plannedDistance: 174,
      plannedStart: "2026-07-13T09:00:00.000Z",
      expectedCompletion: "2026-07-13T13:00:00.000Z",
      status: "Scheduled",
      startingOdometer: 124500,
      revenue: 1950,
      createdBy: "EMP-001",
      createdAt: "2026-07-12T04:30:00.000Z"
    },
    {
      id: "T-1003",
      source: "Los Angeles Depot",
      destination: "Phoenix Terminal",
      vehicleId: "V-01",
      driverId: "D-01",
      cargoDescription: "Pharmaceuticals Coldchain",
      cargoWeight: 4200,
      plannedDistance: 370,
      plannedStart: "2026-07-10T06:00:00.000Z",
      expectedCompletion: "2026-07-10T13:00:00.000Z",
      actualDispatchTimestamp: "2026-07-10T06:05:00.000Z",
      actualCompletionTimestamp: "2026-07-10T13:10:00.000Z",
      startingOdometer: 124130,
      finalOdometer: 124500,
      actualDistance: 370,
      fuelConsumed: 115,
      revenue: 4100,
      status: "Completed",
      createdBy: "EMP-001",
      createdAt: "2026-07-09T10:00:00.000Z"
    }
  ],
  maintenance: [
    {
      id: "M-301",
      vehicleId: "V-03",
      serviceType: "Battery Pack Diagnostics",
      description: "Perform cell balance testing and cooling manifold inspection.",
      startDate: "2026-07-11",
      expectedCompletion: "2026-07-14",
      status: "Active",
      cost: 1850,
      notes: "Battery cell #43 reported minor thermal drift during operations.",
      createdBy: "EMP-002",
      createdAt: "2026-07-11T09:00:00.000Z"
    }
  ],
  fuelLogs: [
    {
      id: "FL-501",
      vehicleId: "V-01",
      driverId: "D-01",
      tripId: "T-1003",
      dateTime: "2026-07-10T13:15:00.000Z",
      litres: 115,
      pricePerLitre: 1.45,
      totalCost: 166.75,
      odometerReading: 124500,
      fuelType: "Diesel",
      notes: "Post-trip top off. Standard station pricing."
    }
  ],
  expenses: [
    {
      id: "EXP-801",
      category: "Fuel",
      amount: 166.75,
      date: "2026-07-10",
      vehicleId: "V-01",
      tripId: "T-1003",
      description: "Fuel Log FL-501 automatic link sync.",
      linkedSourceId: "FL-501",
      createdBy: "System"
    },
    {
      id: "EXP-802",
      category: "Maintenance",
      amount: 1850.00,
      date: "2026-07-11",
      vehicleId: "V-03",
      description: "Diagnostics work order M-301 sync.",
      linkedSourceId: "M-301",
      createdBy: "System"
    },
    {
      id: "EXP-803",
      category: "Toll",
      amount: 45.00,
      date: "2026-07-10",
      vehicleId: "V-01",
      tripId: "T-1003",
      description: "I-10 Expressway Toll Passages",
      createdBy: "EMP-001"
    }
  ],
  auditTrail: [
    {
      id: "AUD-001",
      actor: "System Administrator",
      action: "Database Initialized",
      entityType: "System",
      entityId: "SYSTEM",
      timestamp: new Date().toISOString(),
      details: "Production mock operational data seeded successfully.",
      previousHash: "GENESIS",
      hash: crypto.createHash('sha256').update(JSON.stringify({
        id: "AUD-001", actor: "System Administrator", action: "Database Initialized", 
        entityType: "System", entityId: "SYSTEM", timestamp: new Date().toISOString(), 
        details: "Production mock operational data seeded successfully.", oldValues: null, newValues: null
      }) + "GENESIS").digest('hex')
    }
  ],
  alerts: [
    {
      id: "ALT-901",
      type: "Licence expiring soon",
      severity: "Warning",
      message: "Driver Robert Chen's licence (LIC-11092-RC) expires in 8 days.",
      entityType: "Driver",
      entityId: "D-03",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: "ALT-902",
      type: "Licence expired",
      severity: "High",
      message: "Driver David Miller has an expired license (LIC-44556-DM). Dispatch blocked.",
      entityType: "Driver",
      entityId: "D-04",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    }
  ]
};

// Inject compliance dates and tracking tokens into the mock database on startup
db.vehicles.forEach((v, i) => {
  // Give every vehicle some default compliance dates
  v.insuranceExpiry = "2027-01-01";
  v.pucExpiry = "2027-01-01";
  v.permitExpiry = "2027-01-01";
  v.roadTaxExpiry = "2027-01-01";
  
  if (v.id === "V-01") {
    v.insuranceExpiry = "2026-07-13"; // Expiring tomorrow relative to 2026-07-12
  } else if (v.id === "V-04") {
    v.insuranceExpiry = "2026-07-08"; // Expired
    v.complianceStatus = "Non-Compliant";
  }
});

db.trips.forEach(t => {
  if (!t.trackingToken) {
    t.trackingToken = crypto.randomBytes(16).toString('hex');
  }
});

// App Configuration for Dynamic Pricing and Anomaly Detection
const appConfig = {
  defaultFuelEfficiencyKmL: 5,
  defaultFuelPrice: 100,
  defaultWearFactor: 2.5,
  defaultDemandMultiplier: 1.15,
  targetMarkupMultiplier: 1.2
};

// Simulated Concurrency Dispatch Lock Flag
let atomicDispatchLock = false;


// Crypto Audit Helper
function recordAudit(actor, action, entityType, entityId, details, oldValues = null, newValues = null) {
  const timestamp = new Date().toISOString();
  const id = 'AUD-' + Date.now() + Math.floor(Math.random() * 1000);
  
  const previousEntry = db.auditTrail.length > 0 ? db.auditTrail[db.auditTrail.length - 1] : null;
  const previousHash = previousEntry ? previousEntry.hash : 'GENESIS';

  const canonicalData = JSON.stringify({
    id, actor, action, entityType, entityId, timestamp, details, oldValues, newValues
  });

  const hash = crypto.createHash('sha256').update(canonicalData + previousHash).digest('hex');

  const entry = {
    id, actor, action, entityType, entityId, timestamp, details,
    oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
    newValues: newValues ? JSON.stringify(newValues) : undefined,
    hash, previousHash
  };
  
  db.auditTrail.push(entry);
}

// 1. API HELPER MIDDLEWARE
function authenticateUser(req, res, next) {
  // Demo mode: simply extract user metadata header
  const userRole = req.headers["x-user-role"] || "Dispatcher";
  const userEmp = req.headers["x-user-emp"] || "EMP-001";
  req.user = { role: userRole, employeeId: userEmp };
  next();
}

// 2. AUTH & USER ROLES
app.post("/api/auth/login", (req, res) => {
  const { emailOrEmp, password } = req.body;
  if (!emailOrEmp || !password) {
    return res.status(400).json({ error: "Email or Employee ID and password are required." });
  }

  // Demo accounts lookup
  const accounts = {
    "fleet.manager@transitops.com": { id: "EMP-001", name: "Alice Rodriguez", role: "Fleet Manager" },
    "dispatcher@transitops.com": { id: "EMP-002", name: "Bob Carter", role: "Dispatcher" },
    "safety.officer@transitops.com": { id: "EMP-003", name: "Clara Vance", role: "Safety Officer" },
    "finance@transitops.com": { id: "EMP-004", name: "David Kross", role: "Financial Analyst" },
    "admin@transitops.com": { id: "EMP-005", name: "SysAdmin Overdrive", role: "System Administrator" },
    "client@transitops.com": { id: "CLI-001", name: "Acme Logistics", role: "Logistics Client" }
  };

  const matched = accounts[emailOrEmp.toLowerCase()] || accounts[emailOrEmp];
  if (!matched) {
    // Audit failed login
    db.auditTrail.push({
      id: `AUD-${Date.now()}`,
      actor: "Anonymous",
      action: "Failed Login",
      entityType: "Auth",
      entityId: "ANONYMOUS",
      timestamp: new Date().toISOString(),
      details: `Failed login attempt with identifier: ${emailOrEmp}`
    });
    return res.status(401).json({ error: "Invalid credentials or account does not exist." });
  }

  // Audit successful login
  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: matched.name,
    action: "Login",
    entityType: "Auth",
    entityId: matched.id,
    timestamp: new Date().toISOString(),
    details: `Successfully logged in as ${matched.role}`
  });

  return res.json({ token: `mock-jwt-token-${matched.id}`, user: matched });
});

// Get Database State
app.get("/api/state", authenticateUser, (req, res) => {
  const { role } = req.user;

  // STRICT SECURITY BOUNDARY for Logistics Client
  if (role === "Logistics Client") {
    return res.status(403).json({ error: "Access Denied. Logistics Clients cannot access internal application state." });
  }

  let responseData = { ...db };

  // Data Pruning for restricted roles
  if (role === "Dispatcher" || role === "Safety Officer") {
    responseData.vehicles = db.vehicles.map(v => {
      const { acquisitionCost, ...rest } = v;
      return rest;
    });
    responseData.trips = db.trips.map(t => {
      const { revenue, ...rest } = t;
      return rest;
    });
    responseData.maintenance = db.maintenance.map(m => {
      const { cost, ...rest } = m;
      return rest;
    });
    responseData.expenses = [];
  }

  res.json(responseData);
});

// 3. VEHICLE MANAGEMENT
app.post("/api/vehicles", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Fleet Manager" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied. Fleet Manager or Admin rights required." });
  }

  const { registrationNumber, name, make, model, vehicleType, maxLoadCapacity, odometer, acquisitionCost, acquisitionDate, fuelType } = req.body;
  
  if (!registrationNumber || !name || !make || !model || !vehicleType || !fuelType) {
    return res.status(400).json({ error: "Missing required vehicle parameters." });
  }

  const normalized = registrationNumber.replace(/[\s-]/g, "").toUpperCase();
  const exists = db.vehicles.some(v => v.normalizedRegistrationNumber === normalized);
  if (exists) {
    return res.status(409).json({ error: `Vehicle with registration plate ${registrationNumber} already exists (Normalized match: ${normalized}).` });
  }

  if (Number(maxLoadCapacity) <= 0 || isNaN(maxLoadCapacity)) {
    return res.status(400).json({ error: "Maximum load capacity must be greater than zero." });
  }
  if (Number(odometer) < 0 || isNaN(odometer)) {
    return res.status(400).json({ error: "Odometer reading cannot be negative." });
  }
  if (Number(acquisitionCost) < 0 || isNaN(acquisitionCost)) {
    return res.status(400).json({ error: "Acquisition cost cannot be negative." });
  }

  const newVehicle = {
    id: `V-0${db.vehicles.length + 1}`,
    registrationNumber,
    normalizedRegistrationNumber: normalized,
    name,
    make,
    model,
    vehicleType,
    maxLoadCapacity: Number(maxLoadCapacity),
    odometer: Number(odometer),
    acquisitionCost: Number(acquisitionCost),
    acquisitionDate: acquisitionDate || new Date().toISOString().split("T")[0],
    fuelType,
    operationalStatus: "Available",
    maintenanceStatus: "Clear",
    complianceStatus: "Compliant",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.vehicles.push(newVehicle);
  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: req.user.role,
    action: "Vehicle Created",
    entityType: "Vehicle",
    entityId: newVehicle.id,
    timestamp: new Date().toISOString(),
    details: `Registered new vehicle: ${newVehicle.name} (${newVehicle.registrationNumber})`
  });

  res.status(201).json(newVehicle);
});

// Update Operational/Compliance/Maintenance Status
app.patch("/api/vehicles/:id", authenticateUser, (req, res) => {
  const { role } = req.user;
  const { id } = req.params;
  const vehicle = db.vehicles.find(v => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found." });
  }

  if (role !== "Fleet Manager" && role !== "System Administrator") {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { name, make, model, operationalStatus, odometer, complianceStatus } = req.body;

  if (odometer !== undefined) {
    if (Number(odometer) < vehicle.odometer) {
      return res.status(400).json({ error: `Odometer reading cannot decrease from previous value of ${vehicle.odometer} km without privileged correction workflow.` });
    }
    vehicle.odometer = Number(odometer);
  }

  const oldState = { ...vehicle };

  if (name) vehicle.name = name;
  if (make) vehicle.make = make;
  if (model) vehicle.model = model;
  if (operationalStatus) vehicle.operationalStatus = operationalStatus;
  if (complianceStatus) vehicle.complianceStatus = complianceStatus;
  
  vehicle.updatedAt = new Date().toISOString();

  recordAudit(req.user.role, "Vehicle Updated", "Vehicle", vehicle.id, `Updated vehicle properties.`, oldState, vehicle);

  res.json(vehicle);
});

// 4. DRIVER MANAGEMENT
app.post("/api/drivers", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Safety Officer" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied. Only Safety Officers and System Admins can manage drivers." });
  }

  const { employeeId, fullName, contactNumber, emergencyContact, licenceNumber, licenceCategory, licenceIssueDate, licenceExpiryDate } = req.body;

  if (!employeeId || !fullName || !licenceNumber || !licenceCategory || !licenceExpiryDate) {
    return res.status(400).json({ error: "Missing mandatory driver metrics." });
  }

  const normalizedLic = licenceNumber.replace(/[\s-]/g, "").toUpperCase();
  const exists = db.drivers.some(d => d.normalizedLicenceNumber === normalizedLic);
  if (exists) {
    return res.status(409).json({ error: `Driver with license number ${licenceNumber} already exists.` });
  }

  const newDriver = {
    id: `D-0${db.drivers.length + 1}`,
    employeeId,
    fullName,
    contactNumber,
    emergencyContact,
    licenceNumber,
    normalizedLicenceNumber: normalizedLic,
    licenceCategory,
    licenceIssueDate,
    licenceExpiryDate,
    permittedVehicleCategories: [licenceCategory],
    safetyScore: 90,
    tripCompletionRate: 100.0,
    operationalStatus: "Available",
    complianceStatus: new Date(licenceExpiryDate) < new Date() ? "Expired" : "Valid",
    employmentStatus: "Active",
    totalCompletedTrips: 0,
    totalDistanceDriven: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.drivers.push(newDriver);
  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: req.user.role,
    action: "Driver Created",
    entityType: "Driver",
    entityId: newDriver.id,
    timestamp: new Date().toISOString(),
    details: `Added new driver: ${newDriver.fullName} (${newDriver.employeeId})`
  });

  res.status(201).json(newDriver);
});

app.patch("/api/drivers/:id", authenticateUser, (req, res) => {
  const { role } = req.user;
  const { id } = req.params;
  const driver = db.drivers.find(d => d.id === id);
  if (!driver) {
    return res.status(404).json({ error: "Driver not found." });
  }

  if (role !== "Safety Officer" && role !== "System Administrator") {
    return res.status(403).json({ error: "Access Denied." });
  }

  const { fullName, contactNumber, complianceStatus, employmentStatus, safetyScore } = req.body;
  const oldState = { ...driver };

  if (fullName) driver.fullName = fullName;
  if (contactNumber) driver.contactNumber = contactNumber;
  if (complianceStatus) driver.complianceStatus = complianceStatus;
  if (employmentStatus) driver.employmentStatus = employmentStatus;
  if (safetyScore !== undefined) driver.safetyScore = Math.max(0, Math.min(100, Number(safetyScore)));
  
  driver.updatedAt = new Date().toISOString();

  recordAudit(req.user.role, "Driver Updated", "Driver", driver.id, `Updated driver status properties.`, oldState, driver);

  res.json(driver);
});

// 5. TRIP PLANNING & DISPATCH VALIDATION ENGINE WITH CONCURRENCY LOCK
app.post("/api/trips", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Dispatcher" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied. Only Dispatchers can plan/dispatch trips." });
  }

  const { source, destination, vehicleId, driverId, cargoDescription, cargoWeight, plannedDistance, plannedStart, expectedCompletion, revenue } = req.body;

  // Check inputs
  if (!source || !destination || !vehicleId || !driverId || !cargoDescription || !plannedStart || !expectedCompletion) {
    return res.status(400).json({ error: "Missing required trip planning details." });
  }

  if (source.trim() === "" || destination.trim() === "") {
    return res.status(400).json({ error: "Source and destination cannot be blank." });
  }

  if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
    return res.status(400).json({ error: "Source and destination cannot be identical." });
  }

  const weight = Number(cargoWeight);
  const distance = Number(plannedDistance);
  const revVal = Number(revenue);

  if (isNaN(weight) || weight <= 0 || !isFinite(weight)) {
    return res.status(400).json({ error: "Cargo weight must be a finite number greater than zero." });
  }
  if (isNaN(distance) || distance <= 0 || !isFinite(distance)) {
    return res.status(400).json({ error: "Planned distance must be a finite number greater than zero." });
  }
  if (isNaN(revVal) || revVal < 0 || !isFinite(revVal)) {
    return res.status(400).json({ error: "Revenue cannot be negative or infinite." });
  }

  if (new Date(expectedCompletion) <= new Date(plannedStart)) {
    return res.status(400).json({ error: "Expected completion must occur after planned start date." });
  }

  // Fetch entities
  const vehicle = db.vehicles.find(v => v.id === vehicleId);
  const driver = db.drivers.find(d => d.id === driverId);

  if (!vehicle) return res.status(404).json({ error: "Assigned vehicle does not exist." });
  if (!driver) return res.status(404).json({ error: "Assigned driver does not exist." });

  // Capacity evaluation
  if (weight > vehicle.maxLoadCapacity) {
    return res.status(400).json({ error: `Capacity exceeded by ${weight - vehicle.maxLoadCapacity} kg — dispatch blocked.` });
  }

  // Create Draft / Scheduled Trip
  const newTrip = {
    id: `T-${1000 + db.trips.length + 1}`,
    source,
    destination,
    vehicleId,
    driverId,
    cargoDescription,
    cargoWeight: weight,
    plannedDistance: distance,
    plannedStart,
    expectedCompletion,
    revenue: revVal,
    status: "Scheduled",
    startingOdometer: vehicle.odometer,
    createdBy: req.user.employeeId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.trips.push(newTrip);
  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: req.user.role,
    action: "Trip Created",
    entityType: "Trip",
    entityId: newTrip.id,
    timestamp: new Date().toISOString(),
    details: `Trip scheduled from ${source} to ${destination} with vehicle ${vehicleId}.`
  });

  res.status(201).json(newTrip);
});

// Dispatch Trip - Concurrency safe endpoint
app.post("/api/trips/:id/dispatch", authenticateUser, async (req, res) => {
  const { role } = req.user;
  if (role !== "Dispatcher" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied." });
  }

  const { id } = req.params;

  // SIMULATE CONCURRENCY LOCK RACE CONDITION
  // If simulated atomic dispatch lock is true, reject
  if (atomicDispatchLock) {
    return res.status(409).json({
      error: "Vehicle assignment was locked by another dispatch thread moments ago. Refreshing resources."
    });
  }

  // Acquire lock
  atomicDispatchLock = true;

  try {
    const trip = db.trips.find(t => t.id === id);
    if (!trip) {
      atomicDispatchLock = false;
      return res.status(404).json({ error: "Trip not found." });
    }

    if (trip.status !== "Scheduled" && trip.status !== "Draft") {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Invalid state transition: Cannot dispatch from ${trip.status}` });
    }

    const vehicle = db.vehicles.find(v => v.id === trip.vehicleId);
    const driver = db.drivers.find(d => d.id === trip.driverId);

    // Validate Vehicle dispatch eligibility
    if (!vehicle || vehicle.operationalStatus === "Retired" || vehicle.operationalStatus === "Off Road" || vehicle.operationalStatus === "On Trip" || vehicle.maintenanceStatus === "In Shop" || vehicle.complianceStatus === "Non-Compliant") {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Vehicle eligibility check failed. Status: Ops=${vehicle?.operationalStatus}, Maint=${vehicle?.maintenanceStatus}, Compliance=${vehicle?.complianceStatus}` });
    }

    if (trip.cargoWeight > vehicle.maxLoadCapacity) {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Vehicle capacity check failed. Trip cargo weight (${trip.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoadCapacity} kg).` });
    }

    // Check actual Compliance Autopilot dates
    const now = new Date();
    if (new Date(vehicle.insuranceExpiry) < now) {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Dispatch blocked: Vehicle insurance expired on ${new Date(vehicle.insuranceExpiry).toLocaleDateString()}.` });
    }
    if (new Date(vehicle.pucExpiry) < now) {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Dispatch blocked: Vehicle PUC expired on ${new Date(vehicle.pucExpiry).toLocaleDateString()}.` });
    }
    if (new Date(vehicle.permitExpiry) < now) {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Dispatch blocked: Vehicle permit expired on ${new Date(vehicle.permitExpiry).toLocaleDateString()}.` });
    }
    if (new Date(vehicle.roadTaxExpiry) < now) {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Dispatch blocked: Vehicle road tax expired on ${new Date(vehicle.roadTaxExpiry).toLocaleDateString()}.` });
    }

    // Validate Driver dispatch eligibility
    if (!driver || driver.employmentStatus !== "Active" || driver.operationalStatus !== "Available" || driver.complianceStatus === "Suspended" || driver.complianceStatus === "Expired" || new Date(driver.licenceExpiryDate) < new Date(trip.expectedCompletion)) {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Driver eligibility check failed. Status: Employment=${driver?.employmentStatus}, Ops=${driver?.operationalStatus}, Compliance=${driver?.complianceStatus}. License must remain valid through end of trip.` });
    }

    if (!driver.permittedVehicleCategories.includes(vehicle.vehicleType)) {
      atomicDispatchLock = false;
      return res.status(400).json({ error: `Driver license category compatibility check failed. Driver is not permitted to operate ${vehicle.vehicleType} vehicles.` });
    }

    // Update statuses atomically
    trip.status = "Dispatched";
    trip.actualDispatchTimestamp = new Date().toISOString();
    trip.updatedAt = new Date().toISOString();

    vehicle.operationalStatus = "On Trip";
    vehicle.updatedAt = new Date().toISOString();

    driver.operationalStatus = "On Trip";
    driver.updatedAt = new Date().toISOString();

    db.auditTrail.push({
      id: `AUD-${Date.now()}`,
      actor: req.user.role,
      action: "Trip Dispatched",
      entityType: "Trip",
      entityId: trip.id,
      timestamp: new Date().toISOString(),
      details: `Trip ${trip.id} dispatched. Vehicle ${vehicle.id} and Driver ${driver.id} operational status set to On Trip.`
    });

    atomicDispatchLock = false; // release
    res.json(trip);

  } catch (err) {
    atomicDispatchLock = false; // release
    res.status(500).json({ error: "Internal server error during atomic dispatch operation." });
  }
});

// Trip Completion Route with validations
app.post("/api/trips/:id/complete", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Dispatcher" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied." });
  }

  const { id } = req.params;
  const { finalOdometer, fuelConsumed, actualRevenue } = req.body;

  const trip = db.trips.find(t => t.id === id);
  if (!trip) return res.status(404).json({ error: "Trip not found." });

  if (trip.status !== "Dispatched" && trip.status !== "In Transit" && trip.status !== "Arrived") {
    return res.status(400).json({ error: "Can only complete active dispatched/transit trips." });
  }

  const vehicle = db.vehicles.find(v => v.id === trip.vehicleId);
  const driver = db.drivers.find(d => d.id === trip.driverId);

  const fOdo = Number(finalOdometer);
  const fCons = Number(fuelConsumed);
  const actRev = actualRevenue !== undefined ? Number(actualRevenue) : trip.revenue;

  if (isNaN(fOdo) || fOdo < trip.startingOdometer) {
    return res.status(400).json({ error: `Final odometer (${fOdo}) cannot be lower than starting odometer (${trip.startingOdometer} km).` });
  }

  if (isNaN(fCons) || fCons < 0) {
    return res.status(400).json({ error: "Fuel consumed cannot be negative." });
  }

  const actualDistance = fOdo - trip.startingOdometer;

  // Perform transitions
  trip.status = "Completed";
  trip.finalOdometer = fOdo;
  trip.actualDistance = actualDistance;
  trip.fuelConsumed = fCons;
  trip.revenue = actRev;
  trip.actualCompletionTimestamp = new Date().toISOString();
  trip.updatedAt = new Date().toISOString();

  // Restore resource states ONLY if eligibility remains valid
  if (vehicle) {
    vehicle.odometer = fOdo;
    if (vehicle.operationalStatus !== "Retired" && vehicle.operationalStatus !== "Off Road") {
      vehicle.operationalStatus = "Available";
    }
    vehicle.updatedAt = new Date().toISOString();
  }

  if (driver) {
    driver.totalCompletedTrips += 1;
    driver.totalDistanceDriven += actualDistance;
    if (driver.employmentStatus === "Active" && driver.complianceStatus !== "Suspended" && driver.complianceStatus !== "Expired") {
      driver.operationalStatus = "Available";
    } else {
      driver.operationalStatus = "Off Duty";
    }
    driver.updatedAt = new Date().toISOString();
  }

  // Create Fuel Log entry & Expense Log if fuel was consumed
  if (fCons > 0) {
    const fuelLogId = `FL-${500 + db.fuelLogs.length + 1}`;
    const fuelCost = fCons * 1.5; // Mock price per litre
    db.fuelLogs.push({
      id: fuelLogId,
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      tripId: trip.id,
      dateTime: new Date().toISOString(),
      litres: fCons,
      pricePerLitre: 1.5,
      totalCost: fuelCost,
      odometerReading: fOdo,
      fuelType: vehicle?.fuelType || "Diesel",
      notes: `Automated logs from trip ${trip.id} completion.`
    });

    db.expenses.push({
      id: `EXP-${800 + db.expenses.length + 1}`,
      category: "Fuel",
      amount: fuelCost,
      date: new Date().toISOString().split("T")[0],
      vehicleId: trip.vehicleId,
      tripId: trip.id,
      description: `Fuel Log ${fuelLogId} automatic linked sync.`,
      linkedSourceId: fuelLogId,
      createdBy: "System"
    });
  }

  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: req.user.role,
    action: "Trip Completed",
    entityType: "Trip",
    entityId: trip.id,
    timestamp: new Date().toISOString(),
    details: `Trip completed. Distance: ${actualDistance} km. Vehicle/Driver availability re-validated.`
  });

  res.json(trip);
});

// Trip Cancellation
app.post("/api/trips/:id/cancel", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Dispatcher" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied. Only Dispatchers can cancel trips." });
  }

  const { id } = req.params;
  const { cancellationReason } = req.body;

  if (!cancellationReason || cancellationReason.trim() === "") {
    return res.status(400).json({ error: "Cancellation reason is mandatory." });
  }

  const trip = db.trips.find(t => t.id === id);
  if (!trip) return res.status(404).json({ error: "Trip not found." });

  if (trip.status === "Completed" || trip.status === "Cancelled") {
    return res.status(400).json({ error: "Cannot cancel a completed or already cancelled trip." });
  }

  const vehicle = db.vehicles.find(v => v.id === trip.vehicleId);
  const driver = db.drivers.find(d => d.id === trip.driverId);

  // Restore states if trip was dispatched
  if (trip.status === "Dispatched" || trip.status === "In Transit") {
    if (vehicle && vehicle.operationalStatus !== "Retired") {
      vehicle.operationalStatus = "Available";
    }
    if (driver && driver.employmentStatus === "Active" && driver.complianceStatus !== "Suspended") {
      driver.operationalStatus = "Available";
    }
  }

  trip.status = "Cancelled";
  trip.cancellationReason = cancellationReason;
  trip.updatedAt = new Date().toISOString();

  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: req.user.role,
    action: "Trip Cancelled",
    entityType: "Trip",
    entityId: trip.id,
    timestamp: new Date().toISOString(),
    details: `Trip cancelled. Reason: ${cancellationReason}`
  });

  res.json(trip);
});

// 6. MAINTENANCE
app.post("/api/maintenance", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Fleet Manager" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied." });
  }

  const { vehicleId, serviceType, description, startDate, expectedCompletion, cost } = req.body;

  if (!vehicleId || !serviceType || !startDate || !expectedCompletion) {
    return res.status(400).json({ error: "Missing required maintenance parameters." });
  }

  const vehicle = db.vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found." });

  if (vehicle.operationalStatus === "On Trip") {
    return res.status(400).json({ error: "Vehicle is currently active on a trip and cannot enter maintenance." });
  }

  const newMaint = {
    id: `M-${300 + db.maintenance.length + 1}`,
    vehicleId,
    serviceType,
    description,
    startDate,
    expectedCompletion,
    status: "Active",
    cost: Number(cost) || 0,
    createdBy: req.user.employeeId,
    createdAt: new Date().toISOString()
  };

  vehicle.maintenanceStatus = "In Shop";
  vehicle.operationalStatus = "Off Road";

  db.maintenance.push(newMaint);

  // Auto create linked expense log to avoid double counting issues
  db.expenses.push({
    id: `EXP-${800 + db.expenses.length + 1}`,
    category: "Maintenance",
    amount: newMaint.cost,
    date: startDate,
    vehicleId,
    description: `Diagnostics work order ${newMaint.id} sync.`,
    linkedSourceId: newMaint.id,
    createdBy: "System"
  });

  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: req.user.role,
    action: "Maintenance Opened",
    entityType: "Maintenance",
    entityId: newMaint.id,
    timestamp: new Date().toISOString(),
    details: `Opened maintenance for vehicle ${vehicleId}. Operational Status: Off Road.`
  });

  res.status(201).json(newMaint);
});

app.post("/api/maintenance/:id/complete", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Fleet Manager" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied. Only Fleet Managers can complete maintenance." });
  }

  const { id } = req.params;
  const maint = db.maintenance.find(m => m.id === id);
  if (!maint) return res.status(404).json({ error: "Maintenance record not found." });

  const vehicle = db.vehicles.find(v => v.id === maint.vehicleId);

  maint.status = "Completed";
  maint.actualCompletion = new Date().toISOString();

  // Evaluate other active blocker shop logs before making available
  const hasOtherBlocker = db.maintenance.some(
    m => m.vehicleId === maint.vehicleId && m.id !== id && m.status === "Active"
  );

  if (vehicle && !hasOtherBlocker) {
    vehicle.maintenanceStatus = "Clear";
    
    // Evaluate Compliance blockers
    const now = new Date();
    const isCompliant = 
      new Date(vehicle.insuranceExpiry) >= now &&
      new Date(vehicle.pucExpiry) >= now &&
      new Date(vehicle.permitExpiry) >= now &&
      new Date(vehicle.roadTaxExpiry) >= now &&
      vehicle.complianceStatus === "Compliant";
      
    if (!isCompliant && vehicle.complianceStatus !== "Non-Compliant") {
      vehicle.complianceStatus = "Non-Compliant";
    }

    // Evaluate operational blockers
    const isOnTrip = db.trips.some(t => t.vehicleId === vehicle.id && (t.status === "Dispatched" || t.status === "In Transit"));
    
    if (vehicle.operationalStatus !== "Retired" && !isOnTrip && isCompliant) {
      vehicle.operationalStatus = "Available";
    } else if (isOnTrip) {
      vehicle.operationalStatus = "On Trip";
    }
  }

  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: req.user.role,
    action: "Maintenance Completed",
    entityType: "Maintenance",
    entityId: maint.id,
    timestamp: new Date().toISOString(),
    details: `Completed service order ${maint.id} for vehicle ${maint.vehicleId}.`
  });

  res.json(maint);
});

// 7. FINANCIAL EXPENSES
app.post("/api/expenses", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Financial Analyst" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied." });
  }

  const { category, amount, date, vehicleId, tripId, description } = req.body;

  if (!category || !amount || !date || !description) {
    return res.status(400).json({ error: "Missing required expense parameters." });
  }

  if (Number(amount) < 0) {
    return res.status(400).json({ error: "Expense amount cannot be negative." });
  }

  const newExpense = {
    id: `EXP-${800 + db.expenses.length + 1}`,
    category,
    amount: Number(amount),
    date,
    vehicleId,
    tripId,
    description,
    createdBy: req.user.employeeId
  };

  db.expenses.push(newExpense);
  db.auditTrail.push({
    id: `AUD-${Date.now()}`,
    actor: req.user.role,
    action: "Expense Created",
    entityType: "Expense",
    entityId: newExpense.id,
    timestamp: new Date().toISOString(),
    details: `Manually recorded expense of $${amount} in category ${category}.`
  });

  res.status(201).json(newExpense);
});

// Demo atomic lock toggle trigger for demonstration purposes
app.post("/api/demo/toggle-lock", authenticateUser, (req, res) => {
  atomicDispatchLock = !atomicDispatchLock;
  res.json({ lockedState: atomicDispatchLock });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasEnvKey: !!process.env.GEMINI_API_KEY,
  });
});

// ==========================================
// INTELLIGENT FEATURES & LEDGER VERIFICATION
// ==========================================

// 1. Audit Ledger Verification
app.get("/api/audit/verify", authenticateUser, (req, res) => {
  if (req.user.role !== "System Administrator") return res.status(403).json({ error: "Access Denied" });
  
  let valid = true;
  let brokenIndex = null;
  
  for (let i = 0; i < db.auditTrail.length; i++) {
    const entry = db.auditTrail[i];
    const prevHash = i === 0 ? "GENESIS" : db.auditTrail[i - 1].hash;
    
    if (entry.previousHash !== prevHash) {
      valid = false;
      brokenIndex = i;
      break;
    }
    
    const canonicalData = JSON.stringify({
      id: entry.id, actor: entry.actor, action: entry.action, 
      entityType: entry.entityType, entityId: entry.entityId, 
      timestamp: entry.timestamp, details: entry.details, 
      oldValues: entry.oldValues || null, newValues: entry.newValues || null
    });
    
    const expectedHash = crypto.createHash('sha256').update(canonicalData + prevHash).digest('hex');
    
    if (entry.hash !== expectedHash) {
      valid = false;
      brokenIndex = i;
      break;
    }
  }
  
  res.json({ verified: valid, brokenIndex, validCount: valid ? db.auditTrail.length : brokenIndex });
});

// 2. Smart Assign Recommendations
app.post("/api/trips/recommendations", authenticateUser, (req, res) => {
  const { cargoWeight, plannedStart, expectedCompletion, licenceRequired = "Heavy Truck" } = req.body;
  const weight = Number(cargoWeight) || 0;
  
  // Hard Filters
  const eligibleVehicles = db.vehicles.filter(v => 
    v.operationalStatus === "Available" && 
    v.maintenanceStatus === "Clear" && 
    v.complianceStatus === "Compliant" &&
    v.maxLoadCapacity >= weight
  );
  
  const eligibleDrivers = db.drivers.filter(d => 
    d.operationalStatus === "Available" &&
    d.employmentStatus === "Active" &&
    d.complianceStatus !== "Expired" &&
    d.complianceStatus !== "Suspended" &&
    new Date(d.licenceExpiryDate) >= new Date(expectedCompletion || Date.now())
  );
  
  let recommendations = [];
  
  for (const v of eligibleVehicles) {
    for (const d of eligibleDrivers) {
      if (!d.permittedVehicleCategories.includes(v.vehicleType)) {
        continue;
      }
      
      let score = 100;
      let reasons = [];
      
      // Capacity Fit (Penalize massive overcapacity)
      const capacityRatio = weight / v.maxLoadCapacity;
      if (capacityRatio < 0.2) {
        score -= 15;
        reasons.push("High overcapacity penalty");
      } else if (capacityRatio >= 0.8) {
        score -= 5;
        reasons.push("Near maximum capacity");
      } else {
        reasons.push("Optimal capacity fit");
      }
      
      // Safety Score (Heavy weight)
      if (d.safetyScore >= 90) {
        reasons.push(`High driver safety (${d.safetyScore}%)`);
      } else if (d.safetyScore < 70) {
        score -= 20;
        reasons.push(`Low driver safety warning (${d.safetyScore}%)`);
      }
      
      // Maintenance / Odometer Balance
      if (v.odometer > 100000) {
        score -= 5;
      } else {
        reasons.push("Low vehicle wear");
      }
      
      recommendations.push({
        vehicle: v,
        driver: d,
        score,
        reasons: reasons.join(" • ")
      });
    }
  }
  
  // Sort descending by score
  recommendations.sort((a, b) => b.score - a.score);
  
  res.json({ recommendations: recommendations.slice(0, 3) });
});

// 3. Smart Maintenance Intelligence
app.get("/api/maintenance/intelligence", authenticateUser, (req, res) => {
  const intelligence = db.vehicles.filter(v => v.operationalStatus !== "Retired").map(v => {
    let riskScore = 0;
    let factors = [];
    
    // Distance factor (Simplified: assume typical maintenance interval is 15,000km, we mock last service at 100k for high odometer cars)
    const mockLastService = v.odometer > 100000 ? v.odometer - 12000 : v.odometer - 2000;
    const distanceSinceLast = v.odometer - mockLastService;
    
    if (distanceSinceLast > 10000) {
      riskScore += 40;
      factors.push(`Driven ${(distanceSinceLast).toLocaleString()} km since last standard service.`);
    }
    
    // Odometer factor
    if (v.odometer > 150000) {
      riskScore += 30;
      factors.push("High mileage lifecycle degradation.");
    } else if (v.odometer > 80000) {
      riskScore += 15;
    }
    
    // Status flag
    if (v.complianceStatus !== "Compliant") {
      riskScore += 25;
      factors.push(`Current compliance flag: ${v.complianceStatus}.`);
    }
    
    // History (mock lookup of recent expenses for this vehicle)
    const recentMaint = db.expenses.filter(e => e.vehicleId === v.id && e.category === "Maintenance");
    if (recentMaint.length >= 2) {
      riskScore += 15;
      factors.push("Repeated maintenance events in recent history.");
    }
    
    let classification = "Healthy";
    if (riskScore >= 80) classification = "Critical Attention";
    else if (riskScore >= 60) classification = "Maintenance Recommended";
    else if (riskScore >= 30) classification = "Monitor";
    
    return { vehicleId: v.id, vehicle: v, riskScore: Math.min(riskScore, 100), classification, factors };
  });
  
  // Only return those needing attention (Score >= 60)
  const actionable = intelligence.filter(i => i.riskScore >= 60).sort((a, b) => b.riskScore - a.riskScore);
  res.json({ actionable });
});

// 4. Dynamic Pricing Calculator
app.post("/api/trips/price-estimate", authenticateUser, (req, res) => {
  const { distance, vehicleId } = req.body;
  const numDistance = Number(distance);

  if (isNaN(numDistance) || numDistance <= 0 || !isFinite(numDistance)) {
    return res.status(400).json({ error: "Invalid distance provided for pricing." });
  }

  const vehicle = db.vehicles.find(v => v.id === vehicleId);
  const efficiency = vehicle ? (vehicle.fuelEfficiencyKmL || appConfig.defaultFuelEfficiencyKmL) : appConfig.defaultFuelEfficiencyKmL;

  const fuelRequired = numDistance / efficiency;
  const fuelCost = fuelRequired * appConfig.defaultFuelPrice;
  const wearCost = numDistance * appConfig.defaultWearFactor;
  const baseCost = fuelCost + wearCost;
  
  const suggestedPrice = (baseCost * appConfig.defaultDemandMultiplier) * appConfig.targetMarkupMultiplier;

  res.json({
    distance: numDistance,
    fuelRequired,
    fuelCost,
    wearCost,
    baseCost,
    demandMultiplier: appConfig.defaultDemandMultiplier,
    targetMarkupMultiplier: appConfig.targetMarkupMultiplier,
    suggestedPrice,
    isFallbackEfficiency: !vehicle || !vehicle.fuelEfficiencyKmL,
    appliedEfficiency: efficiency,
    appliedFuelPrice: appConfig.defaultFuelPrice,
    appliedWearFactor: appConfig.defaultWearFactor
  });
});

// 5. Customer Trip Tracking
app.get("/api/trips/track/:token", (req, res) => {
  const { token } = req.params;
  const trip = db.trips.find(t => t.trackingToken === token);
  
  if (!trip) {
    return res.status(404).json({ error: "Tracking token not found or invalid." });
  }

  // ALLOWLIST: Only return safe customer data
  res.json({
    id: trip.trackingToken, // Expose only the tracking token, never the internal ID
    source: trip.source,
    destination: trip.destination,
    status: trip.status,
    plannedStart: trip.plannedStart,
    actualStart: trip.actualDispatchTimestamp || trip.plannedStart, // fallback safely
    expectedCompletion: trip.expectedCompletion,
    cargoDescription: trip.cargoDescription
  });
});

// 6. Expense Anomaly Detection Review
app.post("/api/expenses/:id/review", authenticateUser, (req, res) => {
  const { role } = req.user;
  if (role !== "Financial Analyst" && role !== "System Administrator") {
    return res.status(403).json({ error: "Permission Denied." });
  }

  const { id } = req.params;
  const { reviewStatus } = req.body; // e.g. "Reviewed — Valid", "Reviewed — Requires Action"

  const expense = db.expenses.find(e => e.id === id);
  if (!expense) return res.status(404).json({ error: "Expense not found." });

  const oldStatus = expense.reviewStatus || "Pending Review";
  expense.reviewStatus = reviewStatus;

  recordAudit(
    req.user.role, 
    "Expense Reviewed", 
    "Expense", 
    id, 
    `Reviewed expense anomaly. Status changed to ${reviewStatus}`, 
    { reviewStatus: oldStatus }, 
    { reviewStatus }
  );

  res.json(expense);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  🚀 TransitOps backend running on http://localhost:${PORT}`);
  });
}

export default app;
