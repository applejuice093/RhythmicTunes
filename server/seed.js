const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Artist = require("./models/Artist");
const Song = require("./models/Song");
const ListeningHistory = require("./models/ListeningHistory");
const User = require("./models/User");

dotenv.config();

// ── Artist seed data ────────────────────────────────────────────────
const artistSeedData = [
  {
    name: "Luna Vega",
    bio: "Ethereal pop artist blending dreamy synths with soulful vocals. Luna's music transports listeners to shimmering soundscapes that feel both intimate and vast.",
    profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Marcus Cole",
    bio: "R&B vocalist with a velvet tone and jazz-influenced phrasing. Marcus crafts late-night grooves that resonate with raw emotion and timeless elegance.",
    profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Neon Drift",
    bio: "Electronic duo pushing the boundaries of synthwave and future bass. Their pulsating beats and glitchy textures have become anthems for the digital age.",
    profileImageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Aria Storm",
    bio: "Indie rock powerhouse known for raw lyricism and explosive guitar riffs. Aria channels frustration and hope into anthems that hit hard and stay with you.",
    profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "DJ Cosmos",
    bio: "Boundary-breaking electronic producer fusing deep house with ambient textures. Every set is a journey through space and rhythm.",
    profileImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Jade Rivers",
    bio: "Lo-fi hip-hop artist crafting warm, nostalgic beats with jazzy samples and vinyl crackle. Perfect for studying, unwinding, or drifting away.",
    profileImageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "The Velvet Keys",
    bio: "Jazz ensemble reimagining classic standards with modern sensibilities. Smooth piano, brushed drums, and a saxophone that cries with beauty.",
    profileImageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Echo Phoenix",
    bio: "Alternative artist weaving folk melodies with electronic production. Their music explores themes of rebirth, nature, and the human condition.",
    profileImageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Sable Moon",
    bio: "Ambient composer creating immersive sonic landscapes. Sable Moon's work is meditative, cinematic, and profoundly moving.",
    profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Rico Blaze",
    bio: "Hip-hop artist with sharp wordplay and hard-hitting production. Rico's tracks combine trap energy with conscious storytelling.",
    profileImageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80",
  },
];

// ── Free CC0 / royalty-free audio URLs (short clips for demo) ────────
// Using samples from various free music sources
const audioUrls = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
];

const coverImages = [
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1446057032654-9d8885e95272?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1477233534935-f5e6fe7c1159?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1504898770365-14faca6a7320?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1460667262436-cf19894f4774?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&w=400&q=80",
];

