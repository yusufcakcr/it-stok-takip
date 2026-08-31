'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import {
  LayoutDashboard,
  Monitor,
  Key,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  LogOut,
  Server,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: { name: string; role: string; username: string }
}

const navItems = [
  { href: '/dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard },
  { href: '/hardware', label: 'Donanım', icon: Monitor },
  { href: '/licenses', label: 'Lisanslar', icon: Key },
  { href: '/consumables', label: 'Sarf Malzemesi', icon: Package },
  { href: '/logs', label: 'İşlem Logları', icon: ClipboardList },
  { href: '/reports', label: 'Raporlar', icon: BarChart3 },
]

const adminItems = [
  { href: '/admin/users', label: 'Kullanıcı Yönetimi', icon: Users },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ redirectTo: '/login' })
  }

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <Server className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-sm">IT Stok Takip</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          aria-label="Menü"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-50 transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm">IT Stok Takip</h1>
              <p className="text-xs text-muted-foreground">Yönetim Sistemi</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2">Ana Menü</p>
          {navItems?.map((item: any) => {
            const isActive = pathname === item.href || pathname?.startsWith?.(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}

          {user?.role === 'ADMIN' && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2 mt-4">Yönetim</p>
              {adminItems?.map((item: any) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                      isActive
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {user?.name?.charAt?.(0)?.toUpperCase?.() ?? 'K'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name ?? 'Kullanıcı'}</p>
              <p className="text-xs text-muted-foreground">{user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  )
}
