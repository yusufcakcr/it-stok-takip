import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Providers } from '@/components/providers'
import { Sidebar } from '@/components/sidebar'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar user={{
          name: session.user.name ?? 'Kullanıcı',
          role: (session.user as any)?.role ?? 'USER',
          username: (session.user as any)?.username ?? '',
        }} />
        <main className="flex-1 min-w-0 md:ml-64 p-4 md:p-6 pt-16 md:pt-6 overflow-auto">
          {children}
        </main>
      </div>
    </Providers>
  )
}
