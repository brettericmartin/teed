/**
 * Pattern Extract Stage
 *
 * Second stage of the text parsing pipeline.
 * Uses regex patterns to extract:
 * - Golf specifications (loft, flex, shaft)
 * - Sizes (clothing, shoe)
 * - Colors
 */

import type { PatternExtractResult, ParsedComponent, ExtractedSpec, ExtractedSize } from '../types';
import { extractColor, findAllColors, removeColors } from '../dictionaries/colors';
import { extractSize, findAllSizes, removeSizes } from '../dictionaries/sizes';

/**
 * Golf-specific specification patterns
 */
const GOLF_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Loft: "10.5°", "10.5 degree", "10.5 deg", "9 loft"
  {
    type: 'loft',
    patterns: [
      /\b(\d{1,2}(?:\.\d)?)\s*(?:°|deg(?:ree)?s?|loft)\b/i,
      /\bloft\s*[:=]?\s*(\d{1,2}(?:\.\d)?)\b/i,
    ],
    normalize: (m) => `${m}°`,
  },
  // Flex: "stiff", "regular", "senior", "x-stiff", "ladies"
  {
    type: 'flex',
    patterns: [
      /\b((?:extra[-\s]?)?stiff|x[-\s]?stiff|stf|regular|reg|senior|snr|ladies|a[-\s]?flex|r[-\s]?flex|s[-\s]?flex|x[-\s]?flex)\b/i,
      /\bflex\s*[:=]?\s*(stiff|regular|senior|ladies|[asrx])\b/i,
    ],
    normalize: (m) => normalizeFlexValue(m),
  },
  // Hand: "left hand", "right hand", "LH", "RH"
  {
    type: 'hand',
    patterns: [
      /\b(left[-\s]?hand(?:ed)?|right[-\s]?hand(?:ed)?|lh|rh|lefty|righty)\b/i,
    ],
    normalize: (m) => m.toLowerCase().includes('left') || m.toLowerCase() === 'lh' ? 'Left Hand' : 'Right Hand',
  },
  // Length: "45 inches", "+1", "-0.5"
  {
    type: 'length',
    patterns: [
      /\b(\d{2}(?:\.\d)?)\s*(?:in(?:ch(?:es)?)?|")\b/i,
      /\b([+-]\d(?:\.\d)?)\s*(?:in(?:ch(?:es)?)?|")?\b/,
    ],
    normalize: (m) => m.includes('+') || m.includes('-') ? m : `${m}"`,
  },
  // Weight: "swing weight D2", "SW D3"
  {
    type: 'weight',
    patterns: [
      /\b(?:swing\s*weight|sw)\s*[:=]?\s*([a-f]\d{1,2})\b/i,
      /\b([a-f]\d{1,2})\s*(?:swing\s*weight|sw)\b/i,
    ],
    normalize: (m) => m.toUpperCase(),
  },
  // Shaft: specific shaft models
  {
    type: 'shaft',
    patterns: [
      /\b(project\s*x(?:\s+\w+)*|hzrdus(?:\s+\w+)*|ventus(?:\s+\w+)*|evenflow(?:\s+\w+)*|tensei(?:\s+\w+)*|graphite\s+design(?:\s+\w+)*|fujikura(?:\s+\w+)*|aldila(?:\s+\w+)*|nippon(?:\s+\w+)*|true\s*temper(?:\s+\w+)*|dynamic\s*gold(?:\s+\w+)*|kbs(?:\s+\w+)*|modus(?:\s+\w+)*)\b/i,
    ],
    normalize: (m) => capitalizeShaft(m),
  },
];

/**
 * Tennis-specific specification patterns
 */
const TENNIS_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Grip size: "4 1/4", "L3", "grip 3"
  {
    type: 'generic',
    patterns: [
      /\b(4\s*[1-5]\/[248])\b/i,  // US grip size: 4 1/4, 4 3/8, etc.
      /\b(l[0-5]|grip\s*[0-5])\b/i,  // European grip size: L0-L5
    ],
    normalize: (m) => m.toUpperCase().replace(/\s+/g, ' '),
  },
  // String tension: "55 lbs", "24 kg tension"
  {
    type: 'generic',
    patterns: [
      /\b(\d{2})\s*(?:lbs?|pounds?)\s*(?:tension)?\b/i,
      /\b(\d{2})\s*(?:kg)\s*(?:tension)?\b/i,
      /\btension\s*[:=]?\s*(\d{2})\b/i,
    ],
    normalize: (m) => `${m} tension`,
  },
  // Head size: "100 sq in", "645 cm2"
  {
    type: 'generic',
    patterns: [
      /\b(\d{2,3})\s*(?:sq\.?\s*in(?:ch(?:es)?)?|in²)\b/i,
      /\b(\d{3})\s*(?:cm²|sq\.?\s*cm)\b/i,
    ],
    normalize: (m) => `${m} sq in`,
  },
  // Weight: "300g", "10.6 oz"
  {
    type: 'generic',
    patterns: [
      /\b(\d{2,3})\s*g(?:rams?)?\b/i,
      /\b(\d{1,2}(?:\.\d)?)\s*oz\b/i,
    ],
  },
];

