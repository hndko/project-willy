const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware, permissionUser } = require("../middlewares/userMiddleware");

router.use(authMiddleware);

router.get("/", permissionUser("admin", "owner"), userController.getUsers);
router.get("/:id", permissionUser("admin", "owner"), userController.getUserById);
router.post("/", permissionUser("admin", "owner"), userController.createUser);
router.put("/:id", permissionUser("admin", "owner"), userController.updateUser);
router.delete("/:id", permissionUser("admin", "owner"), userController.deleteUser);

module.exports = router;
