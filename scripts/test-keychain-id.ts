/**
 * Test targeted keychain/charm identification from hi-res frames
 * Sends multiple frames showing the keychains to GPT-4o
 */
import { openai } from '../lib/openaiClient';
import { promises as fs } from 'fs';

async function main() {
  // Frames where the keychains are most visible (45-55s range)
  const frameFiles = [
    '/tmp/keychain-frames/frame_045s.jpg',
    '/tmp/keychain-frames/frame_047s.jpg',
    '/tmp/keychain-frames/frame_049s.jpg',
    '/tmp/keychain-frames/frame_051s.jpg',
    '/tmp/keychain-frames/frame_053s.jpg',
    '/tmp/keychain-frames/frame_055s.jpg',
  ];

  const images: Array<{ type: 'image_url'; image_url: { url: string; detail: 'high' } }> = [];
  for (const file of frameFiles) {
    const data = await fs.readFile(file);
    images.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${data.toString('base64')}`,
        detail: 'high',
      },
    });
  }

  console.log(`Sending ${images.length} frames to GPT-4o...`);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are analyzing frames from a "What's in My Bag" ASMR YouTube video by GHOSTGIRL. These frames show a black leather bag with keychains/charms attached to it. The video creator is showing off the bag and its accessories around the 45-55 second mark.

TASK: Identify EVERY keychain, charm, and accessory attached to the bag. Be extremely detailed.

For EACH keychain/charm:
1. Describe exactly what you see - shape, color, material, any text or logos
2. Is it a character? If so, from what franchise? (e.g., Beavis and Butthead, Sanrio, anime, cartoon, movie)
3. Is it a plush/stuffed figure? What does the character look like?
4. Is it a metal charm? What shape/design?
5. Any brand markings visible?

Also describe the bag itself and any visible brand features.

Return JSON:
{
  "bag": {
    "brand": "Best guess brand based on design features",
    "model": "Model name",
    "confidence": 85,
    "features": "Key identifying design features"
  },
  "keychains": [
    {
      "description": "Detailed visual description",
      "character_or_brand": "Character name, franchise, or brand",
      "type": "plush | metal | rubber | other",
      "confidence": 70,
      "identification": "Best guess at what this is"
    }
  ]
}`,
        },
        ...images,
      ],
    }],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
    temperature: 0.3,
  });

  console.log('\nGPT-4o result:');
  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
