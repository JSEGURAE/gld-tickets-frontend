export default function StatCard({ title, value, icon: Icon, color = 'indigo', subtitle, onClick }) {
  const colorMap = {
    indigo:  { bg: 'bg-indigo-500/15',  icon: 'text-indigo-400',  border: 'border-l-indigo-500' },
    emerald: { bg: 'bg-emerald-500/15', icon: 'text-emerald-400', border: 'border-l-emerald-500' },
    amber:   { bg: 'bg-amber-500/15',   icon: 'text-amber-400',   border: 'border-l-amber-500' },
    violet:  { bg: 'bg-violet-500/15',  icon: 'text-violet-400',  border: 'border-l-violet-500' },
    rose:    { bg: 'bg-rose-500/15',    icon: 'text-rose-400',    border: 'border-l-rose-500' },
    sky:     { bg: 'bg-sky-500/15',     icon: 'text-sky-400',     border: 'border-l-sky-500' },
    slate:   { bg: 'bg-white/10',       icon: 'text-slate-400',   border: 'border-l-slate-400' },
    // backwards compat aliases
    blue:    { bg: 'bg-indigo-500/15',  icon: 'text-indigo-400',  border: 'border-l-indigo-500' },
    green:   { bg: 'bg-emerald-500/15', icon: 'text-emerald-400', border: 'border-l-emerald-500' },
    yellow:  { bg: 'bg-amber-500/15',   icon: 'text-amber-400',   border: 'border-l-amber-500' },
    purple:  { bg: 'bg-violet-500/15',  icon: 'text-violet-400',  border: 'border-l-violet-500' },
  }
  const c = colorMap[color] || colorMap.indigo

  return (
    <div
      className={`card border-l-4 ${c.border} p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-100">{value ?? '–'}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${c.icon}`} />
          </div>
        )}
      </div>
    </div>
  )
}
