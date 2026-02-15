export {};

async function fetchTranscript(videoId: string) {
  // Step 1: Get the page and extract captions URL
  const resp = await fetch('https://www.youtube.com/watch?v=' + videoId, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  const html = await resp.text();

  // Extract ytInitialPlayerResponse
  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;\s*var\s/);
  if (match === null) {
    const match2 = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/);
    if (match2) {
      console.log('Found with alternate pattern, length:', match2[1].length);
    } else {
      console.log('Could not find ytInitialPlayerResponse');
    }
    return;
  }

  const playerResponse = JSON.parse(match[1]);
  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (captions === undefined || captions === null || captions.length === 0) {
    console.log('No caption tracks found');
    return;
  }

  console.log('Caption tracks:', captions.length);
  for (const track of captions) {
    console.log('  -', track.languageCode, track.kind || 'manual', track.name?.simpleText || '');
  }

  // Get the English auto-generated track
  const enTrack = captions.find((t: { languageCode: string }) => t.languageCode === 'en');
  if (enTrack === undefined) {
    console.log('No English track');
    return;
  }

  // Fetch the captions XML
  const captionUrl = enTrack.baseUrl;
  console.log('\nFetching captions from:', captionUrl.slice(0, 100));

  const captionResp = await fetch(captionUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  const xml = await captionResp.text();
  console.log('Caption response length:', xml.length);

  if (xml.length === 0) {
    console.log('Empty response - trying with cookies header...');
    return;
  }

  // Parse XML to extract text segments
  const segmentRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g;
  const segments: Array<{ start: number; dur: number; text: string }> = [];
  let m;
  while ((m = segmentRegex.exec(xml)) !== null) {
    segments.push({
      start: parseFloat(m[1]),
      dur: parseFloat(m[2]),
      text: m[3].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
    });
  }

  console.log(`\nParsed ${segments.length} segments`);

  // Search for key product terms
  const keywords = ['opus', 'wedge', 'tcb', 'apex', 'utility', 'triple diamond', 'putter', 'ai one', 'chrome tour', '3 wood', 'fairway', 'iron'];

  console.log('\n=== KEYWORD MATCHES ===');
  for (const seg of segments) {
    const text = seg.text.toLowerCase();
    for (const kw of keywords) {
      if (text.includes(kw)) {
        const mins = Math.floor(seg.start / 60);
        const secs = Math.floor(seg.start % 60);
        console.log(`  [${mins}:${String(secs).padStart(2, '0')}] ${seg.text}  (matched: ${kw})`);
        break;
      }
    }
  }

  // Show total transcript length
  const fullText = segments.map(s => {
    const mins = Math.floor(s.start / 60);
    const secs = Math.floor(s.start % 60);
    return `[${mins}:${String(secs).padStart(2, '0')}] ${s.text}`;
  }).join('\n');
  console.log(`\nFull timestamped transcript: ${fullText.length} chars`);
}

fetchTranscript('FseNrxffbCc').catch(console.error);
