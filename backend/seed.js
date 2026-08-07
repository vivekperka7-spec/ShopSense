import mongoose from "mongoose";
import dotenv from "dotenv";
import Vendor from "./models/vendor.js";
import Product from "./models/product.js";
import Transaction from "./models/transaction.js";
import Inventory from "./models/inventory.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopsense";

// Real product catalog per category. Each product gets its own search
// keyword, used to fetch a genuine, content-matched photo from the Pexels
// API at seed time (free, real curated stock photography - not a guessed
// or unmoderated URL). If no PEXELS_API_KEY is set, falls back to Picsum
// (real photography, but not content-matched) so seeding still works
// out of the box.
const CATALOG = {
  Electronics: [
    { name: "Wireless Bluetooth Earbuds", keyword: "wireless earbuds", seed: "shopsense-electronics-1" },
    { name: "Smart Fitness Tracker Band", keyword: "fitness tracker watch", seed: "shopsense-electronics-2" },
    { name: "Portable Bluetooth Speaker", keyword: "portable bluetooth speaker", seed: "shopsense-electronics-3" },
    { name: "USB-C Fast Charging Cable", keyword: "usb c charging cable", seed: "shopsense-electronics-4" }
  ],
  "Home & Kitchen": [
    { name: "Ceramic Coffee Mug Set", keyword: "ceramic coffee mug", seed: "shopsense-home-1" },
    { name: "Stainless Steel Cooking Pot", keyword: "stainless steel cooking pot", seed: "shopsense-home-2" },
    { name: "Non-Stick Frying Pan", keyword: "frying pan", seed: "shopsense-home-3" },
    { name: "Bamboo Cutting Board", keyword: "wooden cutting board", seed: "shopsense-home-4" }
  ],
  Fashion: [
    { name: "Cotton Crew Neck T-Shirt", keyword: "plain cotton t-shirt", seed: "shopsense-fashion-1" },
    { name: "Slim Fit Denim Jeans", keyword: "denim jeans folded", seed: "shopsense-fashion-2" },
    { name: "Canvas Tote Bag", keyword: "canvas tote bag", seed: "shopsense-fashion-3" },
    { name: "Wool Blend Scarf", keyword: "wool scarf", seed: "shopsense-fashion-4" }
  ],
  Beauty: [
    { name: "Vitamin C Face Serum", keyword: "skincare serum bottle", seed: "shopsense-beauty-1" },
    { name: "Hydrating Face Moisturizer", keyword: "face moisturizer jar", seed: "shopsense-beauty-2" },
    { name: "Herbal Shampoo Bar", keyword: "shampoo bar", seed: "shopsense-beauty-3" },
    { name: "Matte Liquid Lipstick", keyword: "lipstick", seed: "shopsense-beauty-4" }
  ],
  Sports: [
    { name: "Running Shoes", keyword: "running shoes", seed: "shopsense-sports-1" },
    { name: "Yoga Mat", keyword: "rolled yoga mat", seed: "shopsense-sports-2" },
    { name: "Adjustable Dumbbell Set", keyword: "dumbbells", seed: "shopsense-sports-3" },
    { name: "Insulated Sports Water Bottle", keyword: "insulated water bottle", seed: "shopsense-sports-4" }
  ]
};
const CATEGORIES = Object.keys(CATALOG);

// Fallback visual when no Pexels key is set or a search comes up empty:
// a clean icon on a category-colored background, generated locally with
// zero network dependency - matches the product's category (unlike a
// random unrelated stock photo), and can never fail to load.
const CATEGORY_STYLE = {
  Electronics: { color: "#2563EB", icon: "\u{1F3A7}" },
  "Home & Kitchen": { color: "#D97706", icon: "\u{1F373}" },
  Fashion: { color: "#7C3AED", icon: "\u{1F455}" },
  Beauty: { color: "#DB2777", icon: "\u{1F484}" },
  Sports: { color: "#059669", icon: "\u{1F45F}" }
};

const iconFallback = (category) => {
  const style = CATEGORY_STYLE[category] || { color: "#334155", icon: "\u{1F4E6}" };
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
    <rect width='400' height='400' fill='${style.color}'/>
    <text x='50%' y='50%' font-size='140' text-anchor='middle' dominant-baseline='central'>${style.icon}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// Fetch a genuine, content-matched photo from Pexels for this product's
// keyword. Falls back to a category-matched icon (not an unrelated random
// photo) if no API key is set, the request fails, or nothing is found -
// so seeding always succeeds, and images are always at least relevant.
const imageFor = async (item, category) => {
  const fallback = iconFallback(category);
  if (!PEXELS_API_KEY) return fallback;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(item.keyword)}&per_page=1&orientation=square`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    const photo = data.photos?.[0];
    return photo?.src?.medium || fallback;
  } catch {
    return fallback;
  }
};

// Sample customer emails so Milestone 2 segmentation/recommendations have
// real groupings to work with, instead of every order being an anonymous guest.
const SAMPLE_CUSTOMERS = [
  "riya.sharma@example.com",
  "arjun.mehta@example.com",
  "priya.nair@example.com",
  "kabir.singh@example.com",
  "ananya.rao@example.com"
];

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

  // 2. Products (2-4 per vendor, drawn from the real catalog for that vendor's category)
  console.log(PEXELS_API_KEY ? "Fetching real product photos from Pexels..." : "No PEXELS_API_KEY set - using Picsum fallback images");
  const productDocs = [];
  for (const vendor of vendors) {
    const items = [...CATALOG[vendor.category]]; // copy so we can pick without repeats per vendor
    const count = randomInt(2, Math.min(4, items.length));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * items.length);
      const [item] = items.splice(idx, 1); // remove so this vendor doesn't repeat a product
      const imageUrl = await imageFor(item, vendor.category);
      productDocs.push({
        vendorId: vendor._id,
        name: item.name,
        category: vendor.category,
        price: randomInt(199, 4999),
        stock: randomInt(10, 200),
        imageUrl
      });
    }
  }
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

  // Weighted so purchase frequency varies across customers - gives
  // segmentation something real to show (High Value / Regular / New),
  // rather than every customer landing in the same bucket.
  const customerWeights = [5, 3, 3, 1, 1]; // riya & arjun buy often, ananya/kabir rarely
  const weightedCustomerPool = SAMPLE_CUSTOMERS.flatMap((c, i) => Array(customerWeights[i]).fill(c));

  const txnDocs = [];
  const txnCount = randomInt(30, 45);
  for (let i = 0; i < txnCount; i++) {
    const product = randomFrom(activeProducts);
    const vendor = vendors.find((v) => v._id.equals(product.vendorId));
    const quantity = randomInt(1, 5);
    txnDocs.push({
      vendorId: vendor._id,
      productId: product._id,
      customerId: randomFrom(weightedCustomerPool),
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
