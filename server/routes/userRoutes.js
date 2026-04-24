const express = require("express");
const { getAllUsers, toggleAdminStatus, createUser, deleteUser, updateProfile, changePassword } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getAllUsers);
router.post("/", protect, adminOnly, createUser);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/:id/admin", protect, adminOnly, toggleAdminStatus);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
