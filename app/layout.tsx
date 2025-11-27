import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import FeedbackWidget from "@/components/FeedbackWidget";
import Providers from "@/components/Providers";
import { createServerSupabase } from "@/lib/serverSupabase";

export const metadata: Metadata = {
  title: "Teed - Curations, Made Shareable",
  description: "Create and share curated collections of your favorite gear, kits, and loadouts.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user session for navigation
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let userHandle: string | undefined;
  let displayName: string | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle, display_name')
      .eq('id', user.id)
      .single();

    userHandle = profile?.handle;
    displayName = profile?.display_name;
  }

  return (
    <html lang="en">
      <body className="antialiased bg-[var(--base-background)]">
        <Providers>
          <Navigation
            userHandle={userHandle}
            displayName={displayName}
            isAuthenticated={!!user}
          />

          <main className="pt-nav-safe pb-20 md:pb-0">
            {children}
          </main>

          {/* Feedback widget for authenticated users */}
          {user && <FeedbackWidget />}
        </Providers>
      </body>
    </html>
  );
}
