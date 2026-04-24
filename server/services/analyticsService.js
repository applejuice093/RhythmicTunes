const mongoose = require("mongoose");
const Artist = require("../models/Artist");
const ListeningHistory = require("../models/ListeningHistory");
const Song = require("../models/Song");

const SONG_COLLECTION = Song.collection.name;
const ARTIST_COLLECTION = Artist.collection.name;

const normalizeGenreExpression = {
  $let: {
    vars: {
      genre: {
        $trim: {
          input: {
            $ifNull: ["$song.genre", ""],
          },
        },
      },
    },
    in: {
      $cond: [
        { $eq: ["$$genre", ""] },
        "Unknown",
        "$$genre",
      ],
    },
  },
};

const normalizeArtistNameExpression = {
  $let: {
    vars: {
      artistName: {
        $trim: {
          input: {
            $ifNull: ["$artist.name", ""],
          },
        },
      },
    },
    in: {
      $cond: [
        { $eq: ["$$artistName", ""] },
        "Unknown Artist",
        "$$artistName",
      ],
    },
  },
};

const toObjectId = (value) => {
  if (!mongoose.isValidObjectId(value)) {
    throw new Error("Invalid user ID.");
  }

  return new mongoose.Types.ObjectId(value);
};

const buildSongLookupStages = () => [
  {
    $lookup: {
      from: SONG_COLLECTION,
      localField: "songId",
      foreignField: "_id",
      as: "song",
    },
  },
  {
    $unwind: {
      path: "$song",
      preserveNullAndEmptyArrays: false,
    },
  },
];

const buildGenrePipeline = (matchStage = {}) => [
  ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
  ...buildSongLookupStages(),
  {
    $group: {
      _id: normalizeGenreExpression,
      playCount: { $sum: 1 },
    },
  },
  { $sort: { playCount: -1, _id: 1 } },
  { $limit: 5 },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      playCount: 1,
    },
  },
];

const getTopGenres = async (userId) => {
  const historyUserId = toObjectId(userId);

  return ListeningHistory.aggregate(buildGenrePipeline({ userId: historyUserId }));
};

const getUserActivity = async (userId) => {
  const historyUserId = toObjectId(userId);

  const [summary, mostPlayedArtist, mostPlayedGenre] = await Promise.all([
    ListeningHistory.aggregate([
      { $match: { userId: historyUserId } },
      ...buildSongLookupStages(),
      {
        $group: {
          _id: null,
          totalSongsPlayed: { $sum: 1 },
          totalListeningTime: {
            $sum: {
              $ifNull: ["$song.duration", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalSongsPlayed: 1,
          totalListeningTime: 1,
        },
      },
    ]),
    ListeningHistory.aggregate([
      { $match: { userId: historyUserId } },
      ...buildSongLookupStages(),
      {
        $group: {
          _id: "$song.artistId",
          playCount: { $sum: 1 },
        },
      },
      { $sort: { playCount: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: ARTIST_COLLECTION,
          localField: "_id",
          foreignField: "_id",
          as: "artist",
        },
      },
      {
        $unwind: {
          path: "$artist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          artistId: "$_id",
          name: normalizeArtistNameExpression,
          playCount: 1,
        },
      },
    ]),
    ListeningHistory.aggregate([
      { $match: { userId: historyUserId } },
      ...buildSongLookupStages(),
      {
        $group: {
          _id: normalizeGenreExpression,
          playCount: { $sum: 1 },
        },
      },
      { $sort: { playCount: -1, _id: 1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          genre: "$_id",
          playCount: 1,
        },
      },
    ]),
  ]);

  return {
    totalSongsPlayed: summary[0]?.totalSongsPlayed || 0,
    totalListeningTime: summary[0]?.totalListeningTime || 0,
    mostPlayedArtist: mostPlayedArtist[0] || null,
    mostPlayedGenre: mostPlayedGenre[0] || null,
  };
};

const getGlobalTrends = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [topSongs, topGenres, topArtists] = await Promise.all([
    ListeningHistory.aggregate([
      {
        $match: {
          playedAt: { $gte: sevenDaysAgo },
        },
      },
      ...buildSongLookupStages(),
      {
        $group: {
          _id: "$song._id",
          playCount: { $sum: 1 },
          title: { $first: "$song.title" },
          artistId: { $first: "$song.artistId" },
          album: { $first: "$song.album" },
          genre: { $first: normalizeGenreExpression },
          duration: { $first: "$song.duration" },
          releaseDate: { $first: "$song.releaseDate" },
          fileUrl: { $first: "$song.fileUrl" },
          coverUrl: { $first: "$song.coverUrl" },
        },
      },
      { $sort: { playCount: -1, title: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: ARTIST_COLLECTION,
          localField: "artistId",
          foreignField: "_id",
          as: "artist",
        },
      },
      {
        $unwind: {
          path: "$artist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          playCount: 1,
          song: {
            _id: "$_id",
            title: "$title",
            artistId: {
              _id: "$artistId",
              name: normalizeArtistNameExpression,
            },
            album: { $ifNull: ["$album", ""] },
            genre: "$genre",
            duration: { $ifNull: ["$duration", 0] },
            releaseDate: "$releaseDate",
            fileUrl: { $ifNull: ["$fileUrl", ""] },
            coverUrl: { $ifNull: ["$coverUrl", ""] },
          },
        },
      },
    ]),
    ListeningHistory.aggregate(buildGenrePipeline()),
    Artist.find()
      .sort({ totalFollowers: -1, name: 1 })
      .limit(5)
      .select("_id name profileImageUrl totalFollowers")
      .lean(),
  ]);

  return {
    topSongs,
    topGenres,
    topArtists,
  };
};

module.exports = {
  getGlobalTrends,
  getTopGenres,
  getUserActivity,
};
