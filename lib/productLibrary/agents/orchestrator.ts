/**
 * Product Library Orchestrator
 *
 * Central coordinator for deploying and managing category and brand agents.
 * Handles task distribution, progress tracking, and result aggregation.
 */

import type {
  Category,
  AgentTask,
  OrchestratorState,
  ProductLibrary,
  BrandCatalog,
  Product,
} from '../schema';
import { saveLibrary, loadLibrary } from '../index';

// =============================================================================
// Types
// =============================================================================

export interface CategoryConfig {
  category: Category;
  priorityBrands: string[];
  subcategories: string[];
  specificationTemplate: Record<string, string>;
  retailers: string[];
}

export interface BrandAgentConfig {
  brandName: string;
  category: Category;
  officialUrl?: string;
  affiliateApiId?: string;
  productLines: string[];
  yearRange: { min: number; max: number };
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  products: Product[];
  errors?: string[];
  duration: number;
}

// =============================================================================
// Category Configurations
// =============================================================================

export const CATEGORY_CONFIGS: Partial<Record<Category, CategoryConfig>> = {
  golf: {
    category: 'golf',
    priorityBrands: [
      // Club Manufacturers
      'TaylorMade', 'Titleist', 'Callaway', 'Ping', 'Cobra', 'Cleveland', 'Mizuno', 'Srixon', 'Bridgestone', 'Wilson',
      // Balls & Accessories (TikTok viral)
      'Vice Golf', 'Kirkland Signature', 'Bushnell', 'Garmin', 'Blue Tees', 'Precision Pro',
      // Apparel (TikTok viral)
      'Travis Mathew', 'G/FORE', 'Bad Birdie', 'Peter Millar', 'Greyson',
      // Bags & Accessories
      'Vessel', 'Jones Sports', 'Sun Mountain', 'Ogio', 'Stitch Golf',
      // Training
      'Orange Whip', 'SuperSpeed Golf', 'Arccos', 'SkyTrak',
    ],
    subcategories: ['drivers', 'fairways', 'hybrids', 'irons', 'wedges', 'putters', 'bags', 'balls', 'rangefinders', 'apparel', 'accessories'],
    specificationTemplate: {
      clubType: '', loft: '', shaft: '', flex: '', length: '', headWeight: '', adjustability: '', modelYear: '',
    },
    retailers: [
      'Second Swing Golf', 'GlobalGolf', '2nd Swing', 'Golf Avenue', 'Rock Bottom Golf', '3balls',
      'Callaway Pre-Owned', 'TaylorMade Pre-Owned', 'PGA Superstore', 'Golf Galaxy',
    ],
  },
  tech: {
    category: 'tech',
    priorityBrands: [
      // Core Tech
      'Apple', 'Samsung', 'Sony', 'Bose', 'Microsoft', 'Google', 'Dell', 'Lenovo', 'JBL', 'Sonos',
      // TikTok Viral Audio
      'Aftershokz', 'Loop Experience', 'Skullcandy', 'Beats', 'Jabra', 'Anker', 'Audio-Technica',
      // TikTok Viral Gadgets
      'LARQ', 'Ember', 'Oura', 'Dyson', 'Anker', 'Belkin',
      // Smart Home
      'Nest', 'Ring', 'Philips Hue', 'ecobee', 'August',
    ],
    subcategories: ['phones', 'laptops', 'tablets', 'headphones', 'earbuds', 'speakers', 'smartwatches', 'smart-home', 'charging', 'wearables'],
    specificationTemplate: {
      productType: '', screenSize: '', storage: '', ram: '', processor: '', battery: '',
    },
    retailers: ['Best Buy', 'Amazon', 'B&H Photo', 'Adorama', 'Apple Store', 'Target'],
  },
  fashion: {
    category: 'fashion',
    priorityBrands: [
      // Athletic
      'Nike', 'Adidas', 'Lululemon', 'Under Armour', 'New Balance', 'ASICS', 'On Running', 'Hoka',
      // Outdoor
      'Patagonia', 'The North Face', 'Arc\'teryx', 'Allbirds',
      // TikTok Viral Fashion
      'H&M', 'Zara', 'Levi\'s', 'Aritzia', 'Skims', 'Alo Yoga', 'Vuori', 'Girlfriend Collective',
      // Luxury Athleisure
      'Rhone', 'Ten Thousand', 'Outdoor Voices',
      // Footwear
      'Birkenstock', 'Dr. Martens', 'Crocs', 'Vans', 'Converse',
    ],
    subcategories: ['jackets', 'pants', 'shirts', 'dresses', 'shoes', 'sneakers', 'accessories', 'athletic', 'loungewear'],
    specificationTemplate: {
      garmentType: '', material: '', fit: '', sizes: '', gender: '',
    },
    retailers: ['Nordstrom', 'REI', 'Dick\'s', 'Amazon', 'SSENSE', 'Net-a-Porter', 'Shopbop'],
  },
  makeup: {
    category: 'makeup',
    priorityBrands: [
      // Premium
      'Charlotte Tilbury', 'MAC', 'Fenty Beauty', 'Rare Beauty', 'NARS', 'Urban Decay', 'Too Faced', 'Tarte', 'Benefit', 'Glossier',
      // TikTok Viral Beauty
      'Clinique', 'ELF', 'Maybelline', 'Rhode', 'Summer Fridays', 'Drunk Elephant', 'The Ordinary', 'CeraVe',
      // K-Beauty (TikTok viral)
      'Beauty of Joseon', 'Medicube', 'Laneige', 'COSRX', 'Glow Recipe', 'Tatcha',
      // Clean Beauty
      'Merit', 'Ilia', 'Kosas', 'Tower 28', 'Saie',
    ],
    subcategories: ['lipstick', 'lip-gloss', 'foundation', 'concealer', 'eyeshadow', 'mascara', 'blush', 'bronzer', 'skincare', 'serums', 'moisturizer', 'sunscreen'],
    specificationTemplate: {
      productType: '', shade: '', finish: '', coverage: '', size: '',
    },
    retailers: ['Sephora', 'Ulta', 'Nordstrom', 'Amazon', 'Target', 'SpaceNK'],
  },
  outdoor: {
    category: 'outdoor',
    priorityBrands: [
      // Camping & Hiking
      'REI Co-op', 'The North Face', 'Osprey', 'MSR', 'Big Agnes', 'Kelty', 'Black Diamond', 'Nemo', 'Sea to Summit', 'Gregory',
      // TikTok Viral Outdoor
      'Stanley', 'Yeti', 'Hydro Flask', 'Klean Kanteen',
      // Budget Backpacking (TikTok)
      'Eureka', 'Klymit', 'Alps Mountaineering', 'Therm-a-Rest', 'Lightheart Gear',
      // Premium Outdoor
      'Hilleberg', 'Zpacks', 'Hyperlite Mountain Gear', 'Granite Gear',
    ],
    subcategories: ['tents', 'sleeping-bags', 'sleeping-pads', 'backpacks', 'stoves', 'water-filters', 'coolers', 'drinkware', 'clothing', 'footwear'],
    specificationTemplate: {
      productType: '', capacity: '', weight: '', dimensions: '', season: '',
    },
    retailers: ['REI', 'Backcountry', 'Moosejaw', 'Amazon', 'Campsaver', 'Enwild'],
  },
  photography: {
    category: 'photography',
    priorityBrands: [
      // Camera Bodies
      'Canon', 'Sony', 'Nikon', 'Fujifilm', 'Panasonic', 'Leica', 'OM System', 'Hasselblad',
      // Lenses
      'Sigma', 'Tamron', 'Zeiss', 'Viltrox', 'Samyang',
      // Drones (TikTok viral)
      'DJI', 'Autel', 'HoverAir', 'Potensic',
      // Action Cameras
      'GoPro', 'Insta360', 'DJI Action',
      // TikTok Viral (Canon G7x famous)
      'Peak Design', 'Moment', 'Smallrig',
    ],
    subcategories: ['mirrorless', 'dslr', 'compact', 'lenses', 'tripods', 'gimbals', 'lighting', 'bags', 'drones', 'action-cameras', '360-cameras'],
    specificationTemplate: {
      productType: '', sensorSize: '', megapixels: '', mount: '', focalLength: '',
    },
    retailers: ['B&H Photo', 'Adorama', 'Amazon', 'Best Buy', 'KEH Camera', 'MPB'],
  },
  gaming: {
    category: 'gaming',
    priorityBrands: [
      // Consoles
      'Sony PlayStation', 'Microsoft Xbox', 'Nintendo', 'Steam Deck',
      // Peripherals
      'Razer', 'Logitech', 'SteelSeries', 'Corsair', 'HyperX', 'ASUS ROG', 'MSI',
      // TikTok Viral Gaming
      'Turtle Beach', 'SCUF', 'Elgato', 'NZXT', 'Secretlab',
      // VR (TikTok viral)
      'Meta', 'PSVR', 'Valve Index',
      // Streaming
      'Blue Microphones', 'FIFINE', 'Rode',
    ],
    subcategories: ['consoles', 'controllers', 'headsets', 'keyboards', 'mice', 'monitors', 'chairs', 'streaming', 'vr', 'handhelds'],
    specificationTemplate: {
      productType: '', platform: '', connectivity: '', features: '',
    },
    retailers: ['Best Buy', 'GameStop', 'Amazon', 'Walmart', 'Micro Center', 'Newegg'],
  },
  music: {
    category: 'music',
    priorityBrands: [
      // Guitars
      'Fender', 'Gibson', 'Taylor', 'Martin', 'PRS', 'Epiphone', 'Ibanez', 'Gretsch',
      // Keys & Synths
      'Yamaha', 'Roland', 'Korg', 'Nord', 'Moog', 'Arturia',
      // Pro Audio
      'Shure', 'Audio-Technica', 'Sennheiser', 'Rode', 'AKG', 'Neumann',
      // DJ Equipment
      'Pioneer DJ', 'Native Instruments', 'Numark',
      // TikTok Viral Audio
      'Skullcandy', 'PICUN', 'Beats', 'Bang & Olufsen',
    ],
    subcategories: ['electric-guitars', 'acoustic-guitars', 'bass', 'keyboards', 'drums', 'microphones', 'headphones', 'monitors', 'dj-equipment', 'recording'],
    specificationTemplate: {
      instrumentType: '', bodyStyle: '', material: '', pickups: '', features: '',
    },
    retailers: ['Guitar Center', 'Sweetwater', 'Sam Ash', 'Amazon', 'Reverb', 'Thomann'],
  },
  fitness: {
    category: 'fitness',
    priorityBrands: [
      // Strength Equipment
      'Rogue', 'REP Fitness', 'Titan Fitness', 'Bowflex', 'TRX',
      // Cardio
      'Peloton', 'NordicTrack', 'Concept2', 'AssaultFitness', 'Schwinn',
      // Recovery (TikTok viral)
      'Hyperice', 'Theragun', 'Therabody', 'Normatec', 'Hypervolt',
      // Wearables
      'Whoop', 'Garmin', 'Fitbit', 'Apple Watch', 'Oura',
      // TikTok Viral Fitness
      'BootySprout', 'Bala', 'P.volve', 'Mirror', 'Tonal',
      // Recovery & Mobility
      'Chirp', 'RAD', 'TriggerPoint', 'Lacrosse Ball Plus',
    ],
    subcategories: ['strength', 'cardio', 'recovery', 'wearables', 'yoga', 'accessories', 'resistance', 'weights'],
    specificationTemplate: {
      equipmentType: '', dimensions: '', weight: '', resistance: '', connectivity: '',
    },
    retailers: ['Rogue Fitness', 'Dick\'s', 'Amazon', 'REI', 'Target', 'Walmart'],
  },
  travel: {
    category: 'travel',
    priorityBrands: [
      // Premium Luggage
      'Away', 'Rimowa', 'Tumi', 'Samsonite', 'Briggs & Riley', 'Monos', 'July',
      // TikTok Viral Travel
      'Béis', 'Calpak', 'Paravel', 'Roam', 'Horizn Studios',
      // Travel Backpacks
      'Peak Design', 'Osprey', 'Nomatic', 'Tortuga', 'Patagonia',
      // Budget TikTok Alternatives
      'Coowoz', 'Travelpro', 'Delsey', 'American Tourister',
      // Accessories
      'Cincha', 'Stasher', 'Cadence', 'This Is Ground',
    ],
    subcategories: ['carry-on', 'checked', 'backpacks', 'duffels', 'weekenders', 'packing-cubes', 'accessories', 'tech-organizers'],
    specificationTemplate: {
      luggageType: '', dimensions: '', capacity: '', material: '', wheels: '',
    },
    retailers: ['Away', 'Nordstrom', 'REI', 'Amazon', 'Target', 'Bloomingdales'],
  },
  edc: {
    category: 'edc',
    priorityBrands: [
      // Premium Knives
      'Benchmade', 'Spyderco', 'Chris Reeve', 'Microtech', 'Zero Tolerance', 'Hinderer',
      // Budget/TikTok Knives
      'Civivi', 'CJRB', 'Outdoor Edge', 'QSP', 'Kizer',
      // Multitools
      'Leatherman', 'Victorinox', 'Gerber', 'SOG',
      // Wallets
      'Ridge', 'Bellroy', 'Secrid', 'Ekster', 'Trayvax',
      // Flashlights (TikTok viral)
      'Olight', 'Fenix', 'RovyVon', 'Streamlight', 'Surefire', 'Sofirn',
      // Pens & Accessories
      'Fisher Space Pen', 'Tactile Turn', 'Refyne', 'BigIDesign',
    ],
    subcategories: ['folding-knives', 'fixed-blades', 'multitools', 'wallets', 'flashlights', 'pens', 'watches', 'keychains'],
    specificationTemplate: {
      productType: '', material: '', bladeLength: '', weight: '', lockType: '',
    },
    retailers: ['BladeHQ', 'Knife Center', 'Amazon', 'REI', 'DLT Trading', 'GPKnives'],
  },
};

