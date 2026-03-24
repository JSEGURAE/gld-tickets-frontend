import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronDown, Menu } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { getInitials, getAvatarColor } from '../utils/helpers'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className="h-16 flex items-center px-4 gap-4 sticky top-0 z-30"
      style={{
        background: 'var(--navbar-bg)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg transition-colors btn-ghost"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors"
          style={{ backgroundColor: dropdownOpen ? 'var(--interactive-hover)' : 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--interactive-hover)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = dropdownOpen ? 'var(--interactive-hover)' : 'transparent'}
        >
          <div className="relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(user?.name)}`}>
              {getInitials(user?.name)}
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2"
              style={{ borderColor: 'var(--navbar-bg)' }}
            />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          <ChevronDown
            className={`w-4 h-4 hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl z-20 py-1 animate-fade-in overflow-hidden"
              style={{
                background: 'var(--modal-bg)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border-default)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/15 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
