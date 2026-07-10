import Vendor from "../models/vendor.js";

// Basic validation to hit the ">=99% of vendor registrations validate correctly" target
const validateVendorPayload = (body) => {
  const errors = [];
  if (!body.businessName || body.businessName.trim().length < 2) {
    errors.push("businessName is required (min 2 characters)");
  }
  if (!body.contactEmail || !/^\S+@\S+\.\S+$/.test(body.contactEmail)) {
    errors.push("a valid contactEmail is required");
  }
  return errors;
};

// Register new vendor
export const registerVendor = async (req, res) => {
  const errors = validateVendorPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (err) {
    // duplicate email etc.
    res.status(400).json({ error: err.message });
  }
};

// List all vendors (optionally filter by status)
export const listVendors = async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const vendors = await Vendor.find(filter).sort({ createdAt: -1 });
  res.json(vendors);
};

// Update vendor details (full edit)
export const updateVendor = async (req, res) => {
  if (req.body.businessName !== undefined && req.body.businessName.trim().length < 2) {
    return res.status(400).json({ error: "Validation failed", details: ["businessName is required (min 2 characters)"] });
  }
  if (req.body.contactEmail !== undefined && !/^\S+@\S+\.\S+$/.test(req.body.contactEmail)) {
    return res.status(400).json({ error: "Validation failed", details: ["a valid contactEmail is required"] });
  }
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update vendor status (approve / suspend / activate)
export const updateVendorStatus = async (req, res) => {
  const { status } = req.body;
  if (!["Pending", "Active", "Suspended"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }
  const vendor = await Vendor.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!vendor) return res.status(404).json({ error: "Vendor not found" });
  res.json(vendor);
};
