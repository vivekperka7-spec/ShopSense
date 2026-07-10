import Product from "../models/product.js";
import Inventory from "../models/inventory.js";

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    // keep the separate Inventory collection in sync
    await Inventory.create({ productId: product._id, stockAvailable: product.stock || 0 });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listProducts = async (req, res) => {
  const filter = req.query.vendorId ? { vendorId: req.query.vendorId } : {};
  const products = await Product.find(filter).populate("vendorId", "businessName");
  res.json(products);
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate("vendorId", "businessName");
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (req.body.stock !== undefined) {
      await Inventory.findOneAndUpdate(
        { productId: product._id },
        { stockAvailable: req.body.stock, lastUpdated: new Date() },
        { upsert: true }
      );
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  await Inventory.deleteOne({ productId: product._id });
  res.json({ deleted: true });
};
