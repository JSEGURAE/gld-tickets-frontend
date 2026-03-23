import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PlusCircle, Search, Filter, Loader2, Ticket, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { getTickets } from '../api/tickets'
import { getTechnicians } from '../api/users'
import { StatusBadge, PriorityBadge } from '../components/TicketBadge'
import { timeAgo, STATUS_LABELS, PRIORITY_LABELS, STATUSES, PRIORITIES } from '../utils/helpers'
import useAuthStore from '../store/authStore'

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
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    search: searchParams.get('search') || '',
    assigneeId: searchParams.get('assigneeId') || '',
    page: parseInt(searchParams.get('page') || '1'),
  }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page, limit: 15, sortBy: 'updatedAt', sortOrder: 'desc' }
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      if (filters.search) params.search = filters.search
      if (filters.assigneeId) params.assigneeId = filters.assigneeId
      const result = await getTickets(params)
      setData(result)
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    setSearchParams(params)
  }

  const setPage = (p) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', p)
    setSearchParams(params)
  }

  const clearFilters = () => setSearchParams({})
  const hasFilters = filters.status || filters.priority || filters.search || filters.assigneeId

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tickets</h1>
          <p className="text-slate-400 text-sm mt-0.5">
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
        <div className="flex flex-wrap gap-3">
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

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
            className="select w-44"
          >
            <option value="">Todos los estados</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filters.priority}
            onChange={e => setFilter('priority', e.target.value)}
            className="select w-40"
          >
            <option value="">Todas las prioridades</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>

          {/* Assignee filter */}
          {technicians.length > 0 && (
            <select
              value={filters.assigneeId}
              onChange={e => setFilter('assigneeId', e.target.value)}
              className="select w-44"
            >
              <option value="">Todos los asignados</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-gray-500">
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
                <tr className="border-b border-white/8">
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
                      <p className="font-medium text-slate-100 truncate max-w-xs">{ticket.title}</p>
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
                      {ticket.assignee ? (
                        <span className="text-slate-300">{ticket.assignee.name}</span>
                      ) : (
                        <span className="text-slate-500">Sin asignar</span>
                      )}
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
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
              <span className="px-3 py-1.5 text-sm text-slate-300 font-medium">
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
