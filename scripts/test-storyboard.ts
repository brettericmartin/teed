// Test: can we get storyboard spec from a YouTube video page?
const videoId = 'dQw4w9WgXcQ';
const url = 'https://www.youtube.com/watch?v=' + videoId;

async function main() {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
  const html = await res.text();

  console.log('HTML length:', html.length);
  console.log('Contains "storyboard":', html.includes('storyboard'));

  // Try to extract ytInitialPlayerResponse
  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;/);
  if (!match) {
    console.log('No ytInitialPlayerResponse found via simple regex');

    // Try a more targeted extraction
    const sbMatch = html.match(/"storyboards":\s*\{[^}]*"playerStoryboardSpecRenderer":\s*\{[^}]*"spec":\s*"([^"]+)"/);
    if (sbMatch) {
      console.log('Found storyboard spec via targeted regex!');
      console.log('Spec (first 500):', sbMatch[1].substring(0, 500));
    } else {
      // Try to find any storyboard reference
      const sbIdx = html.indexOf('storyboard');
      if (sbIdx >= 0) {
        console.log('Storyboard context:', html.substring(sbIdx - 50, sbIdx + 200));
      }
    }
    return;
  }

  try {
    const playerResp = JSON.parse(match[1]);
    const spec = playerResp?.storyboards?.playerStoryboardSpecRenderer?.spec;
    if (spec) {
      console.log('SPEC found! Length:', spec.length);
      console.log('Spec:', spec.substring(0, 500));
    } else {
      console.log('No storyboard spec in player response');
      console.log('Storyboard keys:', Object.keys(playerResp?.storyboards || {}));
    }
  } catch (e) {
    console.log('JSON parse failed, trying targeted extraction...');
    const sbMatch = html.match(/"spec":\s*"(https:\/\/i\.ytimg\.com\/sb\/[^"]+)"/);
    if (sbMatch) {
      console.log('Found spec via targeted regex!');
      console.log('Spec:', sbMatch[1].substring(0, 500));
    }
  }
}

main().catch(console.error);
