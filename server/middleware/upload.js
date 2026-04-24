const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
const audioDir = path.join(uploadDir, "audio");
const coverDir = path.join(uploadDir, "covers");

[uploadDir, audioDir, coverDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, audioDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});


const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, coverDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const audioFilter = (req, file, cb) => {
  const allowed = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".webm"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Audio format '${ext}' not supported. Use: ${allowed.join(", ")}`));
  }
};

const imageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Image format '${ext}' not supported. Use: ${allowed.join(", ")}`));
  }
};

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

const uploadCover = multer({
  storage: coverStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = { uploadAudio, uploadCover };
