const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const analyticsRoutes = require("./routes/analyticsRoutes");
const artistRoutes = require("./routes/artistRoutes");
const authRoutes = require("./routes/authRoutes");
const historyRoutes = require("./routes/historyRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const songRoutes = require("./routes/songRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded files (audio, covers) as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/users", userRoutes);
app.use('/songs', express.static('uploads/audio'));
app.use('/covers', express.static('uploads/covers'));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`RhythmicTunes server running on port ${PORT}`);
});
