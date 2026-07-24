<div align="center">

# 🛍️ ShopSense

### Marketplace Vision, Simplified

A multi-vendor e-commerce analytics platform — built for vendors, customers, and marketplace admins.

</div>

---

## What it does

ShopSense brings vendors, products, orders, and analytics together in one place. Vendors list products, customers shop and check out, and admins get real insights — revenue trends, inventory forecasts, customer segments, and product recommendations — all in a live dashboard.

# Built with React, Node.js, Express, and MongoDB.

Milestone 1 established the marketplace foundation: vendor onboarding with server-side validation, a product catalog linked to vendors via Mongoose references, inventory tracked as a separate collection kept in sync with product stock, and a live dashboard using MongoDB aggregation pipelines to compute revenue trends and product/vendor performance.

Milestone 2 added an analytics layer on top of that data: inventory forecasting using a moving average of recent transaction history to predict restock needs, customer segmentation grouping shoppers into New/Regular/High Value tiers based on order count and spend, a recommendation engine suggesting products via category affinity from a customer's purchase history, and a validation endpoint that cross-checks raw transaction sums against aggregated report totals to confirm data consistency. These are intentionally simple, explainable models (moving average, rule-based thresholds, category matching) rather than trained ML — a deliberate choice for this stage, with FastAPI-based ML models planned for a later milestone.

Also added: a full customer shopping flow (cart, checkout, order history, wishlist) and three role-based views (Admin, Vendor, Customer) built on top of the same backend.

# Architecture

<img width="2720" height="2440" alt="shopsense_milestone_flow" src="https://github.com/user-attachments/assets/0e930e04-6e0b-4c6d-b7c1-f7b24382096e" />

## ✨ Features

- 🏪 **Vendor onboarding** with validation and approval workflow
- 📦 **Product catalog** with inventory tracking
- 🛒 **Real shopping experience** — cart, checkout, order history, wishlist
- 📊 **Live analytics dashboard** — revenue trends, top products, vendor performance
- 🔮 **Inventory forecasting** — predicts restock needs from sales history
- 🎯 **Customer segmentation** — groups shoppers by value and activity
- 💡 **Smart recommendations** — personalized product suggestions
- ✅ **Data validation** — keeps reported numbers honest
- 👥 **Three views** — Admin, Vendor, and Customer, each tailored to the role

## 🛠️ Built with

**React** · **Node.js** · **Express** · **MongoDB** · **Recharts**

## 🚀 Getting started

```bash
# Backend
cd backend
npm install
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and pick a role to get started.

---

<div align="center">

Built by **Vivek Perka**

*Marketplace Vision, Simplified.*

</div>
