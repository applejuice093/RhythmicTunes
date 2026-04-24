const express = require("express");
const {
  getHistoryRecommendations,
  getPlaylistRecommendations,
  getTrendingRecommendations,
} = require("../controllers/recommendationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/history", protect, getHistoryRecommendations);
router.get("/trending", getTrendingRecommendations);
router.get("/playlist", protect, getPlaylistRecommendations);

module.exports = router;
