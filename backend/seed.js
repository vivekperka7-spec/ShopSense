import mongoose from "mongoose";
import dotenv from "dotenv";
import Vendor from "./models/vendor.js";
import Product from "./models/product.js";
import Transaction from "./models/transaction.js";
import Inventory from "./models/inventory.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopsense";

const CATEGORIES = ["Electronics", "Home & Kitchen", "Fashion", "Beauty", "Sports"];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// spread transactions over the last 14 days so the "Milestone 1 (Weeks 1-2)" chart has a trend
const randomDateWithinDays = (days) => {
  const now = Date.now();
  const past = now - randomInt(0, days) * 24 * 60 * 60 * 1000;
  return new Date(past);
};

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected. Clearing old data...");

  await Promise.all([
    Vendor.deleteMany({}),
    Product.deleteMany({}),
    Transaction.deleteMany({}),
    Inventory.deleteMany({})
  ]);

  // 1. Vendors
  const vendorNames = [
    "Urban Threads Co.", "TechNest Electronics", "GreenLeaf Home",
    "GlowUp Beauty", "ProGear Sports", "Artisan Crafts Hub",
    "QuickBite Kitchenware", "StyleLoop Fashion"
  ];

  const vendors = await Vendor.insertMany(
    vendorNames.map((name, i) => ({
      businessName: name,
      contactEmail: `contact${i + 1}@${name.split(" ")[0].toLowerCase()}.com`,
      phone: `98765${String(10000 + i)}`,
      category: randomFrom(CATEGORIES),
      commissionRate: randomInt(5, 15),
      status: i < 6 ? "Active" : i === 6 ? "Pending" : "Suspended"
    }))
  );
  console.log(`Seeded ${vendors.length} vendors`);

  // 2. Products (2-4 per vendor)
  const productDocs = [];
  vendors.forEach((vendor) => {
    const count = randomInt(2, 4);
    for (let i = 0; i < count; i++) {
      productDocs.push({
        vendorId: vendor._id,
        name: `${vendor.businessName.split(" ")[0]} Item ${i + 1}`,
        category: vendor.category,
        price: randomInt(199, 4999),
        stock: randomInt(10, 200),
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(vendor.businessName)}${i}/300/300`
      });
    }
  });
  const products = await Product.insertMany(productDocs);
  console.log(`Seeded ${products.length} products`);

  // Mirror each product's stock into the separate Inventory collection
  await Inventory.insertMany(
    products.map((p) => ({ productId: p._id, stockAvailable: p.stock }))
  );
  console.log(`Seeded ${products.length} inventory records`);

  // 3. Transactions (25-35 orders across active vendors' products, last 14 days)
  const activeProducts = products.filter((p) =>
    vendors.find((v) => v._id.equals(p.vendorId) && v.status === "Active")
  );

  const txnDocs = [];
  const txnCount = randomInt(25, 35);
  for (let i = 0; i < txnCount; i++) {
    const product = randomFrom(activeProducts);
    const vendor = vendors.find((v) => v._id.equals(product.vendorId));
    const quantity = randomInt(1, 5);
    txnDocs.push({
      vendorId: vendor._id,
      productId: product._id,
      quantity,
      unitPrice: product.price,
      totalAmount: quantity * product.price,
      status: Math.random() > 0.9 ? "Refunded" : "Completed",
      createdAt: randomDateWithinDays(13)
    });
  }
  await Transaction.insertMany(txnDocs);
  console.log(`Seeded ${txnDocs.length} transactions`);

  console.log("Seeding complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
