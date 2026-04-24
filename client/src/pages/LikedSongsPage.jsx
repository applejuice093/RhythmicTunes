import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'
import FavoriteButton from '../components/FavoriteButton'
import { usePlayerStore } from '../store/playerStore'
import { formatDuration, getSongId, normalizeSongs } from '../utils/songUtils'

function LikedSongsPage() {
  const { addToQueue, playSong, currentSong } = usePlayerStore()
  const [songs, setSongs] = useState([])
  const [pendingSongIds, setPendingSongIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchLikedSongs = async () => {
      setIsLoading(true)
      setError('')

      try {
        const { data } = await axiosInstance.get('/api/songs/liked')
        if (isMounted) setSongs(normalizeSongs(data))
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || 'Unable to load liked songs right now.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchLikedSongs()

    return () => {
      isMounted = false
    }
  }, [])

  const handlePlay = (song) => {
    playSong(song)
    songs.forEach(addToQueue)
  }

  const handlePlayAll = () => {
    if (!songs.length) {
      return
    }

    playSong(songs[0])
    songs.forEach(addToQueue)
  }

  const handleRemoveLike = async (songId) => {
    setPendingSongIds((current) => (current.includes(songId) ? current : [...current, songId]))
    setError('')

    try {
      await axiosInstance.delete(`/api/songs/${songId}/like`)
      setSongs((current) => current.filter((song) => getSongId(song) !== songId))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update liked songs right now.')
    } finally {
      setPendingSongIds((current) => current.filter((id) => id !== songId))
    }
  }

  const currentSongId = currentSong?._id || currentSong?.id

  return (
    <AppLayout>
      <section
        className="relative mb-8 overflow-hidden rounded-3xl border px-6 py-8 md:px-8"
        style={{ background: 'linear-gradient(135deg, rgba(207,159,255,0.18), rgba(255,107,129,0.12))', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/3 translate-x-1/4 rounded-full blur-3xl" style={{ background: 'rgba(255,107,129,0.18)' }} />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#ff9fb0' }}>
              Your Playlist
            </p>
            <h1 className="mt-3 text-4xl font-black text-[var(--text-primary)] md:text-5xl">Liked Songs</h1>
            <p className="mt-3 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
              All the tracks you’ve saved in one playlist-style view.
            </p>
            <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={!songs.length}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#0d0b1a' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play all
            </button>
            <Link
              to="/dashboard"
              className="rounded-full px-5 py-3 text-sm font-bold"
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-secondary)' }}>
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton mb-3 h-14 w-full rounded-xl last:mb-0" />
          ))}
        </div>
      ) : songs.length ? (
        <section className="rounded-2xl p-2" style={{ background: 'var(--bg-secondary)' }}>
          <div
            className="grid grid-cols-[2rem_3rem_1fr_5rem_3rem] items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
          >
            <span>#</span>
            <span />
            <span>Title</span>
            <span className="text-right">Time</span>
            <span />
          </div>
          {songs.map((song, index) => {
            const songId = getSongId(song)
            const isPending = pendingSongIds.includes(songId)
            const isActive = currentSongId === songId

            return (
              <button
                key={songId}
                type="button"
                onClick={() => handlePlay(song)}
                className="group grid w-full grid-cols-[2rem_3rem_1fr_5rem_3rem] items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200"
                style={{ background: isActive ? 'var(--accent-muted)' : 'transparent' }}
                onMouseEnter={(event) => { if (!isActive) event.currentTarget.style.background = 'var(--glass-bg)' }}
                onMouseLeave={(event) => { if (!isActive) event.currentTarget.style.background = 'transparent' }}
              >
                <span className="text-center text-sm font-medium" style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {index + 1}
                </span>
                <img src={song.coverUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{song.title}</span>
                  <span className="block truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {song.artistName}{song.genre ? ` · ${song.genre}` : ''}
                  </span>
                </div>
                <span className="text-right text-sm" style={{ color: 'var(--text-muted)' }}>
                  {formatDuration(song.duration)}
                </span>
                <FavoriteButton
                  isLiked
                  isLoading={isPending}
                  onClick={() => handleRemoveLike(songId)}
                  className="h-9 w-9 justify-self-end"
                  style={{ color: '#ff6b81', background: 'transparent' }}
                />
              </button>
            )
          })}
        </section>
      ) : (
        <section className="rounded-2xl px-6 py-14 text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full" style={{ background: 'rgba(255,107,129,0.12)', color: '#ff6b81' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-6.72-4.35-9.33-8.08C.79 10.24 1.4 6.2 4.72 4.61c2.14-1.02 4.66-.51 6.28 1.27 1.62-1.78 4.14-2.29 6.28-1.27 3.32 1.59 3.93 5.63 2.05 8.31C18.72 16.65 12 21 12 21z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">No liked songs yet</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Head back to the dashboard and tap the heart on a few tracks to start this playlist.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex rounded-full px-5 py-2 text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#0d0b1a' }}
          >
            Explore songs
          </Link>
        </section>
      )}
    </AppLayout>
  )
}

export default LikedSongsPage
