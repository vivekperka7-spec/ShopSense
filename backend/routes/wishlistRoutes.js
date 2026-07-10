import express from "express";
import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlistController.js";

const router = express.Router();

router.post("/", addToWishlist);           // { customerId, productId }
router.get("/:customerId", getWishlist);
router.delete("/", removeFromWishlist);    // { customerId, productId }

export default router;
