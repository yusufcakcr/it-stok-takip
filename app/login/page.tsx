'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Monitor, Lock, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: username,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('Kullanıcı adı veya şifre hatalı')
      } else {
        router.replace('/dashboard')
      }
    } catch {
      setError('Giriş yapılırken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">IT Stok Takip</h1>
          <p className="text-muted-foreground mt-1">Sisteme giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 space-y-4" style={{ boxShadow: 'var(--shadow-md)' }}>
          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Kullanıcı Adı veya E-posta</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="pl-10"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Giriş Yap
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{' '}
            <Link href="/signup" className="text-primary hover:underline">Kayıt Ol</Link>
          </p>

          <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground/80">Varsayılan Yönetici Bilgileri:</p>
            <p>Kullanıcı: <code className="text-primary font-mono">admin</code> | Şifre: <code className="text-primary font-mono">admin123</code></p>
          </div>
        </form>
      </div>
    </div>
  )
}
