# ShopSense

A multi-vendor e-commerce analytics platform. Vendors manage a product catalog, customers browse and buy, and an analytics layer turns transactions into revenue reports, inventory forecasts, customer segments, and recommendations.

## Stack

| Layer | Choice |
|---|---|
| Database | MongoDB + Mongoose |
| API | Node.js + Express |
| Frontend | React (Vite) + Recharts |

## Architecture

```
React app (localhost:5173)
        |  REST calls, proxied by Vite
        v
Express API (localhost:5000)
        |  Mongoose
        v
MongoDB  ->  vendors, products, inventory, transactions, wishlists, forecasts
```

## Roles

The app has three views, chosen at login (a role switcher, not real password-based auth yet):

- **Admin** — manages vendors, products, and views all analytics
- **Vendor** — manages their own product catalog
- **Customer** — shops, adds to cart, checks out, views orders and wishlist

## What each milestone covers

### Milestone 1 — Marketplace foundation
- Vendor onboarding with validation (`POST /api/vendors`)
- Product catalog, tied to vendors (`/api/products`)
- Inventory tracked separately from product stock (`/api/inventory`)
- Revenue dashboard: daily revenue chart, product performance, vendor revenue report

### Milestone 2 — Intelligence layer
- **Inventory forecasting** (`GET /api/forecast?productId=&days=7`) — predicts next week's stock need from a moving average of recent sales
- **Customer segmentation** (`GET /api/analytics/customer-segments`) — groups customers into New / Regular / High Value by spend and order count
- **Recommendations** (`GET /api/recommendations/:customerId`) — suggests products from categories a customer has bought before
- **Data validation** (`GET /api/analytics/validate`) — checks raw transaction totals match the aggregated report totals

All four use simple, explainable logic (moving average, rule-based thresholds, category matching) rather than trained ML models — a deliberate choice for this stage.

### Shopping experience (Customer role)
- Browse products, add to cart with quantity, checkout
- Order history (`GET /api/transactions?customerId=`)
- Wishlist (`/api/wishlist`)

## Data model

| Model | Key fields |
|---|---|
| Vendor | businessName, contactEmail, status (Pending/Active/Suspended) |
| Product | vendorId, name, category, price, stock, imageUrl |
| Inventory | productId, stockAvailable |
| Transaction | vendorId, productId, customerId, quantity, totalAmount, status |
| Wishlist | customerId, productIds[] |
| InventoryForecast | productId, predictedStock, confidenceLevel |

## Running it locally

Requires Node.js and a running MongoDB instance (local or Atlas).

```bash
cd backend
npm install
cp .env.example .env      # point MONGO_URI at your database if not using the local default
npm run seed               # loads mock vendors, products, inventory, transactions
npm run dev                 # API on http://localhost:5000
```

**Real product photos (optional):** get a free key at https://www.pexels.com/api/ and add it to `.env` as `PEXELS_API_KEY=...`. Without a key, seeding still works — it just uses generic stock photos instead of ones matched to each product.

```bash
cd frontend
npm install
npm run dev                 # app on http://localhost:5173
```

## Project structure

```
shopsense/
├── backend/
│   ├── models/          vendor, product, inventory, transaction, wishlist, inventoryForecast
│   ├── controllers/     business logic per resource
│   ├── routes/          Express route definitions
│   ├── seed.js          mock data generator
│   └── server.js        app entry point
└── frontend/
    └── src/
        ├── App.jsx        role-based routing + sidebar
        ├── Landing.jsx     login / role picker
        ├── Dashboard.jsx   revenue chart, stat cards
        ├── Vendors.jsx     vendor management (Admin)
        ├── Products.jsx    catalog management (Admin/Vendor) + storefront (Customer)
        ├── Cart.jsx        cart + checkout (Customer)
        ├── Orders.jsx      order history (Customer)
        ├── Wishlist.jsx    saved products (Customer)
        └── Insights.jsx    forecasting, segmentation, validation (Admin)
```
