import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ticket, Clock, CheckCircle2, AlertTriangle, TrendingUp, PlusCircle, Loader2,
  ChevronRight, Inbox, FlaskConical, Eye,
} from 'lucide-react'
import { getStats, getTickets, getMonthlyStats } from '../api/tickets'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import { StatusBadge, PriorityBadge } from '../components/TicketBadge'
import { timeAgo } from '../utils/helpers'
import useAuthStore from '../store/authStore'

// ─── Status visual config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  NEW:         { label: 'Nuevo',       icon: Inbox,        color: 'text-slate-300',   bg: 'bg-slate-500/15',   border: 'border-slate-500/30',   bar: 'bg-slate-400'   },
  IN_REVIEW:   { label: 'En Revisión', icon: Clock,        color: 'text-amber-300',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   bar: 'bg-amber-400'   },
  IN_PROGRESS: { label: 'En Progreso', icon: TrendingUp,   color: 'text-sky-300',     bg: 'bg-sky-500/15',     border: 'border-sky-500/30',     bar: 'bg-sky-400'     },
  IN_TESTING:  { label: 'En Pruebas',  icon: FlaskConical, color: 'text-violet-300',  bg: 'bg-violet-500/15',  border: 'border-violet-500/30',  bar: 'bg-violet-400'  },
  COMPLETED:   { label: 'Completado',  icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', bar: 'bg-emerald-500' },
}

const PRIORITY_BORDER = {
  CRITICAL: 'border-l-red-500',
  HIGH:     'border-l-orange-400',
  MEDIUM:   'border-l-sky-400',
  LOW:      'border-l-slate-500',
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const DEFAULT_FROM = '2026-03-01'
const today       = () => new Date().toISOString().slice(0, 10)
const monthsAgo   = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10) }

const PRESETS = [
  { label: 'Últ. 6 meses',  from: () => monthsAgo(5)  },
  { label: 'Últ. 12 meses', from: () => monthsAgo(11) },
]

