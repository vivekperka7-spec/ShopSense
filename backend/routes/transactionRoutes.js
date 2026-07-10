import express from "express";
import {
  createTransaction,
  listTransactions,
  revenueOverTime,
  productPerformance,
  baselineAnalytics
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/", createTransaction);
router.get("/", listTransactions);

// Analytics endpoints
router.get("/analytics/revenue", revenueOverTime);
router.get("/analytics/product-performance", productPerformance);
router.get("/analytics/baseline", baselineAnalytics); // single combined call for the dashboard

export default router;
