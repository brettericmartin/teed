import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from the project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Sample golf equipment review transcript
const testTranscript = `
Hey everyone, welcome back to the channel. Today I'm doing a full bag review of my 2024 golf setup.
Let's start with my driver - I'm currently gaming the TaylorMade Stealth 2 Plus driver with a 9 degree
loft and the Project X HZRDUS Smoke Black shaft in stiff flex. It's been an absolute bomb for me this season.

Moving on to my three wood, I've got the Titleist TSR3 15 degree. I paired it with a Fujikura Ventus TR
Blue shaft and it's been super reliable off the deck. The adjustability on this thing is amazing.

For my hybrid, I'm using the Callaway Paradym X 19 degree. It replaced my old 3 iron and honestly I should
have made this switch years ago. The forgiveness is incredible.

My irons are the Ping i525 4 through pitching wedge. I've got these fitted with the True Temper Dynamic
Gold S300 shafts and MCC grips. The distance and control I get with these is phenomenal.

For wedges, I'm running a full Titleist Vokey SM9 setup - 50 degree gap wedge with 12 degrees of bounce,
54 degree sand wedge with 10 degrees, and a 58 degree lob wedge with 12. All in the brushed steel finish.

My putter is the Scotty Cameron Newport 2.5 34 inch with the Super Stroke mid slim grip. I've been using
Scotty putters for over a decade now and just can't switch.

For golf balls, I'm exclusively playing the Titleist Pro V1x. I tried the left dash version but came back
to the regular V1x. I go through about a dozen a month.

My bag is the Vessel Player IV stand bag in navy. It's super lightweight but has tons of storage. I love the
cooler pocket for hot days on the course.

And last but not least, my rangefinder is the Bushnell Pro XE. The slope feature has definitely helped me
dial in my club selection.

That's the full setup guys. Let me know in the comments if you have any questions about any of this gear.
And if you want to see me test some of the new 2025 equipment, hit that subscribe button. See you next time!
`;

console.log('Testing Transcript Processing');
console.log('Transcript length:', testTranscript.length, 'characters');
console.log('');

try {
  const response = await fetch('http://localhost:3000/api/ai/process-transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: testTranscript,
      bagType: 'Golf Bag',
      youtubeUrl: 'https://youtube.com/watch?v=example',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error);
    process.exit(1);
  }

  const result = await response.json();

  console.log('✅ Processing Complete');
  console.log('');
  console.log('Products Found:', result.products.length);
  console.log('Average Confidence:', result.totalConfidence);
  console.log('Processing Time:', result.processingTime, 'ms');
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  result.products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Brand: ${product.brand || 'N/A'}`);
    console.log(`   Category: ${product.category || 'N/A'}`);
    console.log(`   Description: ${product.description || 'N/A'}`);
    console.log(`   Confidence: ${(product.confidence * 100).toFixed(0)}%`);
    console.log(`   Reasoning: ${product.reasoning}`);
    if (product.metadata?.mentionContext) {
      console.log(`   Context: "${product.metadata.mentionContext}"`);
    }
    console.log('');
  });

} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
