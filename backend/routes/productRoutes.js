import express from "express";
import { createProduct, listProducts, updateProduct, deleteProduct } from "../controllers/productController.js";

const router = express.Router();

router.post("/", createProduct);
router.get("/", listProducts);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
