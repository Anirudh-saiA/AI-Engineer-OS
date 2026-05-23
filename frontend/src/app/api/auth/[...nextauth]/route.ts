import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_google_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder_google_client_secret",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "placeholder_nextauth_secret",
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Expose user ID from token
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirect sign-in screen back to the dynamic home page
  },
});

export { handler as GET, handler as POST };