/**
 * Cycling-specific specification patterns
 */
const CYCLING_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Frame size: "54cm", "medium", "56"
  {
    type: 'generic',
    patterns: [
      /\b(\d{2})\s*cm\s*(?:frame)?\b/i,  // 54cm, 56cm
      /\bframe\s*[:=]?\s*(\d{2})\b/i,
      /\b(xxs|xs|small|medium|large|xl|xxl)\s*(?:frame)?\b/i,
    ],
    normalize: (m) => m.toLowerCase().includes('cm') ? m : `${m}cm`,
  },
  // Wheel size: "700c", "29er", "27.5"
  {
    type: 'generic',
    patterns: [
      /\b(700c|650b|26"|27\.5"|29"|29er)\b/i,
    ],
  },
  // Groupset: "Ultegra", "105", "Dura-Ace"
  {
    type: 'generic',
    patterns: [
      /\b(dura[-\s]?ace|ultegra|105|tiagra|sora|claris|red\s*etap|force|rival|apex|gx|nx|sx|xx|xtr|xt|slx|deore)\b/i,
    ],
    normalize: (m) => capitalizeGroupset(m),
  },
  // Speed: "11-speed", "12 speed"
  {
    type: 'generic',
    patterns: [
      /\b(\d{1,2})[-\s]?speed\b/i,
    ],
    normalize: (m) => `${m}-speed`,
  },
];

/**
 * Audio-specific specification patterns
 */
const AUDIO_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Impedance: "32 ohm", "250Ω"
  {
    type: 'generic',
    patterns: [
      /\b(\d{2,3})\s*(?:ohm|Ω)\b/i,
    ],
    normalize: (m) => `${m}Ω`,
  },
  // Driver size: "40mm driver", "50mm"
  {
    type: 'generic',
    patterns: [
      /\b(\d{2,3})\s*mm\s*(?:driver)?\b/i,
    ],
    normalize: (m) => `${m}mm driver`,
  },
  // Frequency response: "20Hz-20kHz"
  {
    type: 'generic',
    patterns: [
      /\b(\d+)\s*hz\s*[-–]\s*(\d+)\s*khz\b/i,
    ],
  },
  // Wattage: "100W", "500 watts"
  {
    type: 'generic',
    patterns: [
      /\b(\d{1,4})\s*(?:w|watts?)\b/i,
    ],
    normalize: (m) => `${m}W`,
  },
  // Channels: "5.1", "7.1.4", "2.1"
  {
    type: 'generic',
    patterns: [
      /\b(\d\.\d(?:\.\d)?)\s*(?:channel)?\b/i,
    ],
    normalize: (m) => `${m} channel`,
  },
];

