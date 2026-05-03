import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from  "../../store/authStore"

export function ProtectedRoute({ children, role }) {
  const { isAuth, user } = useAuthStore()
  const location = useLocation()

  if (!isAuth()) return <Navigate to={`/login?redirect=${location.pathname}`} replace />
  if (role && user?.role !== role && !(role === 'organizer' && user?.role === 'admin')) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export function GuestRoute({ children }) {
  const { isAuth, user } = useAuthStore()
  if (isAuth()) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />
    if (user?.role === 'organizer') return <Navigate to="/organizer" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}
