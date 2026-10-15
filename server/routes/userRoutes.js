const express = require("express");
const {
  changePassword,
  createUser,
  deleteUser,
  getAllUsers,
  toggleAdminStatus,
  updateProfile,
} = require("../controllers/userController");
const { adminOnly, protect } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../utils/validation");

const router = express.Router();
const validateUserId = validateObjectIdParam("id", "user");

router.get("/", protect, adminOnly, getAllUsers);
router.post("/", protect, adminOnly, createUser);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/:id/admin", protect, adminOnly, validateUserId, toggleAdminStatus);
router.delete("/:id", protect, adminOnly, validateUserId, deleteUser);

module.exports = router;
