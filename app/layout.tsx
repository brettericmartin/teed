import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import FeedbackWidget from "@/components/FeedbackWidget";
import Providers from "@/components/Providers";
import { createServerSupabase } from "@/lib/serverSupabase";

export const metadata: Metadata = {
  title: "Teed.club - Bags, made shareable",
  description: "Create and share curated collections of your favorite gear, kits, and loadouts.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

// Force dynamic rendering to ensure fresh user data (avatar, etc.)
export const dynamic = 'force-dynamic';

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
  let avatarUrl: string | undefined;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle, display_name, avatar_url, admin_role')
      .eq('id', user.id)
      .single();

    userHandle = profile?.handle;
    displayName = profile?.display_name;
    avatarUrl = profile?.avatar_url;
    isAdmin = !!profile?.admin_role;
  }

  return (
    <html lang="en">
      <head>
        {/* Linked here rather than @import in CSS so the browser finds the fonts sooner */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body className="antialiased bg-[var(--base-background)]">
        <Providers>
          <Navigation
            userHandle={userHandle}
            displayName={displayName}
            avatarUrl={avatarUrl}
            isAuthenticated={!!user}
            isAdmin={isAdmin}
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
