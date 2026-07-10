import express from "express";
import { registerVendor, listVendors, updateVendor, updateVendorStatus } from "../controllers/vendorController.js";

const router = express.Router();

router.post("/", registerVendor);
router.get("/", listVendors);
router.put("/:id", updateVendor);
router.patch("/:id/status", updateVendorStatus);

export default router;
