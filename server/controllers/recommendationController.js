const {
  historyBasedRecommendations,
  playlistBasedRecommendations,
  trendBasedRecommendations,
} = require("../utils/recommendationEngine");

const getHistoryRecommendations = async (req, res) => {
  try {
    const recommendations = await historyBasedRecommendations(req.user._id);
    return res.json(recommendations);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch history-based recommendations.", error: error.message });
  }
};

const getTrendingRecommendations = async (req, res) => {
  try {
    const recommendations = await trendBasedRecommendations();
    return res.json(recommendations);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch trending recommendations.", error: error.message });
  }
};

const getPlaylistRecommendations = async (req, res) => {
  try {
    const recommendations = await playlistBasedRecommendations(req.user._id);
    return res.json(recommendations);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch playlist-based recommendations.", error: error.message });
  }
};

module.exports = {
  getHistoryRecommendations,
  getPlaylistRecommendations,
  getTrendingRecommendations,
};
