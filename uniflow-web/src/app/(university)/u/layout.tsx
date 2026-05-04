'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import UniflowLogo from '@/components/ui/UniflowLogo'
import {
  LayoutDashboard,
  BookOpen,
  Building2,
  Users,
  CalendarDays,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Settings,
  GraduationCap,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// ─── Role-based nav config ───────────────────────────────────────────────────

type Role = 'university_admin' | 'dean' | 'hod'

const NAV_ITEMS: Record<Role, { label: string; href: string; icon: React.ElementType }[]> = {
  university_admin: [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Faculties', href: '/faculties', icon: BookOpen },
    { label: 'Departments', href: '/departments', icon: Building2 },
    { label: 'Lecturers', href: '/lecturers', icon: Users },
    { label: 'Timetable', href: '/timetable', icon: CalendarDays },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  dean: [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Departments', href: '/departments', icon: Building2 },
    { label: 'Lecturers', href: '/lecturers', icon: Users },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  hod: [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Lecturers', href: '/lecturers', icon: Users },
    { label: 'Timetable', href: '/timetable', icon: CalendarDays },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  university_admin: 'University Admin',
  dean: 'Dean',
  hod: 'Head of Department',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function UniversityPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<{ name: string; email: string; role: Role } | null>(null)
  const [university, setUniversity] = useState<{ name: string; short_name: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (pathname !== '/login') {
          router.push('/login')
        } else {
          setLoading(false)
        }
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, university_id')
        .eq('id', session.user.id)
        .single()

      if (!profile || !['university_admin', 'dean', 'hod'].includes(profile.role)) {
        await supabase.auth.signOut()
        if (pathname !== '/login') {
          router.push('/login')
        } else {
          setLoading(false)
        }
        return
      }

      const { data: uni } = await supabase
        .from('universities')
        .select('name, short_name')
        .eq('id', profile.university_id)
        .single()

      setUser({ name: profile.full_name, email: session.user.email!, role: profile.role as Role })
      setUniversity(uni)
      setLoading(false)
    }
    loadSession()
  }, [pathname, router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand)' }} />
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif', fontSize: '14px' }}>Loading portal...</p>
      </div>
    </div>
  )

  // Skip sidebar/topbar for login page
  if (pathname === '/login') return <>{children}</>

  const navItems = NAV_ITEMS[user!.role] ?? []

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={mobile ? '' : 'desktop-sidebar'}
      style={{
        width: mobile ? '100%' : '260px',
        minHeight: '100vh',
        background: 'rgba(7,13,26,0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        position: mobile ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
      }}
    >
      {/* Logo + Uni Name */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <UniflowLogo size={32} />
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
            Uniflow
          </span>
        </div>
        {university && (
          <div style={{
            background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(37,99,235,0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={14} style={{ color: 'var(--brand)' }} />
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '11px', color: 'var(--brand)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {university.short_name}
              </span>
            </div>
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginLeft: '22px' }}>
              {university.name}
            </p>
          </div>
        )}
      </div>

      {/* Role Badge */}
      <div style={{ padding: '12px 20px' }}>
        <span style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
        }}>
          {ROLE_LABELS[user!.role]}
        </span>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '2px',
                textDecoration: 'none',
                background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                border: active ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon
                size={16}
                style={{ color: active ? 'var(--brand)' : 'var(--text-muted)', flexShrink: 0 }}
              />
              <span style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {label}
              </span>
              {active && (
                <ChevronRight size={12} style={{ color: 'var(--brand)', marginLeft: 'auto' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand), var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {user!.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user!.name}
            </p>
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user!.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={14} style={{ color: '#ef4444' }} />
          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '13px', color: '#ef4444', fontWeight: 500 }}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className="mobile-menu-btn"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '260px',
          height: '100vh',
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        <Sidebar mobile />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }} className="u-main-content">

        {/* Topbar */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(7,13,26,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'none',
            }}
          >
            {sidebarOpen
              ? <X size={20} style={{ color: 'var(--text-primary)' }} />
              : <Menu size={20} style={{ color: 'var(--text-primary)' }} />
            }
          </button>

          {/* Page context — filled in by each page via slot, for now blank */}
          <div />

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Bell size={15} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand), var(--gold))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                {user!.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 28px 40px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .u-main-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
