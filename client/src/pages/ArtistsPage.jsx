import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'

const defaultArtistImage =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=500&q=80'

function ArtistsPage() {
  const [artists, setArtists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchArtists = async () => {
      setIsLoading(true)
      setError('')

      try {
        const { data } = await axiosInstance.get('/api/artists')
        if (isMounted) setArtists(data || [])
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || 'Unable to load artists right now.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchArtists()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AppLayout>
      <section className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Artists</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Explore artists and discover their music.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="skeleton mb-4 h-40 w-40 rounded-full" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      ) : artists.length ? (
        <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 stagger-children">
          {artists.map((artist) => (
            <Link
              key={artist._id}
              to={`/artist/${artist._id}`}
              className="group flex animate-fade-in flex-col items-center rounded-xl p-4 text-center transition-all duration-300"
              style={{ background: 'var(--bg-secondary)' }}
              onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--bg-highlight)' }}
              onMouseLeave={(event) => { event.currentTarget.style.background = 'var(--bg-secondary)' }}
            >
              <div className="relative mb-4 overflow-hidden rounded-full shadow-xl" style={{ boxShadow: 'var(--shadow-card)' }}>
                <img
                  src={artist.profileImageUrl || defaultArtistImage}
                  alt={artist.name}
                  className="h-40 w-40 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div
                  className="absolute bottom-2 right-2 grid h-12 w-12 place-items-center rounded-full shadow-xl opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                  style={{ background: 'var(--accent)', transform: 'translateY(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0d0b1a">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              <h2 className="truncate text-base font-bold text-[var(--text-primary)]">{artist.name}</h2>
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Artist · {artist.totalFollowers?.toLocaleString() || 0} followers
              </p>
            </Link>
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>No artists yet</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Check back later for new artists.</p>
        </div>
      )}
    </AppLayout>
  )
}

export default ArtistsPage
