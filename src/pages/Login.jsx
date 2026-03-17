import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from '../api/auth'
import useAuthStore from '../store/authStore'

function GldLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 308 88" xmlns="http://www.w3.org/2000/svg" className="w-64 drop-shadow-lg">
        {/* Circle 1 – Eye */}
        <circle cx="38" cy="42" r="36" fill="white" />
        <ellipse cx="38" cy="42" rx="14" ry="9" fill="none" stroke="#111" strokeWidth="3.2" />
        <circle cx="38" cy="42" r="5.5" fill="#111" />
        <circle cx="40.5" cy="39.5" r="1.8" fill="white" />

        {/* Circle 2 – G */}
        <circle cx="116" cy="42" r="36" fill="white" />
        <text x="116" y="55" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif"
          fontSize="40" fontWeight="900" fill="#111">G</text>

        {/* Circle 3 – L */}
        <circle cx="194" cy="42" r="36" fill="white" />
        <text x="194" y="55" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif"
          fontSize="40" fontWeight="900" fill="#111">L</text>

        {/* Circle 4 – D */}
        <circle cx="272" cy="42" r="36" fill="white" />
        <text x="272" y="55" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif"
          fontSize="40" fontWeight="900" fill="#111">D</text>
      </svg>

      <p style={{ letterSpacing: '0.18em' }}
        className="text-white font-bold text-sm tracking-widest">
        GRUPO ÓPTICAS GLD S.A.
      </p>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.email.trim(), form.password)
      storeLogin(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
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
        <div className="water-blob water-blob-5" />
        <div className="absolute inset-0 water-surface" />
        {/* Ripple rings */}
        <div className="water-ripple" style={{ width:'300px', height:'300px', top:'30%', left:'20%', animationDelay:'0s' }} />
        <div className="water-ripple" style={{ width:'200px', height:'200px', top:'65%', left:'70%', animationDelay:'2.5s' }} />
        <div className="water-ripple" style={{ width:'250px', height:'250px', top:'15%', left:'60%', animationDelay:'4.8s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10">

        {/* Logo */}
        <GldLogo />

        {/* Glass card */}
        <div
          className="w-full rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.13)',
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-1">Iniciar sesión</h2>
          <p className="text-white/50 text-sm mb-7">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Usuario</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.09)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'white',
                  '--tw-ring-color': 'rgba(255,255,255,0.25)',
                }}
                placeholder="Tu usuario o correo"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all pr-11"
                  style={{
                    background: 'rgba(255,255,255,0.09)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: 'white',
                    '--tw-ring-color': 'rgba(255,255,255,0.25)',
                  }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
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

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white text-gray-900 font-semibold text-sm rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</>
                : 'Iniciar sesión'}
            </button>

            <div className="flex items-center justify-between pt-1">
              <Link
                to="/forgot-password"
                className="text-sm transition-colors"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                onMouseOver={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(167,139,250,0.75)' }}
                onMouseOver={e => e.target.style.color = 'rgba(192,132,252,1)'}
                onMouseOut={e => e.target.style.color = 'rgba(167,139,250,0.75)'}
              >
                Crear cuenta
              </Link>
            </div>

          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-slate-500">
          © 2026 GLD S.A. &nbsp;|&nbsp; Desarrollado por JS
        </p>
      </div>
    </div>
  )
}
