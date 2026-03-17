import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from '../api/auth'
import useAuthStore from '../store/authStore'

const breatheStyle = `
  @keyframes breathe {
    0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 8px rgba(139,92,246,0.6)); }
    50%       { transform: scale(1.07); filter: drop-shadow(0 0 22px rgba(167,139,250,0.9)); }
  }
  @keyframes orbit {
    from { transform: rotate(0deg)   translateX(38px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(38px) rotate(-360deg); }
  }
  @keyframes orbit-rev {
    from { transform: rotate(0deg)   translateX(28px) rotate(0deg); }
    to   { transform: rotate(-360deg) translateX(28px) rotate(360deg); }
  }
  @keyframes ring-spin {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @keyframes ring-spin-rev {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(-360deg);}
  }
  @keyframes core-pulse {
    0%, 100% { opacity: 1;   transform: scale(1);    }
    50%       { opacity: 0.75; transform: scale(0.93); }
  }
  .tech-breathe  { animation: breathe 3s ease-in-out infinite; }
  .orbit-dot     { animation: orbit 4s linear infinite; }
  .orbit-dot-rev { animation: orbit-rev 3s linear infinite; }
  .ring-outer    { animation: ring-spin 8s linear infinite; }
  .ring-inner    { animation: ring-spin-rev 5s linear infinite; }
  .core-pulse    { animation: core-pulse 2.5s ease-in-out infinite; }
`

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
          <style>{breatheStyle}</style>

          {/* Animated tech icon */}
          <div className="flex justify-center mb-6">
            <div className="tech-breathe relative flex items-center justify-center" style={{ width: 96, height: 96 }}>

              {/* Rotating dashed outer ring */}
              <svg className="ring-outer absolute inset-0" width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(139,92,246,0.35)"
                  strokeWidth="1.5" strokeDasharray="6 5" strokeLinecap="round" />
              </svg>

              {/* Rotating inner ring */}
              <svg className="ring-inner absolute inset-0" width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="34" fill="none" stroke="rgba(99,102,241,0.4)"
                  strokeWidth="1" strokeDasharray="3 8" strokeLinecap="round" />
              </svg>

              {/* Orbiting dots */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="orbit-dot w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: '1.5s' }}>
                <div className="orbit-dot-rev w-1.5 h-1.5 rounded-full" style={{ background: '#818cf8', animationDelay: '0.8s' }} />
              </div>

              {/* Core */}
              <div className="core-pulse relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #7c3aed 100%)', boxShadow: '0 0 24px rgba(109,40,217,0.6)' }}>
                {/* Circuit SVG icon */}
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9"  y1="2"  x2="9"  y2="4"  />
                  <line x1="15" y1="2"  x2="15" y2="4"  />
                  <line x1="9"  y1="20" x2="9"  y2="22" />
                  <line x1="15" y1="20" x2="15" y2="22" />
                  <line x1="2"  y1="9"  x2="4"  y2="9"  />
                  <line x1="2"  y1="15" x2="4"  y2="15" />
                  <line x1="20" y1="9"  x2="22" y2="9"  />
                  <line x1="20" y1="15" x2="22" y2="15" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-1 text-center">Iniciar sesión</h2>
          <p className="text-white/50 text-sm mb-7 text-center">Ingresa tus credenciales para continuar</p>

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
          © 2026 GLD S.A. &nbsp;|&nbsp; BI & DATA
        </p>
      </div>
    </div>
  )
}
