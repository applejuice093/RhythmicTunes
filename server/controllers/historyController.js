const mongoose = require("mongoose");
require("../models/Artist");
const ListeningHistory = require("../models/ListeningHistory");
const Song = require("../models/Song");

const logSongPlay = async (req, res) => {
  try {
    const { songId } = req.body;

    if (!songId || !mongoose.isValidObjectId(songId)) {
      return res.status(400).json({ message: "Valid songId is required." });
    }

    const song = await Song.findById(songId);

    if (!song) {
      return res.status(404).json({ message: "Song not found." });
    }

    const historyEntry = await ListeningHistory.create({
      userId: req.user._id,
      songId,
    });

    await historyEntry.populate({
      path: "songId",
      select: "title artistId coverUrl duration fileUrl genre",
      populate: {
        path: "artistId",
        select: "name",
      },
    });

    return res.status(201).json(historyEntry);
  } catch (error) {
    return res.status(500).json({ message: "Failed to log song play.", error: error.message });
  }
};

const getListeningHistory = async (req, res) => {
  try {
    const history = await ListeningHistory.find({ userId: req.user._id })
      .populate({
        path: "songId",
        select: "title artistId coverUrl duration fileUrl genre",
        populate: {
          path: "artistId",
          select: "name",
        },
      })
      .sort({ playedAt: -1 })
      .limit(50);

    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch listening history.", error: error.message });
  }
};

const clearListeningHistory = async (req, res) => {
  try {
    const result = await ListeningHistory.deleteMany({ userId: req.user._id });

    return res.json({
      message: "Listening history cleared.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to clear listening history.", error: error.message });
  }
};

module.exports = {
  clearListeningHistory,
  getListeningHistory,
  logSongPlay,
};
