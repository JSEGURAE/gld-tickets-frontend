import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Loader2, Edit2, Trash2, User, Calendar, Clock,
  MessageSquare, History, Send, ChevronDown, AlertCircle, Paperclip, ExternalLink,
  Eye, UserPlus, X as XIcon, FileText, FileSpreadsheet, File,
} from 'lucide-react'
import { getTicket, updateTicket, addComment, deleteTicket, tagSupervisor, untagSupervisor } from '../api/tickets'
import { getTechnicians, getSupervisors } from '../api/users'
import { getCategories } from '../api/categories'
import { StatusBadge, PriorityBadge } from '../components/TicketBadge'
import Modal from '../components/Modal'
import useAuthStore from '../store/authStore'
import {
  formatDate, timeAgo, getInitials, getAvatarColor,
  STATUS_LABELS, PRIORITY_LABELS, STATUSES, PRIORITIES
} from '../utils/helpers'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [ticket, setTicket] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [categories, setCategories] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [supervisorLoading, setSupervisorLoading] = useState(false)

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editLoading, setEditLoading] = useState(false)

  // Comment
  const [commentText, setCommentText] = useState('')
  const [commentFile, setCommentFile] = useState(null)
  const [commentPreview, setCommentPreview] = useState(null)
  const [commentFileError, setCommentFileError] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const commentFileRef = useRef(null)

  const COMMENT_ALLOWED_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  const handleCommentFile = (f) => {
    if (!f) return
    if (!COMMENT_ALLOWED_TYPES.includes(f.type)) {
      setCommentFileError('Tipo no permitido. Use imágenes, PDF, Excel o Word.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setCommentFileError('El archivo no puede superar los 10 MB.')
      return
    }
    setCommentFileError('')
    setCommentFile(f)
    setCommentPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  const removeCommentFile = () => {
    if (commentPreview) URL.revokeObjectURL(commentPreview)
    setCommentFile(null)
    setCommentPreview(null)
    setCommentFileError('')
    if (commentFileRef.current) commentFileRef.current.value = ''
  }

  const handleCommentPaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file') {
        const f = item.getAsFile()
        if (f) {
          e.preventDefault()
          handleCommentFile(f)
          return
        }
      }
    }
  }

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const isTechOrAdmin = ['TECHNICIAN', 'ADMIN'].includes(user?.role)
  const isOwner = ticket?.requestorId === user?.id
  const canTagSupervisors = isOwner || isTechOrAdmin

  useEffect(() => {
    Promise.all([
      getTicket(id),
      isTechOrAdmin ? getTechnicians() : Promise.resolve([]),
      getSupervisors(),
    ])
      .then(([t, techs, sups]) => {
        setTicket(t)
        setTechnicians(techs)
        setSupervisors(sups)
        // Load categories separately — don't let a missing table crash the ticket page
        if (isTechOrAdmin) {
          getCategories().then(setCategories).catch(() => setCategories([]))
        }
      })
      .catch(() => setError('Error al cargar el ticket'))
      .finally(() => setLoading(false))
  }, [id])

  const refresh = () => getTicket(id).then(setTicket)

  const handleStatusChange = async (newStatus) => {
    if (newStatus === ticket.status) return
    try {
      const updated = await updateTicket(id, { status: newStatus })
      setTicket(t => ({ ...t, ...updated, comments: t.comments, history: t.history }))
      await refresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const handleAssignChange = async (assigneeId) => {
    try {
      await updateTicket(id, { assigneeId: assigneeId ? parseInt(assigneeId) : null })
      await refresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al asignar técnico')
    }
  }

  const handleCategoryChange = async (categoryId) => {
    try {
      await updateTicket(id, { categoryId: categoryId ? parseInt(categoryId) : null, subCategoryId: null })
      await refresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar categoría')
    }
  }

  const handleSubCategoryChange = async (subCategoryId) => {
    try {
      await updateTicket(id, { subCategoryId: subCategoryId ? parseInt(subCategoryId) : null })
      await refresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar subcategoría')
    }
  }

  const handleTagSupervisor = async (supervisorId) => {
    if (!supervisorId) return
    setSupervisorLoading(true)
    try {
      await tagSupervisor(id, parseInt(supervisorId))
      await refresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al etiquetar supervisor')
    } finally {
      setSupervisorLoading(false)
    }
  }

  const handleUntagSupervisor = async (supervisorId) => {
    setSupervisorLoading(true)
    try {
      await untagSupervisor(id, supervisorId)
      await refresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al remover supervisor')
    } finally {
      setSupervisorLoading(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      await updateTicket(id, editForm)
      await refresh()
      setEditOpen(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al editar ticket')
    } finally {
      setEditLoading(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)
    try {
      await addComment(id, commentText, commentFile)
      setCommentText('')
      removeCommentFile()
      await refresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar comentario')
    } finally {
      setCommentLoading(false)
    }
  }

  const getCommentFileIcon = (name) => {
    if (!name) return <File className="w-4 h-4" />
    const ext = name.split('.').pop().toLowerCase()
    if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-red-400" />
    if (['xls', 'xlsx'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-green-400" />
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-400" />
    return <File className="w-4 h-4 text-gray-400" />
  }

  const handleDelete = async () => {
    try {
      await deleteTicket(id)
      navigate('/tickets')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar ticket')
      setDeleteConfirm(false)
    }
  }

  const openEdit = () => {
    setEditForm({ title: ticket.title, description: ticket.description, priority: ticket.priority })
    setEditOpen(true)
  }

  const HISTORY_LABELS = {
    status: 'Estado',
    priority: 'Prioridad',
    assignee: 'Asignado',
    title: 'Título',
    description: 'Descripción',
    created: 'Creado',
    comment: 'Comentario',
  }

  const formatHistoryValue = (field, value) => {
    if (!value) return 'Sin asignar'
    if (field === 'status') return STATUS_LABELS[value] || value
    if (field === 'priority') return PRIORITY_LABELS[value] || value
    if (field === 'assignee') {
      const tech = technicians.find(t => t.id.toString() === value)
      return tech ? tech.name : value
    }
    return value
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-6 text-rose-300 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        {error}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/tickets')} className="btn-ghost p-2 mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-gray-400">#{ticket.id}</span>
              <StatusBadge status={ticket.status} showDot />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {(isOwner || isTechOrAdmin) && (
            <button onClick={openEdit} className="btn-secondary">
              <Edit2 className="w-4 h-4" /> Editar
            </button>
          )}
          {user?.role === 'ADMIN' && (
            <button onClick={() => setDeleteConfirm(true)} className="btn-danger">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-rose-500/15 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-4">
          {/* Description */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-slate-100">Descripción</h2>
            </div>
            <div className="card-body">
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comentarios
                {ticket.comments?.length > 0 && (
                  <span className="text-xs font-medium bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                    {ticket.comments.length}
                  </span>
                )}
              </h2>
            </div>
            <div className="card-body space-y-4">
              {ticket.comments?.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">Sin comentarios aún</p>
              )}
              {ticket.comments?.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${getAvatarColor(comment.user.name)}`}>
                    {getInitials(comment.user.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{comment.user.name}</span>
                      <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <div className="bg-white/5 rounded-lg px-3 py-2.5 text-sm text-slate-300 leading-relaxed">
                      {comment.content}
                      {comment.attachmentUrl && (
                        <a
                          href={comment.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          {getCommentFileIcon(comment.attachmentName)}
                          {comment.attachmentName || 'Adjunto'}
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add comment */}
              <form onSubmit={handleComment} className="flex gap-3 pt-2 border-t dark:border-white/8 border-slate-200">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${getAvatarColor(user?.name)}`}>
                  {getInitials(user?.name)}
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      className="textarea pr-12"
                      rows={3}
                      placeholder="Agrega un comentario..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onPaste={handleCommentPaste}
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || commentLoading}
                      className="absolute bottom-2 right-2 p-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-opacity"
                    >
                      {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* File preview */}
                  {commentFile && (
                    <div className="mt-2 flex items-center gap-3 p-2.5 rounded-lg dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200">
                      {commentPreview ? (
                        <img src={commentPreview} alt="preview" className="h-14 w-14 object-cover rounded-md flex-shrink-0 border dark:border-white/10 border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-white/10 bg-slate-200">
                          {getCommentFileIcon(commentFile.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium dark:text-slate-300 text-slate-700 truncate">{commentFile.name}</p>
                        <p className="text-xs dark:text-slate-500 text-slate-400">{(commentFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button type="button" onClick={removeCommentFile} className="text-rose-400 hover:text-rose-500 flex-shrink-0 transition-colors">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {commentFileError && (
                    <p className="text-xs text-rose-400 mt-1">{commentFileError}</p>
                  )}

                  {/* Attach row */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => commentFileRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs dark:text-slate-400 text-slate-500 dark:hover:text-violet-400 hover:text-violet-600 transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Adjuntar archivo
                    </button>
                    <span className="text-xs dark:text-slate-600 text-slate-400">· Ctrl+V para pegar</span>
                    <input
                      ref={commentFileRef}
                      type="file"
                      accept="image/*,application/pdf,.xlsx,.xls,.docx,.doc"
                      onChange={e => handleCommentFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status & Actions */}
          {isTechOrAdmin && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-100">Gestión</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Estado</label>
                  <select value={ticket.status} onChange={e => handleStatusChange(e.target.value)} className="select">
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Asignado a</label>
                  <select value={ticket.assigneeId || ''} onChange={e => handleAssignChange(e.target.value || null)} className="select">
                    <option value="">Sin asignar</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select value={ticket.categoryId || ''} onChange={e => handleCategoryChange(e.target.value || null)} className="select">
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {ticket.categoryId && (
                  <div>
                    <label className="label">Subcategoría</label>
                    <select value={ticket.subCategoryId || ''} onChange={e => handleSubCategoryChange(e.target.value || null)} className="select">
                      <option value="">Sin subcategoría</option>
                      {(categories.find(c => c.id === ticket.categoryId)?.subcategories || []).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supervisores etiquetados */}
          {(canTagSupervisors && supervisors.length > 0) && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-400" /> Supervisores
                </h2>
              </div>
              <div className="card-body space-y-3">
                {/* Tagged supervisors */}
                {(ticket.supervisors || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ticket.supervisors.map(ts => (
                      <span key={ts.supervisorId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        {ts.supervisor.name}
                        <button
                          onClick={() => handleUntagSupervisor(ts.supervisorId)}
                          className="ml-0.5 hover:text-rose-400 transition-colors"
                          disabled={supervisorLoading}
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Add supervisor dropdown */}
                {(() => {
                  const taggedIds = (ticket.supervisors || []).map(ts => ts.supervisorId)
                  const available = supervisors.filter(s => !taggedIds.includes(s.id))
                  if (!available.length) return <p className="text-xs text-slate-500">Todos los supervisores ya están etiquetados</p>
                  return (
                    <select
                      className="select text-sm"
                      defaultValue=""
                      onChange={e => { handleTagSupervisor(e.target.value); e.target.value = '' }}
                      disabled={supervisorLoading}
                    >
                      <option value="" disabled>
                        {supervisorLoading ? 'Cargando...' : '+ Etiquetar supervisor'}
                      </option>
                      {available.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Ticket info */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-slate-100">Información</h2>
            </div>
            <div className="card-body space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Solicitante</span>
                <span className="font-medium text-slate-200">{ticket.requestor?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Asignado a</span>
                <span className="font-medium text-slate-200">{ticket.assignee?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Prioridad</span>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Estado</span>
                <StatusBadge status={ticket.status} />
              </div>
              {ticket.category && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Categoría</span>
                  <span className="font-medium text-slate-200 text-xs">{ticket.category.name}</span>
                </div>
              )}
              {ticket.subCategory && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Subcategoría</span>
                  <span className="font-medium text-slate-200 text-xs">{ticket.subCategory.name}</span>
                </div>
              )}
              {ticket.remoteId && (
                <>
                  <hr className="border-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Anydesk / TeamViewer</span>
                    <span className="font-mono text-sm font-medium text-violet-300">{ticket.remoteId}</span>
                  </div>
                </>
              )}
              <hr className="border-white/10" />
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Creado
                </span>
                <p className="text-slate-300 mt-0.5">{formatDate(ticket.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Actualizado
                </span>
                <p className="text-slate-300 mt-0.5">{formatDate(ticket.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Attachment */}
          {ticket.attachmentUrl && (() => {
            const name = ticket.attachmentName || ''
            const ext = name.split('.').pop().toLowerCase()
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
            const isPdf = ext === 'pdf'
            const isExcel = ['xls', 'xlsx'].includes(ext)
            const isWord = ['doc', 'docx'].includes(ext)
            return (
              <div className="card">
                <div className="card-header">
                  <h2 className="font-semibold text-slate-100 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Adjuntos
                  </h2>
                </div>
                <div className="card-body">
                  <a href={ticket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block group">
                    {isImage ? (
                      <div className="relative overflow-hidden rounded-lg border border-white/10">
                        <img
                          src={ticket.attachmentUrl}
                          alt={name || 'Adjunto'}
                          className="w-full object-contain max-h-64 bg-white/5 transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPdf ? 'bg-red-500/20' : isExcel ? 'bg-green-500/20' : isWord ? 'bg-blue-500/20' : 'bg-gray-500/20'}`}>
                          {isPdf && <FileText className="w-5 h-5 text-red-400" />}
                          {isExcel && <FileSpreadsheet className="w-5 h-5 text-green-400" />}
                          {isWord && <FileText className="w-5 h-5 text-blue-400" />}
                          {!isPdf && !isExcel && !isWord && <File className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{name || 'Adjunto'}</p>
                          <p className="text-xs text-gray-500 uppercase">{ext || 'archivo'}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                      </div>
                    )}
                    {isImage && name && (
                      <p className="text-xs text-gray-500 mt-1.5 truncate flex items-center gap-1">
                        <Paperclip className="w-3 h-3 flex-shrink-0" />
                        {name}
                      </p>
                    )}
                  </a>
                </div>
              </div>
            )
          })()}

          {/* History */}
          {ticket.history?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-100 flex items-center gap-2">
                  <History className="w-4 h-4" /> Historial
                </h2>
              </div>
              <div className="card-body">
                <div className="relative">
                  <div className="absolute left-3.5 top-0 bottom-0 w-px bg-white/15" />
                  <div className="space-y-4">
                    {ticket.history.slice(0, 8).map(h => (
                      <div key={h.id} className="flex gap-3 relative">
                        <div className="w-7 h-7 rounded-full bg-[#111827] border-2 border-white/20 flex items-center justify-center flex-shrink-0 z-10">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-xs text-slate-400">
                            <span className="font-medium text-slate-300">{h.user?.name}</span>
                            {' '}cambió{' '}
                            <span className="font-medium text-slate-300">{HISTORY_LABELS[h.field] || h.field}</span>
                          </p>
                          {h.oldValue && h.newValue && h.field !== 'created' && h.field !== 'comment' && (
                            <p className="text-xs mt-0.5">
                              <span className="text-gray-400 line-through">{formatHistoryValue(h.field, h.oldValue)}</span>
                              {' → '}
                              <span className="text-slate-300 font-medium">{formatHistoryValue(h.field, h.newValue)}</span>
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(h.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar Ticket">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input
              type="text"
              className="input"
              value={editForm.title || ''}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="textarea"
              rows={5}
              value={editForm.description || ''}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Prioridad</label>
            <select
              className="select"
              value={editForm.priority || ''}
              onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={editLoading} className="btn-primary">
              {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Eliminar Ticket" size="sm">
        <p className="text-slate-400 mb-6">
          ¿Estás seguro de que deseas eliminar el ticket <strong>#{ticket?.id}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
          <button onClick={() => setDeleteConfirm(false)} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}
