import Inventory from "../models/inventory.js";

// List inventory, with populated product info
export const listInventory = async (req, res) => {
  const inventory = await Inventory.find().populate("productId", "name category price");
  res.json(inventory);
};

// Update stock available for a product (e.g. after a restock)
export const updateInventory = async (req, res) => {
  const { stockAvailable } = req.body;
  if (stockAvailable === undefined || stockAvailable < 0) {
    return res.status(400).json({ error: "stockAvailable must be a non-negative number" });
  }
  const record = await Inventory.findOneAndUpdate(
    { productId: req.params.productId },
    { stockAvailable, lastUpdated: new Date() },
    { new: true, upsert: true }
  ).populate("productId", "name category price");
  res.json(record);
};

// Low-stock alerts - products under a threshold (default 10)
export const lowStockAlerts = async (req, res) => {
  const threshold = Number(req.query.threshold) || 10;
  const alerts = await Inventory.find({ stockAvailable: { $lte: threshold } })
    .populate("productId", "name category")
    .sort({ stockAvailable: 1 });
  res.json(alerts);
};
