import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { passwordFingerprint, syncToken } from '@/lib/session-token'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.email as string },
              { username: credentials.email as string },
            ],
          },
        })
        if (!user) return null
        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.username,
          role: user.role,
          username: user.username,
          pwd: passwordFingerprint(user.password),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.username = user.username
        token.pwd = user.pwd
        return token
      }
      // Silinen hesap, düşürülen rol ve değişen parola bir sonraki istekte geçerli olsun
      if (!token.id) return null
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: { role: true, username: true, name: true, email: true, password: true },
      })
      return syncToken(token, dbUser)
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
        session.user.username = token.username
      }
      return session
    },
  },
})
