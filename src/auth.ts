import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { randomUUID } from "node:crypto";

import { verifyPassword } from "@/lib/auth/password";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getServerEnv("AUTH_SECRET"),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: SESSION_TTL_SECONDS,
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password || password.length > 128) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            passwordHash: true,
            emailVerifiedAt: true,
            status: true,
            ageAssurance: { select: { declaredAdult: true } },
          },
        });

        if (!user) return null;
        if (user.status !== "ACTIVE") return null;
        if (!user.emailVerifiedAt) return null;
        if (user.ageAssurance?.declaredAdult !== true) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const sessionId = randomUUID();
        const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

        await prisma.userSession.create({
          data: {
            userId: user.id,
            sessionToken: sessionId,
            expiresAt,
          },
        });

        token.sub = user.id;
        token.sid = sessionId;
        token.exp = Math.floor(expiresAt.getTime() / 1000);
      }

      if (!token.sub || typeof token.sid !== "string") return null;

      const activeSession = await prisma.userSession.findFirst({
        where: {
          userId: token.sub,
          sessionToken: token.sid,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          user: {
            status: "ACTIVE",
            emailVerifiedAt: { not: null },
            ageAssurance: { is: { declaredAdult: true } },
          },
        },
        select: { id: true },
      });

      if (!activeSession) return null;

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && typeof message.token?.sid === "string") {
        await prisma.userSession.updateMany({
          where: {
            sessionToken: message.token.sid,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      }
    },
  },
});
