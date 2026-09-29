import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

type AppRole = 'ADMIN' | 'USER';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: AppRole;
      username?: string;
    } & DefaultSession['user']; // includes name, email, image
  }

  interface User {
    id: string;
    role?: AppRole;
    username?: string;
    pwd?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: AppRole;
    username?: string;
    /** Parola hash özeti; parola değişince oturum düşer (bkz. lib/session-token.ts). */
    pwd?: string;
  }
}
