import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getMyBarber } from '../lib/barbers'
import type { Barber, BarberRole } from '../lib/barbers'
import type { AdminContext } from '../lib/adminContext'

type Module = { to: string; label: string; icon: string }

const modules: Module[] = [
  { to: '/admin/agenda', label: 'Agenda', icon: '📅' },
  { to: '/admin/clients', label: 'Clients', icon: '👤' },
  { to: '/admin/services', label: 'Services', icon: '✂' },
  { to: '/admin/barbiers', label: 'Barbiers', icon: '💈' },
  { to: '/admin/parametres', label: 'Paramètres', icon: '⚙' },
]

type LayoutMode = 'desktop' | 'mobile'

function getLayoutMode(): LayoutMode {
  return localStorage.getItem('adminLayout') === 'mobile' ? 'mobile' : 'desktop'
}

export function AdminLayout() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [myBarber, setMyBarber] = useState<Barber | null>(null)
  const [myRole, setMyRole] = useState<BarberRole | null>(null)
  const [layout, setLayout] = useState<LayoutMode>(getLayoutMode)

  useEffect(() => {
    let active = true
    getMyBarber()
      .then((b) => {
        if (!active) return
        setMyBarber(b)
        setMyRole(b?.role ?? null)
      })
      .catch(() => {
        /* le rôle reste null : accès barbier par défaut */
      })
    return () => {
      active = false
    }
  }, [])

  function changeLayout(mode: LayoutMode) {
    setLayout(mode)
    localStorage.setItem('adminLayout', mode)
  }

  async function onSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  const ctx: AdminContext = { myBarber, myRole, isAdmin: myRole === 'admin' }
  const displayName = myBarber?.name ?? null

  /* ----- Bascule Desktop / Mobile (réutilisée dans les deux mises en page) ----- */
  const layoutToggle = (
    <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5 text-xs dark:border-stone-700 dark:bg-stone-800">
      {(['desktop', 'mobile'] as LayoutMode[]).map((m) => (
        <button
          key={m}
          onClick={() => changeLayout(m)}
          className={`rounded-md px-2.5 py-1 transition ${
            layout === m ? 'bg-amber-800 text-white' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'
          }`}
        >
          {m === 'desktop' ? 'Bureau' : 'Mobile'}
        </button>
      ))}
    </div>
  )

  /* ============================ MISE EN PAGE MOBILE ============================ */
  if (layout === 'mobile') {
    return (
      <div className="flex min-h-screen flex-col bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-100">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">CRM Signa - Barber Shop</div>
            <div className="truncate text-xs text-stone-500 dark:text-stone-400">
              {displayName ? `${displayName} · ` : ''}
              {session?.user.email}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {layoutToggle}
            <button
              onClick={onSignOut}
              className="rounded-lg px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
              aria-label="Se déconnecter"
            >
              Quitter
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-28">
          <Outlet context={ctx} />
        </main>

        {/* Barre de navigation en bas, façon application mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-stone-700 dark:bg-stone-800">
          {modules.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-amber-800 dark:text-amber-500' : 'text-stone-500 dark:text-stone-400'
                }`
              }
            >
              <span className="text-xl leading-none">{m.icon}</span>
              {m.label}
            </NavLink>
          ))}
        </nav>
      </div>
    )
  }

  /* ============================ MISE EN PAGE BUREAU ============================ */
  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800">
        <div className="border-b border-stone-200 px-5 py-4 dark:border-stone-700">
          <div className="text-sm font-semibold">Les Frères Barbiers</div>
          <div className="text-xs text-stone-500 dark:text-stone-400">CRM Signa - Barber Shop</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {modules.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-amber-800 text-white' : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'
                }`
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-stone-200 p-3 dark:border-stone-700">
          <div className="px-3 pb-2">
            {layoutToggle}
          </div>
          {displayName && <div className="truncate px-3 text-sm font-medium text-stone-700 dark:text-stone-200">{displayName}</div>}
          <div className="truncate px-3 pb-2 text-xs text-stone-500 dark:text-stone-400">{session?.user.email}</div>
          <button
            onClick={onSignOut}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet context={ctx} />
      </main>
    </div>
  )
}
