import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'

const gradients = [
  'linear-gradient(135deg, #CF9FFF, #7C3AED)',
  'linear-gradient(135deg, #818cf8, #6366f1)',
  'linear-gradient(135deg, #a78bfa, #7c3aed)',
  'linear-gradient(135deg, #c084fc, #9333ea)',
  'linear-gradient(135deg, #e879f9, #a855f7)',
  'linear-gradient(135deg, #f0abfc, #d946ef)',
]

function CreatePlaylistModal({ onClose, onCreated }) {
  const [playlistName, setPlaylistName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const { data } = await axiosInstance.post('/api/playlists', { playlistName, isPublic })
      onCreated(data)
      onClose()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create playlist. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-5" onClick={onClose}>
      <section
        className="animate-scale-in w-full max-w-md rounded-xl p-7"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Create playlist</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full transition-colors" style={{ background: 'var(--glass-bg)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-secondary)">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[var(--text-primary)]">Playlist name</span>
            <input
              value={playlistName}
              onChange={(event) => setPlaylistName(event.target.value)}
              required
              placeholder="My Awesome Playlist"
              className="w-full rounded-lg px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none transition-all duration-200"
              style={{ background: 'var(--bg-highlight)', border: '1px solid var(--border)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />
          </label>

          <label
            className="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 transition-colors"
            style={{ background: 'var(--bg-highlight)' }}
          >
            <div>
              <span className="block text-sm font-bold text-[var(--text-primary)]">Make it public</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Anyone can see this playlist</span>
            </div>
            <div
              className="relative h-6 w-11 rounded-full transition-colors duration-200"
              style={{ background: isPublic ? 'var(--accent)' : 'var(--surface)' }}
            >
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: isPublic ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </div>
          </label>

          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full py-3 text-sm font-extrabold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#0d0b1a' }}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </form>
      </section>
    </div>
  )
}

function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchPlaylists = async () => {
      setIsLoading(true)
      setError('')
      try {
        const { data } = await axiosInstance.get('/api/playlists')
        if (isMounted) setPlaylists(data || [])
      } catch (requestError) {
        if (isMounted) setError(requestError.response?.data?.message || 'Unable to load playlists right now.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchPlaylists()
    return () => { isMounted = false }
  }, [])

  return (
    <AppLayout>
      <section className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Your Library</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {playlists.length} playlists
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-105"
          style={{ background: 'var(--accent)', color: '#0d0b1a' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New playlist
        </button>
      </section>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (<div key={i} className="skeleton h-24 rounded-xl" />))}
        </div>
      ) : playlists.length ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {playlists.map((playlist, index) => (
            <Link
              key={playlist._id}
              to={`/playlist/${playlist._id}`}
              className="group animate-fade-in overflow-hidden rounded-xl transition-all duration-300"
              style={{ background: 'var(--bg-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-highlight)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)' }}
            >
              <div className="flex items-stretch">
                <div
                  className="grid w-24 flex-shrink-0 place-items-center"
                  style={{ background: gradients[index % gradients.length] }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white" opacity="0.8">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
                  </svg>
                </div>
                <div className="flex min-w-0 flex-col justify-center px-5 py-4">
                  <h2 className="truncate text-base font-bold text-[var(--text-primary)]">{playlist.playlistName}</h2>
                  <p className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>{playlist.songs?.length || 0} songs</span>
                    <span>·</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: playlist.isPublic ? 'var(--accent-muted)' : 'var(--glass-bg)',
                        color: playlist.isPublic ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      {playlist.isPublic ? 'Public' : 'Private'}
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center rounded-xl py-20 text-center" style={{ background: 'var(--bg-secondary)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="var(--text-muted)" className="mb-4 opacity-30">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
          </svg>
          <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>Create your first playlist</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>It's easy. We'll help you.</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-105"
            style={{ background: 'var(--accent)', color: '#0d0b1a' }}
          >
            Create playlist
          </button>
        </div>
      )}

      {isModalOpen && (
        <CreatePlaylistModal
          onClose={() => setIsModalOpen(false)}
          onCreated={(playlist) => setPlaylists((current) => [playlist, ...current])}
        />
      )}
    </AppLayout>
  )
}

export default PlaylistsPage
