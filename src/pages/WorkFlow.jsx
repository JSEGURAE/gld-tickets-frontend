import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Trash2, ExternalLink, CheckCircle2, AlertCircle,
  Loader2, RotateCcw, Pencil, X, LayoutGrid, List,
  Calendar, Tag, GripVertical, ChevronDown,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { getWorkflow, createTask, updateTask, deleteTask, updateTicketStatus } from '../api/workflow'
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_STYLES, PRIORITY_STYLES, timeAgo } from '../utils/helpers'

// ── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_DOT = {
  LOW: 'bg-slate-400', MEDIUM: 'bg-cyan-400', HIGH: 'bg-orange-400', CRITICAL: 'bg-rose-500',
}

// Kanban column definitions — each has ticket statuses and task status that map to it
const COLUMNS = [
  {
    id: 'todo',
    label: 'Pendiente',
    colorClass: 'bg-slate-400',
    textClass: 'dark:text-slate-300 text-slate-600',
    bgClass: 'dark:bg-slate-500/10 bg-slate-50',
    borderClass: 'border-slate-300/40',
    ticketStatuses: ['NEW', 'IN_REVIEW'],
    taskStatuses: ['PENDING'],
    onDropTicket: 'IN_REVIEW',
    onDropTask: 'PENDING',
  },
  {
    id: 'doing',
    label: 'En Progreso',
    colorClass: 'bg-sky-500',
    textClass: 'dark:text-sky-300 text-sky-700',
    bgClass: 'dark:bg-sky-500/10 bg-sky-50',
    borderClass: 'border-sky-400/40',
    ticketStatuses: ['IN_PROGRESS'],
    taskStatuses: ['IN_PROGRESS'],
    onDropTicket: 'IN_PROGRESS',
    onDropTask: 'IN_PROGRESS',
  },
  {
    id: 'testing',
    label: 'En Pruebas',
    colorClass: 'bg-violet-500',
    textClass: 'dark:text-violet-300 text-violet-700',
    bgClass: 'dark:bg-violet-500/10 bg-violet-50',
    borderClass: 'border-violet-400/40',
    ticketStatuses: ['IN_TESTING'],
    taskStatuses: [],            // tasks skip this — they stay IN_PROGRESS
    onDropTicket: 'IN_TESTING',
    onDropTask: 'IN_PROGRESS',   // drag task here → keep IN_PROGRESS
  },
  {
    id: 'done',
    label: 'Completado',
    colorClass: 'bg-emerald-500',
    textClass: 'dark:text-emerald-300 text-emerald-700',
    bgClass: 'dark:bg-emerald-500/10 bg-emerald-50',
    borderClass: 'border-emerald-400/40',
    ticketStatuses: ['COMPLETED'],
    taskStatuses: ['DONE'],
    onDropTicket: 'COMPLETED',
    onDropTask: 'DONE',
  },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

// ── Task Edit Modal ──────────────────────────────────────────────────────────

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'MEDIUM',
    status: task?.status || 'PENDING',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({ ...form, dueDate: form.dueDate || null })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl animate-fade-in"
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-default)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Título *</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="¿Qué hay que hacer?"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-strong)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detalles opcionales..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all resize-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-strong)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
            />
          </div>

          {/* Priority + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Prioridad</label>
              <div className="flex gap-2 items-center mt-1">
                {[['LOW','bg-slate-400','#94a3b8'],['MEDIUM','bg-cyan-400','#22d3ee'],['HIGH','bg-orange-400','#fb923c'],['CRITICAL','bg-rose-500','#f43f5e']].map(([p, bg, ring]) => (
                  <button
                    key={p}
                    type="button"
                    title={PRIORITY_LABELS[p]}
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`w-5 h-5 rounded-full transition-all ${bg} ${form.priority === p ? 'scale-125 ring-2 ring-offset-1 dark:ring-offset-[#1a1a2e] ring-offset-white' : 'opacity-40 hover:opacity-70'}`}
                    style={{ '--tw-ring-color': ring }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Estado</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none transition-all"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option value="PENDING">Pendiente</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="DONE">Completado</option>
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fecha límite</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!form.title.trim() || saving}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (task ? 'Guardar cambios' : 'Crear tarea')}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm transition-all dark:hover:bg-white/10 hover:bg-slate-100" style={{ color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirmation (inline) ─────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-rose-500/15 bg-rose-50 border border-rose-400/30">
      <span className="text-xs text-rose-500 font-medium flex-1">¿Eliminar esta tarea?</span>
      <button onClick={onConfirm} className="text-xs font-semibold text-rose-500 hover:text-rose-400 transition-colors px-1">Sí</button>
      <button onClick={onCancel} className="text-xs" style={{ color: 'var(--text-muted)' }}>No</button>
    </div>
  )
}

// ── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, isDragging, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${
        isDragging ? 'opacity-40 scale-95' : 'opacity-100'
      }`}
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border-default)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Type + Priority row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md dark:bg-sky-500/20 bg-sky-100 dark:text-sky-300 text-sky-700">
          Ticket #{ticket.id}
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${PRIORITY_STYLES[ticket.priority]}`}>
          {PRIORITY_LABELS[ticket.priority]}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
        {ticket.title}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {ticket.category && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md dark:bg-white/8 bg-slate-100 dark:text-slate-400 text-slate-500 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />{ticket.category.name}
          </span>
        )}
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {ticket.requestor.name} · {timeAgo(ticket.createdAt)}
        </span>
      </div>

      {/* Status badge + link */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${STATUS_STYLES[ticket.status]}`}>
          {STATUS_LABELS[ticket.status]}
        </span>
        <Link
          to={`/tickets/${ticket.id}`}
          onClick={e => e.stopPropagation()}
          className="p-1 rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100"
          style={{ color: 'var(--text-muted)' }}
          title="Ver ticket"
        >
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

// ── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onDelete, isDragging, onDragStart }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isDone = task.status === 'DONE'

  const isOverdue = task.dueDate && !isDone && new Date(task.dueDate) < new Date()
  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    : null

  return (
    <div
      draggable={!confirmDelete}
      onDragStart={onDragStart}
      className={`rounded-xl p-3 transition-all duration-150 select-none group ${
        isDragging ? 'opacity-40 scale-95 cursor-grabbing' : 'cursor-grab'
      } ${isDone ? 'opacity-60' : ''}`}
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border-default)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Type + Priority row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md dark:bg-violet-500/20 bg-violet-100 dark:text-violet-300 text-violet-700">
            Tarea
          </span>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} title={PRIORITY_LABELS[task.priority]} />
        </div>
        {/* Actions on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onEdit(task) }}
            className="p-1 rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100"
            style={{ color: 'var(--text-muted)' }}
            title="Editar"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            className="p-1 rounded-lg transition-colors dark:hover:bg-rose-500/20 hover:bg-rose-50 dark:hover:text-rose-400 hover:text-rose-500"
            style={{ color: 'var(--text-muted)' }}
            title="Eliminar"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Title */}
      <p
        className={`text-sm font-medium leading-snug mb-1 line-clamp-2 ${isDone ? 'line-through' : ''}`}
        style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}
      >
        {task.title}
      </p>

      {/* Description snippet */}
      {task.description && (
        <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {task.description}
        </p>
      )}

      {/* Due date */}
      {dueDateStr && (
        <div className={`flex items-center gap-1 text-[10px] font-medium mt-2 ${isOverdue ? 'text-rose-500' : ''}`} style={isOverdue ? {} : { color: 'var(--text-muted)' }}>
          <Calendar className="w-3 h-3" />
          {isOverdue ? 'Vencido · ' : ''}{dueDateStr}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="mt-2">
          <DeleteConfirm
            onConfirm={() => { onDelete(task.id); setConfirmDelete(false) }}
            onCancel={() => setConfirmDelete(false)}
          />
        </div>
      )}
    </div>
  )
}

// ── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ column, tickets, tasks, dragOverColumn, onDragStart, onDragOver, onDrop, onDragLeave, onTicketStatus, onEditTask, onDeleteTask, onQuickAddTask }) {
  const [showAdd, setShowAdd] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const addRef = useRef(null)
  const isDragOver = dragOverColumn === column.id

  const totalCount = tickets.length + tasks.length

  const handleQuickAdd = async (e) => {
    e?.preventDefault()
    const title = addTitle.trim()
    if (!title) { setShowAdd(false); return }
    setAdding(true)
    try {
      await onQuickAddTask(title, column.onDropTask)
      setAddTitle('')
      setShowAdd(false)
    } finally {
      setAdding(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleQuickAdd()
    if (e.key === 'Escape') { setShowAdd(false); setAddTitle('') }
  }

  useEffect(() => {
    if (showAdd) setTimeout(() => addRef.current?.focus(), 50)
  }, [showAdd])

  return (
    <div
      className={`flex flex-col rounded-2xl min-h-[480px] transition-all duration-150 ${isDragOver ? 'ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-[#0f0f1a]' : ''}`}
      style={{ background: 'var(--bg-surface)', border: `1px solid var(--border-default)` }}
      onDragOver={e => onDragOver(e, column.id)}
      onDrop={e => onDrop(e, column)}
      onDragLeave={onDragLeave}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${column.colorClass}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${column.textClass}`}>{column.label}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${column.bgClass}`}
            style={{ color: 'inherit' }}
          >
            {totalCount}
          </span>
        </div>
        {column.id !== 'done' && (
          <button
            onClick={() => setShowAdd(v => !v)}
            className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100"
            style={{ color: 'var(--text-muted)' }}
            title="Agregar tarea"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick add inline */}
      {showAdd && (
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <input
              ref={addRef}
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Título de la tarea..."
              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleQuickAdd}
              disabled={!addTitle.trim() || adding}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            </button>
            <button onClick={() => { setShowAdd(false); setAddTitle('') }} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div
        className={`flex-1 p-3 space-y-2.5 overflow-y-auto transition-colors duration-150 ${isDragOver ? column.bgClass : ''}`}
        style={{ minHeight: '60px' }}
      >
        {/* Drop zone hint */}
        {isDragOver && totalCount === 0 && (
          <div className="h-16 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'var(--border-strong)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Suelta aquí</span>
          </div>
        )}

        {/* Ticket cards */}
        {tickets.map(ticket => (
          <TicketCard
            key={`ticket-${ticket.id}`}
            ticket={ticket}
            onStatusChange={onTicketStatus}
            isDragging={false}
            onDragStart={e => onDragStart(e, { id: ticket.id, type: 'ticket' })}
          />
        ))}

        {/* Task cards */}
        {tasks.map(task => (
          <TaskCard
            key={`task-${task.id}`}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            isDragging={false}
            onDragStart={e => onDragStart(e, { id: task.id, type: 'task' })}
          />
        ))}

        {/* Empty state */}
        {totalCount === 0 && !isDragOver && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CheckCircle2 className="w-7 h-7 dark:text-slate-700 text-slate-300" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin elementos</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main WorkFlow Component ──────────────────────────────────────────────────

export default function WorkFlow() {
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState(() => localStorage.getItem('workflow-view') || 'kanban')
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [, setDraggingItem] = useState(null)
  const [editingTask, setEditingTask] = useState(null)   // null | 'new' | task object
  const [showCompleted, setShowCompleted] = useState(false)

  const setViewPersist = (v) => { setView(v); localStorage.setItem('workflow-view', v) }

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      setError(null)
      const res = await getWorkflow()
      setTickets(res.data.tickets)
      setTasks(res.data.tasks)
    } catch {
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Task CRUD ──────────────────────────────────────────────────────────────
  const handleSaveTask = async (data) => {
    if (editingTask === 'new') {
      const res = await createTask(data)
      setTasks(prev => [res.data, ...prev])
    } else {
      const res = await updateTask(editingTask.id, data)
      setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data : t))
    }
  }

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    try { await deleteTask(id) } catch { load() }
  }

  const handleQuickAddTask = async (title, status) => {
    const res = await createTask({ title, status, priority: 'MEDIUM' })
    setTasks(prev => [res.data, ...prev])
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragStart = (e, item) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify(item))
    setDraggingItem(item)
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null)
    }
  }

  const handleDragEnd = () => {
    setDraggingItem(null)
    setDragOverColumn(null)
  }

  const handleDrop = async (e, column) => {
    e.preventDefault()
    setDragOverColumn(null)
    setDraggingItem(null)

    let item
    try { item = JSON.parse(e.dataTransfer.getData('application/json')) } catch { return }

    if (item.type === 'ticket') {
      const ticket = tickets.find(t => t.id === item.id)
      if (!ticket || ticket.status === column.onDropTicket) return
      setTickets(prev => prev.map(t => t.id === item.id ? { ...t, status: column.onDropTicket } : t))
      try {
        await updateTicketStatus(item.id, column.onDropTicket)
        if (column.onDropTicket === 'COMPLETED') {
          setTimeout(() => setTickets(prev => prev.filter(t => t.id !== item.id)), 700)
        }
      } catch { load() }
    }

    if (item.type === 'task') {
      const task = tasks.find(t => t.id === item.id)
      if (!task || task.status === column.onDropTask) return
      setTasks(prev => prev.map(t => t.id === item.id ? { ...t, status: column.onDropTask, completedAt: column.onDropTask === 'DONE' ? new Date().toISOString() : null } : t))
      try { await updateTask(item.id, { status: column.onDropTask }) } catch { load() }
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const getColumnItems = (column) => {
    const colTickets = tickets.filter(t => column.ticketStatuses.includes(t.status))
    const colTasks   = tasks.filter(t => column.taskStatuses.includes(t.status))
    return { tickets: colTickets, tasks: colTasks }
  }

  const pendingCount = tasks.filter(t => t.status !== 'DONE').length
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  // ── Loading / Error ────────────────────────────────────────────────────────
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
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm mb-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
            {greeting()}, <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{user?.name?.split(' ')[0]}</span> · {today}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Mi WorkFlow</h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Stats pills */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium dark:bg-sky-500/15 bg-sky-50 dark:text-sky-300 text-sky-700 border dark:border-sky-500/25 border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse inline-block" />
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium dark:bg-violet-500/15 bg-violet-50 dark:text-violet-300 text-violet-700 border dark:border-violet-500/25 border-violet-200">
            {pendingCount} tarea{pendingCount !== 1 ? 's' : ''}
          </span>

          {/* Add task button */}
          <button
            onClick={() => setEditingTask('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva tarea
          </button>

          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-default)' }}>
            <button
              onClick={() => setViewPersist('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === 'kanban' ? 'dark:bg-violet-600 bg-violet-600 text-white' : 'dark:hover:bg-white/10 hover:bg-slate-100'}`}
              style={view !== 'kanban' ? { color: 'var(--text-secondary)' } : {}}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Tablero
            </button>
            <button
              onClick={() => setViewPersist('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === 'list' ? 'dark:bg-violet-600 bg-violet-600 text-white' : 'dark:hover:bg-white/10 hover:bg-slate-100'}`}
              style={view !== 'list' ? { color: 'var(--text-secondary)' } : {}}
            >
              <List className="w-3.5 h-3.5" /> Lista
            </button>
          </div>

          <button onClick={load} className="p-1.5 rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100" title="Actualizar" style={{ color: 'var(--text-muted)' }}>
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          KANBAN VIEW
      ══════════════════════════════════════════════════ */}
      {view === 'kanban' && (
        <div onDragEnd={handleDragEnd}>
          {/* Active columns grid (3 cols, skip done) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {COLUMNS.filter(c => c.id !== 'done').map(column => {
              const { tickets: colTickets, tasks: colTasks } = getColumnItems(column)
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tickets={colTickets}
                  tasks={colTasks}
                  dragOverColumn={dragOverColumn}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onTicketStatus={(ticket, status) => {
                    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status } : t))
                    updateTicketStatus(ticket.id, status).catch(load)
                  }}
                  onEditTask={task => setEditingTask(task)}
                  onDeleteTask={handleDeleteTask}
                  onQuickAddTask={handleQuickAddTask}
                />
              )
            })}
          </div>

          {/* Completed column — collapsible */}
          {(() => {
            const doneCol = COLUMNS.find(c => c.id === 'done')
            const { tickets: doneTickets, tasks: doneTasks } = getColumnItems(doneCol)
            const doneCount = doneTickets.length + doneTasks.length
            return (
              <div>
                <button
                  onClick={() => setShowCompleted(v => !v)}
                  className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider transition-colors dark:hover:text-emerald-300 hover:text-emerald-600"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Completado ({doneCount})
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`} />
                </button>
                {showCompleted && (
                  <KanbanColumn
                    column={doneCol}
                    tickets={doneTickets}
                    tasks={doneTasks}
                    dragOverColumn={dragOverColumn}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onTicketStatus={() => {}}
                    onEditTask={task => setEditingTask(task)}
                    onDeleteTask={handleDeleteTask}
                    onQuickAddTask={handleQuickAddTask}
                  />
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          LIST VIEW
      ══════════════════════════════════════════════════ */}
      {view === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-5 items-start">

          {/* ─ Tickets panel ─ */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div className="w-2 h-2 rounded-full bg-sky-500" />
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Tickets Asignados</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold dark:bg-sky-500/20 bg-sky-100 dark:text-sky-300 text-sky-700">{tickets.length}</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <CheckCircle2 className="w-8 h-8 dark:text-slate-700 text-slate-300" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin tickets asignados</p>
                </div>
              ) : tickets.map(ticket => (
                <div key={ticket.id} className="px-5 py-4 transition-colors dark:hover:bg-white/3 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>#{ticket.id}</span>
                        {ticket.category && <span className="text-xs px-1.5 py-0.5 rounded dark:bg-white/8 bg-slate-100 dark:text-slate-400 text-slate-500">{ticket.category.name}</span>}
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ticket.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{ticket.requestor.name} · {timeAgo(ticket.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PRIORITY_STYLES[ticket.priority]}`}>{PRIORITY_LABELS[ticket.priority]}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${STATUS_STYLES[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {['IN_PROGRESS','IN_TESTING','COMPLETED'].map(s => (
                      <button
                        key={s}
                        disabled={ticket.status === s}
                        onClick={() => {
                          setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: s } : t))
                          updateTicketStatus(ticket.id, s).catch(load)
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${ticket.status === s ? `${STATUS_STYLES[s]} opacity-60 cursor-default` : 'dark:text-slate-400 text-slate-500 dark:border-slate-700/50 border-slate-200 dark:hover:bg-white/8 hover:bg-slate-100'}`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                    <Link to={`/tickets/${ticket.id}`} className="ml-auto p-1 rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100" style={{ color: 'var(--text-muted)' }}>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─ Tasks panel ─ */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Mis Tareas</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold dark:bg-violet-500/20 bg-violet-100 dark:text-violet-300 text-violet-700">{pendingCount}</span>
              </div>
              <button onClick={() => setEditingTask('new')} className="w-7 h-7 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <GripVertical className="w-8 h-8 dark:text-slate-700 text-slate-300" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin tareas. ¡Crea una!</p>
                </div>
              ) : (
                ['IN_PROGRESS','PENDING','DONE'].map(statusGroup => {
                  const label = { IN_PROGRESS: 'En Progreso', PENDING: 'Pendientes', DONE: 'Completadas' }[statusGroup]
                  const dot = { IN_PROGRESS: 'bg-sky-500', PENDING: 'bg-amber-400', DONE: 'bg-emerald-500' }[statusGroup]
                  const grouped = tasks.filter(t => t.status === statusGroup)
                  if (!grouped.length) return null
                  return (
                    <div key={statusGroup}>
                      <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-default)', borderTop: '1px solid var(--border-default)' }}>
                        <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      </div>
                      {grouped.map(task => (
                        <div key={task.id} className="group flex items-start gap-3 px-4 py-3 transition-colors dark:hover:bg-white/3 hover:bg-slate-50" style={{ borderBottom: '1px solid var(--border-default)' }}>
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through' : ''}`} style={{ color: task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{task.title}</p>
                            {task.description && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{task.description}</p>}
                            {task.dueDate && <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Calendar className="w-2.5 h-2.5" />{new Date(task.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</p>}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => setEditingTask(task)} className="p-1 rounded-lg transition-colors dark:hover:bg-white/10 hover:bg-slate-100" style={{ color: 'var(--text-muted)' }}><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded-lg transition-colors dark:hover:bg-rose-500/20 hover:bg-rose-50 dark:hover:text-rose-400 hover:text-rose-500" style={{ color: 'var(--text-muted)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Task Edit/Create Modal ── */}
      {editingTask !== null && (
        <TaskModal
          task={editingTask === 'new' ? null : editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  )
}