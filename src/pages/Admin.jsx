import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Loader2, PlusCircle, Edit2, UserX, UserCheck, Users,
  ShieldCheck, Wrench, Search, X, Eye, EyeOff, AlertTriangle,
  CheckCircle2, Mail, Lock, User as UserIcon, Trash2,
  Tag, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, FolderOpen,
  Bell, Phone, MessageSquare, Plus, MailCheck, MapPin,
} from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser } from '../api/users'
import { getRoles } from '../api/roles'
import { getSedes, createSede, updateSede, deleteSede } from '../api/sedes'
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  createSubCategory, updateSubCategory, deleteSubCategory,
} from '../api/categories'
import {
  getNotificationSettings, updateNotificationSetting,
  getRecipients, createRecipient, updateRecipient, deleteRecipient,
} from '../api/notifications'
import { RoleBadge } from '../components/TicketBadge'
import StatCard from '../components/StatCard'
import Modal from '../components/Modal'
import { getInitials, getAvatarColor, timeAgo } from '../utils/helpers'

const EMPTY_FORM = { name: '', email: '', password: '', roleId: '', sedeId: '', active: true }

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [sedes, setSedes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const load = () => {
    setLoading(true)
    getUsers().then(setUsers).catch(() => setError('Error al cargar usuarios')).finally(() => setLoading(false))
  }
  useEffect(() => {
    load()
    getRoles().then(setRoles).catch(() => {})
    getSedes().then(setSedes).catch(() => {})
  }, [])

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    technicians: users.filter(u => u.role === 'TECHNICIAN').length,
    active: users.filter(u => u.active).length,
  }), [users])

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? u.active : !u.active
    return matchSearch && matchRole && matchStatus
  }), [users, search, roleFilter, statusFilter])

  const openCreate = () => {
    const defaultRole = roles.find(r => r.name === 'USER')
    setEditingUser(null)
    setForm({ ...EMPTY_FORM, roleId: defaultRole?.id || '' })
    setFormError(''); setShowPassword(false); setModalOpen(true)
  }
  const openEdit = (u) => {
    setEditingUser(u)
    setForm({ name: u.name, email: u.email, password: '', roleId: u.roleId, sedeId: u.sedeId || '', active: u.active })
    setFormError(''); setShowPassword(false); setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('')
    try {
      if (editingUser) {
        const data = { name: form.name, email: form.email, roleId: form.roleId, sedeId: form.sedeId || null, active: form.active }
        if (form.password) data.password = form.password
        await updateUser(editingUser.id, data)
      } else {
        await createUser({ name: form.name, email: form.email, password: form.password, roleId: form.roleId, sedeId: form.sedeId || null })
      }
      load(); setModalOpen(false)
    } catch (err) { setFormError(err.response?.data?.error || 'Error al guardar') }
    finally { setFormLoading(false) }
  }

  const handleConfirm = async () => {
    if (!confirmModal) return
    setConfirmLoading(true)
    try {
      if (confirmModal.action === 'delete') await deleteUser(confirmModal.user.id)
      else await updateUser(confirmModal.user.id, { active: confirmModal.action === 'activate' })
      load(); setConfirmModal(null)
    } catch (err) { setError(err.response?.data?.error || 'Error'); setConfirmModal(null) }
    finally { setConfirmLoading(false) }
  }

  const clearFilters = () => { setSearch(''); setRoleFilter(''); setStatusFilter('active') }
  const hasFilters = search || roleFilter || statusFilter !== 'active'

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total usuarios"  value={stats.total}       icon={Users}       color="indigo" />
        <StatCard title="Administradores" value={stats.admins}      icon={ShieldCheck} color="violet" />
        <StatCard title="Técnicos"        value={stats.technicians} icon={Wrench}      color="sky"    />
        <StatCard title="Cuentas activas" value={stats.active}      icon={CheckCircle2}color="emerald"/>
      </div>

      {/* Filters + New User */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre o correo..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select w-44">
            <option value="">Todos los roles</option>
            {roles.map(r => <option key={r.id} value={r.name}>{r.label}</option>)}
          </select>
          <div className="flex rounded-lg border border-white/15 overflow-hidden text-sm">
            {[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }].map(opt => (
              <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-2 font-medium transition-colors ${statusFilter === opt.value ? 'bg-violet-600 text-white' : 'bg-white/8 text-slate-300 hover:bg-white/12'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          {hasFilters && <button onClick={clearFilters} className="btn-ghost"><X className="w-4 h-4" /> Limpiar</button>}
          <button onClick={openCreate} className="btn-primary ml-auto"><PlusCircle className="w-4 h-4" /> Nuevo Usuario</button>
        </div>
        <p className="text-xs text-slate-500 mt-3">Mostrando <span className="font-medium text-slate-300">{filtered.length}</span> de {users.length} usuarios</p>
      </div>

      {error && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-violet-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500">No se encontraron usuarios</p>
            {hasFilters && <button onClick={clearFilters} className="mt-2 text-sm text-violet-400 hover:underline">Limpiar filtros</button>}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="table-th">Usuario</th>
                <th className="table-th w-36">Rol</th>
                <th className="table-th w-28">Estado</th>
                <th className="table-th w-24 text-center">Tickets</th>
                <th className="table-th w-40">Registrado</th>
                <th className="table-th w-32 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={`border-b border-white/6 last:border-0 transition-colors ${!u.active ? 'opacity-60' : 'hover:bg-violet-900/20'}`}>
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(u.name)}`}>
                        {getInitials(u.name)}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111827] ${u.active ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td"><RoleBadge role={u.role} /></td>
                  <td className="table-td">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${u.active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/8 text-slate-400 border border-white/10'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="table-td text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-slate-300 text-xs font-semibold">
                      {u._count?.requestedTickets ?? 0}
                    </span>
                  </td>
                  <td className="table-td">
                    <p className="text-xs text-slate-500">{timeAgo(u.createdAt)}</p>
                    <p className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString('es-MX')}</p>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.active
                        ? <button onClick={() => setConfirmModal({ user: u, action: 'deactivate' })} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors" title="Desactivar"><UserX className="w-4 h-4" /></button>
                        : <button onClick={() => setConfirmModal({ user: u, action: 'activate' })} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors" title="Activar"><UserCheck className="w-4 h-4" /></button>
                      }
                      <button onClick={() => setConfirmModal({ user: u, action: 'delete' })} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors" title="Eliminar permanentemente">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'} size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label"><span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> Nombre completo</span></label>
            <input type="text" className="input" placeholder="Ej: Carlos Méndez" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label"><span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Correo electrónico</span></label>
            <input type="email" className="input" placeholder="correo@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Contraseña
                {editingUser && <span className="text-slate-500 font-normal">(dejar vacío para no cambiar)</span>}
              </span>
            </label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input pr-10" placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editingUser} minLength={6} />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Rol del usuario</label>
            <div className="space-y-2">
              {roles.map(r => (
                <label key={r.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${form.roleId === r.id ? 'border-violet-400 bg-violet-500/15' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}>
                  <input type="radio" name="role" value={r.id} checked={form.roleId === r.id} onChange={() => setForm(f => ({ ...f, roleId: r.id }))} className="mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${form.roleId === r.id ? 'text-violet-300' : 'text-slate-200'}`}>{r.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.description || ''}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Sede asignada</span></label>
            <select value={form.sedeId} onChange={e => setForm(f => ({ ...f, sedeId: e.target.value }))} className="select w-full">
              <option value="">Sin sede</option>
              {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          {editingUser && (
            <div className={`flex items-center justify-between p-3 rounded-lg border ${form.active ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
              <div>
                <p className="text-sm font-medium text-slate-200">Cuenta activa</p>
                <p className="text-xs text-slate-500">Los usuarios inactivos no pueden iniciar sesión</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.active ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
          {formError && <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={formLoading} className="btn-primary">
              {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)}
        title={confirmModal?.action === 'delete' ? 'Eliminar usuario' : confirmModal?.action === 'deactivate' ? 'Desactivar cuenta' : 'Reactivar cuenta'}
        size="sm">
        {confirmModal && (
          <div>
            <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${confirmModal.action === 'delete' ? 'bg-rose-500/20 border border-rose-500/40' : confirmModal.action === 'deactivate' ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-emerald-500/15 border border-emerald-500/30'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(confirmModal.user.name)}`}>{getInitials(confirmModal.user.name)}</div>
              <div>
                <p className="font-semibold text-slate-200">{confirmModal.user.name}</p>
                <p className="text-sm text-slate-400">{confirmModal.user.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              {confirmModal.action === 'delete' ? '⚠️ Acción irreversible. Solo posible si el usuario no tiene tickets registrados.'
                : confirmModal.action === 'deactivate' ? 'La cuenta quedará inactiva. Sus tickets e historial se conservarán.'
                : 'La cuenta será reactivada y el usuario podrá iniciar sesión nuevamente.'}
            </p>
            <div className="flex gap-3">
              <button onClick={handleConfirm} disabled={confirmLoading} className={confirmModal.action === 'activate' ? 'btn-primary' : 'btn-danger'}>
                {confirmLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                  : confirmModal.action === 'delete' ? <><Trash2 className="w-4 h-4" /> Eliminar</>
                  : confirmModal.action === 'deactivate' ? <><UserX className="w-4 h-4" /> Desactivar</>
                  : <><UserCheck className="w-4 h-4" /> Reactivar</>}
              </button>
              <button onClick={() => setConfirmModal(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState({}) // categoryId → bool

  // Category modal
  const [catModal, setCatModal] = useState(null) // null | { mode:'create'|'edit', cat? }
  const [catName, setCatName] = useState('')
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')

  // Subcategory modal
  const [subModal, setSubModal] = useState(null) // null | { mode:'create'|'edit', categoryId, sub? }
  const [subName, setSubName] = useState('')
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState('')

  const load = () => {
    setLoading(true)
    getCategories(true).then(setCategories).catch(() => setError('Error al cargar categorías')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const toggleExpanded = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // ── Category handlers
  const openCatCreate = () => { setCatName(''); setCatError(''); setCatModal({ mode: 'create' }) }
  const openCatEdit = (cat) => { setCatName(cat.name); setCatError(''); setCatModal({ mode: 'edit', cat }) }

  const handleCatSubmit = async (e) => {
    e.preventDefault(); setCatLoading(true); setCatError('')
    try {
      if (catModal.mode === 'create') await createCategory(catName.trim())
      else await updateCategory(catModal.cat.id, { name: catName.trim() })
      load(); setCatModal(null)
    } catch (err) { setCatError(err.response?.data?.error || 'Error') }
    finally { setCatLoading(false) }
  }

  const handleToggleCat = async (cat) => {
    try { await updateCategory(cat.id, { active: !cat.active }); load() }
    catch (err) { setError(err.response?.data?.error || 'Error al actualizar') }
  }

  const handleDeleteCat = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.name}"? Esta acción es permanente.`)) return
    try { await deleteCategory(cat.id); load() }
    catch (err) { setError(err.response?.data?.error || 'Error al eliminar') }
  }

  // ── SubCategory handlers
  const openSubCreate = (categoryId) => { setSubName(''); setSubError(''); setSubModal({ mode: 'create', categoryId }) }
  const openSubEdit = (sub, categoryId) => { setSubName(sub.name); setSubError(''); setSubModal({ mode: 'edit', categoryId, sub }) }

  const handleSubSubmit = async (e) => {
    e.preventDefault(); setSubLoading(true); setSubError('')
    try {
      if (subModal.mode === 'create') await createSubCategory(subModal.categoryId, subName.trim())
      else await updateSubCategory(subModal.sub.id, { name: subName.trim() })
      load(); setSubModal(null)
    } catch (err) { setSubError(err.response?.data?.error || 'Error') }
    finally { setSubLoading(false) }
  }

  const handleToggleSub = async (sub) => {
    try { await updateSubCategory(sub.id, { active: !sub.active }); load() }
    catch (err) { setError(err.response?.data?.error || 'Error') }
  }

  const handleDeleteSub = async (sub) => {
    if (!window.confirm(`¿Eliminar la subcategoría "${sub.name}"?`)) return
    try { await deleteSubCategory(sub.id); load() }
    catch (err) { setError(err.response?.data?.error || 'Error al eliminar') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{categories.length} categoría(s) registrada(s)</p>
        <button onClick={openCatCreate} className="btn-primary"><PlusCircle className="w-4 h-4" /> Nueva Categoría</button>
      </div>

      {error && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />{error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-500" /></div>
      ) : categories.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-500">Sin categorías aún. Crea una para empezar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="card overflow-hidden">
              {/* Category header */}
              <div className={`flex items-center gap-3 px-5 py-4 ${!cat.active ? 'opacity-60' : ''}`}>
                <button onClick={() => toggleExpanded(cat.id)} className="text-slate-400 hover:text-slate-200 transition-colors">
                  {expanded[cat.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <Tag className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="font-semibold text-slate-100 flex-1">{cat.name}</span>
                <span className="text-xs text-slate-500">{cat.subcategories?.length ?? 0} subcategorías · {cat._count?.tickets ?? 0} tickets</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${cat.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/8 text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {cat.active ? 'Activa' : 'Inactiva'}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openCatEdit(cat)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleToggleCat(cat)} className={`p-1.5 rounded-lg transition-colors ${cat.active ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/20' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20'}`} title={cat.active ? 'Desactivar' : 'Activar'}>
                    {cat.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openSubCreate(cat.id)} className="p-1.5 text-slate-400 hover:text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors" title="Agregar subcategoría"><PlusCircle className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteCat(cat)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors" title="Eliminar categoría"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Subcategories */}
              {expanded[cat.id] && (
                <div className="border-t border-white/8 bg-white/3">
                  {cat.subcategories?.length === 0 ? (
                    <p className="px-12 py-3 text-sm text-slate-500 italic">Sin subcategorías. Usa + para agregar una.</p>
                  ) : (
                    cat.subcategories.map(sub => (
                      <div key={sub.id} className={`flex items-center gap-3 px-12 py-2.5 border-b border-white/6 last:border-0 ${!sub.active ? 'opacity-50' : 'hover:bg-white/5'} transition-colors`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500/60 flex-shrink-0" />
                        <span className="text-sm text-slate-300 flex-1">{sub.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sub.active ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-500 bg-white/8'}`}>
                          {sub.active ? 'Activa' : 'Inactiva'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openSubEdit(sub, cat.id)} className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleToggleSub(sub)} className={`p-1 rounded transition-colors ${sub.active ? 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/20' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/20'}`}>
                            {sub.active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                          </button>
                          <button onClick={() => handleDeleteSub(sub)} className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      <Modal isOpen={!!catModal} onClose={() => setCatModal(null)} title={catModal?.mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'} size="sm">
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre de la categoría</label>
            <input type="text" className="input" placeholder="Ej: Infraestructura" value={catName} onChange={e => setCatName(e.target.value)} required autoFocus />
          </div>
          {catError && <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg px-3 py-2 text-sm text-rose-300">{catError}</div>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={catLoading} className="btn-primary">
              {catLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : catModal?.mode === 'create' ? 'Crear' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setCatModal(null)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* SubCategory Modal */}
      <Modal isOpen={!!subModal} onClose={() => setSubModal(null)} title={subModal?.mode === 'create' ? 'Nueva Subcategoría' : 'Editar Subcategoría'} size="sm">
        <form onSubmit={handleSubSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre de la subcategoría</label>
            <input type="text" className="input" placeholder="Ej: Computadora" value={subName} onChange={e => setSubName(e.target.value)} required autoFocus />
          </div>
          {subError && <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg px-3 py-2 text-sm text-rose-300">{subError}</div>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={subLoading} className="btn-primary">
              {subLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : subModal?.mode === 'create' ? 'Agregar' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setSubModal(null)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
const PRIORITY_CONFIG = [
  { key: 'LOW',      label: 'Baja',    color: 'text-slate-400',   dot: 'bg-slate-400'   },
  { key: 'MEDIUM',   label: 'Media',   color: 'text-cyan-400',    dot: 'bg-cyan-400'    },
  { key: 'HIGH',     label: 'Alta',    color: 'text-orange-400',  dot: 'bg-orange-400'  },
  { key: 'CRITICAL', label: 'Crítica', color: 'text-rose-400',    dot: 'bg-rose-400'    },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-violet-600' : 'bg-white/15'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function NotificationsTab() {
  const [settings, setSettings]     = useState([])
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // New recipient form
  const [addType, setAddType]   = useState('email') // 'email' | 'sms'
  const [addValue, setAddValue] = useState('')
  const [addName, setAddName]   = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [s, r] = await Promise.all([getNotificationSettings(), getRecipients()])
      setSettings(s)
      setRecipients(r)
    } catch {
      setError('Error al cargar configuración de notificaciones')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleToggle = async (priority, field, value) => {
    try {
      const updated = await updateNotificationSetting(priority, { [field]: value })
      setSettings(prev => prev.map(s => s.priority === priority ? { ...s, ...updated } : s))
    } catch {
      setError('Error al actualizar configuración')
    }
  }

  const handleAddRecipient = async (e) => {
    e.preventDefault()
    if (!addValue.trim()) return
    setAddLoading(true)
    setAddError('')
    try {
      const created = await createRecipient({ type: addType, value: addValue.trim(), name: addName.trim() })
      setRecipients(prev => [...prev, created])
      setAddValue('')
      setAddName('')
    } catch (err) {
      setAddError(err.response?.data?.error || 'Error al agregar destinatario')
    } finally {
      setAddLoading(false)
    }
  }

  const handleToggleRecipient = async (r) => {
    try {
      const updated = await updateRecipient(r.id, { active: !r.active })
      setRecipients(prev => prev.map(x => x.id === r.id ? { ...x, ...updated } : x))
    } catch {
      setError('Error al actualizar destinatario')
    }
  }

  const handleDeleteRecipient = async (id) => {
    try {
      await deleteRecipient(id)
      setRecipients(prev => prev.filter(x => x.id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar destinatario')
    }
  }

  const emailRecipients = recipients.filter(r => r.type === 'email')
  const smsRecipients   = recipients.filter(r => r.type === 'sms')

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Priority matrix */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-violet-400" />
            <h2 className="font-semibold text-slate-100">Activar por prioridad</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Define qué canal se activa según la prioridad del ticket</p>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-2 pr-6 text-slate-500 font-medium">Prioridad</th>
                  <th className="text-center py-2 px-6 text-slate-500 font-medium">
                    <span className="flex items-center justify-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
                  </th>
                  <th className="text-center py-2 px-6 text-slate-500 font-medium">
                    <span className="flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" /> SMS</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRIORITY_CONFIG.map(({ key, label, color, dot }) => {
                  const s = settings.find(x => x.priority === key)
                  return (
                    <tr key={key} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-6">
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          <span className={`font-medium ${color}`}>{label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center">
                          <Toggle checked={s?.emailEnabled ?? false} onChange={v => handleToggle(key, 'emailEnabled', v)} />
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center">
                          <Toggle checked={s?.smsEnabled ?? false} onChange={v => handleToggle(key, 'smsEnabled', v)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add recipient form */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-400" />
            <h2 className="font-semibold text-slate-100">Agregar destinatario</h2>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleAddRecipient} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Tipo</label>
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/8">
                <button type="button" onClick={() => setAddType('email')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${addType === 'email' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
                <button type="button" onClick={() => setAddType('sms')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${addType === 'sms' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Phone className="w-3.5 h-3.5" /> SMS
                </button>
              </div>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="label">{addType === 'email' ? 'Correo electrónico' : 'Número de teléfono'}</label>
              <input
                className="input"
                type={addType === 'email' ? 'email' : 'tel'}
                placeholder={addType === 'email' ? 'usuario@empresa.com' : '+521234567890'}
                value={addValue}
                onChange={e => setAddValue(e.target.value)}
                required
              />
            </div>
            <div className="min-w-[140px]">
              <label className="label">Nombre (opcional)</label>
              <input className="input" type="text" placeholder="Ej. Luis Pérez" value={addName} onChange={e => setAddName(e.target.value)} />
            </div>
            <button type="submit" disabled={addLoading} className="btn-primary self-end">
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Agregar</>}
            </button>
          </form>
          {addError && <p className="text-rose-400 text-sm mt-2">{addError}</p>}
        </div>
      </div>

      {/* Recipients list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email recipients */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <MailCheck className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-slate-100">Destinatarios Email</h2>
              <span className="ml-auto text-xs bg-white/8 text-slate-400 px-2 py-0.5 rounded-full">{emailRecipients.filter(r => r.active).length} activos</span>
            </div>
          </div>
          <div className="card-body space-y-2">
            {emailRecipients.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No hay destinatarios de email</p>
            ) : emailRecipients.map(r => (
              <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${r.active ? 'border-white/8 bg-white/3' : 'border-white/5 opacity-50'}`}>
                <Mail className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {r.name && <p className="text-xs font-medium text-slate-300 truncate">{r.name}</p>}
                  <p className="text-sm text-slate-400 truncate">{r.value}</p>
                </div>
                <button onClick={() => handleToggleRecipient(r)} className={`p-1 rounded transition-colors ${r.active ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-emerald-400'}`} title={r.active ? 'Desactivar' : 'Activar'}>
                  {r.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDeleteRecipient(r.id)} className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* SMS recipients */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-slate-100">Destinatarios SMS</h2>
              <span className="ml-auto text-xs bg-white/8 text-slate-400 px-2 py-0.5 rounded-full">{smsRecipients.filter(r => r.active).length} activos</span>
            </div>
          </div>
          <div className="card-body space-y-2">
            {smsRecipients.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No hay destinatarios SMS</p>
            ) : smsRecipients.map(r => (
              <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${r.active ? 'border-white/8 bg-white/3' : 'border-white/5 opacity-50'}`}>
                <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {r.name && <p className="text-xs font-medium text-slate-300 truncate">{r.name}</p>}
                  <p className="text-sm text-slate-400 truncate">{r.value}</p>
                </div>
                <button onClick={() => handleToggleRecipient(r)} className={`p-1 rounded transition-colors ${r.active ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-emerald-400'}`} title={r.active ? 'Desactivar' : 'Activar'}>
                  {r.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDeleteRecipient(r.id)} className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-4 text-sm text-indigo-300 space-y-1">
        <p className="font-semibold flex items-center gap-2"><Bell className="w-4 h-4" /> Cómo funciona</p>
        <p className="text-indigo-400">Cuando se crea un ticket, el sistema verifica su prioridad y envía la notificación a los destinatarios activos según los canales activados en la tabla de arriba.</p>
        <p className="text-indigo-400">Para SMS se requiere configurar las credenciales de Twilio en <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">Backend/.env</code>.</p>
      </div>
    </div>
  )
}

// ─── Sedes Tab ────────────────────────────────────────────────────────────────
function SedesTab() {
  const [sedes, setSedes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSede, setEditingSede] = useState(null)
  const [form, setForm] = useState({ nombre: '', serie: '', email: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)

  const load = () => {
    setLoading(true)
    getSedes(true).then(setSedes).catch(() => setError('Error al cargar sedes')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditingSede(null); setForm({ nombre: '', serie: '', email: '' }); setFormError(''); setModalOpen(true) }
  const openEdit   = (s) => { setEditingSede(s);   setForm({ nombre: s.nombre, serie: s.serie, email: s.email }); setFormError(''); setModalOpen(true) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('')
    try {
      if (editingSede) await updateSede(editingSede.id, form)
      else await createSede(form)
      load(); setModalOpen(false)
    } catch (err) { setFormError(err.response?.data?.error || 'Error al guardar') }
    finally { setFormLoading(false) }
  }

  const handleToggle = async (sede) => {
    try { await updateSede(sede.id, { active: !sede.active }); load() }
    catch (err) { setError(err.response?.data?.error || 'Error') }
  }

  const handleDelete = async () => {
    try { await deleteSede(confirmModal.id); load(); setConfirmModal(null) }
    catch (err) { setError(err.response?.data?.error || 'Error'); setConfirmModal(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-violet-400" /> Sedes registradas
        </h2>
        <button onClick={openCreate} className="btn-primary"><PlusCircle className="w-4 h-4" /> Nueva Sede</button>
      </div>

      {error && <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-300">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-500" /></div>
        ) : sedes.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No hay sedes registradas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="table-th">Sede</th>
                <th className="table-th w-28">Serie</th>
                <th className="table-th">Correo</th>
                <th className="table-th w-20 text-center">Usuarios</th>
                <th className="table-th w-24 text-center">Estado</th>
                <th className="table-th w-28 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sedes.map(s => (
                <tr key={s.id} className={`border-b border-white/6 last:border-0 transition-colors ${!s.active ? 'opacity-60' : 'hover:bg-violet-900/20'}`}>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="font-medium text-slate-200">{s.nombre}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-xs bg-white/10 text-slate-300 px-2 py-1 rounded">{s.serie}</span>
                  </td>
                  <td className="table-td text-sm text-slate-400">{s.email}</td>
                  <td className="table-td text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-slate-300 text-xs font-semibold">
                      {s._count?.users ?? 0}
                    </span>
                  </td>
                  <td className="table-td text-center">
                    <button onClick={() => handleToggle(s)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${s.active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-white/8 text-slate-400 border-white/10 hover:bg-white/12'}`}>
                      {s.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {s.active ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmModal(s)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingSede ? 'Editar Sede' : 'Nueva Sede'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre de la sede</label>
            <input className="input" placeholder="Ej: Cartago Dr. Max" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Serie <span className="text-slate-500 font-normal">(prefijo para reportes)</span></label>
            <input className="input uppercase" placeholder="Ej: CART" value={form.serie} onChange={e => setForm(f => ({ ...f, serie: e.target.value.toUpperCase() }))} required maxLength={10} />
          </div>
          <div>
            <label className="label">Correo de la sede</label>
            <input className="input" type="email" placeholder="optocartago@drmaxsalud.net" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          {formError && <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg px-3 py-2 text-sm text-rose-300">{formError}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={formLoading} className="btn-primary">
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSede ? 'Guardar cambios' : 'Crear sede'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title="Eliminar Sede" size="sm">
        <p className="text-slate-400 mb-6">¿Eliminar la sede <strong className="text-slate-200">{confirmModal?.nombre}</strong>? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className="btn-danger"><Trash2 className="w-4 h-4" /> Eliminar</button>
          <button onClick={() => setConfirmModal(null)} className="btn-secondary">Cancelar</button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'users',         label: 'Usuarios',        icon: Users   },
  { id: 'categories',    label: 'Categorías',       icon: Tag     },
  { id: 'sedes',         label: 'Sedes',            icon: MapPin  },
  { id: 'notifications', label: 'Notificaciones',   icon: Bell    },
]

export default function Admin() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/admin/categories'    ? 'categories'    :
    location.pathname === '/admin/notifications' ? 'notifications' :
    location.pathname === '/admin/sedes'         ? 'sedes'         : 'users'
  )

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Administración</h1>
        <p className="text-slate-400 text-sm mt-0.5">Gestiona usuarios, roles, categorías y configuración del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/8 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/8'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'users'         && <UsersTab />}
      {activeTab === 'categories'    && <CategoriesTab />}
      {activeTab === 'sedes'         && <SedesTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
    </div>
  )
}
