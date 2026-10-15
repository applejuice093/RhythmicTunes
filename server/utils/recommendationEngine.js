require("../models/Artist");
const ListeningHistory = require("../models/ListeningHistory");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

const songRecommendationFields = "title artistId genre coverUrl duration fileUrl";
const artistNamePopulation = {
  path: "artistId",
  select: "name",
};

/**
 * Stringifies, trims and de-duplicates values (ObjectIds, genres, ...),
 * dropping null/undefined/empty entries while preserving first-seen order.
 * @param {unknown[]} values
 * @returns {string[]}
 */
const getUniqueValues = (values) => {
  const normalizedValues = values
    .filter((value) => value !== undefined && value !== null)
    .map((value) => value.toString().trim())
    .filter(Boolean);

  return [...new Set(normalizedValues)];
};

/**
 * Joins aggregated `{ _id: songId, playCount }` rows with their song documents,
 * keeping the aggregation's ranking order and skipping songs that no longer
 * exist (e.g. deleted after being played).
 * @param {{ _id: unknown, playCount: number }[]} playCounts
 * @param {{ _id: unknown }[]} songs
 * @returns {{ playCount: number, song: object }[]}
 */
const attachSongsToPlayCounts = (playCounts, songs) => {
  const songById = new Map(songs.map((song) => [song._id.toString(), song]));

  return playCounts
    .filter((item) => item && item._id)
    .map((item) => {
      const song = songById.get(item._id.toString());
      return song ? { playCount: item.playCount, song } : null;
    })
    .filter(Boolean);
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

  return attachSongsToPlayCounts(playCounts, songs);
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
  attachSongsToPlayCounts,
  getUniqueValues,
  historyBasedRecommendations,
  playlistBasedRecommendations,
  trendBasedRecommendations,
};
