import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import CreateTicket from './pages/CreateTicket'
import Admin from './pages/Admin'
import useThemeStore from './store/themeStore'

export default function App() {
  const { initTheme } = useThemeStore()
  useEffect(() => { initTheme() }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/new" element={<CreateTicket />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sedes"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
