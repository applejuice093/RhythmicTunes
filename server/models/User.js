const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    subscriptionStatus: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    followedArtists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],
    likedSongs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
