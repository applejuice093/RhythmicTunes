const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    profileImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    totalFollowers: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

artistSchema.virtual("songs", {
  ref: "Song",
  localField: "_id",
  foreignField: "artistId",
});

module.exports = mongoose.model("Artist", artistSchema);
