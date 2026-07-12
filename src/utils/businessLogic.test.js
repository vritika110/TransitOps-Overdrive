// Business validation specs verification
import {
  normalizeRegistration,
  normalizeLicenseNumber,
  calculateFuelEfficiency,
  calculateROI
} from "./businessRules.js";

console.log("▶ Beginning TransitOps Business Logic Verification Rules...");

// 1. Normalized unique plate formats verification
const plateA = normalizeRegistration("KA-01-AB-1234");
const plateB = normalizeRegistration("ka01ab1234");
const plateC = normalizeRegistration("KA 01 AB 1234");

if (plateA === "KA01AB1234" && plateB === "KA01AB1234" && plateC === "KA01AB1234") {
  console.log("   Plate normalization matches perfectly: KA01AB1234");
} else {
  console.error("   Plate normalization validation failure.");
}

// 2. Division-by-zero mitigation checks
const invalidEfficiency = calculateFuelEfficiency(100, 0);
if (invalidEfficiency === null) {
  console.log("   Fuel efficiency division by zero correctly returned null (avoiding NaN/Infinity)");
} else {
  console.error("   Fuel efficiency calculation contains logical loopholes.");
}

// 3. ROI edge cases check (Acquisition Cost = 0)
const invalidROI = calculateROI(1000, 100, 200, 50, 0);
if (invalidROI === null) {
  console.log("   ROI calculation with zero acquisition cost returned null (avoiding infinity error)");
} else {
  console.error("   ROI calculation logic fails on zero division.");
}

console.log("★ TransitOps business constraints checks completed successfully.");
export {};