/**
 * Photography-specific specification patterns
 */
const PHOTOGRAPHY_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Megapixels: "24MP", "45 megapixel"
  {
    type: 'generic',
    patterns: [
      /\b(\d{1,3})\s*(?:mp|megapixels?)\b/i,
    ],
    normalize: (m) => `${m}MP`,
  },
  // Focal length: "50mm", "24-70mm", "f/1.8"
  {
    type: 'generic',
    patterns: [
      /\b(\d{1,3}(?:[-–]\d{1,3})?)\s*mm\b/i,
      /\b(f\/?\d(?:\.\d)?)\b/i,  // Aperture: f/1.8, f2.8
    ],
  },
  // Sensor size: "full frame", "APS-C", "micro four thirds"
  {
    type: 'generic',
    patterns: [
      /\b(full[-\s]?frame|aps[-\s]?c|micro\s*four\s*thirds|m43|mft|medium\s*format)\b/i,
    ],
    normalize: (m) => m.toLowerCase().replace(/[-\s]+/g, ' ').replace('aps c', 'APS-C').replace('full frame', 'Full Frame'),
  },
  // Video resolution: "4K", "8K", "1080p"
  {
    type: 'generic',
    patterns: [
      /\b(4k|8k|1080p|720p|6k)\b/i,
    ],
    normalize: (m) => m.toUpperCase(),
  },
];

/**
 * Watch-specific specification patterns
 */
const WATCH_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Case size: "42mm", "40mm case"
  {
    type: 'generic',
    patterns: [
      /\b(\d{2})\s*mm\s*(?:case)?\b/i,
    ],
    normalize: (m) => `${m}mm`,
  },
  // Water resistance: "100m", "10 ATM", "200m WR"
  {
    type: 'generic',
    patterns: [
      /\b(\d{2,3})\s*(?:m|meters?)\s*(?:wr|water\s*resist(?:ant|ance)?)?\b/i,
      /\b(\d{1,2})\s*(?:atm|bar)\b/i,
    ],
    normalize: (m) => `${m}m WR`,
  },
  // Movement: "automatic", "quartz", "mechanical"
  {
    type: 'generic',
    patterns: [
      /\b(automatic|quartz|mechanical|manual\s*wind|hand[-\s]?wind|kinetic|solar|eco[-\s]?drive)\b/i,
    ],
    normalize: (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase(),
  },
];

/**
 * Fitness-specific specification patterns
 */
const FITNESS_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Weight: "25 lb", "10kg dumbbell"
  {
    type: 'generic',
    patterns: [
      /\b(\d{1,3})\s*(?:lb|lbs?|pounds?)\b/i,
      /\b(\d{1,3})\s*(?:kg|kilos?|kilograms?)\b/i,
    ],
  },
  // Resistance: "heavy resistance", "light band"
  {
    type: 'generic',
    patterns: [
      /\b(light|medium|heavy|extra[-\s]?heavy)\s*(?:resistance|band)?\b/i,
    ],
    normalize: (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase() + ' resistance',
  },
];

/**
 * Fashion/Apparel-specific specification patterns
 */
