const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    album: {
      type: String,
      trim: true,
      default: "",
    },
    genre: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    coverUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("Song", songSchema);
