import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { resetPassword } from '../api/auth'

const glassStyle = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.13)',
}

const inputStyle = {
  background: 'rgba(255,255,255,0.09)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'white',
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ newPassword: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('El enlace de recuperación no es válido.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setError('')
    setLoading(true)
    try {
      await resetPassword(token, form.newPassword)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#000810] overflow-hidden relative flex items-center justify-center p-4">

      {/* Animated water blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="water-blob water-blob-1" />
        <div className="water-blob water-blob-2" />
        <div className="water-blob water-blob-3" />
        <div className="water-blob water-blob-4" />
        <div className="absolute inset-0 water-surface" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl p-8 shadow-2xl" style={glassStyle}>

          {done ? (
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Contraseña actualizada</h2>
              <p className="text-white/50 text-sm mb-4">
                Tu contraseña fue cambiada con éxito. Serás redirigido al inicio de sesión.
              </p>
              <Link to="/login" className="text-white/60 text-sm hover:text-white/80 transition-colors">
                Ir al inicio de sesión →
              </Link>
            </div>

          ) : !token ? (
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Enlace inválido</h2>
              <p className="text-white/50 text-sm mb-6">
                Este enlace de recuperación no es válido o ha expirado.
              </p>
              <Link to="/forgot-password"
                className="w-full py-2.5 px-4 bg-white text-gray-900 font-semibold text-sm rounded-xl hover:bg-white/90 transition-all flex items-center justify-center">
                Solicitar nuevo enlace
              </Link>
            </div>

          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Nueva contraseña</h2>
              <p className="text-white/50 text-sm mb-7">Elige una nueva contraseña para tu cuenta.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all pr-11"
                      style={inputStyle}
                      placeholder="Mínimo 6 caracteres"
                      value={form.newPassword}
                      onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">Confirmar contraseña</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={inputStyle}
                    placeholder="Repite la contraseña"
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white text-gray-900 font-semibold text-sm rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
