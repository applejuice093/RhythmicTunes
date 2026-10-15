const User = require("../models/User");
const bcrypt = require("bcryptjs");
const {
  getPasswordError,
  isNonEmptyString,
  isValidEmail,
  normalizeEmail,
} = require("../utils/validation");
const { generateUniqueUsername, isValidUsername } = require("../utils/username");

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users.", error: error.message });
  }
};

// @desc    Toggle admin status of a user
// @route   PUT /api/users/:id/admin
// @access  Private/Admin
const toggleAdminStatus = async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userToUpdate._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot change your own admin status." });
    }

    userToUpdate.isAdmin = !userToUpdate.isAdmin;
    await userToUpdate.save();

    return res.json({ 
      message: `User ${userToUpdate.name} is now ${userToUpdate.isAdmin ? "an admin" : "a regular user"}.`,
      user: {
        id: userToUpdate._id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        isAdmin: userToUpdate.isAdmin
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update admin status.", error: error.message });
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, username, email, password, isAdmin } = req.body;

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    // Same rules as self-registration: lower-case, [a-z0-9_], max 24 chars.
    const uniqueUsername = await generateUniqueUsername({
      username: typeof username === "string" ? username : "",
      email: normalizedEmail,
    });

    const user = await User.create({
      name,
      username: uniqueUsername,
      email: normalizedEmail,
      password,
      isAdmin: Boolean(isAdmin),
    });

    return res.status(201).json({
      message: "User created successfully.",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create user.", error: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete yourself." });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.json({ message: "User deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user.", error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const userToUpdate = await User.findById(req.user._id);
    if (!userToUpdate) return res.status(404).json({ message: "User not found." });

    // Only validate when the username actually changes, so accounts with a
    // legacy username can still update other profile fields.
    const requestedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    if (requestedUsername && requestedUsername !== userToUpdate.username) {
      if (!isValidUsername(username)) {
        return res.status(400).json({
          message: "Username must be 1-24 characters: letters, numbers, or underscores.",
        });
      }

      const existingUser = await User.findOne({ username: requestedUsername });
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: "Username already taken." });
      }
      userToUpdate.username = requestedUsername;
    }

    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Please provide a valid email address." });
      }

      const normalizedEmail = normalizeEmail(email);
      const existingEmail = await User.findOne({ email: normalizedEmail });
      if (existingEmail && existingEmail._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: "Email already registered." });
      }
      userToUpdate.email = normalizedEmail;
    }

    await userToUpdate.save();
    return res.json({
      message: "Profile updated successfully.",
      user: {
        id: userToUpdate._id,
        name: userToUpdate.name,
        username: userToUpdate.username,
        email: userToUpdate.email,
        isAdmin: userToUpdate.isAdmin,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old password and new password are required." });
    }

    const passwordError = getPasswordError(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError.replace(/^Password/, "New password") });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password." });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to change password.", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  toggleAdminStatus,
  createUser,
  deleteUser,
  updateProfile,
  changePassword
};
