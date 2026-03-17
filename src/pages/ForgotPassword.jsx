import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { forgotPassword } from '../api/auth'

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

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud')
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

        {/* Back link */}
        <Link to="/login" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
        </Link>

        <div className="rounded-3xl p-8 shadow-2xl" style={glassStyle}>
          {sent ? (
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Solicitud enviada</h2>
              <p className="text-white/50 text-sm mb-6">
                Se ha enviado un enlace de recuperación a{' '}
                <span className="text-white/80 font-medium">jsegura@drmaxsalud.net</span>.
                El enlace expira en 1 hora.
              </p>
              <Link to="/login"
                className="w-full py-2.5 px-4 bg-white text-gray-900 font-semibold text-sm rounded-xl hover:bg-white/90 transition-all flex items-center justify-center">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Olvidé mi contraseña</h2>
              <p className="text-white/50 text-sm mb-7">
                Ingresa tu usuario y enviaremos un enlace de recuperación a{' '}
                <span className="text-white/70">jsegura@drmaxsalud.net</span>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">Usuario</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={inputStyle}
                    placeholder="Tu usuario o correo"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
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
                  disabled={loading || !email.trim()}
                  className="w-full py-2.5 px-4 bg-white text-gray-900 font-semibold text-sm rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
