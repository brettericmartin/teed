import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { runVideoPipeline } from '@/lib/videoPipeline';
import type { PipelineEvent, PipelineOptions } from '@/lib/videoPipeline/types';

// ════════════════════════════════════════════════════════════════
// SSE Helper
// ════════════════════════════════════════════════════════════════

function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  const send = (event: PipelineEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    controller.enqueue(encoder.encode(data));
  };

  const close = () => {
    controller.close();
  };

  return { stream, send, close };
}

// ════════════════════════════════════════════════════════════════
// POST /api/video-to-bag/process
// Streams pipeline events via SSE
// ════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Admin-only endpoint
    await requireAdmin();

    const body = await request.json();
    const { videoUrl, options = {}, pipelineVersion } = body as {
      videoUrl: string;
      options?: PipelineOptions;
      pipelineVersion?: 'v1' | 'v2';
    };

    // Allow explicit version override from request body
    if (pipelineVersion) {
      options.pipelineVersion = pipelineVersion;
    }

    if (!videoUrl || typeof videoUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'videoUrl is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format — YouTube or TikTok
    const isYouTube = /(?:youtube\.com|youtu\.be)/.test(videoUrl) || /^[a-zA-Z0-9_-]{11}$/.test(videoUrl);
    const isTikTok = /tiktok\.com/i.test(videoUrl);
    if (!isYouTube && !isTikTok) {
      return new Response(JSON.stringify({ error: 'Only YouTube and TikTok URLs are supported' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[video-to-bag] Starting pipeline for: ${videoUrl}`);

    const { stream, send, close } = createSSEStream();

    // Run pipeline in background, streaming events
    (async () => {
      try {
        for await (const event of runVideoPipeline(videoUrl, options)) {
          send(event);
        }
      } catch (error) {
        console.error('[video-to-bag] Pipeline error:', error);
        send({
          type: 'pipeline_error',
          error: error instanceof Error ? error.message : 'Pipeline failed unexpectedly',
        });
      } finally {
        close();
      }
    })();

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message.includes('Unauthorized')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('[video-to-bag] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
