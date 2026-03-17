export const STATUS_LABELS = {
  NEW: 'Nuevo',
  IN_REVIEW: 'En Revisión',
  IN_PROGRESS: 'En Progreso',
  IN_TESTING: 'En Pruebas',
  COMPLETED: 'Completado',
}

export const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const ROLE_LABELS = {
  USER: 'Usuario',
  TECHNICIAN: 'Técnico',
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
}

export const STATUS_STYLES = {
  NEW:         'bg-slate-100 text-slate-700 border-slate-200',
  IN_REVIEW:   'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 border-sky-200',
  IN_TESTING:  'bg-violet-50 text-violet-700 border-violet-200',
  COMPLETED:   'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export const PRIORITY_STYLES = {
  LOW:      'bg-slate-100 text-slate-600 border-slate-200',
  MEDIUM:   'bg-cyan-50 text-cyan-700 border-cyan-200',
  HIGH:     'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
}

export const ROLE_STYLES = {
  USER:        'bg-slate-100 text-slate-700',
  TECHNICIAN:  'bg-indigo-100 text-indigo-700',
  ADMIN:       'bg-violet-100 text-violet-700',
  SUPERVISOR:  'bg-teal-100 text-teal-700',
}

export const STATUS_DOT = {
  NEW:         'bg-slate-400',
  IN_REVIEW:   'bg-amber-400',
  IN_PROGRESS: 'bg-sky-500',
  IN_TESTING:  'bg-violet-500',
  COMPLETED:   'bg-emerald-500',
}

export function timeAgo(date) {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now - d) / 1000)

  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function getAvatarColor(name = '') {
  const colors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-sky-500', 'bg-rose-500',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export const STATUSES = ['NEW', 'IN_REVIEW', 'IN_PROGRESS', 'IN_TESTING', 'COMPLETED']
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
