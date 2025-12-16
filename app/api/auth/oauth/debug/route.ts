import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/oauth/debug
 * Debug endpoint to capture OAuth redirects and see what's being sent
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Capture all query parameters
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  console.log('OAuth Debug - Received params:', params);

  // Return a page showing what we received
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>OAuth Debug</title></head>
    <body style="font-family: monospace; padding: 20px;">
      <h1>OAuth Callback Debug</h1>
      <h2>Received Parameters:</h2>
      <pre>${JSON.stringify(params, null, 2)}</pre>
      <h2>Analysis:</h2>
      ${params.error ? `<p style="color: red;"><strong>ERROR:</strong> ${params.error}</p>` : ''}
      ${params.error_description ? `<p style="color: red;"><strong>Description:</strong> ${params.error_description}</p>` : ''}
      ${params.code ? `<p style="color: green;"><strong>SUCCESS:</strong> Got authorization code</p>` : ''}
      ${!params.error && !params.code ? '<p style="color: orange;"><strong>UNEXPECTED:</strong> No code or error received</p>' : ''}
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
