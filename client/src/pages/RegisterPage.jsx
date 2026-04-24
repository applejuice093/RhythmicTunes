import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuthStore } from '../store/authStore'

function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => setFormData((c) => ({ ...c, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setIsSubmitting(true)
    try {
      const { data } = await axiosInstance.post('/api/auth/register', formData)
      login(data.user, data.token); navigate('/dashboard')
    } catch (err) { setError(err.response?.data?.message || 'Unable to create account.') }
    finally { setIsSubmitting(false) }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center px-6 py-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="mesh-bg" />
      <section className="animate-scale-in relative z-10 w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full" style={{ background: 'var(--gradient-violet)', boxShadow: '0 0 30px rgba(207,159,255,0.3)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#0d0b1a"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Sign up for free</h1>
        </div>

        <div className="glass-strong rounded-xl p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {[{ label: "What's your name?", name: 'name', type: 'text', placeholder: 'Enter your name' },
              { label: 'Email address', name: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Create a password', name: 'password', type: 'password', placeholder: 'At least 6 characters' }
            ].map((f) => (
              <label key={f.name} className="block">
                <span className="mb-2 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{f.label}</span>
                <input type={f.type} name={f.name} value={formData[f.name]} onChange={handleChange} required placeholder={f.placeholder}
                  className="w-full rounded-lg px-4 py-3 text-sm font-medium outline-none transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 16px rgba(207,159,255,0.12)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
              </label>
            ))}
            {error && <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>{error}</div>}
            <button type="submit" disabled={isSubmitting}
              className="w-full rounded-full py-3 text-sm font-extrabold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
              style={{ background: 'var(--gradient-violet)', color: '#0d0b1a', boxShadow: '0 0 20px rgba(207,159,255,0.2)' }}
            >{isSubmitting ? 'Creating account...' : 'Sign Up'}</button>
          </form>
          <div className="mt-6 text-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
            <Link to="/login" className="text-sm font-bold underline" style={{ color: 'var(--accent)' }}>Log in</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
