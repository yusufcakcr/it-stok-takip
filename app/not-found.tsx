import Link from 'next/link'
import { Server, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Server className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-6xl font-display font-extrabold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Sayfa Bulunamadı</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Aradığınız sayfa silinmiş, taşınmış veya hiç var olmamış olabilir.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <Home className="w-4 h-4" /> Gösterge Paneline Dön
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full sm:w-auto flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Giriş Sayfası
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
