const express = require("express");
const router = express.Router();
const { getAllCategories, getCategoryDetail, createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// ROUTING
// GET Find ALL Categories
router.get("/", getAllCategories);

// GET Detail Categorie
router.get("/:id", authMiddleware, permissionUser("admin", "user"), getCategoryDetail);

// POST Create Categorie
router.post("/", authMiddleware, permissionUser("admin"), createCategory);

// PUT Update Categories
router.put("/:id", authMiddleware, permissionUser("admin"), updateCategory);

// DEL Delete Product
router.delete("/:id", authMiddleware, permissionUser("admin"), deleteCategory);

module.exports = router;
