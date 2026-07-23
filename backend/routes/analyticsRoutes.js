import express from "express";
import { revenueReport, customerSegments, validateConsistency } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/revenue-report", revenueReport);
router.get("/customer-segments", customerSegments);
router.get("/validate", validateConsistency);

export default router;
