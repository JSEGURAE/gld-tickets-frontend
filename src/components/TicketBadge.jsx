import {
  STATUS_LABELS, PRIORITY_LABELS,
  STATUS_STYLES, PRIORITY_STYLES, STATUS_DOT,
} from '../utils/helpers'

export function StatusBadge({ status, showDot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-gray-400'}`} />}
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const icons = { LOW: '↓', MEDIUM: '→', HIGH: '↑', CRITICAL: '⚡' }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600'}`}>
      <span className="font-bold">{icons[priority] || '–'}</span>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  )
}

export function RoleBadge({ role }) {
  const styles = {
    USER:       'bg-slate-100 text-slate-700',
    TECHNICIAN: 'bg-indigo-100 text-indigo-700',
    ADMIN:      'bg-violet-100 text-violet-700',
  }
  const labels = { USER: 'Usuario', TECHNICIAN: 'Técnico', ADMIN: 'Admin' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
      {labels[role] || role}
    </span>
  )
}
