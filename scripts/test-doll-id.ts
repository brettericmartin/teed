/**
 * Test targeted doll/character keychain identification
 */
import { openai } from '../lib/openaiClient';
import { promises as fs } from 'fs';

async function main() {
  // Best frame showing the plush doll clearly
  const frameData = await fs.readFile('/tmp/keychain-frames/frame_023s.jpg');
  const base64 = `data:image/jpeg;base64,${frameData.toString('base64')}`;

  // Also the frame showing moth charm best
  const frameData2 = await fs.readFile('/tmp/keychain-frames/frame_019s.jpg');
  const base642 = `data:image/jpeg;base64,${frameData2.toString('base64')}`;

  console.log('Sending frames to GPT-4o for doll/charm identification...');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are a toy and collectible expert. There are TWO keychains/charms attached to a black bag in these images. Identify each one separately:

KEYCHAIN #1 (left side of bag): A plush doll keychain with a pink/salmon face, pink hair, big dark eyes, and a black fuzzy body/outfit. This appears to be a designer toy or collectible figure.

Could this be:
- A Skullpanda figure by Popmart?
- A Ddung doll?
- A Monchhichi?
- A Blythe doll keychain?
- A custom art doll?
- A Kewpie doll variant?
- Something from Sanrio, anime, or a specific franchise?

KEYCHAIN #2 (right side of bag, on the zipper): A silver metal charm that looks like a moth or butterfly with detailed filigree/cutout wings and a star above it.

Could this be:
- A death's head moth charm (Silence of the Lambs)?
- A luna moth design?
- A specific brand's charm (Vivienne Westwood, Alexander McQueen)?

For each, give your best identification with reasoning.

Return JSON:
{
  "keychain_1": {
    "identification": "Best guess name/character",
    "brand_or_franchise": "Brand, artist, or franchise",
    "type": "designer toy | plush | art doll | etc",
    "confidence": 75,
    "reasoning": "Why you think this is what it is"
  },
  "keychain_2": {
    "identification": "Best guess name/design",
    "brand_or_franchise": "Brand if identifiable",
    "type": "metal charm | pendant | etc",
    "confidence": 75,
    "reasoning": "Why you think this is what it is"
  }
}`,
        },
        { type: 'image_url', image_url: { url: base64, detail: 'high' } },
        { type: 'image_url', image_url: { url: base642, detail: 'high' } },
      ],
    }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
    temperature: 0.3,
  });

  console.log('\nGPT-4o result:');
  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
