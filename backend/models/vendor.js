import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  contactEmail: { type: String, required: true, unique: true },
  phone: String,
  category: String,               // primary product category, useful for filtering later
  commissionRate: { type: Number, default: 10 },
  status: {
    type: String,
    enum: ["Pending", "Active", "Suspended"],
    default: "Pending"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Vendor", vendorSchema);
