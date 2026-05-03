import { create } from 'zustand'
import { authAPI } from '../api'

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('ef_user') || 'null'),
  token: localStorage.getItem('ef_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await authAPI.login({ email, password })
      localStorage.setItem('ef_token', data.access_token)
      localStorage.setItem('ef_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return data.user
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  register: async (payload) => {
    set({ loading: true })
    try {
      const { data } = await authAPI.register(payload)
      localStorage.setItem('ef_token', data.access_token)
      localStorage.setItem('ef_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return data.user
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('ef_token')
    localStorage.removeItem('ef_user')
    set({ user: null, token: null })
  },

  updateUser: (updated) => {
    const u = { ...get().user, ...updated }
    localStorage.setItem('ef_user', JSON.stringify(u))
    set({ user: u })
  },

  isAuth:       () => !!get().token,
  isAdmin:      () => get().user?.role === 'admin',
  isOrganizer:  () => ['organizer','admin'].includes(get().user?.role),
}))