// =============================================================================
// Orchestrator State Management
// =============================================================================

let orchestratorState: OrchestratorState = {
  phase: 'infrastructure',
  tasks: [],
  overallProgress: 0,
  startedAt: new Date().toISOString(),
  totalProducts: 0,
  totalVariants: 0,
};

/**
 * Get current orchestrator state
 */
export function getState(): OrchestratorState {
  return { ...orchestratorState };
}

/**
 * Reset orchestrator to initial state
 */
export function resetState(): void {
  orchestratorState = {
    phase: 'infrastructure',
    tasks: [],
    overallProgress: 0,
    startedAt: new Date().toISOString(),
    totalProducts: 0,
    totalVariants: 0,
  };
}

// =============================================================================
// Task Management
// =============================================================================

/**
 * Generate a unique task ID
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new category lead task
 */
export function createCategoryTask(category: Category): AgentTask {
  const task: AgentTask = {
    id: generateTaskId(),
    type: 'category-lead',
    category,
    status: 'pending',
    progress: 0,
    productsCollected: 0,
  };

  orchestratorState.tasks.push(task);
  return task;
}

/**
 * Create a new brand agent task
 */
export function createBrandTask(category: Category, brand: string): AgentTask {
  const task: AgentTask = {
    id: generateTaskId(),
    type: 'brand-agent',
    category,
    brand,
    status: 'pending',
    progress: 0,
    productsCollected: 0,
  };

  orchestratorState.tasks.push(task);
  return task;
}

