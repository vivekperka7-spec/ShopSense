import mongoose from "mongoose";

const inventoryForecastSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  predictedStock: { type: Number, required: true },
  windowDays: { type: Number, required: true },
  confidenceLevel: { type: Number, default: 0.8 },
  forecastDate: { type: Date, default: Date.now }
});

export default mongoose.model("InventoryForecast", inventoryForecastSchema);
