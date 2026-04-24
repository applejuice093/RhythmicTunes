export const defaultCoverUrl =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80'

export const getSongId = (song) => song?._id || song?.id || ''

export const getArtistName = (song) => {
  if (typeof song?.artistId === 'object' && song.artistId?.name) {
    return song.artistId.name
  }

  if (typeof song?.artist === 'object' && song.artist?.name) {
    return song.artist.name
  }

  return song?.artistName || song?.artist || 'Unknown Artist'
}

export const formatDuration = (duration) => {
  const totalSeconds = Number(duration)

  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const normalizeSong = (item) => {
  const song = item?.song || item

  if (!song) {
    return null
  }

  return {
    ...song,
    _id: getSongId(song),
    artistName: getArtistName(song),
    coverUrl: song.coverUrl || defaultCoverUrl,
    playCount: item?.playCount,
  }
}

export const normalizeSongs = (items = []) => items.map(normalizeSong).filter(Boolean)
