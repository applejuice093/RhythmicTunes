import { formatDistanceToNowStrict } from 'date-fns'
import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'
import { usePlayerStore } from '../store/playerStore'
import { formatDuration, normalizeSong } from '../utils/songUtils'

const formatPlayedAt = (playedAt) => {
  if (!playedAt) return 'Unknown time'
  return formatDistanceToNowStrict(new Date(playedAt), { addSuffix: true })
}

function HistoryPage() {
  const { addToQueue, playSong, currentSong } = usePlayerStore()
  const [historyEntries, setHistoryEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const currentSongId = currentSong?._id || currentSong?.id

  useEffect(() => {
    let isMounted = true
    const fetchHistory = async () => {
      setIsLoading(true); setError('')
      try {
        const { data } = await axiosInstance.get('/api/history')
        if (isMounted) setHistoryEntries(data || [])
      } catch (requestError) {
        if (isMounted) setError(requestError.response?.data?.message || 'Unable to load listening history right now.')
      } finally { if (isMounted) setIsLoading(false) }
    }
    fetchHistory()
    return () => { isMounted = false }
  }, [])

  const songs = historyEntries.map((entry) => normalizeSong(entry.songId)).filter(Boolean)

  const handlePlay = (song) => {
    playSong(song)
    songs.forEach(addToQueue)
  }

  const handleClearHistory = async () => {
    if (!window.confirm('Clear your listening history? This cannot be undone.')) return
    setError('')
    try {
      await axiosInstance.delete('/api/history')
      setHistoryEntries([])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to clear listening history right now.')
    }
  }

  return (
    <AppLayout>
      {/* Header */}
      <section className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Recently Played</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your last {historyEntries.length} listened tracks
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearHistory}
          disabled={!historyEntries.length}
          className="rounded-full px-5 py-2 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: 'var(--danger)', border: '1px solid rgba(231,76,60,0.3)' }}
        >
          Clear all
        </button>
      </section>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (<div key={i} className="skeleton h-16 rounded-lg" />))}
        </div>
      ) : historyEntries.length ? (
        <div className="rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
          {/* Table Header */}
          <div
            className="grid grid-cols-[2rem_3rem_1fr_7rem_6rem] items-center gap-3 px-4 py-2.5 text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
          >
            <span>#</span>
            <span />
            <span>Title</span>
            <span className="text-right">Played</span>
            <span className="text-right">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-auto">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
              </svg>
            </span>
          </div>

          {/* Entries */}
          {historyEntries.map((entry, index) => {
            const song = normalizeSong(entry.songId)
            if (!song) return null

            return (
              <button
                key={entry._id}
                type="button"
                onClick={() => handlePlay(song)}
                className="group grid w-full grid-cols-[2rem_3rem_1fr_7rem_6rem] items-center gap-3 px-4 py-2.5 text-left transition-all duration-200"
                style={{ background: currentSongId === song._id ? 'var(--accent-muted)' : 'transparent' }}
                onMouseEnter={(e) => { if (currentSongId !== song._id) e.currentTarget.style.background = 'var(--glass-bg)' }}
                onMouseLeave={(e) => { if (currentSongId !== song._id) e.currentTarget.style.background = 'transparent' }}
              >
                <span className="text-center text-sm" style={{ color: currentSongId === song._id ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {index + 1}
                </span>
                <img src={song.coverUrl} alt="" className="h-10 w-10 rounded object-cover" />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-semibold" style={{ color: currentSongId === song._id ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {song.title}
                  </span>
                  <span className="block truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {song.artistName}
                  </span>
                </div>
                <span className="text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatPlayedAt(entry.playedAt)}
                </span>
                <span className="text-right text-sm" style={{ color: 'var(--text-muted)' }}>
                  {formatDuration(song.duration)}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl py-20 text-center" style={{ background: 'var(--bg-secondary)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="var(--text-muted)" className="mb-4 opacity-30">
            <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
          </svg>
          <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>No listening history</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Play a song and it'll show up here.</p>
        </div>
      )}
    </AppLayout>
  )
}

export default HistoryPage
