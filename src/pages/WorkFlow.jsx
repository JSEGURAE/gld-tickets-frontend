import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Trash2, ExternalLink, Play, CheckCircle2, Circle,
  AlertCircle, Clock, Filter, Loader2, RotateCcw, Pencil, Check, X,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { getWorkflow, createTask, updateTask, deleteTask, updateTicketStatus } from '../api/workflow'
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_STYLES, PRIORITY_STYLES, timeAgo } from '../utils/helpers'

const PRIORITY_DOT = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-cyan-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-rose-500',
}

const TICKET_FILTERS = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Nuevo', value: 'NEW' },
  { label: 'En Progreso', value: 'IN_PROGRESS' },
  { label: 'En Pruebas', value: 'IN_TESTING' },
  { label: 'Crítico', value: 'CRITICAL' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function WorkFlow() {
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ticketFilter, setTicketFilter] = useState('ALL')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM')
  const [addingTask, setAddingTask] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const newTaskRef = useRef(null)

  const load = async () => {
    try {
      setError(null)
      const res = await getWorkflow()
      setTickets(res.data.tickets)
      setTasks(res.data.tasks)
    } catch (e) {
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const handleAddTask = async (e) => {
    e?.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return
    setAddingTask(true)
    try {
      const res = await createTask({ title, priority: newTaskPriority })
      setTasks(prev => [res.data, ...prev])
      setNewTaskTitle('')
      setNewTaskPriority('MEDIUM')
    } catch {
      // silent — could add toast
    } finally {
      setAddingTask(false)
    }
  }

  const handleTaskStatus = async (task, newStatus) => {
    const optimistic = tasks.map(t => t.id === task.id ? { ...t, status: newStatus, completedAt: newStatus === 'DONE' ? new Date().toISOString() : null } : t)
    setTasks(optimistic)
    try {
      await updateTask(task.id, { status: newStatus })
    } catch {
      setTasks(tasks) // rollback
    }
  }

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await deleteTask(id)
    } catch {
      load() // reload on failure
    }
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setEditingTitle(task.title)
  }

  const saveEdit = async (task) => {
    const title = editingTitle.trim()
    if (!title || title === task.title) { setEditingId(null); return }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, title } : t))
    setEditingId(null)
    try {
      await updateTask(task.id, { title })
    } catch {
      load()
    }
  }

  const handleKeyEdit = (e, task) => {
    if (e.key === 'Enter') saveEdit(task)
    if (e.key === 'Escape') setEditingId(null)
  }

  // ── Ticket status ──────────────────────────────────────────────────────────
  const handleTicketStatus = async (ticket, status) => {
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status } : t))
    try {
      await updateTicketStatus(ticket.id, status)
      if (status === 'COMPLETED') {
        setTimeout(() => setTickets(prev => prev.filter(t => t.id !== ticket.id)), 600)
      }
    } catch {
      load()
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'ALL') return true
    if (ticketFilter === 'CRITICAL') return t.priority === 'CRITICAL'
    return t.status === ticketFilter
  })

  const pendingTasks = tasks.filter(t => t.status === 'PENDING')
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS')
  const doneTasks = tasks.filter(t => t.status === 'DONE')

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando WorkFlow...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p style={{ color: 'var(--text-primary)' }} className="font-medium">{error}</p>
        <button onClick={load} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100" style={{ color: 'var(--text-secondary)' }}>
          <RotateCcw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm mb-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
            {greeting()}, <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{user?.name?.split(' ')[0]}</span> · {today}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Mi WorkFlow
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium dark:bg-sky-500/15 bg-sky-50 dark:text-sky-300 text-sky-700 dark:border-sky-500/25 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse inline-block" />
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} activo{tickets.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium dark:bg-amber-500/15 bg-amber-50 dark:text-amber-300 text-amber-700 dark:border-amber-500/25 border border-amber-200">
            <Clock className="w-3 h-3" />
            {pendingTasks.length + inProgressTasks.length} tarea{(pendingTasks.length + inProgressTasks.length) !== 1 ? 's' : ''} pendiente{(pendingTasks.length + inProgressTasks.length) !== 1 ? 's' : ''}
          </div>
          <button onClick={load} className="p-2 rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100" title="Actualizar" style={{ color: 'var(--text-muted)' }}>
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6 items-start">

        {/* ═══════════════════════════════════════
            LEFT PANEL: Tickets asignados
        ═══════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--card-shadow)' }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-sky-500" />
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Tickets Asignados</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold dark:bg-sky-500/20 bg-sky-100 dark:text-sky-300 text-sky-700">{filteredTickets.length}</span>
            </div>
            <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-4 py-3 overflow-x-auto" style={{ borderBottom: '1px solid var(--border-default)' }}>
            {TICKET_FILTERS.map(f => (
              <button key={f.value} onClick={() => setTicketFilter(f.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  ticketFilter === f.value
                    ? 'dark:bg-violet-500/25 bg-violet-100 dark:text-violet-200 text-violet-700 dark:border-violet-500/30 border border-violet-300'
                    : 'dark:text-slate-400 text-slate-500 dark:hover:bg-white/8 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {f.label}
                {f.value !== 'ALL' && (
                  <span className="ml-1.5 opacity-60">
                    {f.value === 'CRITICAL'
                      ? tickets.filter(t => t.priority === 'CRITICAL').length
                      : tickets.filter(t => t.status === f.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Ticket list */}
          <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--border-default)' }}>
            {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <CheckCircle2 className="w-10 h-10 dark:text-slate-700 text-slate-300" />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  {ticketFilter === 'ALL' ? 'Sin tickets asignados. ¡Buen trabajo!' : 'Sin tickets en este filtro'}
                </p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div key={ticket.id} className="px-5 py-4 transition-colors dark:hover:bg-white/3 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>#{ticket.id}</span>
                        {ticket.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full dark:bg-white/8 bg-slate-100 dark:text-slate-400 text-slate-500">
                            {ticket.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-snug truncate" style={{ color: 'var(--text-primary)' }}>{ticket.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {ticket.requestor.name} · {timeAgo(ticket.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_STYLES[ticket.priority]}`}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={ticket.status === 'IN_PROGRESS'}
                      onClick={() => handleTicketStatus(ticket, 'IN_PROGRESS')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border ${
                        ticket.status === 'IN_PROGRESS'
                          ? 'dark:bg-sky-500/25 bg-sky-100 dark:text-sky-300 text-sky-600 dark:border-sky-500/30 border-sky-200 opacity-60 cursor-default'
                          : 'dark:text-slate-400 text-slate-500 dark:hover:bg-sky-500/20 hover:bg-sky-50 dark:hover:text-sky-300 hover:text-sky-600 dark:border-slate-700/50 border-slate-200 hover:border-sky-300 dark:hover:border-sky-500/30'
                      }`}
                    >
                      <Play className="w-3 h-3" /> En Progreso
                    </button>
                    <button
                      disabled={ticket.status === 'IN_TESTING'}
                      onClick={() => handleTicketStatus(ticket, 'IN_TESTING')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border ${
                        ticket.status === 'IN_TESTING'
                          ? 'dark:bg-violet-500/25 bg-violet-100 dark:text-violet-300 text-violet-600 dark:border-violet-500/30 border-violet-200 opacity-60 cursor-default'
                          : 'dark:text-slate-400 text-slate-500 dark:hover:bg-violet-500/20 hover:bg-violet-50 dark:hover:text-violet-300 hover:text-violet-600 dark:border-slate-700/50 border-slate-200 hover:border-violet-300 dark:hover:border-violet-500/30'
                      }`}
                    >
                      <Clock className="w-3 h-3" /> En Pruebas
                    </button>
                    <button
                      onClick={() => handleTicketStatus(ticket, 'COMPLETED')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border dark:text-slate-400 text-slate-500 dark:hover:bg-emerald-500/20 hover:bg-emerald-50 dark:hover:text-emerald-300 hover:text-emerald-600 dark:border-slate-700/50 border-slate-200 hover:border-emerald-300 dark:hover:border-emerald-500/30"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Completar
                    </button>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="ml-auto flex items-center gap-1 text-xs transition-colors dark:text-slate-500 text-slate-400 dark:hover:text-violet-400 hover:text-violet-600"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT PANEL: Mis Tareas
        ═══════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--card-shadow)' }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Mis Tareas</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold dark:bg-violet-500/20 bg-violet-100 dark:text-violet-300 text-violet-700">
                {pendingTasks.length + inProgressTasks.length}
              </span>
            </div>
          </div>

          {/* Add task form */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <form onSubmit={handleAddTask} className="flex items-center gap-2">
              <input
                ref={newTaskRef}
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Nueva tarea... (Enter para agregar)"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-strong)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim() || addingTask}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150 dark:bg-violet-600 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {addingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </form>
            {/* Priority selector */}
            <div className="flex items-center gap-1.5 mt-2.5 px-1">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Prioridad:</span>
              {[['LOW','bg-slate-400'],['MEDIUM','bg-cyan-400'],['HIGH','bg-orange-400'],['CRITICAL','bg-rose-500']].map(([p, color]) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewTaskPriority(p)}
                  title={PRIORITY_LABELS[p]}
                  className={`w-4 h-4 rounded-full transition-all ${color} ${newTaskPriority === p ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800 ring-offset-white ring-current scale-125' : 'opacity-50 hover:opacity-80'}`}
                  style={{ color: color.replace('bg-', '').includes('slate') ? '#94a3b8' : color.replace('bg-', '').includes('cyan') ? '#22d3ee' : color.replace('bg-', '').includes('orange') ? '#fb923c' : '#f43f5e' }}
                />
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="max-h-[600px] overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Circle className="w-10 h-10 dark:text-slate-700 text-slate-300" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin tareas. ¡Agrega una arriba!</p>
              </div>
            ) : (
              <>
                {/* In Progress tasks */}
                {inProgressTasks.length > 0 && (
                  <div>
                    <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>En Progreso</span>
                    </div>
                    {inProgressTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        editingId={editingId}
                        editingTitle={editingTitle}
                        setEditingTitle={setEditingTitle}
                        startEdit={startEdit}
                        saveEdit={saveEdit}
                        handleKeyEdit={handleKeyEdit}
                        setEditingId={setEditingId}
                        handleTaskStatus={handleTaskStatus}
                        handleDeleteTask={handleDeleteTask}
                      />
                    ))}
                  </div>
                )}

                {/* Pending tasks */}
                {pendingTasks.length > 0 && (
                  <div>
                    <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-default)', borderTop: inProgressTasks.length > 0 ? '1px solid var(--border-default)' : 'none' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pendientes</span>
                    </div>
                    {pendingTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        editingId={editingId}
                        editingTitle={editingTitle}
                        setEditingTitle={setEditingTitle}
                        startEdit={startEdit}
                        saveEdit={saveEdit}
                        handleKeyEdit={handleKeyEdit}
                        setEditingId={setEditingId}
                        handleTaskStatus={handleTaskStatus}
                        handleDeleteTask={handleDeleteTask}
                      />
                    ))}
                  </div>
                )}

                {/* Done tasks */}
                {doneTasks.length > 0 && (
                  <div>
                    <div className="px-4 py-2 flex items-center gap-2" style={{ borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Completadas</span>
                    </div>
                    {doneTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        editingId={editingId}
                        editingTitle={editingTitle}
                        setEditingTitle={setEditingTitle}
                        startEdit={startEdit}
                        saveEdit={saveEdit}
                        handleKeyEdit={handleKeyEdit}
                        setEditingId={setEditingId}
                        handleTaskStatus={handleTaskStatus}
                        handleDeleteTask={handleDeleteTask}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskItem({ task, editingId, editingTitle, setEditingTitle, startEdit, saveEdit, handleKeyEdit, setEditingId, handleTaskStatus, handleDeleteTask }) {
  const isDone = task.status === 'DONE'
  const isInProgress = task.status === 'IN_PROGRESS'

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors dark:hover:bg-white/3 hover:bg-slate-50" style={{ borderBottom: '1px solid var(--border-default)' }}>
      {/* Checkbox */}
      <button
        onClick={() => handleTaskStatus(task, isDone ? 'PENDING' : 'DONE')}
        className="flex-shrink-0 transition-all"
      >
        {isDone
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          : <Circle className={`w-5 h-5 transition-colors ${isInProgress ? 'text-sky-400' : 'dark:text-slate-600 text-slate-300 dark:group-hover:text-slate-400 group-hover:text-slate-400'}`} />
        }
      </button>

      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} title={PRIORITY_LABELS[task.priority]} />

      {/* Title */}
      <div className="flex-1 min-w-0">
        {editingId === task.id ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              onKeyDown={e => handleKeyEdit(e, task)}
              className="flex-1 text-sm px-2 py-1 rounded-lg outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            />
            <button onClick={() => saveEdit(task)} className="text-emerald-500 hover:text-emerald-400 flex-shrink-0"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditingId(null)} className="dark:text-slate-500 text-slate-400 hover:text-slate-600 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <span
            onClick={() => !isDone && startEdit(task)}
            className={`text-sm block truncate ${isDone ? 'line-through' : 'cursor-text'}`}
            style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Actions (visible on hover) */}
      {!isDone && editingId !== task.id && (
        <button
          onClick={() => handleTaskStatus(task, isInProgress ? 'PENDING' : 'IN_PROGRESS')}
          title={isInProgress ? 'Pausar' : 'Iniciar'}
          className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg ${
            isInProgress
              ? 'dark:text-sky-400 text-sky-500 dark:hover:bg-sky-500/20 hover:bg-sky-50'
              : 'dark:text-slate-500 text-slate-400 dark:hover:bg-sky-500/20 hover:bg-sky-50 dark:hover:text-sky-400 hover:text-sky-500'
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${isInProgress ? 'rotate-180' : ''}`} />
        </button>
      )}
      <button
        onClick={() => handleDeleteTask(task.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg dark:text-slate-600 text-slate-300 dark:hover:text-rose-400 hover:text-rose-500 dark:hover:bg-rose-500/15 hover:bg-rose-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}