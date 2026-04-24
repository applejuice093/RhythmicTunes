const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    playlistName: {
      type: String,
      required: true,
      trim: true,
    },
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("Playlist", playlistSchema);