const FASHION_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Fit: "slim fit", "relaxed", "regular fit", "tailored", "oversized"
  {
    type: 'generic',
    patterns: [
      /\b(slim|skinny|relaxed|regular|loose|tailored|fitted|oversized|cropped|straight|wide[-\s]?leg|boot[-\s]?cut|tapered)\s*(?:fit|cut)?\b/i,
    ],
    normalize: (m) => capitalize(m.replace(/[-\s]+/g, ' ').trim()) + ' Fit',
  },
  // Material: "100% cotton", "wool blend", "leather", "cashmere"
  {
    type: 'generic',
    patterns: [
      /\b(?:100%\s*)?(cotton|wool|linen|silk|cashmere|leather|suede|polyester|nylon|denim|jersey|fleece|velvet|satin|tweed|corduroy)\b/i,
      /\b(wool\s*blend|cotton\s*blend|silk\s*blend)\b/i,
    ],
    normalize: (m) => capitalize(m.trim()),
  },
  // Season: "fall 2024", "spring/summer", "SS24", "FW23"
  {
    type: 'generic',
    patterns: [
      /\b(spring|summer|fall|autumn|winter|spring[-\/]summer|fall[-\/]winter|fw|ss|aw)\s*['']?(\d{2,4})?\b/i,
    ],
    normalize: (m) => normalizeSeasonValue(m),
  },
  // Length: "ankle length", "knee length", "midi", "maxi", "mini"
  {
    type: 'generic',
    patterns: [
      /\b(ankle|knee|mid[-\s]?calf|floor)[-\s]?length\b/i,
      /\b(mini|midi|maxi|crop(?:ped)?)\b/i,
    ],
    normalize: (m) => capitalize(m.replace(/[-\s]+/g, ' ').trim()),
  },
  // Rise: "high rise", "mid rise", "low rise"
  {
    type: 'generic',
    patterns: [
      /\b(high|mid|low)[-\s]?rise\b/i,
    ],
    normalize: (m) => capitalize(m.replace(/[-\s]+/g, ' ').trim()),
  },
];

/**
 * Beauty/Makeup-specific specification patterns
 */
const BEAUTY_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Shade/Color number: "shade 03", "color N°5", "#42", "N25"
  {
    type: 'generic',
    patterns: [
      /\b(?:shade|color|colour|no\.?|#|n°?)\s*(\d{1,3}(?:\.\d)?)\b/i,
      /\b([A-Z]?\d{1,3})\s*(?:shade|color)\b/i,
    ],
    normalize: (m) => `Shade ${m.replace(/[^A-Z0-9.]/gi, '')}`,
  },
  // Finish: "matte", "satin", "glossy", "dewy", "shimmer", "metallic"
  {
    type: 'generic',
    patterns: [
      /\b(matte|satin|glossy|gloss|dewy|shimmer|shimmery|metallic|luminous|radiant|natural|velvet|cream)\s*(?:finish)?\b/i,
    ],
    normalize: (m) => capitalize(m.trim()) + ' Finish',
  },
  // Coverage: "full coverage", "medium coverage", "sheer"
  {
    type: 'generic',
    patterns: [
      /\b(full|medium|light|sheer|buildable)\s*(?:coverage)?\b/i,
    ],
    normalize: (m) => capitalize(m.trim()) + ' Coverage',
  },
  // Product size: "full size", "mini", "travel size", "deluxe sample"
  {
    type: 'generic',
    patterns: [
      /\b(full[-\s]?size|mini|travel[-\s]?size|deluxe\s*sample|sample\s*size|jumbo)\b/i,
    ],
    normalize: (m) => capitalize(m.replace(/[-\s]+/g, ' ').trim()),
  },
  // Volume/Weight: "30ml", "1 oz", "50g"
  {
    type: 'generic',
    patterns: [
      /\b(\d+(?:\.\d)?)\s*(?:ml|oz|fl\.?\s*oz|g)\b/i,
    ],
  },
  // Undertone: "warm undertone", "cool", "neutral"
  {
    type: 'generic',
    patterns: [
      /\b(warm|cool|neutral|olive)\s*(?:undertone)?\b/i,
    ],
    normalize: (m) => capitalize(m.trim()) + ' Undertone',
  },
];

/**
 * Home/Furniture-specific specification patterns
 */
