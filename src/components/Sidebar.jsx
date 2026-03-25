import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, PlusCircle, List, Users,
  ChevronDown, Zap, Tag, Bell, MapPin, Kanban,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { getInitials, getAvatarColor, ROLE_LABELS } from '../utils/helpers'
import ThemeToggle from './ThemeToggle'

const PARTICLES = [
  { left: '8%',  delay: '0s',    duration: '5.5s',  size: '3px',  opacity: '0.8' },
  { left: '18%', delay: '1.8s',  duration: '7.5s',  size: '2px',  opacity: '0.5' },
  { left: '32%', delay: '3.5s',  duration: '6s',    size: '4px',  opacity: '0.7' },
  { left: '47%', delay: '0.8s',  duration: '8s',    size: '2px',  opacity: '0.6' },
  { left: '58%', delay: '4.2s',  duration: '5s',    size: '3px',  opacity: '0.9' },
  { left: '68%', delay: '2.1s',  duration: '7s',    size: '2px',  opacity: '0.4' },
  { left: '79%', delay: '5.3s',  duration: '6.5s',  size: '4px',  opacity: '0.7' },
  { left: '90%', delay: '1.0s',  duration: '8.5s',  size: '2px',  opacity: '0.5' },
]

export default function Sidebar({ onClose }) {
  const { user } = useAuthStore()
  const location = useLocation()

  const isTicketsSection = location.pathname.startsWith('/tickets')
  const [ticketsOpen, setTicketsOpen] = useState(isTicketsSection)

  useEffect(() => {
    if (isTicketsSection) setTicketsOpen(true)
  }, [isTicketsSection])

  /* Nav link classes — dark: variants handle dark-mode specifics */
  const mainLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
      isActive
        ? 'dark:bg-violet-500/20 bg-blue-50 dark:text-white text-blue-600 dark:nav-active-glow border-l-[3px] dark:border-violet-500 border-blue-600 pl-[calc(0.75rem-3px)]'
        : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-100'
    }`

  const subLinkClass = ({ isActive }) =>
    `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
      isActive
        ? 'dark:bg-violet-500/35 bg-blue-50 dark:text-violet-200 text-blue-600 font-semibold'
        : 'dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-100'
    }`

  return (
    <aside className="sidebar-bg flex flex-col w-64 h-full relative overflow-hidden">

      {/* Floating particles — dark mode only (hidden via CSS in light) */}
      {PARTICLES.map((p, i) => (
        <span key={i} className="sidebar-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }} />
      ))}

      {/* Ambient glow orbs */}
      <div className="sidebar-ambient absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full"
          style={{
            width: '240px', height: '240px',
            top: '-30%', left: '-30%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(109,40,217,0.2) 40%, transparent 70%)',
            filter: 'blur(50px)',
            animation: 'waterFloat1 14s ease-in-out infinite',
          }} />
        <div className="absolute rounded-full"
          style={{
            width: '180px', height: '180px',
            bottom: '5%', right: '-25%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, rgba(124,58,237,0.15) 50%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'waterFloat3 20s ease-in-out infinite 4s',
          }} />
        <div className="absolute rounded-full"
          style={{
            width: '120px', height: '120px',
            top: '40%', left: '50%',
            background: 'radial-gradient(circle, rgba(192,132,252,0.2) 0%, transparent 70%)',
            filter: 'blur(30px)',
            animation: 'waterFloat2 17s ease-in-out infinite 8s',
          }} />
      </div>

      {/* Logo */}
      <div
        className="relative flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="logo-shimmer w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/60">
          <span className="text-white font-black text-xs tracking-tight drop-shadow">GLD</span>
        </div>
        <div className="min-w-0">
          <h1 className="dark:text-white text-violet-950 font-bold text-sm leading-tight truncate">
            GLD Service Portal
          </h1>
          <p className="dark:text-violet-300 text-violet-600 text-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Portal de soporte técnico
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        <div className="flex items-center gap-2 px-3 pb-3">
          <span className="text-xs font-semibold dark:text-slate-600 text-slate-400 uppercase tracking-widest">Menú</span>
          <div className="flex-1 h-px bg-gradient-to-r from-violet-600/70 to-transparent" />
        </div>

        <NavLink to="/" end className={mainLinkClass} onClick={onClose}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0 transition-all duration-200 group-hover:scale-125 group-hover:rotate-6 group-hover:text-violet-400" />
          Dashboard
        </NavLink>

        {(user?.role === 'TECHNICIAN' || user?.role === 'ADMIN') && (
          <NavLink to="/workflow" className={mainLinkClass} onClick={onClose}>
            <Kanban className="w-4 h-4 flex-shrink-0 transition-all duration-200 group-hover:scale-125 group-hover:rotate-6 group-hover:text-violet-400" />
            WorkFlow
          </NavLink>
        )}

        {/* Tickets accordion */}
        <div>
          <button
            onClick={() => setTicketsOpen(o => !o)}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
              isTicketsSection
                ? 'dark:bg-violet-500/20 bg-blue-50 dark:text-white text-blue-600 dark:nav-active-glow border-l-[3px] dark:border-violet-400 border-blue-600 pl-[calc(0.75rem-3px)]'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-100'
            }`}
          >
            <Ticket className="w-4 h-4 flex-shrink-0 transition-all duration-200 group-hover:scale-125 group-hover:-rotate-12 group-hover:text-violet-400" />
            <span className="flex-1 text-left">Tickets</span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${ticketsOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: ticketsOpen ? '130px' : '0px', opacity: ticketsOpen ? 1 : 0 }}>
            <div className="ml-5 mt-1.5 mb-1 pl-3 space-y-0.5"
              style={{ borderLeft: '1px solid rgba(139,92,246,0.4)' }}>

              <div className="relative">
                <div className="absolute -left-[15px] top-3 w-2 h-2 rounded-full bg-violet-400"
                  style={{ boxShadow: '0 0 10px 2px rgba(139,92,246,0.9)' }} />
                <NavLink to="/tickets" end className={subLinkClass} onClick={onClose}>
                  <List className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-150 group-hover:scale-125 group-hover:text-violet-400" />
                  Ver todos
                </NavLink>
              </div>

              <div className="relative">
                <div className="absolute -left-[15px] top-3 w-1.5 h-1.5 rounded-full bg-violet-700/60" />
                <NavLink to="/tickets/new" className={subLinkClass} onClick={onClose}>
                  <PlusCircle className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 group-hover:scale-125 group-hover:rotate-90 group-hover:text-violet-400" />
                  Nuevo Ticket
                </NavLink>
              </div>
            </div>
          </div>
        </div>

        {/* Admin section */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="flex items-center gap-2 px-3 pt-4 pb-2">
              <span className="text-xs font-semibold dark:text-slate-600 text-slate-400 uppercase tracking-widest">Admin</span>
              <div className="flex-1 h-px bg-gradient-to-r from-violet-600/70 to-transparent" />
            </div>
            <div className="ml-5 pl-3 space-y-0.5"
              style={{ borderLeft: '1px solid rgba(139,92,246,0.4)' }}>
              <div className="relative">
                <div className="absolute -left-[15px] top-3 w-2 h-2 rounded-full bg-violet-400"
                  style={{ boxShadow: '0 0 8px 2px rgba(139,92,246,0.8)' }} />
                <NavLink to="/admin" end className={subLinkClass} onClick={onClose}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-150 group-hover:scale-125 group-hover:text-violet-400" />
                  Usuarios
                </NavLink>
              </div>
              <div className="relative">
                <div className="absolute -left-[15px] top-3 w-1.5 h-1.5 rounded-full bg-violet-700/60" />
                <NavLink to="/admin/categories" className={subLinkClass} onClick={onClose}>
                  <Tag className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-150 group-hover:scale-125 group-hover:text-violet-400" />
                  Categorías
                </NavLink>
              </div>
              <div className="relative">
                <div className="absolute -left-[15px] top-3 w-1.5 h-1.5 rounded-full bg-violet-700/60" />
                <NavLink to="/admin/notifications" className={subLinkClass} onClick={onClose}>
                  <Bell className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-150 group-hover:scale-125 group-hover:text-violet-400" />
                  Notificaciones
                </NavLink>
              </div>
              <div className="relative">
                <div className="absolute -left-[15px] top-3 w-1.5 h-1.5 rounded-full bg-violet-700/60" />
                <NavLink to="/admin/sedes" className={subLinkClass} onClick={onClose}>
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-150 group-hover:scale-125 group-hover:text-violet-400" />
                  Sedes
                </NavLink>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* User card + Theme toggle */}
      <div className="relative p-3" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="dark:block hidden absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-violet-500/80 to-transparent" />

        {/* Theme toggle row */}
        <div className="flex items-center justify-between px-3 py-2 mb-1">
          <span className="text-xs dark:text-slate-500 text-slate-400">
            Tema
          </span>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors duration-150 cursor-default">
          <div className="relative flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-violet-600/80 ${getAvatarColor(user?.name)}`}
              style={{ boxShadow: '0 0 14px rgba(139,92,246,0.4)' }}
            >
              {getInitials(user?.name)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
              <div className="online-ping absolute inset-0 rounded-full bg-emerald-400" />
              <div
                className="relative w-3 h-3 rounded-full bg-emerald-500 border-2"
                style={{ borderColor: 'var(--bg-surface)' }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="dark:text-white text-slate-800 text-sm font-medium truncate">{user?.name}</p>
            <p className="dark:text-violet-300 text-slate-500 text-xs truncate">{ROLE_LABELS[user?.role]}</p>
          </div>

          <Zap className="w-3.5 h-3.5 dark:text-violet-300 text-violet-500 flex-shrink-0 animate-pulse" />
        </div>
      </div>
    </aside>
  )
}
