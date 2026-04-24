const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const normalizeUsername = (value = "") => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
};

const createUsernameBase = ({ username, name, email }) => {
  const emailPrefix = email.split("@")[0] || "";
  return normalizeUsername(username || name || emailPrefix) || "listener";
};

const generateUniqueUsername = async (details, excludeUserId) => {
  const base = createUsernameBase(details);
  let suffix = 0;

  while (true) {
    const nextSuffix = suffix ? String(suffix) : "";
    const candidateBase = base.slice(0, Math.max(1, 24 - nextSuffix.length));
    const candidate = `${candidateBase}${nextSuffix}`;
    const existingUser = await User.findOne({
      username: candidate,
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    }).select("_id");

    if (!existingUser) {
      return candidate;
    }

    suffix += 1;
  }
};

const ensureUserProfileFields = async (user) => {
  let shouldSave = false;

  if (!user.username) {
    user.username = await generateUniqueUsername(
      {
        name: user.name,
        email: user.email,
      },
      user._id
    );
    shouldSave = true;
  }

  if (!user.subscriptionStatus) {
    user.subscriptionStatus = "free";
    shouldSave = true;
  }

  if (!Array.isArray(user.likedSongs)) {
    user.likedSongs = [];
    shouldSave = true;
  }

  if (shouldSave) {
    await user.save();
  }

  return user;
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  isAdmin: user.isAdmin || false,
  subscriptionStatus: user.subscriptionStatus || "free",
});

const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const uniqueUsername = await generateUniqueUsername(
      {
        username,
        name,
        email: normalizedEmail,
      }
    );
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const user = await User.create({
      name,
      username: uniqueUsername,
      email: normalizedEmail,
      password,
    });

    return res.status(201).json({
      token: createToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    await ensureUserProfileFields(user);

    return res.json({
      token: createToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await ensureUserProfileFields(user);
    return res.json({ user: formatUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get user.", error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
