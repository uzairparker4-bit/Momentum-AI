import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.startsWith("REPLACE") || key.startsWith("REPLACE")) {
    return null;
  }
  return createClient(url, key);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const supabase = getSupabaseAdmin();
      if (!supabase) return true; // dev mode without keys
      const { error } = await supabase.from("users").upsert(
        {
          email: user.email,
          name: user.name ?? null,
          google_id: user.id ?? null,
          avatar_url: user.image ?? null,
        },
        { onConflict: "email" }
      );
      if (error) console.error("[Auth] Supabase upsert error:", error.message);
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { data } = await supabase
            .from("users")
            .select("id")
            .eq("email", user.email)
            .single();
          if (data) token.supabaseUserId = data.id;
        }
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.supabaseUserId) {
        session.user.id = token.supabaseUserId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