/**
 * Update task status
 */
export function updateTask(
  taskId: string,
  updates: Partial<AgentTask>
): AgentTask | null {
  const task = orchestratorState.tasks.find(t => t.id === taskId);
  if (!task) return null;

  Object.assign(task, updates);

  // Recalculate overall progress
  const completedTasks = orchestratorState.tasks.filter(
    t => t.status === 'completed'
  ).length;
  orchestratorState.overallProgress =
    (completedTasks / orchestratorState.tasks.length) * 100;

  // Update totals
  orchestratorState.totalProducts = orchestratorState.tasks.reduce(
    (sum, t) => sum + t.productsCollected,
    0
  );

  return task;
}

/**
 * Get all tasks for a category
 */
export function getTasksByCategory(category: Category): AgentTask[] {
  return orchestratorState.tasks.filter(t => t.category === category);
}

// =============================================================================
// Agent Execution
// =============================================================================

/**
 * Generate the prompt for a category lead agent
 */
export function generateCategoryLeadPrompt(category: Category): string {
  const config = CATEGORY_CONFIGS[category];

  if (!config) {
    return `You are the Category Lead Agent for ${category.toUpperCase()}.

Your mission: Build a comprehensive product library covering ${category} brands from 2020-2024, at SKU-level granularity.

For each brand, collect:
1. All major product releases from 2020-2024
2. Every colorway and variant (SKU-level)
3. Reference images (primary product shot)
4. Complete specifications
5. Visual identification features (colors, patterns, design cues)`;
  }

  return `You are the Category Lead Agent for ${category.toUpperCase()}.

Your mission: Build a comprehensive product library covering ${category} brands from 2020-2024, at SKU-level granularity.

Priority Brands: ${config.priorityBrands.join(', ')}

Subcategories to cover: ${config.subcategories.join(', ')}

For each brand, collect:
1. All major product releases from 2020-2024
2. Every colorway and variant (SKU-level)
3. Reference images (primary product shot)
4. Complete specifications
5. Visual identification features (colors, patterns, design cues)

Output Format: JSON array of BrandCatalog objects following this structure:
{
  "name": "Brand Name",
  "aliases": ["alt names"],
  "products": [
    {
      "id": "unique-id",
      "name": "Product Name",
      "brand": "Brand Name",
      "category": "${category}",
      "subcategory": "subcategory",
      "releaseYear": 2024,
      "msrp": 499,
      "visualSignature": {
        "primaryColors": ["black", "white"],
        "colorwayName": "Stealth Black",
        "patterns": ["solid"],
        "designCues": ["feature1", "feature2"],
        "distinguishingFeatures": ["unique aspects"]
      },
      "specifications": {
        ${Object.keys(config.specificationTemplate)
          .map(k => `"${k}": "value"`)
          .join(',\n        ')}
      },
      "variants": [...],
      "referenceImages": { "primary": "url" },
      "searchKeywords": ["keywords"],
      "source": "ai",
      "dataConfidence": 85,
      "lastUpdated": "${new Date().toISOString()}"
    }
  ],
  "lastUpdated": "${new Date().toISOString()}"
}

Coverage Goals:
- 5 years of products per brand (2020-2024)
- All major product lines
- Reference images for 95% of products
- Complete specifications for 90% of products

Retailers for data validation: ${config.retailers.join(', ')}

Start with the first priority brand and work through the list systematically.`;
}

