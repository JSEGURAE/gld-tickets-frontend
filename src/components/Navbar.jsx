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
    <header className="h-16 flex items-center px-4 gap-4 sticky top-0 z-30"
      style={{
        background: 'rgba(8,12,20,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>

      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/8 transition-colors"
        >
          <div className="relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(user?.name)}`}>
              {getInitials(user?.name)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#080c14]" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-200 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-52 rounded-xl z-20 py-1 animate-fade-in overflow-hidden"
              style={{
                background: 'rgba(17,24,39,0.97)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              }}>
              <div className="px-4 py-3 border-b border-white/8">
                <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
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
