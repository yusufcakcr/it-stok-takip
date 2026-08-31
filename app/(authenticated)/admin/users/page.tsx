'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Plus, Trash2, KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function UsersAdminPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', email: '', name: '', password: '', role: 'USER' })
  const [addLoading, setAddLoading] = useState(false)
  const [resetPwId, setResetPwId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) setUsers(await res.json())
    } catch (e: any) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin, fetchUsers])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.username?.trim() || !newUser.email?.trim() || !newUser.password) {
      toast.error('Zorunlu alanları doldurunuz')
      return
    }
    if (newUser.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }

    setAddLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Kullanıcı oluşturulamadı')
      } else {
        // If role was selected as ADMIN, update it via /api/users
        if (newUser.role === 'ADMIN' && data?.id) {
          await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.id, role: 'ADMIN' }),
          })
        }
        toast.success('Kullanıcı başarıyla oluşturuldu')
        setShowAdd(false)
        setNewUser({ username: '', email: '', name: '', password: '', role: 'USER' })
        fetchUsers()
      }
    } catch {
      toast.error('Bağlantı hatası')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (id === session?.user?.id) {
      toast.error('Kendi hesabınızı silemezsiniz')
      return
    }
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Kullanıcı silindi')
      fetchUsers()
    } else {
      toast.error(data?.error ?? 'Silme işlemi başarısız')
    }
  }

  const handleResetPassword = async () => {
    if (!resetPwId || !newPassword) return
    if (newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır')
      return
    }
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resetPwId, password: newPassword }),
    })
    if (res.ok) {
      toast.success('Kullanıcı şifresi güncellendi')
      setResetPwId(null)
      setNewPassword('')
    } else {
      toast.error('Şifre güncellenemedi')
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border p-8">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-3" />
        <h2 className="text-lg font-bold">Erişim Yetkisi Yok</h2>
        <p className="text-muted-foreground text-sm mt-1">Bu sayfaya erişim yalnızca Sistem Yöneticisi (ADMIN) rolüne açıktır.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> Kullanıcı Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">Sistem kullanıcılarını ve rollerini yönetin (Maksimum 5 kullanıcı)</p>
        </div>
        <Button onClick={() => setShowAdd(true)} disabled={(users?.length ?? 0) >= 5}>
          <Plus className="w-4 h-4" /> Kullanıcı Ekle
        </Button>
      </div>

      {(users?.length ?? 0) >= 5 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 text-sm text-amber-400 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Maksimum kullanıcı sayısına (5/5) ulaşıldı. Yeni kullanıcı eklemek için mevcut bir kullanıcıyı silmelisiniz.</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-xl shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kullanıcı</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">E-posta</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Rol</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kayıt Tarihi</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user: any) => {
                const isCurrent = user?.id === session?.user?.id
                return (
                  <tr key={user?.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold text-xs text-primary">
                          {user?.name?.charAt?.(0)?.toUpperCase?.() ?? 'K'}
                        </div>
                        <div>
                          <p>{user?.name ?? user?.username ?? '-'}</p>
                          <p className="text-xs text-muted-foreground font-mono">@{user?.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{user?.email ?? '-'}</td>
                    <td className="py-3 px-4">
                      {user?.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Yönetici
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border px-2.5 py-0.5 rounded-full font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" /> Kullanıcı
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs font-mono">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setResetPwId(user?.id)} title="Şifre Sıfırla">
                          <KeyRound className="w-4 h-4" /> Şifre
                        </Button>
                        {!isCurrent && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user?.id)} title="Kullanıcıyı Sil">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h3 className="font-display font-semibold mb-4 text-lg">Yeni Kullanıcı Ekle</h3>
            <form onSubmit={handleAdd} className="space-y-3.5">
              <div>
                <label className="text-sm font-medium">Kullanıcı Adı <span className="text-destructive">*</span></label>
                <Input value={newUser.username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="Örn: ahmet" required />
              </div>
              <div>
                <label className="text-sm font-medium">E-posta <span className="text-destructive">*</span></label>
                <Input type="email" value={newUser.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="Örn: ahmet@itstok.com" required />
              </div>
              <div>
                <label className="text-sm font-medium">Ad Soyad</label>
                <Input value={newUser.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Ahmet Can" />
              </div>
              <div>
                <label className="text-sm font-medium">Şifre (Min. 6 Karakter) <span className="text-destructive">*</span></label>
                <Input type="password" minLength={6} value={newUser.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
              </div>
              <div>
                <label className="text-sm font-medium">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUser(p => ({ ...p, role: e.target.value }))}
                  className="w-full h-10 bg-muted border border-input rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                >
                  <option value="USER">Kullanıcı (Standart - Loglanır)</option>
                  <option value="ADMIN">Yönetici (Admin - Loglanmaz)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">İptal</Button>
                <Button type="submit" className="flex-1" loading={addLoading}>Kullanıcı Oluştur</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {resetPwId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setResetPwId(null)}>
          <div className="bg-card rounded-xl p-6 w-full max-w-sm border border-border shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h3 className="font-display font-semibold mb-4 text-lg">Şifre Sıfırla</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Yeni Şifre (Min. 6 Karakter)</label>
                <Input type="password" minLength={6} value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} placeholder="Yeni şifre..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setResetPwId(null)} className="flex-1">İptal</Button>
                <Button onClick={handleResetPassword} className="flex-1" disabled={!newPassword || newPassword.length < 6}>Şifreyi Güncelle</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
