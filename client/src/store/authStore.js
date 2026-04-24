import { create } from 'zustand'
import axiosInstance from '../api/axiosInstance'

const storedUser = localStorage.getItem('rhythmictunes_user')
const storedToken = localStorage.getItem('rhythmictunes_token')

const parseStoredUser = () => {
  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('rhythmictunes_user')
    return null
  }
}

export const useAuthStore = create((set, get) => ({
  user: parseStoredUser(),
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  login: (userData, token) => {
    localStorage.setItem('rhythmictunes_token', token)
    localStorage.setItem('rhythmictunes_user', JSON.stringify(userData))

    set({
      user: userData,
      token,
      isAuthenticated: true,
    })
  },
  logout: () => {
    localStorage.removeItem('rhythmictunes_token')
    localStorage.removeItem('rhythmictunes_user')

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },
  // Refresh user data from server (picks up isAdmin changes, etc.)
  refreshUser: async () => {
    const { token } = get()
    if (!token) return

    try {
      const { data } = await axiosInstance.get('/api/auth/me')
      if (data?.user) {
        localStorage.setItem('rhythmictunes_user', JSON.stringify(data.user))
        set({ user: data.user })
      }
    } catch {
      // Token expired or invalid — log out
      get().logout()
    }
  },
}))

// Auto-refresh user data on app load if authenticated
if (storedToken) {
  useAuthStore.getState().refreshUser()
}
