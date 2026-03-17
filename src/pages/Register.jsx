import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { register } from '../api/auth'
import useAuthStore from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await register(form.name.trim(), form.email.trim(), form.password)
      storeLogin(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#000810] overflow-hidden relative flex items-center justify-center p-4">

      {/* Animated water background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="water-blob water-blob-1" />
        <div className="water-blob water-blob-2" />
        <div className="water-blob water-blob-3" />
        <div className="water-blob water-blob-4" />
        <div className="water-blob water-blob-5" />
        <div className="absolute inset-0 water-surface" />
        <div className="water-ripple" style={{ width:'280px', height:'280px', top:'25%', left:'15%', animationDelay:'1s' }} />
        <div className="water-ripple" style={{ width:'220px', height:'220px', top:'60%', left:'65%', animationDelay:'3.5s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">

        {/* Logo / Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="logo-shimmer w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-900/60">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <p style={{ letterSpacing: '0.18em' }} className="text-white font-bold text-sm tracking-widest">
            GRUPO ÓPTICAS GLD S.A.
          </p>
        </div>

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
          <h2 className="text-xl font-semibold text-white mb-1">Crear cuenta</h2>
          <p className="text-white/50 text-sm mb-7">Regístrate para enviar tickets de soporte</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Nombre completo</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', '--tw-ring-color': 'rgba(167,139,250,0.4)' }}
                placeholder="Tu nombre completo"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', '--tw-ring-color': 'rgba(167,139,250,0.4)' }}
                placeholder="correo@empresa.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all pr-11"
                  style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', '--tw-ring-color': 'rgba(167,139,250,0.4)' }}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', '--tw-ring-color': 'rgba(167,139,250,0.4)' }}
                placeholder="Repite tu contraseña"
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

            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 font-semibold text-sm rounded-xl active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white' }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                : <><UserPlus className="w-4 h-4" /> Crear cuenta</>}
            </button>

            <div className="text-center pt-1">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>¿Ya tienes cuenta? </span>
              <Link to="/login" className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(167,139,250,0.8)' }}
                onMouseOver={e => e.target.style.color = 'rgba(192,132,252,1)'}
                onMouseOut={e => e.target.style.color = 'rgba(167,139,250,0.8)'}>
                Iniciar sesión
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
