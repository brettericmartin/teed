/**
 * Test targeted bag identification with hi-res frame
 */
import { openai } from '../lib/openaiClient';
import { promises as fs } from 'fs';

async function main() {
  const frameData = await fs.readFile('/tmp/bag-frames/hires_020s.jpg');
  const base64 = `data:image/jpeg;base64,${frameData.toString('base64')}`;

  const frameData2 = await fs.readFile('/tmp/bag-frames/hires_030s.jpg');
  const base642 = `data:image/jpeg;base64,${frameData2.toString('base64')}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are a fashion product analyst helping catalog items from a "What's in My Bag" video for a shopping recommendation app. Analyze this black leather bag and the keychains/charms attached to it.

For the BAG: Describe the design features (leather type, hardware style, strap construction, zipper placement, overall shape). Based on these features, what brand and model would this be listed as in a fashion catalog? Return your best assessment.

For each KEYCHAIN/CHARM attached to the bag: What is it? Is it a character (anime, cartoon, etc.)? What brand/franchise?

Return JSON:
{
  "bag": {
    "brand": "Best guess brand",
    "model": "Model name if identifiable",
    "confidence": 80,
    "features": "Key design features that identify this bag"
  },
  "keychains": [
    {
      "name": "Description",
      "brand": "Brand/franchise if identifiable",
      "confidence": 70
    }
  ]
}`
        },
        { type: 'image_url', image_url: { url: base64, detail: 'high' } },
        { type: 'image_url', image_url: { url: base642, detail: 'high' } },
      ],
    }],
    response_format: { type: 'json_object' },
    max_tokens: 500,
    temperature: 0.3,
  });

  console.log('GPT-4o result:');
  console.log(JSON.stringify(JSON.parse(response.choices[0]?.message?.content || '{}'), null, 2));
}

main().catch(console.error);
