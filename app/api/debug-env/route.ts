import { NextResponse } from 'next/server';

// Temporary debug endpoint - DELETE AFTER FIXING
export async function GET() {
  const envVars = Object.keys(process.env)
    .filter(k => k.includes('SUPABASE') || k.includes('NEXT_PUBLIC'))
    .map(k => ({
      name: k,
      hasValue: !!process.env[k],
      length: process.env[k]?.length || 0,
      preview: process.env[k]?.substring(0, 15) + '...',
    }));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    supabaseEnvVars: envVars,
  });
}
