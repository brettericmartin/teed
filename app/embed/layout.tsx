import '@/app/globals.css';
import './embed.css';

/**
 * Minimal layout for embeddable views.
 * - No navigation
 * - No footer
 * - Transparent background support
 * - Auto dark/light mode via CSS variables
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="embed-body">
        {children}
      </body>
    </html>
  );
}
