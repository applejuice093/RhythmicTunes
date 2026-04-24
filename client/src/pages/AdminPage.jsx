import { useEffect, useState, useRef } from 'react'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'

function AdminPage() {
  const [artists, setArtists] = useState([])
  const [songs, setSongs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const audioInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '', artistId: '', album: '', genre: '', duration: '', fileUrl: '', coverUrl: '',
  })
  const [audioFileName, setAudioFileName] = useState('')
  const [coverFileName, setCoverFileName] = useState('')

  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', isAdmin: false })
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [artistsRes, songsRes, usersRes] = await Promise.all([
          axiosInstance.get('/api/artists'),
          axiosInstance.get('/api/songs?limit=100'),
          axiosInstance.get('/api/users').catch(() => ({ data: { users: [] } })),
        ])
        if (isMounted) {
          setArtists(artistsRes.data || [])
          setSongs(songsRes.data?.songs || [])
          setUsers(usersRes.data?.users || [])
        }
      } catch (err) {
        if (isMounted) setError('Failed to load data')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [])

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  // Upload audio file
  const handleAudioUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAudio(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('audio', file)
      const { data } = await axiosInstance.post('/api/songs/upload/audio', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // The server returns a path like /uploads/audio/filename.mp3
      // We need the full URL so the browser can play it
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      setFormData((prev) => ({ ...prev, fileUrl: `${baseUrl}${data.fileUrl}` }))
      setAudioFileName(data.originalName)

      // Auto-detect duration from the uploaded file
      const tempAudio = new Audio(URL.createObjectURL(file))
      tempAudio.addEventListener('loadedmetadata', () => {
        const dur = Math.round(tempAudio.duration)
        setFormData((prev) => ({ ...prev, duration: String(dur) }))
        URL.revokeObjectURL(tempAudio.src)
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Audio upload failed')
    } finally {
      setUploadingAudio(false)
    }
  }

  // Upload cover image
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingCover(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('cover', file)
      const { data } = await axiosInstance.post('/api/songs/upload/cover', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      setFormData((prev) => ({ ...prev, coverUrl: `${baseUrl}${data.coverUrl}` }))
      setCoverFileName(data.originalName)
    } catch (err) {
      setError(err.response?.data?.message || 'Cover upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setIsSubmitting(true)
    try {
      const payload = { ...formData, duration: Number(formData.duration) }
      await axiosInstance.post('/api/songs', payload)
      const songsRes = await axiosInstance.get('/api/songs?limit=100')
      setSongs(songsRes.data?.songs || [])
      setSuccess(`Song added successfully!`)
      setFormData({ title: '', artistId: formData.artistId, album: '', genre: '', duration: '', fileUrl: '', coverUrl: '' })
      setAudioFileName(''); setCoverFileName('')
      if (audioInputRef.current) audioInputRef.current.value = ''
      if (coverInputRef.current) coverInputRef.current.value = ''
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add song')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSong = async (id) => {
    if (!window.confirm('Delete this song?')) return
    try {
      await axiosInstance.delete(`/api/songs/${id}`)
      setSongs(prev => prev.filter(s => s._id !== id))
    } catch(err) {
      setError(err.response?.data?.message || 'Failed to delete song')
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setIsCreatingUser(true)
    try {
      const { data } = await axiosInstance.post('/api/users', newUser)
      setUsers(prev => [...prev, data.user])
      setSuccess('User created successfully!')
      setNewUser({ name: '', username: '', email: '', password: '', isAdmin: false })
    } catch(err) {
      setError(err.response?.data?.message || 'Failed to create user')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await axiosInstance.delete(`/api/users/${id}`)
      setUsers(prev => prev.filter(u => (u._id || u.id) !== id))
    } catch(err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleToggleAdmin = async (id) => {
    try {
      const { data } = await axiosInstance.put(`/api/users/${id}/admin`)
      setUsers(prev => prev.map(u => (u._id || u.id) === id ? data.user : u))
    } catch(err) {
       setError(err.response?.data?.message || 'Failed to toggle admin status')
    }
  }

  const getArtistName = (artistId) => {
    if (typeof artistId === 'object' && artistId?.name) return artistId.name
    const artist = artists.find((a) => a._id === artistId)
    return artist?.name || 'Unknown'
  }

  const formatDur = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
  const focusHandler = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 16px rgba(207,159,255,0.12)' }
  const blurHandler = (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }

  return (
    <AppLayout>
      <section className="mb-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: 'var(--gradient-violet)', boxShadow: '0 0 20px rgba(207,159,255,0.3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d0b1a">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add songs from your system or via URL</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_1.5fr]">
        {/* ── Add Song Form ── */}
        <section className="glass-strong rounded-xl p-6">
          <h2 className="mb-5 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add New Song</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Song Title *</span>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Enter song title"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle}
                onFocus={focusHandler} onBlur={blurHandler}
              />
            </label>

            {/* Artist */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Artist *</span>
              <select name="artistId" value={formData.artistId} onChange={handleChange} required
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle}
              >
                <option value="">Select an artist</option>
                {artists.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </label>

            {/* Album & Genre */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Album</span>
                <input type="text" name="album" value={formData.album} onChange={handleChange} placeholder="Album name"
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle}
                  onFocus={focusHandler} onBlur={blurHandler}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Genre</span>
                <input type="text" name="genre" value={formData.genre} onChange={handleChange} placeholder="e.g. Pop, Rock"
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle}
                  onFocus={focusHandler} onBlur={blurHandler}
                />
              </label>
            </div>

            {/* ── Audio File Upload ── */}
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Audio File *</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => audioInputRef.current?.click()} disabled={uploadingAudio}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid rgba(207,159,255,0.2)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" /></svg>
                  {uploadingAudio ? 'Uploading...' : 'Choose File'}
                </button>
                {audioFileName && <span className="truncate text-xs" style={{ color: 'var(--accent)' }}>{audioFileName}</span>}
              </div>
              <input ref={audioInputRef} type="file" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,.webm" onChange={handleAudioUpload} className="hidden" />
              {/* OR manual URL */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>or paste url</span>
                <input type="url" name="fileUrl" value={formData.fileUrl} onChange={handleChange} placeholder="https://example.com/song.mp3"
                  className="flex-1 rounded-lg px-3 py-2 text-xs font-medium outline-none transition-all" style={inputStyle}
                  onFocus={focusHandler} onBlur={blurHandler}
                />
              </div>
            </div>

            {/* ── Cover Image Upload ── */}
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Cover Image</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                  {uploadingCover ? 'Uploading...' : 'Choose Cover'}
                </button>
                {coverFileName && <span className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{coverFileName}</span>}
              </div>
              <input ref={coverInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleCoverUpload} className="hidden" />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>or paste url</span>
                <input type="url" name="coverUrl" value={formData.coverUrl} onChange={handleChange} placeholder="https://example.com/cover.jpg"
                  className="flex-1 rounded-lg px-3 py-2 text-xs font-medium outline-none transition-all" style={inputStyle}
                  onFocus={focusHandler} onBlur={blurHandler}
                />
              </div>
            </div>

            {/* Duration (auto-filled from upload) */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Duration (seconds) * {formData.duration && <span className="normal-case" style={{ color: 'var(--accent)' }}>— {formatDur(formData.duration)}</span>}
              </span>
              <input type="number" name="duration" value={formData.duration} onChange={handleChange} required min="0" placeholder="Auto-detected on upload"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle}
                onFocus={focusHandler} onBlur={blurHandler}
              />
            </label>

            {error && (<div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>{error}</div>)}
            {success && (<div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{success}</div>)}

            <button type="submit" disabled={isSubmitting || !formData.fileUrl}
              className="w-full rounded-full py-2.5 text-sm font-extrabold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
              style={{ background: 'var(--gradient-violet)', color: '#0d0b1a', boxShadow: '0 0 20px rgba(207,159,255,0.2)' }}
            >{isSubmitting ? 'Adding...' : 'Add Song'}</button>
          </form>
        </section>

        {/* ── Songs List ── */}
        <section className="glass rounded-xl">
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Song Catalog</h2>
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
              {songs.length} songs
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-5">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="sticky top-0 grid grid-cols-[2rem_3rem_1fr_8rem_5rem_2rem] items-center gap-3 px-5 py-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)', background: 'rgba(13,11,26,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border)' }}>
                <span>#</span><span /><span>Title / Artist</span><span>Genre</span><span className="text-right">Duration</span><span />
              </div>

              {songs.length > 0 ? songs.map((song, index) => (
                <div key={song._id}
                  className="group grid grid-cols-[2rem_3rem_1fr_8rem_5rem_2rem] items-center gap-3 px-5 py-2 transition-colors hover:bg-[var(--glass-bg)]"
                >
                  <span className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>{index + 1}</span>
                  <img src={song.coverUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=100&q=60'}
                    alt="" className="h-8 w-8 rounded object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{song.title}</p>
                    <p className="truncate text-[11px]" style={{ color: 'var(--text-secondary)' }}>{getArtistName(song.artistId)}</p>
                  </div>
                  <span className="truncate rounded-full px-2 py-0.5 text-center text-[10px] font-semibold"
                    style={{ background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}>{song.genre || '—'}</span>
                  <span className="text-right text-xs" style={{ color: 'var(--text-muted)' }}>{formatDur(song.duration)}</span>
                  <button onClick={() => handleDeleteSong(song._id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 rounded-full hover:bg-[var(--danger-muted)] text-[var(--danger)]" title="Delete Song">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                  </button>
                </div>
              )) : (
                <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No songs in catalog.</div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── User & Admin Management ── */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_1.5fr]">
        
        {/* Create User Form */}
        <section className="glass-strong rounded-xl p-6">
          <h2 className="mb-5 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create User / Admin</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Name *</span>
              <input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} required placeholder="User's full name"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Username</span>
              <input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} placeholder="Optional unique username"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Email *</span>
              <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required placeholder="user@example.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Password *</span>
              <input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required placeholder="Enter strong password"
                 className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </label>
            <label className="flex items-center gap-3 mt-4">
              <input type="checkbox" checked={newUser.isAdmin} onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})} className="h-4 w-4 rounded accent-[var(--accent)]" />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Make this user an Admin</span>
            </label>
            <button type="submit" disabled={isCreatingUser}
              className="w-full rounded-full mt-4 py-2.5 text-sm font-extrabold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
              style={{ background: 'var(--gradient-violet)', color: '#0d0b1a', boxShadow: '0 0 20px rgba(207,159,255,0.2)' }}
            >{isCreatingUser ? 'Creating...' : 'Create Account'}</button>
          </form>
        </section>

        {/* Users List */}
        <section className="glass rounded-xl flex flex-col">
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>User Directory</h2>
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
              {users.length} users
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto flex-1">
            <div className="sticky top-0 grid grid-cols-[1fr_1fr_5rem_2rem] items-center gap-3 px-5 py-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)', background: 'rgba(13,11,26,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border)' }}>
              <span>Name / Email</span><span>Username</span><span className="text-center">Role</span><span />
            </div>

            {users.length > 0 ? users.map((u) => (
              <div key={u._id || u.id} className="group grid grid-cols-[1fr_1fr_5rem_2rem] items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--glass-bg)] border-b border-[var(--border)] last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                  <p className="truncate text-[11px]" style={{ color: 'var(--text-secondary)' }}>{u.email}</p>
                </div>
                <div className="min-w-0">
                  <span className="truncate text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>@{u.username}</span>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => handleToggleAdmin(u._id || u.id)}
                    className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase transition-all hover:scale-105"
                    style={{ background: u.isAdmin ? 'var(--accent-muted)' : 'rgba(255,255,255,0.05)', color: u.isAdmin ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {u.isAdmin ? 'Admin' : 'User'}
                  </button>
                </div>
                <button onClick={() => handleDeleteUser(u._id || u.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1.5 rounded-full hover:bg-[var(--danger-muted)] text-[var(--danger)] ml-auto" title="Delete User">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                </button>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No users found.</div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

export default AdminPage
