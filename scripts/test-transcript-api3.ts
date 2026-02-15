export {};

async function main() {
  const pkg = await import('youtube-transcript-api');
  const TranscriptClient = pkg.default;
  const client = new TranscriptClient();

  try {
    const result = await client.getTranscript('FseNrxffbCc');
    console.log('Result type:', typeof result);
    if (Array.isArray(result)) {
      console.log('Items:', result.length);
      if (result.length > 0) {
        console.log('First:', JSON.stringify(result[0]));
        console.log('Last:', JSON.stringify(result[result.length - 1]));
      }

      // Search for keywords
      const keywords = ['opus', 'wedge', 'tcb', 'apex', 'utility', 'triple diamond', 'putter', 'ai one', 'chrome tour', '3 wood', 'fairway', 'iron'];
      console.log('\n=== KEYWORD MATCHES ===');
      for (const item of result) {
        const text = (item.text || item.snippet || '').toLowerCase();
        for (const kw of keywords) {
          if (text.includes(kw)) {
            const offset = item.offset || item.start || 0;
            const mins = Math.floor(offset / 60);
            const secs = Math.floor(offset % 60);
            console.log(`  [${mins}:${String(secs).padStart(2, '0')}] ${item.text || item.snippet}  (matched: ${kw})`);
            break;
          }
        }
      }
    } else {
      console.log('Result:', JSON.stringify(result).slice(0, 1000));
    }
  } catch (err: any) {
    console.log('Error:', err.message);
    console.log('Stack:', err.stack?.slice(0, 500));
  }
}

main().catch(console.error);
