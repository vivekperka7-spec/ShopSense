import express from "express";
import { listInventory, updateInventory, lowStockAlerts } from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", listInventory);
router.get("/low-stock", lowStockAlerts);
router.patch("/:productId", updateInventory);

export default router;
