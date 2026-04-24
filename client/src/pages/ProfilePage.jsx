import { useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import AppLayout from '../components/AppLayout'
import { useAuthStore } from '../store/authStore'

function ProfilePage() {
  const { user, token, refreshUser } = useAuthStore()
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleProfileChange = (e) => setProfileData(p => ({ ...p, [e.target.name]: e.target.value }))
  const handlePasswordChange = (e) => setPasswordData(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const { data } = await axiosInstance.put('/api/users/update-profile', profileData)
      setProfileSuccess(data.message)
      await refreshUser()
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      const { data } = await axiosInstance.put('/api/users/change-password', passwordData)
      setPasswordSuccess(data.message)
      setPasswordData({ oldPassword: '', newPassword: '' })
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
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
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Profile Settings</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Update your account details and password</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        {/* Update Profile Form */}
        <section className="glass-strong rounded-xl p-6">
          <h2 className="mb-5 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Personal Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Username</span>
              <input type="text" name="username" value={profileData.username} onChange={handleProfileChange} required placeholder="Your username"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Email</span>
              <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} required placeholder="Your email address"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </label>
            
            {profileError && (<div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>{profileError}</div>)}
            {profileSuccess && (<div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{profileSuccess}</div>)}
            
            <button type="submit" disabled={profileLoading}
              className="w-full rounded-full py-2.5 text-sm font-extrabold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 mt-4"
              style={{ background: 'var(--gradient-violet)', color: '#0d0b1a', boxShadow: '0 0 20px rgba(207,159,255,0.2)' }}
            >{profileLoading ? 'Updating...' : 'Update Profile'}</button>
          </form>
        </section>

        {/* Change Password Form */}
        <section className="glass-strong rounded-xl p-6">
          <h2 className="mb-5 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Old Password *</span>
              <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} required placeholder="Enter current password"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>New Password *</span>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required placeholder="Enter new strong password"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </label>
            
            {passwordError && (<div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>{passwordError}</div>)}
            {passwordSuccess && (<div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{passwordSuccess}</div>)}
            
            <button type="submit" disabled={passwordLoading}
              className="w-full rounded-full py-2.5 text-sm font-extrabold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 mt-4"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >{passwordLoading ? 'Changing...' : 'Change Password'}</button>
          </form>
        </section>
      </div>

    </AppLayout>
  )
}

export default ProfilePage
