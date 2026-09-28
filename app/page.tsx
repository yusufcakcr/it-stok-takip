export const dynamic = "force-dynamic";
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  try {
    const session = await auth()
    if (session?.user) {
      redirect('/dashboard')
    }
  } catch (error) {
    // If redirect throws standard Next.js digest, let it bubble
    const digest = (error as { digest?: unknown } | null)?.digest
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Home auth error:', error)
  }
  redirect('/login')
}