// ─── User Dashboard ───────────────────────────────────────────────────────────
function UserDashboard({ user }) {
  const navigate  = useNavigate()
  const [tickets,      setTickets]     = useState([])
  const [stats,        setStats]       = useState(null)
  const [monthly,      setMonthly]     = useState([])
  const [loading,      setLoading]     = useState(true)
  const [chartLoading, setChartLoading]= useState(false)
  const [filter,       setFilter]      = useState('open')
  const [dateFrom,     setDateFrom]    = useState(DEFAULT_FROM)
  const [dateTo,       setDateTo]      = useState(today())
  const [activePreset, setActivePreset]= useState(null)

  useEffect(() => {
    Promise.all([getStats(), getTickets(), getMonthlyStats(DEFAULT_FROM, today())])
      .then(([s, t, m]) => { setStats(s); setTickets(t.tickets || []); setMonthly(m) })
      .finally(() => setLoading(false))
  }, [])

  const applyRange = (from, to) => {
    setChartLoading(true)
    getMonthlyStats(from, to)
      .then(setMonthly)
      .finally(() => setChartLoading(false))
  }

  const handlePreset = (i) => {
    const p = PRESETS[i]
    const f = p.from(); const t = today()
    setDateFrom(f); setDateTo(t); setActivePreset(i)
    applyRange(f, t)
  }

  const handleApply = () => { setActivePreset(null); applyRange(dateFrom, dateTo) }

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const s        = stats?.byStatus || {}

  const displayed = filter === 'open'
    ? tickets.filter(t => t.status !== 'COMPLETED')
    : tickets

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            {new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => navigate('/tickets/new')} className="btn-primary">
          <PlusCircle className="w-4 h-4" /> Nuevo Ticket
        </button>
      </div>

      {/* Total + Monthly chart */}
      <div className="card p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total de solicitudes</p>
              <p className="text-2xl font-bold text-slate-100 leading-none mt-0.5">{stats?.total ?? 0}</p>
            </div>
          </div>

          {/* Filter panel */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Presets */}
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => handlePreset(i)}
                  className={`px-3 py-1.5 font-medium transition-colors ${activePreset === i ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-slate-200'}`}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Calendar range */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <input
                type="date" value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setActivePreset(null) }}
                className="bg-transparent text-xs text-slate-300 outline-none [color-scheme:dark] cursor-pointer"
              />
              <span className="text-slate-500 text-xs">→</span>
              <input
                type="date" value={dateTo}
                onChange={e => { setDateTo(e.target.value); setActivePreset(null) }}
                className="bg-transparent text-xs text-slate-300 outline-none [color-scheme:dark] cursor-pointer"
              />
              <button onClick={handleApply}
                className="ml-1 px-2 py-0.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-md font-medium transition-colors">
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {chartLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/60 rounded-lg z-10">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            </div>
          )}
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={monthly} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(139,92,246,0.1)' }}
                contentStyle={{ background: '#1e1b2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#c4b5fd' }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(v) => [v, 'Tickets']}
              />
              <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]}
                label={{ position: 'top', fill: '#a78bfa', fontSize: 11, fontWeight: 600,
                  formatter: (v) => v > 0 ? v : '' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ticket cards */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-100">Mis Solicitudes</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {displayed.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
              {[{ v: 'open', label: 'Activos' }, { v: 'all', label: 'Todos' }].map(opt => (
                <button key={opt.v} onClick={() => setFilter(opt.v)}
                  className={`px-3 py-1.5 font-medium transition-colors ${filter === opt.v ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-slate-200'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => navigate('/tickets')}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {displayed.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-violet-400 opacity-60" />
              </div>
              <p className="text-slate-400 font-medium">
                {filter === 'open' ? 'No tienes solicitudes activas' : 'No tienes solicitudes aún'}
              </p>
              <p className="text-slate-600 text-sm mt-1">
                {filter === 'open' ? '¡Todo al día! 🎉' : 'Crea tu primera solicitud de soporte'}
              </p>
              <button onClick={() => navigate('/tickets/new')} className="btn-primary mt-4 mx-auto">
                <PlusCircle className="w-4 h-4" /> Nueva solicitud
              </button>
            </div>
          ) : (
            displayed.map(ticket => {
              const cfg        = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.NEW
              const StatusIcon = cfg.icon
              return (
                <div key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className={`group flex items-start gap-4 p-4 rounded-xl border border-l-4 ${PRIORITY_BORDER[ticket.priority]} border-white/8 bg-white/3 hover:bg-violet-900/20 hover:border-violet-500/30 cursor-pointer transition-all duration-150`}>

                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}>
                    <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-200 text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {ticket.title}
                      </p>
                      <Eye className="w-4 h-4 text-slate-600 group-hover:text-violet-400 flex-shrink-0 mt-0.5 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      <span className="text-xs text-slate-500 ml-auto">{timeAgo(ticket.updatedAt)}</span>
                    </div>
                    {ticket.assignee && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        Asignado a <span className="text-slate-400">{ticket.assignee.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Status breakdown */}
      {tickets.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-100">Resumen por estado</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count      = s[key] || 0
                const pct        = stats?.total ? Math.round((count / stats.total) * 100) : 0
                const StatusIcon = cfg.icon
                return (
                  <div key={key} className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border} flex flex-col gap-2`}>
                    <div className="flex items-center justify-between">
                      <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-xl font-bold ${cfg.color}`}>{count}</span>
                    </div>
                    <p className="text-xs text-slate-400">{cfg.label}</p>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Admin / Tech / Supervisor Dashboard ──────────────────────────────────────
function GlobalDashboard({ user }) {
  const navigate  = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError('Error al cargar estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  )
  if (error) return (
    <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-6 text-red-300 flex items-center gap-2">
      <AlertTriangle className="w-5 h-5" />{error}
    </div>
  )

  const s = stats?.byStatus   || {}
  const p = stats?.byPriority || {}
  const openTickets = (s.NEW || 0) + (s.IN_REVIEW || 0) + (s.IN_PROGRESS || 0) + (s.IN_TESTING || 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            {new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => navigate('/tickets/new')} className="btn-primary">
          <PlusCircle className="w-4 h-4" /> Nuevo Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total de Tickets"  value={stats?.total}     icon={Ticket}       color="indigo"  onClick={() => navigate('/tickets')} />
        <StatCard title="Tickets Abiertos"  value={openTickets}      icon={Clock}        color="amber"   onClick={() => navigate('/tickets')} />
        <StatCard title="En Progreso"        value={s.IN_PROGRESS||0} icon={TrendingUp}   color="sky"     onClick={() => navigate('/tickets?status=IN_PROGRESS')} />
        <StatCard title="Completados"        value={s.COMPLETED||0}   icon={CheckCircle2} color="emerald" onClick={() => navigate('/tickets?status=COMPLETED')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-slate-100">Actividad Reciente</h2>
            <button onClick={() => navigate('/tickets')} className="text-sm text-violet-400 hover:text-violet-300 font-medium">
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            {stats?.recentTickets?.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">#</th>
                    <th className="table-th">Título</th>
                    <th className="table-th">Estado</th>
                    <th className="table-th">Prioridad</th>
                    <th className="table-th">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTickets.map(ticket => (
                    <tr key={ticket.id} className="table-row" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      <td className="table-td font-mono text-slate-400">#{ticket.id}</td>
                      <td className="table-td">
                        <p className="font-medium text-slate-100 truncate max-w-xs">{ticket.title}</p>
                        <p className="text-xs text-slate-500">{ticket.requestor?.name}</p>
                      </td>
                      <td className="table-td"><StatusBadge status={ticket.status} /></td>
                      <td className="table-td"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="table-td text-slate-400 whitespace-nowrap">{timeAgo(ticket.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No hay tickets aún</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="card-header"><h2 className="font-semibold text-slate-100">Por Estado</h2></div>
            <div className="card-body space-y-3">
              {[
                { key: 'NEW',         label: 'Nuevo',       color: 'bg-slate-400'  },
                { key: 'IN_REVIEW',   label: 'En Revisión', color: 'bg-amber-400'  },
                { key: 'IN_PROGRESS', label: 'En Progreso', color: 'bg-sky-500'    },
                { key: 'IN_TESTING',  label: 'En Pruebas',  color: 'bg-violet-500' },
                { key: 'COMPLETED',   label: 'Completado',  color: 'bg-emerald-500'},
              ].map(({ key, label, color }) => {
                const count = s[key] || 0
                const pct   = stats?.total ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-semibold text-slate-200">{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="font-semibold text-slate-100">Por Prioridad</h2></div>
            <div className="card-body space-y-2">
              {[
                { key: 'CRITICAL', label: 'Crítica', color: 'text-red-400 bg-red-500/15'       },
                { key: 'HIGH',     label: 'Alta',    color: 'text-orange-400 bg-orange-500/15' },
                { key: 'MEDIUM',   label: 'Media',   color: 'text-sky-400 bg-sky-500/15'       },
                { key: 'LOW',      label: 'Baja',    color: 'text-slate-400 bg-white/8'        },
              ].map(({ key, label, color }) => (
                <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-lg ${color}`}>
                  <span className="text-sm font-medium">{label}</span>
                  <span className="font-bold">{p[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore()
  if (user?.role === 'USER') return <UserDashboard user={user} />
  return <GlobalDashboard user={user} />
}
