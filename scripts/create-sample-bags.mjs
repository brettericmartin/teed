import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars from .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Popular bags with realistic items based on YouTube/influencer equipment lists
const sampleBags = [
  {
    title: "Pro Golf Bag",
    description: "My complete golf setup for the 2024 season",
    category: "golf",
    items: [
      { name: "TaylorMade Stealth 2 Driver", brand: "TaylorMade", notes: "10.5° loft, Ventus shaft" },
      { name: "Titleist TSR2 3-Wood", brand: "Titleist", notes: "15° loft" },
      { name: "Callaway Paradym 5-Hybrid", brand: "Callaway", notes: "25°" },
      { name: "Titleist T200 Irons (5-PW)", brand: "Titleist", notes: "Dynamic Gold S300 shafts" },
      { name: "Vokey SM9 50° Wedge", brand: "Titleist", notes: "F Grind" },
      { name: "Vokey SM9 54° Wedge", brand: "Titleist", notes: "S Grind" },
      { name: "Vokey SM9 58° Wedge", brand: "Titleist", notes: "M Grind" },
      { name: "Scotty Cameron Phantom X 11", brand: "Scotty Cameron", notes: "34 inch" },
      { name: "Pro V1x Golf Balls", brand: "Titleist", notes: "One dozen" },
      { name: "Sun Mountain 4.5 LS Stand Bag", brand: "Sun Mountain", notes: "Navy/White" },
      { name: "Bushnell Pro X3 Rangefinder", brand: "Bushnell", notes: "Slope edition" },
      { name: "FootJoy Pro SL Shoes", brand: "FootJoy", notes: "Size 10, White" },
    ]
  },
  {
    title: "YouTube Creator Kit",
    description: "My complete video production setup for creating content",
    category: "photography",
    items: [
      { name: "Sony A7 IV Mirrorless Camera", brand: "Sony", notes: "Main camera body" },
      { name: "Sony 24-70mm f/2.8 GM II", brand: "Sony", notes: "Primary lens" },
      { name: "Sony 85mm f/1.4 GM", brand: "Sony", notes: "Portrait/B-roll lens" },
      { name: "DJI RS 3 Pro Gimbal", brand: "DJI", notes: "For smooth video" },
      { name: "Rode VideoMic Pro+", brand: "Rode", notes: "On-camera audio" },
      { name: "Shure SM7B Microphone", brand: "Shure", notes: "Podcast/voiceover" },
      { name: "Elgato Key Light Air (2x)", brand: "Elgato", notes: "LED panel lights" },
      { name: "Peak Design Travel Tripod", brand: "Peak Design", notes: "Carbon fiber" },
      { name: "Samsung T7 Shield 2TB SSD", brand: "Samsung", notes: "Portable storage" },
      { name: "Apple MacBook Pro 16\" M3 Max", brand: "Apple", notes: "Editing machine" },
    ]
  },
  {
    title: "Backpacking Essentials",
    description: "Ultralight gear for multi-day wilderness trips",
    category: "outdoor",
    items: [
      { name: "Osprey Exos 58 Backpack", brand: "Osprey", notes: "Ultralight, 58L" },
      { name: "Big Agnes Copper Spur HV UL2", brand: "Big Agnes", notes: "2-person tent" },
      { name: "Therm-a-Rest NeoAir XLite", brand: "Therm-a-Rest", notes: "Sleeping pad" },
      { name: "Western Mountaineering UltraLite", brand: "Western Mountaineering", notes: "20°F sleeping bag" },
      { name: "Jetboil Flash Cooking System", brand: "Jetboil", notes: "Fast boil stove" },
      { name: "Sawyer Squeeze Water Filter", brand: "Sawyer", notes: "Lightweight filtration" },
      { name: "Black Diamond Spot 400 Headlamp", brand: "Black Diamond", notes: "400 lumens" },
      { name: "Garmin inReach Mini 2", brand: "Garmin", notes: "Satellite communicator" },
      { name: "Sea to Summit Aeros Pillow", brand: "Sea to Summit", notes: "Ultralight pillow" },
      { name: "Darn Tough Hiker Socks (3 pairs)", brand: "Darn Tough", notes: "Merino wool" },
    ]
  },
  {
    title: "Everyday Carry",
    description: "What I carry with me every day",
    category: "lifestyle",
    items: [
      { name: "iPhone 15 Pro Max", brand: "Apple", notes: "256GB, Natural Titanium" },
      { name: "Apple Watch Ultra 2", brand: "Apple", notes: "Orange Alpine Loop" },
      { name: "AirPods Pro 2nd Gen", brand: "Apple", notes: "USB-C case" },
      { name: "Bellroy Slim Sleeve Wallet", brand: "Bellroy", notes: "Black leather" },
      { name: "Orbitkey Key Organizer", brand: "Orbitkey", notes: "Leather, holds 7 keys" },
      { name: "Fisher Space Pen Bullet", brand: "Fisher", notes: "Chrome finish" },
      { name: "Leatherman Free P4", brand: "Leatherman", notes: "Multi-tool" },
      { name: "Anker 737 Power Bank", brand: "Anker", notes: "24,000mAh" },
      { name: "Ridge Wallet", brand: "Ridge", notes: "Titanium, money clip" },
      { name: "Oakley Holbrook Sunglasses", brand: "Oakley", notes: "Prizm lenses" },
    ]
  },
  {
    title: "Home Gym Setup",
    description: "Complete home fitness equipment",
    category: "fitness",
    items: [
      { name: "Rogue Ohio Power Bar", brand: "Rogue", notes: "20kg, bare steel" },
      { name: "Rogue Echo Bumper Plates", brand: "Rogue", notes: "370lb set" },
      { name: "Rogue Monster Rack", brand: "Rogue", notes: "RML-490C" },
      { name: "Rogue Adjustable Bench 3.0", brand: "Rogue", notes: "FID bench" },
      { name: "Concept2 Model D Rower", brand: "Concept2", notes: "PM5 monitor" },
      { name: "Bowflex SelectTech 552", brand: "Bowflex", notes: "Adjustable dumbbells" },
      { name: "TRX Pro4 System", brand: "TRX", notes: "Suspension trainer" },
      { name: "Rogue Echo Bike", brand: "Rogue", notes: "Air bike" },
      { name: "Horse Stall Mats (6x)", brand: "Generic", notes: "4'x6' rubber" },
      { name: "Whoop 4.0 Fitness Tracker", brand: "Whoop", notes: "Recovery tracking" },
    ]
  },
  {
    title: "Digital Nomad Travel Kit",
    description: "Everything I need to work and travel anywhere",
    category: "travel",
    items: [
      { name: "Peak Design Travel Backpack 45L", brand: "Peak Design", notes: "Carry-on size" },
      { name: "MacBook Air 15\" M3", brand: "Apple", notes: "16GB, Space Gray" },
      { name: "Sony WH-1000XM5", brand: "Sony", notes: "Noise cancelling headphones" },
      { name: "Anker Nano II 65W Charger", brand: "Anker", notes: "GaN, USB-C" },
      { name: "Roost Laptop Stand", brand: "Roost", notes: "Portable, adjustable" },
      { name: "Logitech MX Keys Mini", brand: "Logitech", notes: "Compact keyboard" },
      { name: "Logitech MX Anywhere 3", brand: "Logitech", notes: "Portable mouse" },
      { name: "Kindle Paperwhite", brand: "Amazon", notes: "11th gen" },
      { name: "Away Carry-On Suitcase", brand: "Away", notes: "Built-in charger" },
      { name: "Aer Day Sling 3", brand: "Aer", notes: "Daily carry sling" },
    ]
  },
  {
    title: "Pro Desk Setup",
    description: "My optimized work from home setup",
    category: "workspace",
    items: [
      { name: "Apple Studio Display", brand: "Apple", notes: "27\", 5K" },
      { name: "Mac Studio M2 Ultra", brand: "Apple", notes: "64GB RAM, 1TB SSD" },
      { name: "Herman Miller Aeron Chair", brand: "Herman Miller", notes: "Size B, Graphite" },
      { name: "Uplift V2 Standing Desk", brand: "Uplift", notes: "72\" walnut top" },
      { name: "Keychron Q1 Pro", brand: "Keychron", notes: "Gateron Brown switches" },
      { name: "Logitech MX Master 3S", brand: "Logitech", notes: "Space Gray" },
      { name: "CalDigit TS4 Thunderbolt Dock", brand: "CalDigit", notes: "18 ports" },
      { name: "Elgato Wave:3 Microphone", brand: "Elgato", notes: "USB condenser" },
      { name: "BenQ ScreenBar Halo", brand: "BenQ", notes: "Monitor light bar" },
      { name: "Grovemade Desk Shelf", brand: "Grovemade", notes: "Walnut" },
    ]
  },
  {
    title: "Gaming Battle Station",
    description: "High-end PC gaming setup",
    category: "gaming",
    items: [
      { name: "NVIDIA RTX 4090", brand: "NVIDIA", notes: "Founders Edition" },
      { name: "AMD Ryzen 9 7950X3D", brand: "AMD", notes: "16-core CPU" },
      { name: "ASUS ROG Swift PG32UCDM", brand: "ASUS", notes: "32\" 4K 240Hz OLED" },
      { name: "Corsair Dominator 64GB DDR5", brand: "Corsair", notes: "6000MHz" },
      { name: "Samsung 990 Pro 2TB NVMe", brand: "Samsung", notes: "Gen 4 SSD" },
      { name: "NZXT H7 Flow Case", brand: "NZXT", notes: "White, airflow" },
      { name: "Logitech G Pro X Superlight 2", brand: "Logitech", notes: "Wireless mouse" },
      { name: "Wooting 60HE Keyboard", brand: "Wooting", notes: "Analog switches" },
      { name: "SteelSeries Arctis Nova Pro", brand: "SteelSeries", notes: "Wireless headset" },
      { name: "Secretlab Titan Evo 2022", brand: "Secretlab", notes: "XL, Cookies & Cream" },
    ]
  },
  {
    title: "Skincare Routine",
    description: "My daily AM/PM skincare products",
    category: "beauty",
    items: [
      { name: "CeraVe Hydrating Cleanser", brand: "CeraVe", notes: "AM & PM" },
      { name: "Paula's Choice 2% BHA", brand: "Paula's Choice", notes: "Exfoliant, PM only" },
      { name: "The Ordinary Niacinamide 10%", brand: "The Ordinary", notes: "AM serum" },
      { name: "The Ordinary Hyaluronic Acid 2%", brand: "The Ordinary", notes: "Hydration" },
      { name: "CeraVe PM Facial Moisturizer", brand: "CeraVe", notes: "Nightly" },
      { name: "La Roche-Posay Anthelios SPF 50", brand: "La Roche-Posay", notes: "Daily sunscreen" },
      { name: "The Ordinary Retinol 0.5%", brand: "The Ordinary", notes: "Night, 2x week" },
      { name: "CeraVe Eye Repair Cream", brand: "CeraVe", notes: "AM & PM" },
      { name: "Neutrogena Hydro Boost Gel", brand: "Neutrogena", notes: "Extra hydration" },
      { name: "Aquaphor Lip Repair", brand: "Aquaphor", notes: "Lip care" },
    ]
  },
  {
    title: "Home Barista Setup",
    description: "Everything for cafe-quality coffee at home",
    category: "coffee",
    items: [
      { name: "Breville Barista Express Impress", brand: "Breville", notes: "Espresso machine" },
      { name: "Baratza Encore ESP", brand: "Baratza", notes: "Burr grinder" },
      { name: "Acaia Lunar Scale", brand: "Acaia", notes: "0.1g precision" },
      { name: "Fellow Stagg EKG Kettle", brand: "Fellow", notes: "Gooseneck, temp control" },
      { name: "Hario V60 Dripper", brand: "Hario", notes: "Size 02, ceramic" },
      { name: "AeroPress Original", brand: "AeroPress", notes: "Travel-friendly" },
      { name: "Fellow Atmos Canister", brand: "Fellow", notes: "Vacuum storage" },
      { name: "Rattleware Latte Art Pitcher", brand: "Rattleware", notes: "12oz" },
      { name: "Normcore WDT Tool", brand: "Normcore", notes: "Distribution tool" },
      { name: "Onyx Coffee Lab Subscription", brand: "Onyx", notes: "Fresh beans monthly" },
    ]
  },
];

