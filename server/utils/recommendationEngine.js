require("../models/Artist");
const ListeningHistory = require("../models/ListeningHistory");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

const songRecommendationFields = "title artistId genre coverUrl duration fileUrl";
const artistNamePopulation = {
  path: "artistId",
  select: "name",
};

const getUniqueValues = (values) => {
  const normalizedValues = values
    .filter((value) => value !== undefined && value !== null)
    .map((value) => value.toString().trim())
    .filter(Boolean);

  return [...new Set(normalizedValues)];
};

const getSongRecommendationsByGenres = async (genres, excludedSongIds) => {
  if (!genres.length) {
    return [];
  }

  return Song.find({
    genre: { $in: genres },
    _id: { $nin: excludedSongIds },
  })
    .select(songRecommendationFields)
    .populate(artistNamePopulation)
    .sort({ createdAt: -1 })
    .limit(10);
};

const historyBasedRecommendations = async (userId) => {
  const recentHistory = await ListeningHistory.find({ userId })
    .populate({
      path: "songId",
      select: "genre",
    })
    .sort({ playedAt: -1 })
    .limit(30);

  const playedSongIds = getUniqueValues(
    recentHistory.map((entry) => entry.songId && entry.songId._id)
  );
  const genres = getUniqueValues(recentHistory.map((entry) => entry.songId && entry.songId.genre));

  return getSongRecommendationsByGenres(genres, playedSongIds);
};

const trendBasedRecommendations = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const playCounts = await ListeningHistory.aggregate([
    {
      $match: {
        playedAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: "$songId",
        playCount: { $sum: 1 },
      },
    },
    { $sort: { playCount: -1 } },
    { $limit: 10 },
  ]);

  const songIds = playCounts.map((item) => item._id).filter(Boolean);
  const songs = await Song.find({ _id: { $in: songIds } })
    .select(songRecommendationFields)
    .populate(artistNamePopulation);
  const songById = new Map(songs.map((song) => [song._id.toString(), song]));

  return playCounts
    .map((item) => {
      const song = songById.get(item._id.toString());

      if (!song) {
        return null;
      }

      return {
        playCount: item.playCount,
        song,
      };
    })
    .filter(Boolean);
};

const playlistBasedRecommendations = async (userId) => {
  const playlists = await Playlist.find({ userId }).select("songs");
  const playlistSongIds = getUniqueValues(
    playlists.flatMap((playlist) => playlist.songs.map((songId) => songId))
  );

  if (!playlistSongIds.length) {
    return [];
  }

  const playlistSongs = await Song.find({ _id: { $in: playlistSongIds } }).select("genre");
  const genres = getUniqueValues(playlistSongs.map((song) => song.genre));

  return getSongRecommendationsByGenres(genres, playlistSongIds);
};

module.exports = {
  historyBasedRecommendations,
  playlistBasedRecommendations,
  trendBasedRecommendations,
};
