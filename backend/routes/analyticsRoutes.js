import express from "express";
import { revenueReport } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/revenue-report", revenueReport);

export default router;
