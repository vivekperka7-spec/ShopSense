import express from "express";
import { forecastInventory, listForecasts } from "../controllers/forecastController.js";

const router = express.Router();
router.get("/", forecastInventory);
router.get("/history", listForecasts);
export default router;
