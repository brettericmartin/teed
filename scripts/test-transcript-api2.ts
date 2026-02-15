export {};

async function main() {
  const pkg = await import('youtube-transcript-api');
  console.log('Package exports:', Object.keys(pkg));

  // Try different export patterns
  const Api = pkg.YoutubeTranscriptApi || pkg.default?.YoutubeTranscriptApi || pkg.default;
  console.log('Api type:', typeof Api);

  if (typeof Api === 'function' || typeof Api === 'object') {
    const methods = Object.getOwnPropertyNames(Api.prototype || Api).filter(m => m !== 'constructor');
    console.log('Methods:', methods);

    try {
      // Try getTranscript
      const result = await (Api.getTranscript || Api.fetchTranscript || Api)('FseNrxffbCc');
      console.log('Result type:', typeof result);
      if (Array.isArray(result)) {
        console.log('Items:', result.length);
        if (result.length > 0) console.log('First:', JSON.stringify(result[0]));
      } else {
        console.log('Result:', JSON.stringify(result).slice(0, 500));
      }
    } catch (err: any) {
      console.log('Error calling API:', err.message);
    }
  }
}

main().catch(console.error);