/**
 * Generate the prompt for a brand agent
 */
export function generateBrandAgentPrompt(config: BrandAgentConfig): string {
  const categoryConfig = CATEGORY_CONFIGS[config.category];
  const specKeys = categoryConfig?.specificationTemplate
    ? Object.keys(categoryConfig.specificationTemplate).join(', ')
    : 'all relevant specifications';

  return `You are a Brand Agent for ${config.brandName} in the ${config.category} category.

Your mission: Collect every product released by ${config.brandName} from ${config.yearRange.min}-${config.yearRange.max}.

Product Lines to Cover:
${config.productLines.map(l => `- ${l}`).join('\n')}

${config.officialUrl ? `Official Website: ${config.officialUrl}` : ''}

For each product, collect:
1. Name and model number
2. Release year and MSRP
3. All colorways and variants
4. Specifications: ${specKeys}
5. Primary product image URL
6. Visual identification features
7. Search keywords

Output Format: JSON array of Product objects.

Quality Requirements:
- Every variant as a separate entry
- Accurate release years
- Valid image URLs
- Complete specifications
- Distinguishing visual features

Be thorough and comprehensive. Include discontinued products from the specified year range.`;
}

// =============================================================================
// Result Processing
// =============================================================================

/**
 * Process results from a brand agent and update the library
 */
