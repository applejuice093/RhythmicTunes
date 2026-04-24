import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'
import { usePlayerStore } from '../store/playerStore'
import { normalizeSongs, formatDuration } from '../utils/songUtils'

const defaultArtistImage =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80'

function ArtistDetailPage() {
  const { id } = useParams()
  const { addToQueue, playSong, currentSong } = usePlayerStore()
  const [artist, setArtist] = useState(null)
  const [songs, setSongs] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  const [error, setError] = useState('')

  const currentSongId = currentSong?._id || currentSong?.id

  useEffect(() => {
    let isMounted = true
    const fetchArtist = async () => {
      setIsLoading(true)
      setError('')
      try {
        const { data } = await axiosInstance.get(`/api/artists/${id}`)
        if (!isMounted) return
        setArtist(data)
        setIsFollowing(Boolean(data.isFollowing))
        setSongs(normalizeSongs(
          (data.songs || []).map((song) => ({ ...song, artistId: { _id: data._id, name: data.name } }))
        ))
      } catch (requestError) {
        if (isMounted) setError(requestError.response?.data?.message || 'Unable to load this artist right now.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchArtist()
    return () => { isMounted = false }
  }, [id])

  const handleToggleFollow = async () => {
    setIsTogglingFollow(true)
    setError('')
    try {
      const { data } = await axiosInstance.post(`/api/artists/${id}/follow`)
      setIsFollowing(data.followed)
      setArtist((current) => current ? { ...current, totalFollowers: data.totalFollowers } : current)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update follow status right now.')
    } finally {
      setIsTogglingFollow(false)
    }
  }

  const handlePlay = (song) => {
    playSong(song)
    songs.forEach(addToQueue)
  }

  const handlePlayAll = () => {
    if (songs.length) {
      playSong(songs[0])
      songs.forEach(addToQueue)
    }
  }

  return (
    <AppLayout>
      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div>
          <div className="skeleton mb-6 h-72 w-full rounded-xl" />
          <div className="skeleton mb-4 h-8 w-48" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      ) : artist ? (
        <>
          {/* ── Hero Banner ── */}
          <section
            className="relative mb-8 flex items-end overflow-hidden rounded-xl p-6 md:p-10"
            style={{ minHeight: '320px' }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={artist.profileImageUrl || defaultArtistImage}
                alt=""
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(transparent 0%, rgba(18,18,18,0.8) 60%, rgba(18,18,18,1) 100%)' }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Artist</p>
              <h1 className="text-4xl font-black text-[var(--text-primary)] md:text-6xl">{artist.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                {artist.bio || 'No bio available.'}
              </p>
              <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {artist.totalFollowers?.toLocaleString() || 0} followers
              </p>
            </div>
          </section>

          {/* ── Action Buttons ── */}
          <div className="mb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={!songs.length}
              className="grid h-14 w-14 place-items-center rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#0d0b1a">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={isTogglingFollow}
              className="rounded-full px-6 py-2 text-sm font-bold transition-all duration-200 hover:scale-105 disabled:opacity-60"
              style={{
                background: isFollowing ? 'transparent' : 'transparent',
                color: isFollowing ? 'var(--accent)' : 'var(--text-primary)',
                border: isFollowing ? '1px solid var(--accent)' : '1px solid var(--border-hover)',
              }}
            >
              {isTogglingFollow ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>

            <Link
              to="/artists"
              className="ml-auto text-xs font-bold transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← All artists
            </Link>
          </div>

          {/* ── Track List ── */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-[var(--text-primary)]">Popular</h2>
            <div className="rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              {/* Header */}
              <div
                className="grid grid-cols-[2rem_3rem_1fr_6rem] items-center gap-3 px-4 py-2.5 text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
              >
                <span>#</span>
                <span />
                <span>Title</span>
                <span className="text-right">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-auto">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                  </svg>
                </span>
              </div>

              {/* Tracks */}
              {songs.length ? songs.map((song, index) => (
                <button
                  key={song._id}
                  type="button"
                  onClick={() => handlePlay(song)}
                  className="group grid w-full grid-cols-[2rem_3rem_1fr_6rem] items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                  style={{ background: currentSongId === song._id ? 'var(--accent-muted)' : 'transparent' }}
                  onMouseEnter={(e) => { if (currentSongId !== song._id) e.currentTarget.style.background = 'var(--glass-bg)' }}
                  onMouseLeave={(e) => { if (currentSongId !== song._id) e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="text-center text-sm font-medium" style={{ color: currentSongId === song._id ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {index + 1}
                  </span>
                  <img src={song.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold" style={{ color: currentSongId === song._id ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {song.title}
                    </span>
                    <span className="block truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {song.album || artist.name}
                    </span>
                  </div>
                  <span className="text-right text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatDuration(song.duration)}
                  </span>
                </button>
              )) : (
                <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No songs available yet.
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>Artist not found</p>
          <Link to="/artists" className="mt-3 text-sm font-bold" style={{ color: 'var(--accent)' }}>
            Browse artists
          </Link>
        </div>
      )}
    </AppLayout>
  )
}

export default ArtistDetailPage
