import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone?: string | null;
      avatarStyle?: string;
      avatarSeed?: string;
    } & DefaultSession["user"];
  }
  interface User {
    phone?: string | null;
    avatarStyle?: string;
    avatarSeed?: string;
  }
}

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    ...googleProvider,
    // Legacy: custom OTP via DB
    Credentials({
      id: "phone-otp",
      credentials: { phone: {}, otp: {} },
      async authorize(credentials) {
        const phone = credentials?.phone as string | undefined;
        const otp   = credentials?.otp   as string | undefined;
        if (!phone || !otp) return null;

        const otpRecord = await prisma.otpCode.findFirst({
          where: { phone, code: otp, used: false, expires: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });
        if (!otpRecord) return null;

        await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              name: `User ${phone.slice(-4)}`,
              avatarStyle: "avataaars",
              avatarSeed: Math.random().toString(36).slice(2, 8),
            },
          });
        }
        return { id: user.id, name: user.name, email: user.email, image: user.image, phone: user.phone, avatarStyle: user.avatarStyle, avatarSeed: user.avatarSeed };
      },
    }),

    // Firebase phone auth — token verified client-side by Firebase
    Credentials({
      id: "firebase-phone",
      credentials: { idToken: {} },
      async authorize(credentials) {
        const idToken = credentials?.idToken as string | undefined;
        if (!idToken) return null;

        // Verify token via Firebase REST (no Admin SDK needed)
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) }
        );
        const data = await res.json();
        const fbUser = data.users?.[0];
        if (!fbUser?.phoneNumber) return null;

        const phone = fbUser.phoneNumber.replace(/^\+91/, "");

        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              name: `User ${phone.slice(-4)}`,
              avatarStyle: "avataaars",
              avatarSeed: Math.random().toString(36).slice(2, 8),
            },
          });
        }
        return { id: user.id, name: user.name, email: user.email, image: user.image, phone: user.phone, avatarStyle: user.avatarStyle, avatarSeed: user.avatarSeed };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.avatarStyle = user.avatarStyle;
        token.avatarSeed = user.avatarSeed;
      }
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) {
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.phone = dbUser.phone;
          token.avatarStyle = dbUser.avatarStyle;
          token.avatarSeed = dbUser.avatarSeed;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string | null | undefined;
        session.user.avatarStyle = token.avatarStyle as string | undefined;
        session.user.avatarSeed = token.avatarSeed as string | undefined;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
