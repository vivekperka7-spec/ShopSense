# ShopSense — Milestone 1 Starter

Covers: vendor onboarding, product catalog, transaction logging, and the
baseline revenue/product-performance dashboard for Weeks 1–2.

## Prerequisites
- Node.js (v18+)
- MongoDB running locally (or a free MongoDB Atlas cluster — update `MONGO_URI` if so)
- Postman (optional, for testing the API directly)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env      # edit MONGO_URI if not using local MongoDB
npm run seed               # loads mock vendors, products, transactions
npm run dev                # starts API on http://localhost:5000
```

### Key endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/vendors | Register a vendor |
| GET | /api/vendors | List vendors (optional `?status=Active`) |
| PATCH | /api/vendors/:id/status | Approve / suspend a vendor |
| POST | /api/products | Add a product |
| GET | /api/products | List products (optional `?vendorId=`) |
| POST | /api/transactions | Record a transaction |
| GET | /api/transactions/analytics/baseline | Combined revenue + product performance (powers the dashboard) |

Test with Postman first — hit `GET /api/transactions/analytics/baseline`
after seeding and confirm you get back `totalRevenue`, `revenueSeries`, and
`productPerformance`.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```

The dashboard fetches from `/api/transactions/analytics/baseline`
(proxied to the backend by Vite) and renders the revenue chart + product
performance table shown in the Milestone 1 mockup.

## 3. Demonstrating the Milestone 1 acceptance criteria

- **≥99% vendor registrations validate correctly** — `registerVendor` rejects
  malformed submissions (missing name, bad email format) before they hit the
  DB. Show your mentor a few valid + a few deliberately invalid POSTs in
  Postman to prove the validation works.
- **≥98% transactional consistency** — every transaction stores
  `totalAmount = quantity * unitPrice` at write time, and the aggregation
  pipelines sum directly off that field, so revenue totals stay consistent
  with the underlying orders. You can spot-check by summing `unitPrice *
  quantity` manually for a few seeded transactions and comparing to the
  dashboard total.
- **Dashboard visualizes product and vendor performance** — the React
  dashboard covers product performance; vendor-level breakdown (revenue per
  vendor) is a quick extension of the same aggregation pattern if your
  mentor wants it before Friday — ask and I'll add it.

## Next milestones (for context, not needed this week)
- Milestone 2: inventory forecasting, customer segmentation, recommendations
- Milestone 3: FastAPI ML services, MLflow tracking
- Milestone 4: Docker packaging, CI/CD, final docs
