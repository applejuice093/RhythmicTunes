const express = require("express");
const {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeSongFromPlaylist,
  updatePlaylist,
} = require("../controllers/playlistController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getUserPlaylists);
router.post("/", protect, createPlaylist);
router.get("/:id", getPlaylistById);
router.put("/:id", protect, updatePlaylist);
router.delete("/:id", protect, deletePlaylist);
router.post("/:id/songs", protect, addSongToPlaylist);
router.delete("/:id/songs/:songId", protect, removeSongFromPlaylist);

module.exports = router;
