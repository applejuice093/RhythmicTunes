const User = require("../models/User");
const bcrypt = require("bcryptjs");

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

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const baseUsername = username || email.split("@")[0] || "listener";
    let uniqueUsername = baseUsername;
    let suffix = 0;
    while (await User.findOne({ username: uniqueUsername })) {
        suffix++;
        uniqueUsername = `${baseUsername}${suffix}`;
    }

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

    if (username) {
      const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: "Username already taken." });
      }
      userToUpdate.username = username.toLowerCase().trim();
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingEmail && existingEmail._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: "Email already registered." });
      }
      userToUpdate.email = email.toLowerCase().trim();
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