async function createSampleBags() {
  console.log('Finding test user...\n');

  // Get the test user (or first available user)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .limit(5);

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log('Available users:');
  profiles.forEach(p => console.log(`  - ${p.display_name || p.handle} (${p.id})`));

  // Use the first user
  const testUser = profiles[0];
  console.log(`\nUsing user: ${testUser.display_name || testUser.handle}\n`);

  // Create each bag with items
  for (const bagData of sampleBags) {
    console.log(`Creating bag: "${bagData.title}"...`);

    // Generate a URL-friendly code
    const code = bagData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Check if bag already exists
    const { data: existing } = await supabase
      .from('bags')
      .select('id')
      .eq('owner_id', testUser.id)
      .eq('code', code)
      .single();

    if (existing) {
      console.log(`  Bag "${bagData.title}" already exists, skipping...`);
      continue;
    }

    // Create the bag
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .insert({
        owner_id: testUser.id,
        title: bagData.title,
        description: bagData.description,
        category: bagData.category,
        code: code,
        is_public: true,
      })
      .select()
      .single();

    if (bagError) {
      console.error(`  Error creating bag:`, bagError);
      continue;
    }

    console.log(`  Created bag with ID: ${bag.id}`);

    // Add items to the bag
    for (let i = 0; i < bagData.items.length; i++) {
      const item = bagData.items[i];

      const { error: itemError } = await supabase
        .from('bag_items')
        .insert({
          bag_id: bag.id,
          custom_name: item.name,
          custom_description: item.brand ? `Brand: ${item.brand}` : null,
          notes: item.notes,
          sort_index: i + 1,
          quantity: 1,
        });

      if (itemError) {
        console.error(`    Error adding item "${item.name}":`, itemError);
      }
    }

    console.log(`  Added ${bagData.items.length} items\n`);
  }

  console.log('Done! Created sample bags with items.');
}

createSampleBags().catch(console.error);
