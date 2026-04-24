import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'
import { usePlayerStore } from '../store/playerStore'
import { formatDuration, normalizeSongs } from '../utils/songUtils'

function AddSongModal({ existingSongIds, onAdd, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const trimmedQuery = query.trim()
    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      if (!trimmedQuery) { setResults([]); setIsLoading(false); setError(''); return }
      setIsLoading(true); setError('')
      try {
        const { data } = await axiosInstance.get('/api/songs/search', { params: { q: trimmedQuery }, signal: controller.signal })
        setResults(normalizeSongs(data))
      } catch (requestError) {
        if (requestError.name !== 'CanceledError') setError(requestError.response?.data?.message || 'Unable to search songs right now.')
      } finally { setIsLoading(false) }
    }, trimmedQuery ? 400 : 0)
    return () => { window.clearTimeout(timeoutId); controller.abort() }
  }, [query])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-5" onClick={onClose}>
      <section
        className="animate-scale-in flex max-h-[85svh] w-full max-w-2xl flex-col overflow-hidden rounded-xl"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Add songs</h2>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: 'var(--glass-bg)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-secondary)">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="var(--text-muted)">
              <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for songs"
              className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none"
              style={{ background: 'var(--bg-highlight)', border: '1px solid var(--border)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>{error}</div>
          )}
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => (<div key={i} className="skeleton h-14 rounded-lg" />))}</div>
          ) : results.length ? (
            <div className="space-y-2">
              {results.map((song) => {
                const alreadyAdded = existingSongIds.has(song._id)
                return (
                  <div key={song._id} className="flex items-center gap-3 rounded-lg p-2 transition-colors" style={{ background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <img src={song.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{song.title}</p>
                      <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{song.artistName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAdd(song)}
                      disabled={alreadyAdded}
                      className="rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 disabled:opacity-40"
                      style={{
                        background: alreadyAdded ? 'transparent' : 'transparent',
                        color: alreadyAdded ? 'var(--text-muted)' : 'var(--text-primary)',
                        border: alreadyAdded ? '1px solid var(--border)' : '1px solid var(--border-hover)',
                      }}
                    >
                      {alreadyAdded ? 'Added' : 'Add'}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {query.trim() ? 'No songs found.' : 'Search to find songs to add.'}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function PlaylistDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToQueue, playSong, currentSong } = usePlayerStore()
  const [playlist, setPlaylist] = useState(null)
  const [songs, setSongs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const existingSongIds = new Set(songs.map((song) => song._id))
  const currentSongId = currentSong?._id || currentSong?.id

  const setPlaylistData = (playlistData) => {
    setPlaylist(playlistData)
    setSongs(normalizeSongs(playlistData?.songs || []))
  }

  useEffect(() => {
    let isMounted = true
    const fetchPlaylist = async () => {
      setIsLoading(true); setError('')
      try {
        const { data } = await axiosInstance.get(`/api/playlists/${id}`)
        if (isMounted) setPlaylistData(data)
      } catch (requestError) {
        if (isMounted) setError(requestError.response?.data?.message || 'Unable to load this playlist right now.')
      } finally { if (isMounted) setIsLoading(false) }
    }
    fetchPlaylist()
    return () => { isMounted = false }
  }, [id])

  const handlePlay = (song) => { playSong(song); songs.forEach(addToQueue) }
  const handlePlayAll = () => { if (songs.length) { playSong(songs[0]); songs.forEach(addToQueue) } }
  const handleRemoveSong = async (songId) => {
    try { const { data } = await axiosInstance.delete(`/api/playlists/${id}/songs/${songId}`); setPlaylistData(data) }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to remove that song right now.') }
  }
  const handleAddSong = async (song) => {
    try { const { data } = await axiosInstance.post(`/api/playlists/${id}/songs`, { songId: song._id }); setPlaylistData(data) }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to add that song right now.') }
  }
  const handleDeletePlaylist = async () => {
    if (!window.confirm('Delete this playlist? This cannot be undone.')) return
    try { await axiosInstance.delete(`/api/playlists/${id}`); navigate('/playlists') }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete playlist right now.') }
  }

  const totalDuration = songs.reduce((sum, song) => sum + (Number(song.duration) || 0), 0)

  return (
    <AppLayout>
      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>{error}</div>
      )}

      {isLoading ? (
        <div>
          <div className="skeleton mb-6 h-56 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      ) : playlist ? (
        <>
          {/* ── Header ── */}
          <section
            className="mb-8 flex flex-col items-start gap-6 rounded-xl p-6 md:flex-row md:items-end md:p-10"
            style={{ background: 'linear-gradient(135deg, #1a1a2e, var(--bg-secondary))' }}
          >
            <div
              className="grid h-48 w-48 flex-shrink-0 place-items-center rounded-lg shadow-2xl"
              style={{ background: 'var(--gradient-2)' }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.7">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Playlist</p>
              <h1 className="mt-2 text-4xl font-black text-[var(--text-primary)] md:text-5xl">{playlist.playlistName}</h1>
              <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>{songs.length} songs</span>
                <span>·</span>
                <span>{formatDuration(totalDuration)}</span>
                <span>·</span>
                <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
              </p>
            </div>
          </section>

          {/* ── Action Buttons ── */}
          <div className="mb-6 flex items-center gap-4">
            <button type="button" onClick={handlePlayAll} disabled={!songs.length}
              className="grid h-14 w-14 place-items-center rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#0d0b1a"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <button type="button" onClick={() => setIsAddModalOpen(true)}
              className="rounded-full px-5 py-2 text-sm font-bold transition-all duration-200 hover:scale-105"
              style={{ border: '1px solid var(--border-hover)', color: 'var(--text-primary)' }}
            >
              Add songs
            </button>
            <button type="button" onClick={handleDeletePlaylist}
              className="rounded-full px-5 py-2 text-sm font-bold transition-all duration-200"
              style={{ color: 'var(--danger)' }}
            >
              Delete
            </button>
            <Link to="/playlists" className="ml-auto text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              ← All playlists
            </Link>
          </div>

          {/* ── Track List ── */}
          <div className="rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <div className="grid grid-cols-[2rem_3rem_1fr_6rem_3rem] items-center gap-3 px-4 py-2.5 text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
            >
              <span>#</span><span /><span>Title</span>
              <span className="text-right">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-auto">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                </svg>
              </span>
              <span />
            </div>

            {songs.length ? songs.map((song, index) => (
              <div
                key={song._id}
                className="group grid grid-cols-[2rem_3rem_1fr_6rem_3rem] items-center gap-3 px-4 py-2 transition-all duration-200"
                style={{ background: currentSongId === song._id ? 'var(--accent-muted)' : 'transparent' }}
                onMouseEnter={(e) => { if (currentSongId !== song._id) e.currentTarget.style.background = 'var(--glass-bg)' }}
                onMouseLeave={(e) => { if (currentSongId !== song._id) e.currentTarget.style.background = 'transparent' }}
              >
                <button type="button" onClick={() => handlePlay(song)} className="text-center text-sm" style={{ color: currentSongId === song._id ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {index + 1}
                </button>
                <button type="button" onClick={() => handlePlay(song)}>
                  <img src={song.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
                </button>
                <button type="button" onClick={() => handlePlay(song)} className="min-w-0 text-left">
                  <span className="block truncate text-sm font-semibold" style={{ color: currentSongId === song._id ? 'var(--accent)' : 'var(--text-primary)' }}>{song.title}</span>
                  <span className="block truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{song.artistName}</span>
                </button>
                <span className="text-right text-sm" style={{ color: 'var(--text-muted)' }}>{formatDuration(song.duration)}</span>
                <button type="button" onClick={() => handleRemoveSong(song._id)}
                  className="grid h-8 w-8 place-items-center rounded-full opacity-0 transition-all duration-200 group-hover:opacity-100"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            )) : (
              <div className="px-4 py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No songs yet. Add some to get started.</p>
                <button type="button" onClick={() => setIsAddModalOpen(true)}
                  className="mt-3 rounded-full px-5 py-2 text-sm font-bold"
                  style={{ background: 'var(--accent)', color: '#0d0b1a' }}
                >
                  Find songs
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>Playlist not found</p>
          <Link to="/playlists" className="mt-3 text-sm font-bold" style={{ color: 'var(--accent)' }}>Browse playlists</Link>
        </div>
      )}

      {isAddModalOpen && (
        <AddSongModal existingSongIds={existingSongIds} onAdd={handleAddSong} onClose={() => setIsAddModalOpen(false)} />
      )}
    </AppLayout>
  )
}

export default PlaylistDetailPage
