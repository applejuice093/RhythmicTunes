const express = require("express");
const {
  clearListeningHistory,
  getListeningHistory,
  logSongPlay,
} = require("../controllers/historyController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, logSongPlay);
router.get("/", protect, getListeningHistory);
router.delete("/", protect, clearListeningHistory);

module.exports = router;