// ── Songs per artist (artistIndex → songs) ──────────────────────────
const songSeedData = [
  // Luna Vega (0) — Pop
  { title: "Starlit Highway", genre: "Pop", album: "Starlit Highway", duration: 234, artistIndex: 0, audioIndex: 0, coverIndex: 0 },
  { title: "Crystal Shadows", genre: "Pop", album: "Starlit Highway", duration: 198, artistIndex: 0, audioIndex: 1, coverIndex: 1 },
  { title: "Velvet Horizon", genre: "Pop", album: "Velvet Horizon", duration: 212, artistIndex: 0, audioIndex: 2, coverIndex: 2 },

  // Marcus Cole (1) — R&B
  { title: "Midnight Serenade", genre: "R&B", album: "Midnight Serenade", duration: 267, artistIndex: 1, audioIndex: 3, coverIndex: 3 },
  { title: "Golden Hour", genre: "R&B", album: "Midnight Serenade", duration: 243, artistIndex: 1, audioIndex: 4, coverIndex: 4 },
  { title: "Silk & Honey", genre: "R&B", album: "Silk & Honey", duration: 189, artistIndex: 1, audioIndex: 5, coverIndex: 5 },

  // Neon Drift (2) — Electronic
  { title: "Pulse Engine", genre: "Electronic", album: "Digital Sunrise", duration: 302, artistIndex: 2, audioIndex: 6, coverIndex: 6 },
  { title: "Neon Cathedral", genre: "Electronic", album: "Digital Sunrise", duration: 278, artistIndex: 2, audioIndex: 7, coverIndex: 7 },
  { title: "Digital Sunrise", genre: "Electronic", album: "Digital Sunrise", duration: 256, artistIndex: 2, audioIndex: 8, coverIndex: 8 },
  { title: "Circuit Dreams", genre: "Synthwave", album: "Circuit Dreams", duration: 224, artistIndex: 2, audioIndex: 9, coverIndex: 9 },

  // Aria Storm (3) — Rock / Indie
  { title: "Burning Daylight", genre: "Rock", album: "Burning Daylight", duration: 245, artistIndex: 3, audioIndex: 10, coverIndex: 10 },
  { title: "Paper Fortress", genre: "Indie", album: "Burning Daylight", duration: 218, artistIndex: 3, audioIndex: 11, coverIndex: 11 },
  { title: "Shatter & Bloom", genre: "Rock", album: "Shatter & Bloom", duration: 201, artistIndex: 3, audioIndex: 12, coverIndex: 12 },

  // DJ Cosmos (4) — House / Electronic
  { title: "Cosmic Voyage", genre: "House", album: "Interstellar Beats", duration: 334, artistIndex: 4, audioIndex: 13, coverIndex: 13 },
  { title: "Nebula Groove", genre: "Deep House", album: "Interstellar Beats", duration: 298, artistIndex: 4, audioIndex: 14, coverIndex: 14 },
  { title: "Zero Gravity", genre: "Electronic", album: "Interstellar Beats", duration: 312, artistIndex: 4, audioIndex: 15, coverIndex: 15 },

  // Jade Rivers (5) — Lo-fi
  { title: "Rainy Afternoon", genre: "Lo-fi", album: "Quiet Frequencies", duration: 178, artistIndex: 5, audioIndex: 0, coverIndex: 9 },
  { title: "Coffee & Vinyl", genre: "Lo-fi", album: "Quiet Frequencies", duration: 165, artistIndex: 5, audioIndex: 1, coverIndex: 10 },
  { title: "Quiet Frequencies", genre: "Lo-fi", album: "Quiet Frequencies", duration: 192, artistIndex: 5, audioIndex: 2, coverIndex: 11 },

  // The Velvet Keys (6) — Jazz
  { title: "Blue Satin", genre: "Jazz", album: "After Midnight", duration: 287, artistIndex: 6, audioIndex: 3, coverIndex: 7 },
  { title: "Smoky Room", genre: "Jazz", album: "After Midnight", duration: 312, artistIndex: 6, audioIndex: 4, coverIndex: 8 },
  { title: "After Midnight", genre: "Jazz", album: "After Midnight", duration: 256, artistIndex: 6, audioIndex: 5, coverIndex: 13 },

  // Echo Phoenix (7) — Alternative / Folk
  { title: "Forest Fire", genre: "Alternative", album: "Rebirth", duration: 234, artistIndex: 7, audioIndex: 6, coverIndex: 2 },
  { title: "River of Light", genre: "Folk", album: "Rebirth", duration: 209, artistIndex: 7, audioIndex: 7, coverIndex: 5 },
  { title: "Rebirth", genre: "Alternative", album: "Rebirth", duration: 278, artistIndex: 7, audioIndex: 8, coverIndex: 14 },

  // Sable Moon (8) — Ambient / Classical
  { title: "Lunar Tide", genre: "Ambient", album: "Celestial Drift", duration: 345, artistIndex: 8, audioIndex: 9, coverIndex: 0 },
  { title: "Celestial Drift", genre: "Ambient", album: "Celestial Drift", duration: 398, artistIndex: 8, audioIndex: 10, coverIndex: 1 },
  { title: "Dawn Whisper", genre: "Classical", album: "Dawn Whisper", duration: 267, artistIndex: 8, audioIndex: 11, coverIndex: 4 },

  // Rico Blaze (9) — Hip-Hop
  { title: "Street Lights", genre: "Hip-Hop", album: "No Ceilings", duration: 215, artistIndex: 9, audioIndex: 12, coverIndex: 3 },
  { title: "Crown Heavy", genre: "Hip-Hop", album: "No Ceilings", duration: 198, artistIndex: 9, audioIndex: 13, coverIndex: 6 },
  { title: "No Ceilings", genre: "Hip-Hop", album: "No Ceilings", duration: 234, artistIndex: 9, audioIndex: 14, coverIndex: 12 },
  { title: "Concrete Dreams", genre: "Rap", album: "Concrete Dreams", duration: 187, artistIndex: 9, audioIndex: 15, coverIndex: 15 },
];

// ── Main seed function ──────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // Clear existing data (artists, songs, history only)
    await Artist.deleteMany({});
    await Song.deleteMany({});
    await ListeningHistory.deleteMany({});
    console.log("✓ Cleared existing artists, songs, and listening history");

    // Insert artists
    const artists = await Artist.insertMany(
      artistSeedData.map((artist) => ({
        ...artist,
        totalFollowers: Math.floor(Math.random() * 5000) + 100,
      }))
    );
    console.log(`✓ Inserted ${artists.length} artists`);

    // Insert songs
    const songsToInsert = songSeedData.map((song, index) => ({
      title: song.title,
      artistId: artists[song.artistIndex]._id,
      album: song.album,
      genre: song.genre,
      duration: song.duration,
      releaseDate: new Date(Date.now() - (songSeedData.length - index) * 24 * 60 * 60 * 1000),
      fileUrl: audioUrls[song.audioIndex % audioUrls.length],
      coverUrl: coverImages[song.coverIndex % coverImages.length],
    }));

    const songs = await Song.insertMany(songsToInsert);
    console.log(`✓ Inserted ${songs.length} songs`);

    // Generate listening history for the existing user (if any)
    const user = await User.findOne({});
    if (user) {
      const historyEntries = [];
      const now = Date.now();

      // Generate 40 random history entries spread over the past 7 days
      for (let i = 0; i < 40; i++) {
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        const randomTimeOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);

        historyEntries.push({
          userId: user._id,
          songId: randomSong._id,
          playedAt: new Date(now - randomTimeOffset),
        });
      }

      await ListeningHistory.insertMany(historyEntries);
      console.log(`✓ Inserted ${historyEntries.length} listening history entries for user "${user.name}"`);
    } else {
      console.log("⚠ No existing user found — skipping listening history generation");
    }

    console.log("\n🎵 Seed complete! Your RhythmicTunes database is ready.");
    console.log(`   ${artists.length} artists | ${songs.length} songs`);
  } catch (error) {
    console.error("✗ Seed failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  }
}

seed();
