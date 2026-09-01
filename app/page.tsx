export const dynamic = "force-dynamic";
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  try {
    const session = await auth()
    if (session?.user) {
      redirect('/dashboard')
    }
  } catch (error: any) {
    // If redirect throws standard Next.js digest, let it bubble
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Home auth error:', error)
  }
  redirect('/login')
}
