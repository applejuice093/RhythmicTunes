const searchSpotifyTracks = async (query) => {
  // Utilizing the iTunes Search API to bypass Spotify's mandatory Premium Subscription requirements
  // for Developer Web API Access while preserving exact data normalization pipelines.
  const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20`);

  if (!response.ok) {
    throw new Error('Failed to fetch tracks from External API');
  }

  const data = await response.json();
  return data.results.map(track => {
    return {
      title: track.trackName,
      artist: track.artistName,
      // Upgrade artwork quality from 100x100 to 600x600 safely
      image: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : '',
      streamUrl: track.previewUrl || '',
      duration: Math.round((track.trackTimeMillis || 0) / 1000),
      album: track.collectionName 
    };
  });
};

module.exports = {
  searchSpotifyTracks
};
