import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PlusCircle, Search, Loader2, Ticket, ChevronLeft, ChevronRight, X, ChevronDown, Check,
} from 'lucide-react'
import { getTickets } from '../api/tickets'
import { getTechnicians } from '../api/users'
import { StatusBadge, PriorityBadge } from '../components/TicketBadge'
import { timeAgo, STATUS_LABELS, PRIORITY_LABELS, STATUSES, PRIORITIES } from '../utils/helpers'
import useAuthStore from '../store/authStore'

/* ── MultiSelect dropdown with checkboxes ──────────────────────────────────── */
function MultiSelect({ options, selected, onChange, placeholder, renderOption }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allSelected = selected.length === options.length
  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  const toggleAll = () => onChange(allSelected ? [] : options.map(o => o.value))

  const label =
    selected.length === 0 ? placeholder :
    selected.length === options.length ? 'Todos' :
    selected.length === 1 ? (options.find(o => o.value === selected[0])?.label ?? placeholder) :
    `${selected.length} seleccionados`

  const hasActive = selected.length > 0

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border transition-all duration-150 w-full
          ${hasActive
            ? 'dark:border-violet-500/60 border-violet-400 dark:text-violet-300 text-violet-700 dark:bg-violet-500/10 bg-violet-50'
            : 'dark:border-white/10 border-slate-200 dark:text-slate-300 text-slate-600 dark:bg-transparent bg-white dark:hover:border-white/20 hover:border-slate-300'
          }`}
        style={{ minWidth: '10rem' }}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-52 rounded-xl border dark:border-white/10 border-slate-200 dark:bg-[#1a2035] bg-white shadow-xl animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b dark:border-white/8 border-slate-100">
            <button type="button" onClick={toggleAll}
              className="text-xs font-medium dark:text-violet-400 text-violet-600 hover:underline">
              {allSelected ? 'Limpiar todo' : 'Seleccionar todo'}
            </button>
            {hasActive && !allSelected && (
              <button type="button" onClick={() => onChange([])}
                className="text-xs dark:text-slate-500 text-slate-400 hover:underline">
                Limpiar
              </button>
            )}
          </div>
          {/* Options */}
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map(opt => {
              const isChecked = selected.includes(opt.value)
              return (
                <label key={opt.value}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer dark:hover:bg-white/5 hover:bg-slate-50 transition-colors">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                    ${isChecked
                      ? 'bg-violet-500 border-violet-500'
                      : 'dark:border-white/20 border-slate-300 dark:bg-transparent bg-white'}`}>
                    {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <input type="checkbox" checked={isChecked} onChange={() => toggle(opt.value)} className="hidden" />
                  {renderOption ? renderOption(opt) : (
                    <span className="text-sm dark:text-slate-300 text-slate-700">{opt.label}</span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tickets page ──────────────────────────────────────────────────────────── */
const parseMulti = (param) => param ? param.split(',').filter(Boolean) : []

export default function Tickets() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [technicians, setTechnicians] = useState([])
  const [data, setData] = useState({ tickets: [], pagination: { total: 0, page: 1, totalPages: 1 } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTechnicians().then(setTechnicians).catch(() => {})
  }, [])

  const filters = {
    status:     parseMulti(searchParams.get('status')),
    priority:   parseMulti(searchParams.get('priority')),
    assigneeId: parseMulti(searchParams.get('assigneeId')),
    search:     searchParams.get('search') || '',
    page:       parseInt(searchParams.get('page') || '1'),
  }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page, limit: 15, sortBy: 'updatedAt', sortOrder: 'desc' }
      if (filters.status.length)     params.status     = filters.status.join(',')
      if (filters.priority.length)   params.priority   = filters.priority.join(',')
      if (filters.assigneeId.length) params.assigneeId = filters.assigneeId.join(',')
      if (filters.search)            params.search     = filters.search
      const result = await getTickets(params)
      setData(result)
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const setFilter = (key, values) => {
    const params = new URLSearchParams(searchParams)
    if (Array.isArray(values)) {
      if (values.length > 0) params.set(key, values.join(','))
      else params.delete(key)
    } else {
      if (values) params.set(key, values)
      else params.delete(key)
    }
    params.delete('page')
    setSearchParams(params)
  }

  const setPage = (p) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', p)
    setSearchParams(params)
  }

  const clearFilters = () => setSearchParams({})
  const hasFilters = filters.status.length || filters.priority.length || filters.search || filters.assigneeId.length

  const statusOptions  = STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))
  const priorityOptions = PRIORITIES.map(p => ({ value: p, label: PRIORITY_LABELS[p] }))
  const assigneeOptions = technicians.map(t => ({ value: String(t.id), label: t.name }))

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-slate-100 text-slate-900">Tickets</h1>
          <p className="dark:text-slate-400 text-slate-500 text-sm mt-0.5">
            {data.pagination.total} tickets en total
          </p>
        </div>
        <button onClick={() => navigate('/tickets/new')} className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Nuevo Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título o #número..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="input pl-9"
            />
          </div>

          {/* Status multi-select */}
          <MultiSelect
            options={statusOptions}
            selected={filters.status}
            onChange={vals => setFilter('status', vals)}
            placeholder="Todos los estados"
            renderOption={opt => <StatusBadge status={opt.value} showDot />}
          />

          {/* Priority multi-select */}
          <MultiSelect
            options={priorityOptions}
            selected={filters.priority}
            onChange={vals => setFilter('priority', vals)}
            placeholder="Todas las prioridades"
            renderOption={opt => <PriorityBadge priority={opt.value} />}
          />

          {/* Assignee multi-select */}
          {technicians.length > 0 && (
            <MultiSelect
              options={assigneeOptions}
              selected={filters.assigneeId}
              onChange={vals => setFilter('assigneeId', vals)}
              placeholder="Todos los asignados"
            />
          )}

          {/* Clear */}
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-gray-500 flex items-center gap-1.5">
              <X className="w-4 h-4" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : data.tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">No se encontraron tickets</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm text-indigo-600 hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-white/8 border-slate-200">
                  <th className="table-th w-12">#</th>
                  <th className="table-th">Título</th>
                  <th className="table-th w-36">Estado</th>
                  <th className="table-th w-32">Prioridad</th>
                  {user?.role !== 'USER' && <th className="table-th w-36">Solicitante</th>}
                  <th className="table-th w-36">Asignado a</th>
                  <th className="table-th w-28">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {data.tickets.map(ticket => (
                  <tr
                    key={ticket.id}
                    className="table-row"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <td className="table-td font-mono text-gray-400 text-xs">#{ticket.id}</td>
                    <td className="table-td">
                      <p className="font-medium dark:text-slate-100 text-slate-800 truncate max-w-xs">{ticket.title}</p>
                      {ticket._count?.comments > 0 && (
                        <p className="text-xs text-gray-400">{ticket._count.comments} comentario{ticket._count.comments !== 1 ? 's' : ''}</p>
                      )}
                    </td>
                    <td className="table-td"><StatusBadge status={ticket.status} showDot /></td>
                    <td className="table-td"><PriorityBadge priority={ticket.priority} /></td>
                    {user?.role !== 'USER' && (
                      <td className="table-td text-slate-400">{ticket.requestor?.name || '—'}</td>
                    )}
                    <td className="table-td">
                      {ticket.assignee
                        ? <span className="dark:text-slate-300 text-slate-700">{ticket.assignee.name}</span>
                        : <span className="text-slate-500">Sin asignar</span>
                      }
                    </td>
                    <td className="table-td text-gray-400 whitespace-nowrap text-xs">
                      {timeAgo(ticket.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-white/8 border-slate-200">
            <p className="text-sm text-slate-400">
              Mostrando {((filters.page - 1) * 15) + 1}–{Math.min(filters.page * 15, data.pagination.total)} de {data.pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(filters.page - 1)}
                disabled={filters.page <= 1}
                className="btn-secondary py-1.5 px-3 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-sm dark:text-slate-300 text-slate-600 font-medium">
                {filters.page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(filters.page + 1)}
                disabled={filters.page >= data.pagination.totalPages}
                className="btn-secondary py-1.5 px-3 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
