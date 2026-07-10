import mongoose from "mongoose";

// Mirrors the reference schema: inventory tracked as its own collection,
// separate from the product's own `stock` field, so stock movements can be
// audited/updated independently (e.g. by a warehouse process later).
const inventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
  stockAvailable: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model("Inventory", inventorySchema);
