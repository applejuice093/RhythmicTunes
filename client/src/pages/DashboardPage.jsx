import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'
import FavoriteButton from '../components/FavoriteButton'
import SongCard from '../components/SongCard'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { getSongId, normalizeSong, normalizeSongs } from '../utils/songUtils'

function SongRow({ song, index, onPlay, isActive, favoriteButton }) {
  return (
    <button
      type="button"
      onClick={() => onPlay(song)}
      className="group grid w-full grid-cols-[2rem_3rem_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-200"
      style={{ background: isActive ? 'var(--accent-muted)' : 'transparent' }}
      onMouseEnter={(event) => { if (!isActive) event.currentTarget.style.background = 'var(--glass-bg)' }}
      onMouseLeave={(event) => { if (!isActive) event.currentTarget.style.background = 'transparent' }}
    >
      <span className="text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        {index + 1}
      </span>
      <img src={song.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
      <div className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{song.title}</span>
        <span className="block truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{song.artistName}</span>
      </div>
      <div className="flex items-center gap-2">
        {favoriteButton}
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {song.playCount ? `${song.playCount} plays` : ''}
        </span>
        <div
          className="grid h-8 w-8 place-items-center rounded-full opacity-0 transition-all duration-200 group-hover:opacity-100"
          style={{ background: 'var(--accent)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d0b1a">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  )
}

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { addToQueue, playSong, currentSong } = usePlayerStore()
  const [trendingSongs, setTrendingSongs] = useState([])
  const [personalizedSongs, setPersonalizedSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [likedSongs, setLikedSongs] = useState([])
  const [pendingLikeSongIds, setPendingLikeSongIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [trendingResponse, personalizedResponse, playlistsResponse, likedResponse] = await Promise.all([
          axiosInstance.get('/api/recommendations/trending'),
          axiosInstance.get('/api/recommendations/history'),
          axiosInstance.get('/api/playlists'),
          axiosInstance.get('/api/songs/liked'),
        ])

        if (!isMounted) return

        setTrendingSongs(normalizeSongs(trendingResponse.data))
        setPersonalizedSongs(normalizeSongs(personalizedResponse.data))
        setPlaylists(playlistsResponse.data || [])
        setLikedSongs(normalizeSongs(likedResponse.data))
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || 'Unable to load your dashboard right now.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const handlePlay = (song) => {
    playSong(song)
    ;[...trendingSongs, ...personalizedSongs].forEach(addToQueue)
  }

  const handleToggleLike = async (song) => {
    const songId = getSongId(song)

    if (!songId) {
      return
    }

    const isLiked = likedSongs.some((likedSong) => getSongId(likedSong) === songId)
    setPendingLikeSongIds((current) => (current.includes(songId) ? current : [...current, songId]))
    setError('')

    try {
      if (isLiked) {
        await axiosInstance.delete(`/api/songs/${songId}/like`)
        setLikedSongs((current) => current.filter((likedSong) => getSongId(likedSong) !== songId))
      } else {
        await axiosInstance.post(`/api/songs/${songId}/like`)
        const normalizedSong = normalizeSong(song)

        if (normalizedSong) {
          setLikedSongs((current) => [
            normalizedSong,
            ...current.filter((likedSong) => getSongId(likedSong) !== songId),
          ])
        }
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update liked songs right now.')
    } finally {
      setPendingLikeSongIds((current) => current.filter((id) => id !== songId))
    }
  }

  const currentSongId = currentSong?._id || currentSong?.id
  const likedSongIds = new Set(likedSongs.map((song) => getSongId(song)))

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const renderFavoriteButton = (song, size = 'card') => {
    const songId = getSongId(song)
    const isLiked = likedSongIds.has(songId)
    const isPending = pendingLikeSongIds.includes(songId)
    const isCard = size === 'card'

    return (
      <FavoriteButton
        isLiked={isLiked}
        isLoading={isPending}
        onClick={() => handleToggleLike(song)}
        className={isCard ? 'h-9 w-9' : 'h-8 w-8'}
        style={{
          color: isLiked ? '#ff6b81' : 'var(--text-primary)',
          background: isCard ? 'rgba(13, 11, 26, 0.72)' : 'transparent',
          border: isCard ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
          backdropFilter: isCard ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: isCard ? 'blur(14px)' : 'none',
        }}
      />
    )
  }

  return (
    <AppLayout>
      <section className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] md:text-4xl">
              {getGreeting()}{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Here's what's been playing. Dive back in or discover something new.
            </p>
          </div>
          <Link
            to="/liked"
            className="inline-flex items-center gap-2 self-start rounded-full px-5 py-2 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'var(--bg-highlight)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-6.72-4.35-9.33-8.08C.79 10.24 1.4 6.2 4.72 4.61c2.14-1.02 4.66-.51 6.28 1.27 1.62-1.78 4.14-2.29 6.28-1.27 3.32 1.59 3.93 5.63 2.05 8.31C18.72 16.65 12 21 12 21z" />
            </svg>
            Liked Songs
          </Link>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b', border: '1px solid rgba(231,76,60,0.2)' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : (
        <>
          <section className="mb-10">
            <div
              className="overflow-hidden rounded-2xl border p-5"
              style={{ background: 'linear-gradient(135deg, rgba(207,159,255,0.12), rgba(255,107,129,0.08))', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                    Your Collection
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">Liked Songs</h2>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {likedSongs.length
                      ? `${likedSongs.length} tracks saved for the moments you want to replay.`
                      : 'Tap the heart on any track to build your liked songs playlist.'}
                  </p>
                </div>
                <Link
                  to="/liked"
                  className="inline-flex items-center gap-2 self-start rounded-full px-5 py-2 text-sm font-bold"
                  style={{ background: 'var(--accent)', color: '#0d0b1a' }}
                >
                  Open playlist
                </Link>
              </div>

              {likedSongs.length > 0 && (
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {likedSongs.slice(0, 3).map((song) => (
                    <button
                      key={song._id}
                      type="button"
                      onClick={() => handlePlay(song)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                      onMouseLeave={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    >
                      <img src={song.coverUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{song.title}</span>
                        <span className="block truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{song.artistName}</span>
                      </div>
                      {renderFavoriteButton(song, 'row')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {trendingSongs.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Trending Now</h2>
                <Link to="/search" className="text-xs font-bold transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Show all
                </Link>
              </div>
              <div className="horizontal-scroll stagger-children">
                {trendingSongs.map((song) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    onPlay={handlePlay}
                    favoriteButton={renderFavoriteButton(song)}
                  />
                ))}
              </div>
            </section>
          )}

          {personalizedSongs.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Made for You</h2>
              </div>
              <div className="rounded-xl p-2" style={{ background: 'var(--bg-secondary)' }}>
                {personalizedSongs.map((song, index) => (
                  <SongRow
                    key={song._id}
                    song={song}
                    index={index}
                    onPlay={handlePlay}
                    isActive={currentSongId === song._id}
                    favoriteButton={renderFavoriteButton(song, 'row')}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Playlists</h2>
              <Link to="/playlists" className="text-xs font-bold transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Show all
              </Link>
            </div>
            {playlists.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {playlists.map((playlist) => (
                  <Link
                    key={playlist._id}
                    to={`/playlist/${playlist._id}`}
                    className="group flex items-center gap-4 overflow-hidden rounded-lg transition-all duration-200"
                    style={{ background: 'var(--bg-highlight)' }}
                    onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--surface)' }}
                    onMouseLeave={(event) => { event.currentTarget.style.background = 'var(--bg-highlight)' }}
                  >
                    <div
                      className="grid h-16 w-16 flex-shrink-0 place-items-center"
                      style={{ background: 'var(--gradient-2)' }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.8">
                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 py-3 pr-4">
                      <h3 className="truncate text-sm font-bold text-[var(--text-primary)]">{playlist.playlistName}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {playlist.songs?.length || 0} songs · {playlist.isPublic ? 'Public' : 'Private'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl px-6 py-8 text-center" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No playlists yet. Create one to get started.</p>
                <Link
                  to="/playlists"
                  className="mt-3 inline-block rounded-full px-5 py-2 text-sm font-bold"
                  style={{ background: 'var(--accent)', color: '#0d0b1a' }}
                >
                  Create playlist
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </AppLayout>
  )
}

export default DashboardPage
