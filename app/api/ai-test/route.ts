import { generateItemDescription } from '@/lib/ai';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await generateItemDescription({ name: 'Test item' });
    return NextResponse.json({ description: result });
  } catch (error) {
    console.error('AI test error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