const HOME_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  normalize?: (match: string) => string;
}> = [
  // Dimensions: "72x30", "24" x 36"", "king size", "queen"
  {
    type: 'generic',
    patterns: [
      /\b(\d{1,3})\s*[x×]\s*(\d{1,3})(?:\s*[x×]\s*(\d{1,3}))?\s*(?:in(?:ch(?:es)?)?|cm|mm|")?\b/i,
      /\b(king|queen|full|twin|california\s*king|cal[-\s]?king)\s*(?:size)?\b/i,
    ],
    normalize: (m) => m.includes('x') || m.includes('×') ? m : capitalize(m.trim()),
  },
  // Material: "solid wood", "oak", "walnut", "marble", "brass"
  {
    type: 'generic',
    patterns: [
      /\b(solid\s*wood|oak|walnut|maple|cherry|mahogany|teak|pine|birch|bamboo|marble|granite|quartz|brass|chrome|stainless\s*steel|iron|glass|ceramic|porcelain|concrete|rattan|wicker)\b/i,
    ],
    normalize: (m) => capitalize(m.replace(/\s+/g, ' ').trim()),
  },
  // Finish: "matte black", "polished chrome", "brushed nickel", "oil rubbed bronze"
  {
    type: 'generic',
    patterns: [
      /\b(matte|polished|brushed|satin|antique|oil[-\s]?rubbed|hammered|patina)\s*(?:black|white|gold|silver|chrome|nickel|bronze|brass|copper)?\b/i,
    ],
    normalize: (m) => capitalize(m.replace(/[-\s]+/g, ' ').trim()),
  },
  // Thread count: "400 thread count", "1000TC"
  {
    type: 'generic',
    patterns: [
      /\b(\d{3,4})\s*(?:thread\s*count|tc)\b/i,
    ],
    normalize: (m) => `${m.replace(/\D/g, '')} Thread Count`,
  },
  // Fill power: "800 fill", "700 fill power"
  {
    type: 'generic',
    patterns: [
      /\b(\d{3})\s*(?:fill(?:\s*power)?)\b/i,
    ],
    normalize: (m) => `${m.replace(/\D/g, '')} Fill Power`,
  },
];

/**
 * Helper to capitalize words
 */
function capitalize(str: string): string {
  return str.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Normalize season values
 */
function normalizeSeasonValue(value: string): string {
  const v = value.toLowerCase().replace(/['']/g, '').trim();

  // Extract year if present
  const yearMatch = v.match(/(\d{2,4})/);
  const year = yearMatch ? (yearMatch[1].length === 2 ? `20${yearMatch[1]}` : yearMatch[1]) : '';

  if (v.includes('ss') || v.includes('spring') && v.includes('summer')) {
    return year ? `Spring/Summer ${year}` : 'Spring/Summer';
  }
  if (v.includes('fw') || v.includes('aw') || (v.includes('fall') && v.includes('winter'))) {
    return year ? `Fall/Winter ${year}` : 'Fall/Winter';
  }
  if (v.includes('spring')) return year ? `Spring ${year}` : 'Spring';
  if (v.includes('summer')) return year ? `Summer ${year}` : 'Summer';
  if (v.includes('fall') || v.includes('autumn')) return year ? `Fall ${year}` : 'Fall';
  if (v.includes('winter')) return year ? `Winter ${year}` : 'Winter';

  return value;
}

/**
 * Tech/general specification patterns
 */
const GENERAL_SPEC_PATTERNS: Array<{
  type: ExtractedSpec['type'];
  patterns: RegExp[];
  unit?: string;
}> = [
  // Storage: "256GB", "1TB", "512 GB"
  {
    type: 'generic',
    patterns: [/\b(\d+)\s*(gb|tb|mb)\b/i],
    unit: 'storage',
  },
  // Memory: "16GB RAM", "8 GB memory"
  {
    type: 'generic',
    patterns: [/\b(\d+)\s*gb\s*(?:ram|memory)\b/i],
    unit: 'RAM',
  },
  // Screen size: "6.7 inch", "27""
  {
    type: 'generic',
    patterns: [/\b(\d+(?:\.\d)?)\s*(?:inch|in|")\s*(?:screen|display|monitor)?\b/i],
    unit: 'screen',
  },
  // Battery: "5000mAh", "100Wh"
  {
    type: 'generic',
    patterns: [/\b(\d+)\s*(?:mah|wh)\b/i],
    unit: 'battery',
  },
];

/**
 * Extract specifications from text
 */
export function patternExtract(text: string): PatternExtractResult {
  const extractedComponents: ParsedComponent[] = [];
  const extractedSpecs: ExtractedSpec[] = [];
  let remainingText = text;

  // === Extract golf specs ===
  for (const { type, patterns, normalize } of GOLF_SPEC_PATTERNS) {
    for (const pattern of patterns) {
      const match = remainingText.match(pattern);
      if (match) {
        const rawValue = match[1] || match[0];
        const value = normalize ? normalize(rawValue) : rawValue;

        extractedSpecs.push({
          type,
          value,
          originalText: match[0],
        });

        extractedComponents.push({
          type: 'specification',
          value,
          confidence: 0.9,
          source: 'pattern',
          originalText: match[0],
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[0].length,
        });

        // Remove from text
        remainingText = remainingText.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
        break; // Only one match per type
      }
    }
  }

  // === Extract general specs ===
  for (const { type, patterns, unit } of GENERAL_SPEC_PATTERNS) {
    for (const pattern of patterns) {
      const match = remainingText.match(pattern);
      if (match) {
        extractedSpecs.push({
          type,
          value: match[0],
          unit,
          originalText: match[0],
        });

        extractedComponents.push({
          type: 'specification',
          value: match[0],
          confidence: 0.85,
          source: 'pattern',
          originalText: match[0],
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[0].length,
        });

        remainingText = remainingText.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  // === Extract category-specific specs ===
  for (const spec of CATEGORY_SPEC_PATTERNS) {
    for (const pattern of spec.patterns) {
      const match = remainingText.match(pattern);
      if (match) {
        const rawValue = match[1] || match[0];
        const value = spec.normalize ? spec.normalize(rawValue) : rawValue;

        extractedSpecs.push({
          type: spec.type,
          value,
          originalText: match[0],
        });

        extractedComponents.push({
          type: 'specification',
          value,
          confidence: 0.85,
          source: 'pattern',
          originalText: match[0],
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[0].length,
        });

        remainingText = remainingText.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  // === Extract color ===
  const colorMatches = findAllColors(remainingText);
  let extractedColor: string | null = null;

  if (colorMatches.length > 0) {
    // Use the first color found
    const firstColor = colorMatches[0];
    extractedColor = firstColor.color;

    extractedComponents.push({
      type: 'color',
      value: firstColor.color,
      confidence: 0.9,
      source: 'dictionary',
      originalText: firstColor.originalText,
      startIndex: firstColor.position,
      endIndex: firstColor.position + firstColor.originalText.length,
    });

    // Remove colors from text
    remainingText = removeColors(remainingText);
  }

  // === Extract size ===
  const sizeMatches = findAllSizes(remainingText);
  let extractedSize: ExtractedSize | null = null;

  if (sizeMatches.length > 0) {
    // Use the first size found
    const firstSize = sizeMatches[0];
    extractedSize = firstSize.size;

    extractedComponents.push({
      type: 'size',
      value: firstSize.size.value,
      confidence: 0.85,
      source: 'pattern',
      originalText: firstSize.originalText,
      startIndex: firstSize.position,
      endIndex: firstSize.position + firstSize.originalText.length,
    });

    // Remove sizes from text
    remainingText = removeSizes(remainingText);
  }

  return {
    extractedSpecs,
    extractedSize,
    extractedColor,
    extractedComponents,
    remainingText: remainingText.trim(),
  };
}

/**
 * Normalize flex values to standard format
 */
function normalizeFlexValue(value: string): string {
  const v = value.toLowerCase().replace(/[-\s]/g, '');

  if (v.includes('xstiff') || v === 'x') return 'X-Stiff';
  if (v.includes('stiff') || v === 'stf' || v === 's') return 'Stiff';
  if (v.includes('regular') || v === 'reg' || v === 'r') return 'Regular';
  if (v.includes('senior') || v === 'snr' || v === 'a' || v.includes('aflex')) return 'Senior';
  if (v.includes('ladies') || v === 'l') return 'Ladies';

  // Return capitalized version if no match
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Capitalize shaft brand names properly
 */
function capitalizeShaft(shaft: string): string {
  const shaftMap: Record<string, string> = {
    'project x': 'Project X',
    'projectx': 'Project X',
    'hzrdus': 'HZRDUS',
    'ventus': 'Ventus',
    'evenflow': 'EvenFlow',
    'tensei': 'Tensei',
    'graphite design': 'Graphite Design',
    'fujikura': 'Fujikura',
    'aldila': 'Aldila',
    'nippon': 'Nippon',
    'true temper': 'True Temper',
    'truetemper': 'True Temper',
    'dynamic gold': 'Dynamic Gold',
    'dynamicgold': 'Dynamic Gold',
    'kbs': 'KBS',
    'modus': 'Modus',
  };

  const lower = shaft.toLowerCase().trim();

  for (const [key, value] of Object.entries(shaftMap)) {
    if (lower.startsWith(key)) {
      // Return the proper name plus any remaining text
      const remaining = shaft.slice(key.length).trim();
      return remaining ? `${value} ${remaining}` : value;
    }
  }

  // Default: capitalize first letter of each word
  return shaft.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Capitalize cycling groupset names properly
 */
function capitalizeGroupset(groupset: string): string {
  const groupsetMap: Record<string, string> = {
    'dura-ace': 'Dura-Ace',
    'duraace': 'Dura-Ace',
    'dura ace': 'Dura-Ace',
    'ultegra': 'Ultegra',
    '105': 'Shimano 105',
    'tiagra': 'Tiagra',
    'sora': 'Sora',
    'claris': 'Claris',
    'red etap': 'SRAM Red eTap',
    'force': 'SRAM Force',
    'rival': 'SRAM Rival',
    'apex': 'SRAM Apex',
    'gx': 'SRAM GX',
    'nx': 'SRAM NX',
    'sx': 'SRAM SX',
    'xx': 'SRAM XX',
    'xtr': 'Shimano XTR',
    'xt': 'Shimano XT',
    'slx': 'Shimano SLX',
    'deore': 'Shimano Deore',
  };

  const lower = groupset.toLowerCase().trim().replace(/[-\s]+/g, ' ');

  for (const [key, value] of Object.entries(groupsetMap)) {
    if (lower === key || lower.replace(/[-\s]+/g, '') === key.replace(/[-\s]+/g, '')) {
      return value;
    }
  }

  return groupset.charAt(0).toUpperCase() + groupset.slice(1).toLowerCase();
}

/**
 * All category-specific patterns combined
 */
const CATEGORY_SPEC_PATTERNS = [
  ...TENNIS_SPEC_PATTERNS.map(p => ({ ...p, category: 'tennis' })),
  ...CYCLING_SPEC_PATTERNS.map(p => ({ ...p, category: 'cycling' })),
  ...AUDIO_SPEC_PATTERNS.map(p => ({ ...p, category: 'audio' })),
  ...PHOTOGRAPHY_SPEC_PATTERNS.map(p => ({ ...p, category: 'photography' })),
  ...WATCH_SPEC_PATTERNS.map(p => ({ ...p, category: 'watches' })),
  ...FITNESS_SPEC_PATTERNS.map(p => ({ ...p, category: 'fitness' })),
  ...FASHION_SPEC_PATTERNS.map(p => ({ ...p, category: 'fashion' })),
  ...BEAUTY_SPEC_PATTERNS.map(p => ({ ...p, category: 'beauty' })),
  ...HOME_SPEC_PATTERNS.map(p => ({ ...p, category: 'home' })),
];
