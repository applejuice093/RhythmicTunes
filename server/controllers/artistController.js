const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Artist = require("../models/Artist");
require("../models/Song");
const User = require("../models/User");

const getArtistFollowerCount = (artist) => {
  const rawArtist = typeof artist.toObject === "function" ? artist.toObject() : artist;
  return rawArtist.totalFollowers ?? rawArtist.followers ?? 0;
};

const formatArtist = (artist) => {
  const artistResponse = typeof artist.toObject === "function" ? artist.toObject() : { ...artist };
  artistResponse.totalFollowers = getArtistFollowerCount(artist);
  delete artistResponse.followers;
  return artistResponse;
};

const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find().sort({ name: 1 });
    return res.json(artists.map(formatArtist));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch artists.", error: error.message });
  }
};

const getArtistById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid artist ID." });
    }

    const artist = await Artist.findById(req.params.id).populate({
      path: "songs",
      select: "title album genre duration releaseDate fileUrl coverUrl",
      options: { sort: { releaseDate: -1, createdAt: -1 } },
    });

    if (!artist) {
      return res.status(404).json({ message: "Artist not found." });
    }

    const artistResponse = formatArtist(artist);
    artistResponse.isFollowing = false;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("followedArtists");

        artistResponse.isFollowing = Boolean(
          user &&
            user.followedArtists.some(
              (artistId) => artistId.toString() === artist._id.toString()
            )
        );
      } catch (error) {
        artistResponse.isFollowing = false;
      }
    }

    return res.json(artistResponse);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch artist.", error: error.message });
  }
};

const createArtist = async (req, res) => {
  try {
    const { name, bio, profileImageUrl } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Artist name is required." });
    }

    const artist = await Artist.create({
      name,
      bio,
      profileImageUrl,
    });

    return res.status(201).json(artist);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create artist.", error: error.message });
  }
};

const toggleFollowArtist = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid artist ID." });
    }

    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({ message: "Artist not found." });
    }

    const isFollowing = req.user.followedArtists.some(
      (artistId) => artistId.toString() === artist._id.toString()
    );

    if (isFollowing) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { followedArtists: artist._id },
      });
      artist.totalFollowers = Math.max(getArtistFollowerCount(artist) - 1, 0);
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { followedArtists: artist._id },
      });
      artist.totalFollowers = getArtistFollowerCount(artist) + 1;
    }

    await artist.save();

    return res.json({
      followed: !isFollowing,
      totalFollowers: artist.totalFollowers,
      artist: formatArtist(artist),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update follow status.", error: error.message });
  }
};

module.exports = {
  createArtist,
  getAllArtists,
  getArtistById,
  toggleFollowArtist,
};
