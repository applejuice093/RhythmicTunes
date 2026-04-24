const express = require("express");
const {
  getMyActivity,
  getMyTopGenres,
  getTrends,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMyActivity);
router.get("/genres", protect, getMyTopGenres);
router.get("/trends", getTrends);

module.exports = router;
