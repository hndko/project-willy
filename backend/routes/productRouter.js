const express = require("express");
const router = express.Router();
const { getAllProducts, getProductDetail, createProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// uploadOption File Image
const { uploadOption } = require("../utils/fileUpload");

// ROUTING
// GET Find ALL Products
router.get("/", getAllProducts);

// GET Detail Product
router.get("/:id", authMiddleware, permissionUser("admin", "user"), getProductDetail);

// POST Create Product
router.post("/", authMiddleware, permissionUser("admin", "stock"), uploadOption.single("image"), createProduct);

// PUT Update Product
router.put("/:id", authMiddleware, permissionUser("admin", "stock"), uploadOption.single("image"), updateProduct);

// DEL Delete Product
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteProduct);

module.exports = router;