export function processAgentResults(
  category: Category,
  brandName: string,
  products: Product[]
): void {
  // Create or update brand catalog
  const brandCatalog: BrandCatalog = {
    name: brandName,
    aliases: [],
    products,
    lastUpdated: new Date().toISOString(),
  };

  // Load existing library or create new one
  let library = loadLibrary(category);

  if (!library) {
    library = {
      category,
      schemaVersion: '1.0.0',
      lastUpdated: new Date().toISOString(),
      brands: [],
      productCount: 0,
      variantCount: 0,
    };
  }

  // Find existing brand or add new
  const existingBrandIndex = library.brands.findIndex(
    b => b.name.toLowerCase() === brandName.toLowerCase()
  );

  if (existingBrandIndex >= 0) {
    // Merge products
    const existingBrand = library.brands[existingBrandIndex];
    const existingIds = new Set(existingBrand.products.map(p => p.id));
    const newProducts = products.filter(p => !existingIds.has(p.id));
    existingBrand.products.push(...newProducts);
    existingBrand.lastUpdated = new Date().toISOString();
  } else {
    library.brands.push(brandCatalog);
  }

  // Save updated library
  saveLibrary(library);

  console.log(
    `[Orchestrator] Processed ${products.length} products for ${brandName} in ${category}`
  );
}

// =============================================================================
// Deployment Functions
// =============================================================================

/**
 * Deploy all category lead agents
 */
export function deployAllCategories(): AgentTask[] {
  const categories: Category[] = [
    'golf',
    'tech',
    'fashion',
    'makeup',
    'outdoor',
    'photography',
    'gaming',
    'music',
    'fitness',
    'travel',
    'edc',
  ];

  orchestratorState.phase = 'collection';

  return categories.map(category => createCategoryTask(category));
}

/**
 * Deploy brand agents for a specific category
 */
export function deployBrandAgents(category: Category): AgentTask[] {
  const config = CATEGORY_CONFIGS[category];
  if (!config) {
    console.log(`[Orchestrator] No config found for category ${category}, skipping brand agents`);
    return [];
  }
  return config.priorityBrands.map(brand => createBrandTask(category, brand));
}

/**
 * Get deployment summary
 */
export function getDeploymentSummary(): {
  categories: number;
  brands: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalProducts: number;
} {
  const tasks = orchestratorState.tasks;

  return {
    categories: new Set(tasks.map(t => t.category)).size,
    brands: tasks.filter(t => t.type === 'brand-agent').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    failedTasks: tasks.filter(t => t.status === 'failed').length,
    totalProducts: orchestratorState.totalProducts,
  };
}
