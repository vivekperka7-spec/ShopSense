import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  name: { type: String, required: true },
  category: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Product", productSchema);
