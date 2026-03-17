import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-[#080c14]">

      {/* Animated background blobs behind content */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="water-blob water-blob-1" style={{ opacity: 0.35 }} />
        <div className="water-blob water-blob-3" style={{ opacity: 0.25 }} />
        <div className="water-blob water-blob-4" style={{ opacity: 0.2 }} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 relative z-10">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50 animate-fade-in">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div key={location.key} className="page-transition">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
              <Outlet />
            </div>
          </div>
        </main>

        <footer className="relative z-10 border-t border-white/8 py-2.5 px-6 flex-shrink-0">
          <p className="text-center text-xs text-slate-500">
            © 2026 GLD S.A. &nbsp;|&nbsp; Desarrollado por JS
          </p>
        </footer>
      </div>
    </div>
  )
}
