import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true }, // quantity * unitPrice, stored for fast aggregation
  status: {
    type: String,
    enum: ["Completed", "Refunded", "Pending"],
    default: "Completed"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);
