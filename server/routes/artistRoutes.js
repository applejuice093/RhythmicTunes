const express = require("express");
const {
  createArtist,
  getAllArtists,
  getArtistById,
  toggleFollowArtist,
} = require("../controllers/artistController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllArtists);
router.get("/:id", getArtistById);
router.post("/", protect, createArtist);
router.post("/:id/follow", protect, toggleFollowArtist);

module.exports = router;
