import type { NextAuthConfig } from "next-auth";

/**
 * Lightweight Auth.js configuration for Edge / Proxy runtime.
 * Strictly no Prisma or bcrypt dependencies here.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role;
        token.email = user.email as string;
        token.name = user.name as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: [], // Populated in src/lib/auth.ts with full Credentials provider
};

