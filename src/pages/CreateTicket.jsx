import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Paperclip, X, Upload, FileText, FileSpreadsheet, File } from 'lucide-react'
import { createTicket } from '../api/tickets'
import { PRIORITY_LABELS, PRIORITIES } from '../utils/helpers'

export default function CreateTicket() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ title: '', remoteId: '', description: '', priority: 'MEDIUM' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ALLOWED_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  const getFileIcon = (f) => {
    if (!f) return <File className="w-8 h-8 text-gray-400" />
    if (f.type.startsWith('image/')) return null
    if (f.type === 'application/pdf') return <FileText className="w-10 h-10 text-red-400" />
    if (f.type.includes('excel') || f.type.includes('spreadsheet')) return <FileSpreadsheet className="w-10 h-10 text-green-500" />
    return <FileText className="w-10 h-10 text-blue-400" />
  }

  const handleFile = (f) => {
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Tipo no permitido. Use imágenes, PDF, Excel o Word.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar los 10 MB')
      return
    }
    setError('')
    setFile(f)
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  const removeFile = (e) => {
    e.stopPropagation()
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('Título y descripción son requeridos')
      return
    }
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('title', form.title.trim())
    formData.append('description', form.description.trim())
    formData.append('priority', form.priority)
    if (form.remoteId.trim()) formData.append('remoteId', form.remoteId.trim())
    if (file) formData.append('image', file)

    try {
      const ticket = await createTicket(formData)
      navigate(`/tickets/${ticket.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el ticket')
    } finally {
      setLoading(false)
    }
  }

  const priorityConfig = {
    LOW:      { active: 'bg-slate-600 border-slate-600 text-white',   idle: 'dark:border-slate-500/50 border-slate-300 dark:text-slate-300 text-slate-600 dark:hover:bg-slate-500/10 hover:bg-slate-50' },
    MEDIUM:   { active: 'bg-cyan-600 border-cyan-600 text-white',     idle: 'dark:border-cyan-500/50 border-cyan-300 dark:text-cyan-400 text-cyan-700 dark:hover:bg-cyan-500/10 hover:bg-cyan-50' },
    HIGH:     { active: 'bg-orange-500 border-orange-500 text-white', idle: 'dark:border-orange-500/50 border-orange-300 dark:text-orange-400 text-orange-600 dark:hover:bg-orange-500/10 hover:bg-orange-50' },
    CRITICAL: { active: 'bg-rose-600 border-rose-600 text-white',     idle: 'dark:border-rose-500/50 border-rose-300 dark:text-rose-400 text-rose-600 dark:hover:bg-rose-500/10 hover:bg-rose-50' },
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Nuevo Ticket</h1>
          <p className="text-slate-400 text-sm mt-0.5">Describe tu solicitud con el mayor detalle posible</p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title */}
          <div>
            <label className="label">
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Error en el módulo de facturación"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={200}
              required
            />
            <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{form.title.length}/200</p>
          </div>

          {/* Remote ID */}
          <div>
            <label className="label">
              Anydesk / TeamViewer
              <span className="text-gray-400 font-normal text-xs ml-1">(opcional)</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ej: 123 456 789"
              value={form.remoteId}
              onChange={e => setForm(f => ({ ...f, remoteId: e.target.value }))}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Descripción <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="textarea"
              rows={5}
              placeholder="Describe el problema o solicitud. Si es un error, incluye pasos para reproducirlo."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="label">Prioridad</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORITIES.map(p => {
                const cfg = priorityConfig[p]
                const isActive = form.priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`px-3 py-2.5 text-sm font-semibold border-2 rounded-xl transition-all duration-150 active:scale-95 ${
                      isActive ? cfg.active : `dark:bg-transparent bg-white ${cfg.idle}`
                    }`}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* File attachment */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Paperclip className="w-4 h-4" />
              Archivo adjunto
              <span className="text-gray-400 font-normal text-xs">(opcional, máx. 10 MB)</span>
            </label>

            <div
              className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
                dragging
                  ? 'border-violet-400 dark:bg-violet-500/10 bg-violet-50 scale-[1.01]'
                  : file
                    ? 'border-violet-300 dark:bg-violet-500/8 bg-violet-50/50'
                    : 'dark:border-white/15 border-gray-300 dark:hover:border-violet-400 hover:border-violet-400 dark:hover:bg-violet-500/8 hover:bg-violet-50/30 cursor-pointer'
              }`}
              onClick={() => !file && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="p-4 flex flex-col items-center gap-2">
                  {preview ? (
                    <div className="relative group">
                      <img src={preview} alt="Vista previa" className="max-h-52 rounded-lg object-contain shadow-sm" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl dark:bg-white/8 bg-gray-100 flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                  <p className="text-xs text-violet-600 font-medium truncate max-w-xs">{file?.name}</p>
                  <p className="text-xs text-gray-400">{(file?.size / 1024).toFixed(0)} KB</p>
                  <button type="button" onClick={removeFile}
                    className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium">
                    <X className="w-3 h-3" /> Quitar archivo
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl dark:bg-white/8 bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Arrastra un archivo aquí o{' '}
                    <span className="text-violet-600 dark:text-violet-400 font-semibold">selecciona un archivo</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PNG, JPG, PDF, Excel, Word — hasta 10 MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.xlsx,.xls,.docx,.doc"
                onChange={e => handleFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <div className="dark:bg-rose-500/15 bg-rose-50 dark:border-rose-500/30 border border-rose-200 rounded-xl px-4 py-3 text-sm dark:text-rose-300 text-rose-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando ticket...</>
                : 'Crear Ticket'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
