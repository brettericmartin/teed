export {};

/**
 * Fetch YouTube transcript using the Innertube API directly.
 * This bypasses the timedtext API which is often blocked.
 */

const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

async function fetchTranscriptInnertube(videoId: string) {
  // Step 1: Fetch the YouTube page to get session data
  const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  const html = await pageResp.text();

  // Extract serialized share entity for transcript
  // We need to get the params for the transcript endpoint
  const configMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;\s*var\s/);
  if (configMatch === null) {
    console.log('Could not find player response');
    return;
  }

  const playerResponse = JSON.parse(configMatch[1]);

  // Check for captions
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (captionTracks) {
    console.log('Caption tracks available:', captionTracks.length);

    // Try fetching with the page's cookies (session)
    const cookies = pageResp.headers.get('set-cookie') || '';
    const enTrack = captionTracks.find((t: { languageCode: string }) => t.languageCode === 'en');

    if (enTrack) {
      // Try fetching with fmt=json3 and the page cookies
      const captionUrl = enTrack.baseUrl + '&fmt=json3';
      console.log('Trying json3 format with cookies...');

      const captionResp = await fetch(captionUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies,
          'Referer': `https://www.youtube.com/watch?v=${videoId}`,
        }
      });
      const text = await captionResp.text();
      console.log('json3 response length:', text.length);

      if (text.length > 0) {
        try {
          const data = JSON.parse(text);
          const events = data.events || [];
          console.log('Events:', events.length);
          return;
        } catch {
          console.log('Not valid JSON, first 200 chars:', text.slice(0, 200));
        }
      }
    }
  }

  // Fallback: Use Innertube get_transcript API
  console.log('\nTrying Innertube get_transcript API...');

  // We need the serializedShareEntity or the params
  // The transcript panel is loaded via engagement panels
  const engagementPanels = playerResponse?.engagementPanels;
  if (engagementPanels) {
    console.log('Engagement panels:', engagementPanels.length);
  }

  // Try the Innertube transcript endpoint
  const transcriptResp = await fetch(`https://www.youtube.com/youtubei/v1/get_transcript?key=${INNERTUBE_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify({
      context: {
        client: {
          hl: 'en',
          gl: 'US',
          clientName: 'WEB',
          clientVersion: '2.20240101.01.00',
        }
      },
      params: Buffer.from(`\n\x0b${videoId}`).toString('base64')
    })
  });

  const transcriptData = await transcriptResp.json();
  console.log('Innertube response status:', transcriptResp.status);

  // Navigate the response to find transcript segments
  const body = transcriptData?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer?.body?.transcriptBodyRenderer;
  const cueGroups = body?.cueGroups;

  if (cueGroups && cueGroups.length > 0) {
    console.log(`Found ${cueGroups.length} cue groups`);

    const segments: Array<{ startMs: number; text: string }> = [];
    for (const group of cueGroups) {
      const cues = group?.transcriptCueGroupRenderer?.cues;
      if (cues) {
        for (const cue of cues) {
          const renderer = cue?.transcriptCueRenderer;
          if (renderer) {
            segments.push({
              startMs: parseInt(renderer.startOffsetMs || '0'),
              text: renderer.cue?.simpleText || '',
            });
          }
        }
      }
    }

    console.log(`Parsed ${segments.length} segments`);

    // Search for key product terms
    const keywords = ['opus', 'wedge', 'tcb', 'apex', 'utility', 'triple diamond', 'putter', 'ai one', 'chrome tour', '3 wood', 'fairway', 'iron'];

    console.log('\n=== KEYWORD MATCHES ===');
    for (const seg of segments) {
      const text = seg.text.toLowerCase();
      for (const kw of keywords) {
        if (text.includes(kw)) {
          const mins = Math.floor(seg.startMs / 60000);
          const secs = Math.floor((seg.startMs % 60000) / 1000);
          console.log(`  [${mins}:${String(secs).padStart(2, '0')}] ${seg.text}  (matched: ${kw})`);
          break;
        }
      }
    }

    // Show total text
    const fullText = segments.map(s => {
      const mins = Math.floor(s.startMs / 60000);
      const secs = Math.floor((s.startMs % 60000) / 1000);
      return `[${mins}:${String(secs).padStart(2, '0')}] ${s.text}`;
    }).join('\n');
    console.log(`\nFull timestamped transcript: ${fullText.length} chars`);
    console.log('\nFirst 10 segments:');
    for (const seg of segments.slice(0, 10)) {
      const mins = Math.floor(seg.startMs / 60000);
      const secs = Math.floor((seg.startMs % 60000) / 1000);
      console.log(`  [${mins}:${String(secs).padStart(2, '0')}] ${seg.text}`);
    }
  } else {
    console.log('No transcript cue groups found');
    console.log('Response keys:', Object.keys(transcriptData || {}));
    if (transcriptData?.actions) {
      console.log('Actions:', JSON.stringify(transcriptData.actions).slice(0, 500));
    }
  }
}

fetchTranscriptInnertube('FseNrxffbCc').catch(console.error);
