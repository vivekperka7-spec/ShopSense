import express from "express";
import { recommendationsForCustomer } from "../controllers/recommendationController.js";

const router = express.Router();
router.get("/:customerId", recommendationsForCustomer);
export default router;
