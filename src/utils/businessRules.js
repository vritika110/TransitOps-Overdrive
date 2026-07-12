/**
 * TransitOps - Business Rules Engine
 * Centralized source of truth for enums, permissions, validations, and metrics.
 * Built by Team Overdrive.
 */

export const ROLES = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
  SYSTEM_ADMIN: "System Administrator",
};

export const VEHICLE_OPERATIONAL_STATUS = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  OFF_ROAD: "Off Road",
  RETIRED: "Retired",
};

export const VEHICLE_MAINTENANCE_STATUS = {
  CLEAR: "Clear",
  DUE_SOON: "Due Soon",
  OVERDUE: "Overdue",
  IN_SHOP: "In Shop",
};

export const VEHICLE_COMPLIANCE_STATUS = {
  COMPLIANT: "Compliant",
  EXPIRING_SOON: "Expiring Soon",
  NON_COMPLIANT: "Non-Compliant",
};

export const DRIVER_OPERATIONAL_STATUS = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  OFF_DUTY: "Off Duty",
};

export const DRIVER_COMPLIANCE_STATUS = {
  VALID: "Valid",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
};

export const DRIVER_EMPLOYMENT_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  TERMINATED: "Terminated",
};

export const TRIP_STATUS = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  READY: "Ready for Dispatch",
  DISPATCHED: "Dispatched",
  IN_TRANSIT: "In Transit",
  ARRIVED: "Arrived",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DELAYED: "Delayed",
  INTERRUPTED: "Interrupted",
  FAILED: "Failed",
};

export const MAINTENANCE_STATUS = {
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const EXPENSE_CATEGORIES = {
  FUEL: "Fuel",
  MAINTENANCE: "Maintenance",
  TOLL: "Toll",
  PARKING: "Parking",
  MISC: "Miscellaneous",
};

// Permission Matrix (Role-based actions)
export const PERMISSIONS = {
  [ROLES.FLEET_MANAGER]: {
    VEHICLES_MANAGE: true,
    VEHICLES_VIEW: true,
    MAINTENANCE_MANAGE: true,
    MAINTENANCE_VIEW: true,
    DRIVERS_VIEW: true,
    TRIPS_VIEW: true,
    ANALYTICS_OPERATIONAL: true,
    ANALYTICS_FINANCIAL: false,
    USERS_MANAGE: false,
    AUDIT_VIEW: false,
  },
  [ROLES.DISPATCHER]: {
    VEHICLES_MANAGE: false,
    VEHICLES_VIEW: true,
    MAINTENANCE_MANAGE: false,
    MAINTENANCE_VIEW: true,
    DRIVERS_VIEW: true,
    TRIPS_MANAGE: true,
    TRIPS_VIEW: true,
    ANALYTICS_OPERATIONAL: true,
    ANALYTICS_FINANCIAL: false,
    USERS_MANAGE: false,
    AUDIT_VIEW: false,
  },
  [ROLES.SAFETY_OFFICER]: {
    VEHICLES_MANAGE: false,
    VEHICLES_VIEW: true,
    MAINTENANCE_MANAGE: false,
    MAINTENANCE_VIEW: true,
    DRIVERS_MANAGE: true,
    DRIVERS_VIEW: true,
    TRIPS_VIEW: true,
    ANALYTICS_OPERATIONAL: true,
    ANALYTICS_FINANCIAL: false,
    USERS_MANAGE: false,
    AUDIT_VIEW: false,
  },
  [ROLES.FINANCIAL_ANALYST]: {
    VEHICLES_MANAGE: false,
    VEHICLES_VIEW: true,
    MAINTENANCE_MANAGE: false,
    MAINTENANCE_VIEW: true,
    DRIVERS_VIEW: true,
    TRIPS_VIEW: true,
    FINANCE_MANAGE: true,
    ANALYTICS_OPERATIONAL: true,
    ANALYTICS_FINANCIAL: true,
    USERS_MANAGE: false,
    AUDIT_VIEW: false,
  },
  [ROLES.SYSTEM_ADMIN]: {
    VEHICLES_MANAGE: true,
    VEHICLES_VIEW: true,
    MAINTENANCE_MANAGE: true,
    MAINTENANCE_VIEW: true,
    DRIVERS_MANAGE: true,
    DRIVERS_VIEW: true,
    TRIPS_MANAGE: true,
    TRIPS_VIEW: true,
    FINANCE_MANAGE: true,
    ANALYTICS_OPERATIONAL: true,
    ANALYTICS_FINANCIAL: true,
    USERS_MANAGE: true,
    AUDIT_VIEW: true,
  },
};

/**
 * Normalizes registration plates.
 * e.g., "KA-01-AB-1234" -> "KA01AB1234"
 */
export function normalizeRegistration(reg) {
  if (!reg) return "";
  return reg.replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Normalizes driver license number.
 */
export function normalizeLicenseNumber(lic) {
  if (!lic) return "";
  return lic.replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Determines rating band for driver safety score (0-100)
 */
export function getSafetyRatingBand(score) {
  if (score >= 90) return { band: "Excellent", color: "#10b981" };
  if (score >= 75) return { band: "Good", color: "#3b82f6" };
  if (score >= 60) return { band: "Fair", color: "#f59e0b" };
  return { band: "Risk Check Required", color: "#ef4444" };
}

/**
 * Calculates Fuel Efficiency
 */
export function calculateFuelEfficiency(distance, fuelConsumed) {
  if (typeof distance !== "number" || typeof fuelConsumed !== "number" || fuelConsumed <= 0 || distance <= 0) {
    return null;
  }
  return distance / fuelConsumed;
}

/**
 * Calculates vehicle Attributable operating costs and ROI
 */
export function calculateROI(revenue, fuelCost, maintenanceCost, otherExpense, acquisitionCost) {
  if (typeof acquisitionCost !== "number" || acquisitionCost <= 0) {
    return null;
  }
  const operatingCost = (fuelCost || 0) + (maintenanceCost || 0) + (otherExpense || 0);
  const profit = (revenue || 0) - operatingCost;
  return (profit / acquisitionCost) * 100;
}
