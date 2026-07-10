import Wishlist from "../models/wishlist.js";

// Save (or add to) a customer's wishlist - upsert by customerId
export const addToWishlist = async (req, res) => {
  const { customerId, productId } = req.body;
  if (!customerId || !productId) {
    return res.status(400).json({ error: "customerId and productId are required" });
  }
  const wishlist = await Wishlist.findOneAndUpdate(
    { customerId },
    { $addToSet: { productIds: productId }, updatedAt: new Date() },
    { new: true, upsert: true }
  );
  res.json(wishlist);
};

export const getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ customerId: req.params.customerId }).populate(
    "productIds"
  );
  res.json(wishlist || { customerId: req.params.customerId, productIds: [] });
};

export const removeFromWishlist = async (req, res) => {
  const { customerId, productId } = req.body;
  const wishlist = await Wishlist.findOneAndUpdate(
    { customerId },
    { $pull: { productIds: productId }, updatedAt: new Date() },
    { new: true }
  );
  res.json(wishlist);
};
