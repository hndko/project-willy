const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

// Semua endpoint role harus login
router.use(authMiddleware);

// List & detail role (bisa diakses admin/owner/user)
router.get("/", permissionUser("admin", "owner", "user"), roleController.getRoles);
router.get("/:id", permissionUser("admin", "owner", "user"), roleController.getRoleById);

// Create, update, delete hanya admin/owner
router.post("/", permissionUser("admin", "owner"), roleController.createRole);
router.put("/:id", permissionUser("admin", "owner"), roleController.updateRole);
router.delete("/:id", permissionUser("admin", "owner"), roleController.deleteRole);

module.exports = router;
