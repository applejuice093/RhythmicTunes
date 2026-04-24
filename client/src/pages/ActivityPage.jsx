import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'

const formatListeningTime = (totalSeconds = 0) => {
  const seconds = Math.max(Number(totalSeconds) || 0, 0)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  if (minutes) return `${minutes}m`
  return `${seconds}s`
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  const item = payload[0]?.payload
  if (!item) {
    return null
  }

  return (
    <div
      className="rounded-xl px-3 py-2 text-sm"
      style={{ background: 'rgba(13, 11, 26, 0.92)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="font-semibold text-[var(--text-primary)]">{item.genre}</p>
      <p style={{ color: 'var(--text-secondary)' }}>{item.playCount} plays</p>
    </div>
  )
}

function ActivityPage() {
  const [activity, setActivity] = useState(null)
  const [topGenres, setTopGenres] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchActivity = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [activityResponse, genresResponse] = await Promise.all([
          axiosInstance.get('/api/analytics/me'),
          axiosInstance.get('/api/analytics/genres'),
        ])

        if (!isMounted) return

        setActivity(activityResponse.data || null)
        setTopGenres(genresResponse.data || [])
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || 'Unable to load your activity right now.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchActivity()

    return () => {
      isMounted = false
    }
  }, [])

  const summaryCards = [
    {
      label: 'Total Plays',
      value: activity?.totalSongsPlayed?.toLocaleString?.() ?? '0',
      accent: 'var(--accent)',
    },
    {
      label: 'Top Genre',
      value: activity?.mostPlayedGenre?.genre || 'No data yet',
      accent: '#7dd3fc',
    },
    {
      label: 'Most Played Artist',
      value: activity?.mostPlayedArtist?.name || 'No data yet',
      accent: '#fda4af',
    },
    {
      label: 'Listening Time',
      value: formatListeningTime(activity?.totalListeningTime),
      accent: '#86efac',
    },
  ]

  return (
    <AppLayout>
      <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Your Activity</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            A quick look at what you’ve been listening to most.
          </p>
        </div>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 self-start rounded-full px-5 py-2 text-sm font-bold"
          style={{ background: 'var(--bg-highlight)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          View history
        </Link>
      </section>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton h-32 rounded-2xl" />
          ))}
          <div className="skeleton md:col-span-2 xl:col-span-4 h-[340px] rounded-3xl" />
        </div>
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border px-5 py-5"
                style={{ background: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: card.accent }}>
                  {card.label}
                </span>
                <p className="mt-4 text-2xl font-black text-[var(--text-primary)]">{card.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
            <article
              className="rounded-3xl border p-5 md:p-6"
              style={{ background: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
                  Top Genres
                </p>
                <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">Your listening mix</h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Based on all-time plays in your listening history.
                </p>
              </div>

              {topGenres.length ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topGenres} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="genre"
                        stroke="var(--text-muted)"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="var(--text-muted)"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip />} />
                      <Bar dataKey="playCount" fill="var(--accent)" radius={[10, 10, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="grid min-h-[320px] place-items-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--text-primary)]">No genre data yet</p>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Play a few songs and your chart will start filling in.
                    </p>
                  </div>
                </div>
              )}
            </article>

            <article
              className="rounded-3xl border p-5 md:p-6"
              style={{ background: 'linear-gradient(180deg, rgba(207,159,255,0.12), rgba(13,11,26,0.08))', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#fda4af' }}>
                Highlights
              </p>
              <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">At a glance</h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl px-4 py-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                    Favorite artist
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
                    {activity?.mostPlayedArtist?.name || 'No favorite yet'}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {activity?.mostPlayedArtist?.playCount
                      ? `${activity.mostPlayedArtist.playCount} plays`
                      : 'Start listening to build your profile.'}
                  </p>
                </div>

                <div className="rounded-2xl px-4 py-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                    Favorite genre
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
                    {activity?.mostPlayedGenre?.genre || 'No top genre yet'}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {activity?.mostPlayedGenre?.playCount
                      ? `${activity.mostPlayedGenre.playCount} plays`
                      : 'Your top genre will appear here.'}
                  </p>
                </div>

                <div className="rounded-2xl px-4 py-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                    Total listening time
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
                    {formatListeningTime(activity?.totalListeningTime)}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Across {activity?.totalSongsPlayed || 0} recorded plays.
                  </p>
                </div>
              </div>
            </article>
          </section>
        </>
      )}
    </AppLayout>
  )
}

export default ActivityPage
