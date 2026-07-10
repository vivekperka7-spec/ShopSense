# ShopSense

A multi-vendor e-commerce analytics platform. Vendors register and manage a product catalog, transactions get logged against that catalog, and an aggregation layer turns raw orders into revenue and performance reporting for marketplace admins.

Built for **Milestone 1**: vendor onboarding, product catalog, inventory tracking, and baseline sales analytics.

## Stack

| Layer | Choice |
|---|---|
| Database | MongoDB + Mongoose |
| API | Node.js + Express |
| Frontend | React (Vite) + Recharts |
| Aggregation | MongoDB aggregation pipelines |

## Architecture

```
React dashboard (localhost:5173)
        |  REST calls, proxied by Vite
        v
Express API (localhost:5000)
        |  Mongoose
        v
MongoDB  ->  vendors, products, inventory, transactions, wishlists
```

Vendor and product writes stay in their own collections; inventory is tracked separately from product stock so it can be adjusted independently of catalog edits. Every transaction stores `totalAmount` at write time, so the revenue and vendor-performance reports read directly off that field instead of recomputing totals on the fly.

## Data model

**Vendor** — `businessName`, `contactEmail` (unique), `phone`, `category`, `commissionRate`, `status` (`Pending` / `Active` / `Suspended`)

**Product** — `vendorId` (ref), `name`, `category`, `price`, `stock`

**Inventory** — `productId` (ref, unique), `stockAvailable`, `lastUpdated` — kept in sync automatically on product create/update/delete

**Transaction** — `vendorId`, `productId`, `quantity`, `unitPrice`, `totalAmount`, `status` (`Completed` / `Refunded` / `Pending`)

**Wishlist** — `customerId`, `productIds[]`

## API

### Vendors
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/vendors` | Register a vendor (validates name + email format) |
| GET | `/api/vendors` | List vendors, optional `?status=Active` |
| PUT | `/api/vendors/:id` | Edit vendor details |
| PATCH | `/api/vendors/:id/status` | Approve / suspend a vendor |

### Products
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/products` | Add a product (creates a matching inventory record) |
| GET | `/api/products` | List products, optional `?vendorId=` |
| PUT | `/api/products/:id` | Edit a product |
| DELETE | `/api/products/:id` | Remove a product |

### Inventory
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/inventory` | List all inventory records |
| GET | `/api/inventory/low-stock?threshold=10` | Products at or below a stock threshold |
| PATCH | `/api/inventory/:productId` | Update stock available |

### Transactions & analytics
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/transactions` | Log a transaction |
| GET | `/api/transactions` | List transactions |
| GET | `/api/transactions/analytics/baseline` | Revenue-by-day + product performance, powers the dashboard |
| GET | `/api/analytics/revenue-report` | Revenue and units sold grouped by vendor |

### Wishlist
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/wishlist` | Add a product to a customer's wishlist |
| GET | `/api/wishlist/:customerId` | Get a customer's wishlist |
| DELETE | `/api/wishlist` | Remove a product from a wishlist |

## Running it locally

Requires Node.js and a running MongoDB instance (local or Atlas).

```bash
cd backend
npm install
cp .env.example .env      # point MONGO_URI at your database if not using the local default
npm run seed               # loads mock vendors, products, inventory, transactions
npm run dev                 # API on http://localhost:5000
```

```bash
cd frontend
npm install
npm run dev                 # dashboard on http://localhost:5173
```

## Demonstrating the Milestone 1 criteria

**Vendor onboarding validates registrations** — `POST /api/vendors` with a malformed email or missing name returns a 400 with specific validation messages; visible live in the Vendors page's registration form.

**Revenue reporting stays consistent with orders** — `totalAmount` is computed once, at the moment a transaction is written, and every aggregation (`baseline`, `revenue-report`) sums directly off that stored field rather than recalculating from unit price and quantity separately.

**Dashboards visualize vendor and product performance** — the dashboard's revenue chart and product performance table cover the product side; `revenue-report` covers vendor-level totals for side-by-side comparison.

## Project structure

```
shopsense/
├── backend/
│   ├── models/          vendor, product, inventory, transaction, wishlist
│   ├── controllers/     business logic per resource
│   ├── routes/          Express route definitions
│   ├── seed.js          mock data generator
│   └── server.js        app entry point
└── frontend/
    └── src/
        ├── App.jsx        sidebar + page routing
        ├── Dashboard.jsx  revenue chart, stat cards, product/vendor tables
        ├── Vendors.jsx    registration form + vendor management
        └── Products.jsx   catalog management
```
