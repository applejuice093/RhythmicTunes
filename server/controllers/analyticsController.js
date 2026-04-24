const {
  getGlobalTrends,
  getTopGenres,
  getUserActivity,
} = require("../services/analyticsService");

const getMyActivity = async (req, res) => {
  try {
    const activity = await getUserActivity(req.user._id);
    return res.json(activity);
  } catch (error) {
    const statusCode = error.message === "Invalid user ID." ? 400 : 500;
    return res.status(statusCode).json({
      message: "Failed to fetch user activity.",
      error: error.message,
    });
  }
};

const getMyTopGenres = async (req, res) => {
  try {
    const genres = await getTopGenres(req.user._id);
    return res.json(genres);
  } catch (error) {
    const statusCode = error.message === "Invalid user ID." ? 400 : 500;
    return res.status(statusCode).json({
      message: "Failed to fetch top genres.",
      error: error.message,
    });
  }
};

const getTrends = async (req, res) => {
  try {
    const trends = await getGlobalTrends();
    return res.json(trends);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch global trends.",
      error: error.message,
    });
  }
};

module.exports = {
  getMyActivity,
  getMyTopGenres,
  getTrends,
};
