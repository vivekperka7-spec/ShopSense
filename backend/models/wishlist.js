import mongoose from "mongoose";

// Lightweight wishlist: one doc per customer, list of saved products.
// customerId is a free-text/email identifier for now since there's no
// full customer auth system in Milestone 1 - swap for a Customer ref
// once that model exists in Milestone 2.
const wishlistSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Wishlist", wishlistSchema);
