/**
 * Dictionary Match Stage
 *
 * Third stage of the text parsing pipeline.
 * - Detects brands using the KNOWN_BRANDS dictionary
 * - Infers category from brand or text patterns
 */

import type { DictionaryMatchResult, ParsedComponent, BrandEntry } from '../types';
import type { Category } from '@/lib/productLibrary/schema';
import { levenshteinDistance } from '@/lib/utils';

/**
 * Comprehensive brand dictionary with categories and aliases
 * Synced from DOMAIN_BRAND_MAP with 500+ brands across 50+ categories
 */
const BRAND_DICTIONARY_CORE: BrandEntry[] = [
  // ============================================
  // GOLF BRANDS (Equipment, Apparel, Tech)
  // ============================================

  // Luxury Golf
  { name: 'G/FORE', normalizedName: 'g/fore', aliases: ['gfore', 'g fore', 'g-fore'], category: 'golf', tier: 'luxury' },
  { name: 'PXG', normalizedName: 'pxg', aliases: ['parsons xtreme golf'], category: 'golf', tier: 'luxury' },
  { name: 'Scotty Cameron', normalizedName: 'scotty cameron', aliases: ['scotty', 'scottie cameron', 'scotty camron'], category: 'golf', tier: 'luxury' },
  { name: 'Bettinardi', normalizedName: 'bettinardi', aliases: ['betinardi'], category: 'golf', tier: 'luxury' },
  { name: 'Miura', normalizedName: 'miura', aliases: ['miura golf'], category: 'golf', tier: 'luxury' },
  { name: 'Honma', normalizedName: 'honma', aliases: ['honma golf'], category: 'golf', tier: 'luxury' },
  { name: 'Vessel', normalizedName: 'vessel', aliases: ['vessel bags'], category: 'golf', tier: 'luxury' },
  { name: 'Jones Sports Co', normalizedName: 'jones sports co', aliases: ['jones golf'], category: 'golf', tier: 'luxury' },
  { name: 'Stitch Golf', normalizedName: 'stitch golf', aliases: ['stitch'], category: 'golf', tier: 'luxury' },
  { name: 'Linksoul', normalizedName: 'linksoul', aliases: [], category: 'golf', tier: 'luxury' },
  { name: 'Peter Millar', normalizedName: 'peter millar', aliases: ['petermillar'], category: 'golf', tier: 'luxury' },
  { name: 'Greyson', normalizedName: 'greyson', aliases: ['greyson clothiers'], category: 'golf', tier: 'luxury' },
  { name: 'KJUS', normalizedName: 'kjus', aliases: [], category: 'golf', tier: 'luxury' },
  { name: 'RLX Ralph Lauren', normalizedName: 'rlx ralph lauren', aliases: ['rlx', 'ralph lauren golf'], category: 'golf', tier: 'luxury' },
  { name: 'Malbon Golf', normalizedName: 'malbon golf', aliases: ['malbon'], category: 'golf', tier: 'luxury' },
  { name: 'melin', normalizedName: 'melin', aliases: [], category: 'golf', tier: 'luxury' },

  // Premium Golf Equipment
  { name: 'TaylorMade', normalizedName: 'taylormade', aliases: ['taylor made', 'tmag', 'tm', 'taylermade', 'tailormade', 'talormade'], category: 'golf', tier: 'premium' },
  { name: 'Callaway', normalizedName: 'callaway', aliases: ['cally', 'calaway', 'callway', 'calllaway'], category: 'golf', tier: 'premium' },
  { name: 'Titleist', normalizedName: 'titleist', aliases: ['acushnet', 'titelist', 'titliest', 'titeleist'], category: 'golf', tier: 'premium' },
  { name: 'Vokey', normalizedName: 'vokey', aliases: ['vokey design', 'titleist vokey'], category: 'golf', tier: 'premium' },
  { name: 'PING', normalizedName: 'ping', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Cleveland', normalizedName: 'cleveland', aliases: ['cleveland golf'], category: 'golf', tier: 'premium' },
  { name: 'Mizuno', normalizedName: 'mizuno', aliases: ['mizuono', 'misuno'], category: 'golf', tier: 'premium' },
  { name: 'Srixon', normalizedName: 'srixon', aliases: ['dunlop', 'srixion'], category: 'golf', tier: 'premium' },
  { name: 'Cobra', normalizedName: 'cobra', aliases: ['cobra golf', 'cobra puma golf'], category: 'golf', tier: 'premium' },
  { name: 'Bridgestone', normalizedName: 'bridgestone', aliases: ['bridgestone golf', 'bridgston'], category: 'golf', tier: 'premium' },
  { name: 'Wilson', normalizedName: 'wilson', aliases: ['wilson staff', 'wilson golf'], category: 'golf', tier: 'premium' },
  { name: 'XXIO', normalizedName: 'xxio', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Evnroll', normalizedName: 'evnroll', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Odyssey', normalizedName: 'odyssey', aliases: [], category: 'golf', tier: 'premium' },

  // Golf Apparel & Footwear
  { name: 'FootJoy', normalizedName: 'footjoy', aliases: ['fj', 'foot joy'], category: 'golf', tier: 'premium' },
  { name: 'TravisMathew', normalizedName: 'travismathew', aliases: ['travis mathew', 'travis matthew', 'travismathews'], category: 'golf', tier: 'premium' },
  { name: 'Puma Golf', normalizedName: 'puma golf', aliases: ['puma', 'cobra puma'], category: 'golf', tier: 'premium' },
  { name: 'adidas Golf', normalizedName: 'adidas golf', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Johnnie-O', normalizedName: 'johnnie-o', aliases: ['johnnie o'], category: 'golf', tier: 'premium' },
  { name: 'Dunning', normalizedName: 'dunning', aliases: ['dunning golf'], category: 'golf', tier: 'premium' },
  { name: 'Eastside Golf', normalizedName: 'eastside golf', aliases: ['eastside'], category: 'golf', tier: 'premium' },
  { name: 'Good Good Golf', normalizedName: 'good good golf', aliases: ['good good', 'goodgood'], category: 'golf', tier: 'premium' },
  { name: 'Ace High', normalizedName: 'ace high', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Nocturnal', normalizedName: 'nocturnal', aliases: [], category: 'golf', tier: 'premium' },

  // Golf Mid-Tier
  { name: 'Bad Birdie', normalizedName: 'bad birdie', aliases: ['badbirdie'], category: 'golf', tier: 'mid' },
  { name: 'Swannies', normalizedName: 'swannies', aliases: [], category: 'golf', tier: 'mid' },
  { name: 'Tour Edge', normalizedName: 'tour edge', aliases: ['touredge'], category: 'golf', tier: 'mid' },
  { name: 'Blue Tees', normalizedName: 'blue tees', aliases: ['bluetees'], category: 'golf', tier: 'mid' },
  { name: 'Shot Scope', normalizedName: 'shot scope', aliases: [], category: 'golf', tier: 'mid' },
  { name: 'Voice Caddie', normalizedName: 'voice caddie', aliases: [], category: 'golf', tier: 'mid' },
  { name: 'Sunday Golf', normalizedName: 'sunday golf', aliases: [], category: 'golf', tier: 'mid' },
  { name: 'Ghost Golf', normalizedName: 'ghost golf', aliases: ['ghost'], category: 'golf', tier: 'mid' },
  { name: 'Breezy Golf', normalizedName: 'breezy golf', aliases: ['breezy'], category: 'golf', tier: 'mid' },

  // Golf Grips & Accessories
  { name: 'Golf Pride', normalizedName: 'golf pride', aliases: ['golfpride'], category: 'golf', tier: 'premium' },
  { name: 'SuperStroke', normalizedName: 'superstroke', aliases: ['super stroke'], category: 'golf', tier: 'premium' },
  { name: 'Lamkin', normalizedName: 'lamkin', aliases: [], category: 'golf', tier: 'mid' },

  // Golf Tech
  { name: 'Bushnell', normalizedName: 'bushnell', aliases: ['bushnell golf'], category: 'golf', tier: 'premium' },
  { name: 'Arccos', normalizedName: 'arccos', aliases: ['arccos golf'], category: 'golf', tier: 'premium' },

  // Golf Value
  { name: 'Vice Golf', normalizedName: 'vice golf', aliases: ['vice'], category: 'golf', tier: 'value' },
  { name: 'Kirkland', normalizedName: 'kirkland', aliases: ['kirkland signature'], category: 'golf', tier: 'value' },

  // Golf Shafts
  { name: 'Project X', normalizedName: 'project x', aliases: ['projectx'], category: 'golf', tier: 'premium' },
  { name: 'Fujikura', normalizedName: 'fujikura', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Graphite Design', normalizedName: 'graphite design', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Aldila', normalizedName: 'aldila', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'True Temper', normalizedName: 'true temper', aliases: ['truetemper'], category: 'golf', tier: 'premium' },
  { name: 'KBS', normalizedName: 'kbs', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Nippon', normalizedName: 'nippon', aliases: [], category: 'golf', tier: 'premium' },

  // Golf Accessories & Headcovers
  { name: 'Seamus Golf', normalizedName: 'seamus golf', aliases: ['seamus'], category: 'golf', tier: 'luxury' },
  { name: 'Dormie Workshop', normalizedName: 'dormie workshop', aliases: ['dormie'], category: 'golf', tier: 'luxury' },
  { name: 'Rose & Fire', normalizedName: 'rose & fire', aliases: ['rose and fire'], category: 'golf', tier: 'premium' },
  { name: 'PRG Golf', normalizedName: 'prg golf', aliases: ['prg'], category: 'golf', tier: 'premium' },
  { name: 'Cayce Golf', normalizedName: 'cayce golf', aliases: ['cayce'], category: 'golf', tier: 'premium' },
  { name: 'Pins & Aces', normalizedName: 'pins & aces', aliases: ['pins and aces'], category: 'golf', tier: 'mid' },
  { name: 'Sunfish', normalizedName: 'sunfish', aliases: ['sunfish golf'], category: 'golf', tier: 'mid' },
  { name: 'Jan Craig', normalizedName: 'jan craig', aliases: [], category: 'golf', tier: 'mid' },
  { name: 'Daphne', normalizedName: 'daphne', aliases: ['daphne headcovers'], category: 'golf', tier: 'mid' },
  { name: 'Stitch', normalizedName: 'stitch', aliases: ['stitch headcovers'], category: 'golf', tier: 'premium' },

  // More Golf Equipment & DTC Brands
  { name: 'Takomo Golf', normalizedName: 'takomo golf', aliases: ['takomo'], category: 'golf', tier: 'mid' },
  { name: 'Sub 70', normalizedName: 'sub 70', aliases: ['sub70'], category: 'golf', tier: 'mid' },
  { name: 'Haywood Golf', normalizedName: 'haywood golf', aliases: ['haywood'], category: 'golf', tier: 'mid' },
  { name: 'New Level Golf', normalizedName: 'new level golf', aliases: ['new level'], category: 'golf', tier: 'mid' },
  { name: 'Maltby', normalizedName: 'maltby', aliases: ['golfworks', 'maltby golf'], category: 'golf', tier: 'value' },
  { name: 'Wishon Golf', normalizedName: 'wishon golf', aliases: ['wishon', 'tom wishon'], category: 'golf', tier: 'mid' },
  { name: 'Ben Hogan Golf', normalizedName: 'ben hogan golf', aliases: ['ben hogan'], category: 'golf', tier: 'mid' },
  { name: 'Edel Golf', normalizedName: 'edel golf', aliases: ['edel'], category: 'golf', tier: 'premium' },
  { name: 'LAB Golf', normalizedName: 'lab golf', aliases: ['lab'], category: 'golf', tier: 'premium' },
  { name: 'Robin Golf', normalizedName: 'robin golf', aliases: ['robin'], category: 'golf', tier: 'mid' },
  { name: 'Stix Golf', normalizedName: 'stix golf', aliases: ['stix'], category: 'golf', tier: 'value' },
  { name: 'Top Flite', normalizedName: 'top flite', aliases: ['topflite'], category: 'golf', tier: 'value' },
  { name: 'Maxfli', normalizedName: 'maxfli', aliases: [], category: 'golf', tier: 'value' },
  { name: 'Noodle', normalizedName: 'noodle', aliases: ['taylormade noodle'], category: 'golf', tier: 'value' },
  { name: 'Snell Golf', normalizedName: 'snell golf', aliases: ['snell'], category: 'golf', tier: 'mid' },
  { name: 'OnCore Golf', normalizedName: 'oncore golf', aliases: ['oncore'], category: 'golf', tier: 'mid' },
  { name: 'Cut Golf', normalizedName: 'cut golf', aliases: ['cut'], category: 'golf', tier: 'value' },
  { name: 'Seed Golf', normalizedName: 'seed golf', aliases: ['seed'], category: 'golf', tier: 'value' },

  // More Golf Apparel
  { name: 'Nike Golf', normalizedName: 'nike golf', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Galvin Green', normalizedName: 'galvin green', aliases: [], category: 'golf', tier: 'luxury' },
  { name: 'J.Lindeberg', normalizedName: 'j.lindeberg', aliases: ['j lindeberg', 'jlindeberg'], category: 'golf', tier: 'luxury' },
  { name: 'Bogner', normalizedName: 'bogner', aliases: [], category: 'golf', tier: 'luxury' },
  { name: 'Lyle & Scott', normalizedName: 'lyle & scott', aliases: ['lyle and scott'], category: 'golf', tier: 'premium' },
  { name: 'Original Penguin', normalizedName: 'original penguin', aliases: ['penguin golf'], category: 'golf', tier: 'mid' },
  { name: 'PUMA Golf', normalizedName: 'puma golf', aliases: [], category: 'golf', tier: 'mid' },
  { name: 'Holderness & Bourne', normalizedName: 'holderness & bourne', aliases: ['holderness and bourne', 'h&b'], category: 'golf', tier: 'premium' },
  { name: 'Rhoback', normalizedName: 'rhoback', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'B.Draddy', normalizedName: 'b.draddy', aliases: ['b draddy', 'bdraddy'], category: 'golf', tier: 'premium' },
  { name: 'Criquet', normalizedName: 'criquet', aliases: ['criquet shirts'], category: 'golf', tier: 'premium' },
  { name: 'Devereux', normalizedName: 'devereux', aliases: ['devereux golf'], category: 'golf', tier: 'mid' },
  { name: 'Radmor', normalizedName: 'radmor', aliases: [], category: 'golf', tier: 'premium' },
  { name: 'Barstool Golf', normalizedName: 'barstool golf', aliases: ['foreplay', 'barstool sports golf'], category: 'golf', tier: 'mid' },
  { name: 'William Murray Golf', normalizedName: 'william murray golf', aliases: ['william murray', 'bill murray golf'], category: 'golf', tier: 'mid' },

  // ============================================
  // TECH & ELECTRONICS
  // ============================================

  // Premium Tech
  { name: 'Apple', normalizedName: 'apple', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'Samsung', normalizedName: 'samsung', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'Sony', normalizedName: 'sony', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'Microsoft', normalizedName: 'microsoft', aliases: ['msft'], category: 'tech', tier: 'premium' },
  { name: 'Google', normalizedName: 'google', aliases: [], category: 'tech', tier: 'premium' },

  // Mid-Tier Tech
  { name: 'Dell', normalizedName: 'dell', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'HP', normalizedName: 'hp', aliases: ['hewlett-packard'], category: 'tech', tier: 'mid' },
  { name: 'Lenovo', normalizedName: 'lenovo', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'ASUS', normalizedName: 'asus', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'MSI', normalizedName: 'msi', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'LG', normalizedName: 'lg', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Logitech', normalizedName: 'logitech', aliases: ['logi'], category: 'tech', tier: 'mid' },
  { name: 'Belkin', normalizedName: 'belkin', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Anker', normalizedName: 'anker', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'OnePlus', normalizedName: 'oneplus', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Nothing', normalizedName: 'nothing', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Garmin', normalizedName: 'garmin', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'Acer', normalizedName: 'acer', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Huawei', normalizedName: 'huawei', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Motorola', normalizedName: 'motorola', aliases: ['moto'], category: 'tech', tier: 'mid' },
  { name: 'Nvidia', normalizedName: 'nvidia', aliases: ['geforce', 'rtx'], category: 'tech', tier: 'premium' },
  { name: 'AMD', normalizedName: 'amd', aliases: ['radeon', 'ryzen'], category: 'tech', tier: 'premium' },
  { name: 'Intel', normalizedName: 'intel', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'TP-Link', normalizedName: 'tp-link', aliases: ['tplink'], category: 'tech', tier: 'mid' },
  { name: 'Netgear', normalizedName: 'netgear', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Ubiquiti', normalizedName: 'ubiquiti', aliases: ['unifi'], category: 'tech', tier: 'premium' },
  { name: 'Ring', normalizedName: 'ring', aliases: ['ring doorbell'], category: 'tech', tier: 'mid' },
  { name: 'Nest', normalizedName: 'nest', aliases: ['google nest'], category: 'tech', tier: 'premium' },
  { name: 'Philips Hue', normalizedName: 'philips hue', aliases: ['hue'], category: 'tech', tier: 'premium' },
  { name: 'Sonnen', normalizedName: 'sonnen', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'Roku', normalizedName: 'roku', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Amazon', normalizedName: 'amazon', aliases: ['echo', 'alexa', 'kindle', 'fire tv'], category: 'tech', tier: 'mid' },
  { name: 'Meta', normalizedName: 'meta', aliases: ['meta quest', 'oculus'], category: 'tech', tier: 'premium' },
  { name: 'Dynabook', normalizedName: 'dynabook', aliases: ['toshiba laptop'], category: 'tech', tier: 'mid' },
  { name: 'Framework', normalizedName: 'framework', aliases: ['framework laptop'], category: 'tech', tier: 'premium' },
  { name: 'Valve', normalizedName: 'valve', aliases: ['steam deck'], category: 'tech', tier: 'premium' },
  { name: 'Western Digital', normalizedName: 'western digital', aliases: ['wd', 'sandisk'], category: 'tech', tier: 'mid' },
  { name: 'Seagate', normalizedName: 'seagate', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Crucial', normalizedName: 'crucial', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Synology', normalizedName: 'synology', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'CalDigit', normalizedName: 'caldigit', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'Twelve South', normalizedName: 'twelve south', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'Satechi', normalizedName: 'satechi', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'HyperDrive', normalizedName: 'hyperdrive', aliases: [], category: 'tech', tier: 'mid' },
  { name: 'Elgato', normalizedName: 'elgato', aliases: [], category: 'tech', tier: 'premium' },
  { name: 'Raspberry Pi', normalizedName: 'raspberry pi', aliases: ['rpi'], category: 'tech', tier: 'mid' },

  // ============================================
  // AUDIO
  // ============================================

  { name: 'Bang & Olufsen', normalizedName: 'bang & olufsen', aliases: ['b&o', 'bang olufsen'], category: 'audio', tier: 'luxury' },
  { name: 'Shure', normalizedName: 'shure', aliases: [], category: 'audio', tier: 'luxury' },
  { name: 'Bose', normalizedName: 'bose', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Sonos', normalizedName: 'sonos', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Sennheiser', normalizedName: 'sennheiser', aliases: ['senheiser', 'sennheizer'], category: 'audio', tier: 'premium' },
  { name: 'Audio-Technica', normalizedName: 'audio-technica', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Beats', normalizedName: 'beats', aliases: ['beats by dre'], category: 'audio', tier: 'premium' },
  { name: 'RODE', normalizedName: 'rode', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Blue Microphones', normalizedName: 'blue microphones', aliases: ['blue yeti', 'blue snowball'], category: 'audio', tier: 'premium' },
  { name: 'JBL', normalizedName: 'jbl', aliases: [], category: 'audio', tier: 'mid' },
  { name: 'Skullcandy', normalizedName: 'skullcandy', aliases: [], category: 'audio', tier: 'mid' },
  { name: 'Focal', normalizedName: 'focal', aliases: [], category: 'audio', tier: 'luxury' },
  { name: 'Audeze', normalizedName: 'audeze', aliases: [], category: 'audio', tier: 'luxury' },
  { name: 'Beyerdynamic', normalizedName: 'beyerdynamic', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'AKG', normalizedName: 'akg', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Klipsch', normalizedName: 'klipsch', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'KEF', normalizedName: 'kef', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Harman Kardon', normalizedName: 'harman kardon', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Marshall', normalizedName: 'marshall', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Jabra', normalizedName: 'jabra', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Campfire Audio', normalizedName: 'campfire audio', aliases: ['campfire'], category: 'audio', tier: 'luxury' },
  { name: 'Moondrop', normalizedName: 'moondrop', aliases: [], category: 'audio', tier: 'mid' },
  { name: 'FiiO', normalizedName: 'fiio', aliases: [], category: 'audio', tier: 'mid' },
  { name: 'Bowers & Wilkins', normalizedName: 'bowers & wilkins', aliases: ['b&w'], category: 'audio', tier: 'luxury' },
  { name: 'Devialet', normalizedName: 'devialet', aliases: [], category: 'audio', tier: 'luxury' },
  { name: 'McIntosh', normalizedName: 'mcintosh', aliases: [], category: 'audio', tier: 'luxury' },
  { name: 'SVS', normalizedName: 'svs', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Denon', normalizedName: 'denon', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Marantz', normalizedName: 'marantz', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Wharfedale', normalizedName: 'wharfedale', aliases: [], category: 'audio', tier: 'mid' },
  { name: 'Edifier', normalizedName: 'edifier', aliases: [], category: 'audio', tier: 'mid' },
  { name: 'Technics', normalizedName: 'technics', aliases: [], category: 'audio', tier: 'premium' },
  { name: 'Pro-Ject', normalizedName: 'pro-ject', aliases: ['project audio'], category: 'audio', tier: 'premium' },
  { name: 'U-Turn Audio', normalizedName: 'u-turn audio', aliases: ['u-turn', 'uturn'], category: 'audio', tier: 'mid' },
  { name: 'Anker Soundcore', normalizedName: 'anker soundcore', aliases: ['soundcore'], category: 'audio', tier: 'value' },
  { name: 'Topping', normalizedName: 'topping', aliases: [], category: 'audio', tier: 'mid' },
  { name: 'SMSL', normalizedName: 'smsl', aliases: [], category: 'audio', tier: 'mid' },
  { name: 'Elac', normalizedName: 'elac', aliases: [], category: 'audio', tier: 'premium' },

  // ============================================
  // GAMING
  // ============================================

  { name: 'PlayStation', normalizedName: 'playstation', aliases: ['sony playstation', 'ps5', 'ps4'], category: 'gaming', tier: 'luxury' },
  { name: 'Xbox', normalizedName: 'xbox', aliases: ['microsoft xbox'], category: 'gaming', tier: 'luxury' },
  { name: 'Secretlab', normalizedName: 'secretlab', aliases: [], category: 'gaming', tier: 'luxury' },
  { name: 'Nintendo', normalizedName: 'nintendo', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'Razer', normalizedName: 'razer', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'Corsair', normalizedName: 'corsair', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'SteelSeries', normalizedName: 'steelseries', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'NZXT', normalizedName: 'nzxt', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'ASUS ROG', normalizedName: 'asus rog', aliases: ['republic of gamers', 'rog'], category: 'gaming', tier: 'premium' },
  { name: 'BenQ', normalizedName: 'benq', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'Logitech G', normalizedName: 'logitech g', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'SCUF Gaming', normalizedName: 'scuf gaming', aliases: ['scuf'], category: 'gaming', tier: 'premium' },
  { name: 'Ducky', normalizedName: 'ducky', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'HyperX', normalizedName: 'hyperx', aliases: [], category: 'gaming', tier: 'mid' },
  { name: 'Keychron', normalizedName: 'keychron', aliases: [], category: 'gaming', tier: 'mid' },

  // ============================================
  // PHOTOGRAPHY
  // ============================================

  { name: 'Leica', normalizedName: 'leica', aliases: [], category: 'photography', tier: 'luxury' },
  { name: 'Hasselblad', normalizedName: 'hasselblad', aliases: [], category: 'photography', tier: 'luxury' },
  { name: 'Gitzo', normalizedName: 'gitzo', aliases: [], category: 'photography', tier: 'luxury' },
  { name: 'Profoto', normalizedName: 'profoto', aliases: [], category: 'photography', tier: 'luxury' },
  { name: 'Canon', normalizedName: 'canon', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'Nikon', normalizedName: 'nikon', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'Fujifilm', normalizedName: 'fujifilm', aliases: ['fuji', 'fuji x'], category: 'photography', tier: 'premium' },
  { name: 'Panasonic', normalizedName: 'panasonic', aliases: ['lumix'], category: 'photography', tier: 'premium' },
  { name: 'DJI', normalizedName: 'dji', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'GoPro', normalizedName: 'gopro', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'Peak Design', normalizedName: 'peak design', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'Manfrotto', normalizedName: 'manfrotto', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'Think Tank', normalizedName: 'think tank', aliases: ['think tank photo'], category: 'photography', tier: 'premium' },
  { name: 'Insta360', normalizedName: 'insta360', aliases: [], category: 'photography', tier: 'mid' },
  { name: 'Lowepro', normalizedName: 'lowepro', aliases: [], category: 'photography', tier: 'mid' },
  { name: 'Godox', normalizedName: 'godox', aliases: [], category: 'photography', tier: 'mid' },

  // ============================================
  // OUTDOOR & CAMPING
  // ============================================

  { name: 'Snow Peak', normalizedName: 'snow peak', aliases: [], category: 'outdoor', tier: 'luxury' },
  { name: "Arc'teryx", normalizedName: 'arcteryx', aliases: ['arc teryx', 'arcteryx'], category: 'outdoor', tier: 'luxury' },
  { name: 'Patagonia', normalizedName: 'patagonia', aliases: ['pata', 'patigonia', 'patogonia'], category: 'outdoor', tier: 'premium' },
  { name: 'The North Face', normalizedName: 'the north face', aliases: ['north face', 'tnf'], category: 'outdoor', tier: 'premium' },
  { name: 'Black Diamond', normalizedName: 'black diamond', aliases: ['bd'], category: 'outdoor', tier: 'premium' },
  { name: 'Marmot', normalizedName: 'marmot', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Mountain Hardwear', normalizedName: 'mountain hardwear', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Osprey', normalizedName: 'osprey', aliases: ['osprey packs'], category: 'outdoor', tier: 'premium' },
  { name: 'Gregory', normalizedName: 'gregory', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Big Agnes', normalizedName: 'big agnes', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'NEMO', normalizedName: 'nemo', aliases: ['nemo equipment'], category: 'outdoor', tier: 'premium' },
  { name: 'MSR', normalizedName: 'msr', aliases: ['mountain safety research'], category: 'outdoor', tier: 'premium' },
  { name: 'Sea to Summit', normalizedName: 'sea to summit', aliases: ['s2s'], category: 'outdoor', tier: 'premium' },
  { name: 'Jetboil', normalizedName: 'jetboil', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'YETI', normalizedName: 'yeti', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Ember', normalizedName: 'ember', aliases: ['ember mug'], category: 'outdoor', tier: 'premium' },
  { name: 'Cotopaxi', normalizedName: 'cotopaxi', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Salomon', normalizedName: 'salomon', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Vasque', normalizedName: 'vasque', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Oboz', normalizedName: 'oboz', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'La Sportiva', normalizedName: 'la sportiva', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Scarpa', normalizedName: 'scarpa', aliases: [], category: 'outdoor', tier: 'premium' },
  { name: 'Kelty', normalizedName: 'kelty', aliases: [], category: 'outdoor', tier: 'mid' },
  { name: 'Hydro Flask', normalizedName: 'hydro flask', aliases: ['hydroflask'], category: 'outdoor', tier: 'mid' },
  { name: 'Stanley', normalizedName: 'stanley', aliases: [], category: 'outdoor', tier: 'mid' },
  { name: 'Columbia', normalizedName: 'columbia', aliases: ['columbia sportswear'], category: 'outdoor', tier: 'mid' },
  { name: 'Merrell', normalizedName: 'merrell', aliases: [], category: 'outdoor', tier: 'mid' },
  { name: 'Filson', normalizedName: 'filson', aliases: ['c.c. filson'], category: 'outdoor', tier: 'luxury' },
  { name: 'Carhartt', normalizedName: 'carhartt', aliases: ['carhartt wip'], category: 'outdoor', tier: 'mid' },

  // ============================================
  // FOOTWEAR
  // ============================================

  { name: 'Allen Edmonds', normalizedName: 'allen edmonds', aliases: [], category: 'footwear', tier: 'luxury' },
  { name: 'ECCO', normalizedName: 'ecco', aliases: [], category: 'footwear', tier: 'premium' },
  { name: 'Allbirds', normalizedName: 'allbirds', aliases: [], category: 'footwear', tier: 'premium' },
  { name: 'New Balance', normalizedName: 'new balance', aliases: ['nb'], category: 'footwear', tier: 'premium' },
  { name: 'ASICS', normalizedName: 'asics', aliases: [], category: 'footwear', tier: 'premium' },
  { name: 'HOKA', normalizedName: 'hoka', aliases: ['hoka one one'], category: 'footwear', tier: 'premium' },
  { name: 'Brooks', normalizedName: 'brooks', aliases: ['brooks running'], category: 'footwear', tier: 'premium' },
  { name: 'Saucony', normalizedName: 'saucony', aliases: [], category: 'footwear', tier: 'premium' },
  { name: 'On', normalizedName: 'on', aliases: ['on running', 'on cloud'], category: 'footwear', tier: 'premium' },
  { name: 'Birkenstock', normalizedName: 'birkenstock', aliases: [], category: 'footwear', tier: 'premium' },
  { name: 'Cole Haan', normalizedName: 'cole haan', aliases: [], category: 'footwear', tier: 'premium' },
  { name: 'Vans', normalizedName: 'vans', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Converse', normalizedName: 'converse', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Clarks', normalizedName: 'clarks', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Jordan', normalizedName: 'jordan', aliases: ['air jordan', 'jordan brand'], category: 'footwear', tier: 'premium' },
  { name: 'Yeezy', normalizedName: 'yeezy', aliases: [], category: 'footwear', tier: 'luxury' },
  { name: 'Common Projects', normalizedName: 'common projects', aliases: [], category: 'footwear', tier: 'luxury' },
  { name: 'Golden Goose', normalizedName: 'golden goose', aliases: ['ggdb'], category: 'footwear', tier: 'luxury' },
  { name: 'Salvatore Ferragamo', normalizedName: 'salvatore ferragamo', aliases: ['ferragamo'], category: 'footwear', tier: 'luxury' },
  { name: 'Tods', normalizedName: 'tods', aliases: ["tod's"], category: 'footwear', tier: 'luxury' },
  { name: 'Crocs', normalizedName: 'crocs', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Hey Dude', normalizedName: 'hey dude', aliases: ['heydude'], category: 'footwear', tier: 'value' },
  { name: 'Merrell', normalizedName: 'merrell', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Timberland', normalizedName: 'timberland', aliases: ['timbs'], category: 'footwear', tier: 'mid' },
  { name: 'Dr. Martens', normalizedName: 'dr. martens', aliases: ['doc martens', 'docs'], category: 'footwear', tier: 'premium' },
  { name: 'Blundstone', normalizedName: 'blundstone', aliases: ['blunnies'], category: 'footwear', tier: 'premium' },
  { name: 'Red Wing', normalizedName: 'red wing', aliases: ['red wing heritage'], category: 'footwear', tier: 'premium' },
  { name: 'Wolverine', normalizedName: 'wolverine', aliases: ['wolverine 1000 mile'], category: 'footwear', tier: 'premium' },
  { name: 'Thursday Boots', normalizedName: 'thursday boots', aliases: ['thursday boot company'], category: 'footwear', tier: 'mid' },
  { name: 'Sperry', normalizedName: 'sperry', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Teva', normalizedName: 'teva', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Chacos', normalizedName: 'chacos', aliases: ['chaco'], category: 'footwear', tier: 'mid' },
  { name: 'Altra', normalizedName: 'altra', aliases: ['altra running'], category: 'footwear', tier: 'premium' },
  { name: 'La Sportiva', normalizedName: 'la sportiva', aliases: [], category: 'footwear', tier: 'premium' },
  { name: 'Puma', normalizedName: 'puma', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Reebok', normalizedName: 'reebok', aliases: [], category: 'footwear', tier: 'mid' },
  { name: 'Sketchers', normalizedName: 'sketchers', aliases: ['skechers'], category: 'footwear', tier: 'value' },
  { name: 'Native Shoes', normalizedName: 'native shoes', aliases: [], category: 'footwear', tier: 'mid' },

  // ============================================
  // FASHION & LUXURY
  // ============================================

  { name: 'Gucci', normalizedName: 'gucci', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Louis Vuitton', normalizedName: 'louis vuitton', aliases: ['lv'], category: 'fashion', tier: 'luxury' },
  { name: 'Prada', normalizedName: 'prada', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Hermès', normalizedName: 'hermes', aliases: ['hermes'], category: 'fashion', tier: 'luxury' },
  { name: 'Chanel', normalizedName: 'chanel', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Dior', normalizedName: 'dior', aliases: ['christian dior'], category: 'fashion', tier: 'luxury' },
  { name: 'Burberry', normalizedName: 'burberry', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Balenciaga', normalizedName: 'balenciaga', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Bottega Veneta', normalizedName: 'bottega veneta', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Loewe', normalizedName: 'loewe', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Acne Studios', normalizedName: 'acne studios', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Ralph Lauren', normalizedName: 'ralph lauren', aliases: ['polo'], category: 'fashion', tier: 'premium' },
  { name: 'Hugo Boss', normalizedName: 'hugo boss', aliases: ['boss'], category: 'fashion', tier: 'premium' },
  { name: 'Brooks Brothers', normalizedName: 'brooks brothers', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Theory', normalizedName: 'theory', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'A.P.C.', normalizedName: 'apc', aliases: ['apc'], category: 'fashion', tier: 'premium' },
  { name: 'Tommy Hilfiger', normalizedName: 'tommy hilfiger', aliases: [], category: 'fashion', tier: 'mid' },
  { name: 'Calvin Klein', normalizedName: 'calvin klein', aliases: ['ck'], category: 'fashion', tier: 'mid' },
  { name: 'J.Crew', normalizedName: 'j.crew', aliases: ['jcrew'], category: 'fashion', tier: 'mid' },
  { name: 'Versace', normalizedName: 'versace', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Saint Laurent', normalizedName: 'saint laurent', aliases: ['ysl', 'yves saint laurent'], category: 'fashion', tier: 'luxury' },
  { name: 'Givenchy', normalizedName: 'givenchy', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Valentino', normalizedName: 'valentino', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Fendi', normalizedName: 'fendi', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Moncler', normalizedName: 'moncler', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Off-White', normalizedName: 'off-white', aliases: ['off white', 'offwhite'], category: 'fashion', tier: 'luxury' },
  { name: 'Fear of God', normalizedName: 'fear of god', aliases: ['fog', 'essentials'], category: 'fashion', tier: 'luxury' },
  { name: 'Stone Island', normalizedName: 'stone island', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Canada Goose', normalizedName: 'canada goose', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Kith', normalizedName: 'kith', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Stüssy', normalizedName: 'stussy', aliases: ['stussy', 'stüssy'], category: 'fashion', tier: 'premium' },
  { name: 'Supreme', normalizedName: 'supreme', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Carhartt WIP', normalizedName: 'carhartt wip', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Comme des Garçons', normalizedName: 'comme des garcons', aliases: ['cdg'], category: 'fashion', tier: 'luxury' },
  { name: 'Zara', normalizedName: 'zara', aliases: [], category: 'fashion', tier: 'mid' },
  { name: 'H&M', normalizedName: 'h&m', aliases: ['hm'], category: 'fashion', tier: 'value' },
  { name: 'Uniqlo', normalizedName: 'uniqlo', aliases: [], category: 'fashion', tier: 'mid' },
  { name: 'Gap', normalizedName: 'gap', aliases: [], category: 'fashion', tier: 'mid' },
  { name: 'Banana Republic', normalizedName: 'banana republic', aliases: [], category: 'fashion', tier: 'mid' },
  { name: 'Club Monaco', normalizedName: 'club monaco', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'COS', normalizedName: 'cos', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Aritzia', normalizedName: 'aritzia', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Abercrombie & Fitch', normalizedName: 'abercrombie & fitch', aliases: ['abercrombie', 'a&f'], category: 'fashion', tier: 'mid' },
  { name: 'Lacoste', normalizedName: 'lacoste', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Fred Perry', normalizedName: 'fred perry', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Barbour', normalizedName: 'barbour', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Faherty', normalizedName: 'faherty', aliases: ['faherty brand'], category: 'fashion', tier: 'premium' },
  { name: 'Vineyard Vines', normalizedName: 'vineyard vines', aliases: ['vv'], category: 'fashion', tier: 'mid' },
  { name: 'Southern Tide', normalizedName: 'southern tide', aliases: [], category: 'fashion', tier: 'mid' },
  { name: 'Billy Reid', normalizedName: 'billy reid', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Rag & Bone', normalizedName: 'rag & bone', aliases: ['rag and bone'], category: 'fashion', tier: 'premium' },
  { name: 'AllSaints', normalizedName: 'allsaints', aliases: ['all saints'], category: 'fashion', tier: 'premium' },
  { name: 'Scotch & Soda', normalizedName: 'scotch & soda', aliases: ['scotch and soda'], category: 'fashion', tier: 'mid' },
  { name: 'Massimo Dutti', normalizedName: 'massimo dutti', aliases: [], category: 'fashion', tier: 'premium' },
  { name: 'Brunello Cucinelli', normalizedName: 'brunello cucinelli', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Loro Piana', normalizedName: 'loro piana', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Tom Ford', normalizedName: 'tom ford', aliases: [], category: 'fashion', tier: 'luxury' },
  { name: 'Armani', normalizedName: 'armani', aliases: ['giorgio armani', 'emporio armani'], category: 'fashion', tier: 'luxury' },

  // ============================================
  // APPAREL (D2C & General)
  // ============================================

  { name: 'Nike', normalizedName: 'nike', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'adidas', normalizedName: 'adidas', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'Under Armour', normalizedName: 'under armour', aliases: ['ua', 'underarmour'], category: 'apparel', tier: 'premium' },
  { name: 'Bonobos', normalizedName: 'bonobos', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'Everlane', normalizedName: 'everlane', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'Kotn', normalizedName: 'kotn', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'Cuyana', normalizedName: 'cuyana', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'Reformation', normalizedName: 'reformation', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'Buck Mason', normalizedName: 'buck mason', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'Todd Snyder', normalizedName: 'todd snyder', aliases: [], category: 'apparel', tier: 'premium' },
  { name: 'Marine Layer', normalizedName: 'marine layer', aliases: [], category: 'apparel', tier: 'mid' },
  { name: 'UNTUCKit', normalizedName: 'untuckit', aliases: [], category: 'apparel', tier: 'mid' },

  // ============================================
  // ACTIVEWEAR & FITNESS
  // ============================================

  { name: 'Lululemon', normalizedName: 'lululemon', aliases: ['lulu', 'lulolemon', 'lululemmon'], category: 'activewear', tier: 'luxury' },
  { name: 'Alo Yoga', normalizedName: 'alo yoga', aliases: ['alo'], category: 'activewear', tier: 'luxury' },
  { name: 'Vuori', normalizedName: 'vuori', aliases: [], category: 'activewear', tier: 'premium' },
  { name: 'Rhone', normalizedName: 'rhone', aliases: [], category: 'activewear', tier: 'premium' },
  { name: 'Athleta', normalizedName: 'athleta', aliases: [], category: 'activewear', tier: 'premium' },
  { name: 'Gymshark', normalizedName: 'gymshark', aliases: [], category: 'activewear', tier: 'premium' },
  { name: 'NOBULL', normalizedName: 'nobull', aliases: [], category: 'activewear', tier: 'premium' },
  { name: 'Ten Thousand', normalizedName: 'ten thousand', aliases: [], category: 'activewear', tier: 'premium' },
  { name: 'Puma', normalizedName: 'puma', aliases: [], category: 'athletic', tier: 'mid' },
  { name: 'Reebok', normalizedName: 'reebok', aliases: [], category: 'athletic', tier: 'mid' },
  { name: 'Tracksmith', normalizedName: 'tracksmith', aliases: [], category: 'running', tier: 'premium' },

  // Fitness Equipment
  { name: 'Tonal', normalizedName: 'tonal', aliases: [], category: 'fitness', tier: 'luxury' },
  { name: 'Therabody', normalizedName: 'therabody', aliases: ['theragun'], category: 'fitness', tier: 'premium' },
  { name: 'Hyperice', normalizedName: 'hyperice', aliases: [], category: 'fitness', tier: 'premium' },
  { name: 'Peloton', normalizedName: 'peloton', aliases: [], category: 'fitness', tier: 'premium' },
  { name: 'Hydrow', normalizedName: 'hydrow', aliases: [], category: 'fitness', tier: 'premium' },
  { name: 'Rogue Fitness', normalizedName: 'rogue fitness', aliases: ['rogue'], category: 'fitness', tier: 'mid' },

  // Wearables
  { name: 'WHOOP', normalizedName: 'whoop', aliases: [], category: 'wearables', tier: 'premium' },
  { name: 'Oura', normalizedName: 'oura', aliases: ['oura ring'], category: 'wearables', tier: 'premium' },

  // ============================================
  // EDC & ACCESSORIES
  // ============================================

  { name: 'Chris Reeve', normalizedName: 'chris reeve', aliases: ['crk', 'chris reeve knives'], category: 'edc', tier: 'luxury' },
  { name: 'Benchmade', normalizedName: 'benchmade', aliases: [], category: 'edc', tier: 'premium' },
  { name: 'Spyderco', normalizedName: 'spyderco', aliases: [], category: 'edc', tier: 'premium' },
  { name: 'Leatherman', normalizedName: 'leatherman', aliases: [], category: 'edc', tier: 'premium' },
  { name: 'Victorinox', normalizedName: 'victorinox', aliases: ['swiss army'], category: 'edc', tier: 'premium' },
  { name: 'SureFire', normalizedName: 'surefire', aliases: [], category: 'edc', tier: 'premium' },
  { name: 'The Ridge', normalizedName: 'the ridge', aliases: ['ridge wallet', 'ridge'], category: 'edc', tier: 'premium' },
  { name: 'Bellroy', normalizedName: 'bellroy', aliases: [], category: 'edc', tier: 'premium' },
  { name: 'Kershaw', normalizedName: 'kershaw', aliases: [], category: 'edc', tier: 'mid' },
  { name: 'CRKT', normalizedName: 'crkt', aliases: ['columbia river knife & tool'], category: 'edc', tier: 'mid' },
  { name: 'Gerber', normalizedName: 'gerber', aliases: [], category: 'edc', tier: 'mid' },
  { name: 'Olight', normalizedName: 'olight', aliases: [], category: 'edc', tier: 'mid' },
  { name: 'Fenix', normalizedName: 'fenix', aliases: [], category: 'edc', tier: 'mid' },
  { name: 'Streamlight', normalizedName: 'streamlight', aliases: [], category: 'edc', tier: 'mid' },

  // ============================================
  // TRAVEL & BAGS
  // ============================================

  { name: 'Rimowa', normalizedName: 'rimowa', aliases: [], category: 'travel', tier: 'luxury' },
  { name: 'Tumi', normalizedName: 'tumi', aliases: [], category: 'travel', tier: 'luxury' },
  { name: 'Senreve', normalizedName: 'senreve', aliases: [], category: 'bags', tier: 'luxury' },
  { name: 'Away', normalizedName: 'away', aliases: [], category: 'travel', tier: 'premium' },
  { name: 'Briggs & Riley', normalizedName: 'briggs & riley', aliases: ['briggs riley'], category: 'travel', tier: 'premium' },
  { name: 'Dagne Dover', normalizedName: 'dagne dover', aliases: [], category: 'bags', tier: 'premium' },
  { name: 'CALPAK', normalizedName: 'calpak', aliases: [], category: 'bags', tier: 'mid' },
  { name: 'Béis', normalizedName: 'beis', aliases: ['beis'], category: 'bags', tier: 'mid' },
  { name: 'Samsonite', normalizedName: 'samsonite', aliases: [], category: 'travel', tier: 'mid' },
  { name: 'Monos', normalizedName: 'monos', aliases: [], category: 'travel', tier: 'premium' },
  { name: 'July', normalizedName: 'july', aliases: ['july luggage'], category: 'travel', tier: 'premium' },
  { name: 'Paravel', normalizedName: 'paravel', aliases: [], category: 'travel', tier: 'premium' },
  { name: 'Baboon to the Moon', normalizedName: 'baboon to the moon', aliases: ['baboon'], category: 'bags', tier: 'premium' },
  { name: 'Tortuga', normalizedName: 'tortuga', aliases: [], category: 'bags', tier: 'premium' },
  { name: 'Aer', normalizedName: 'aer', aliases: ['aer bags'], category: 'bags', tier: 'premium' },
  { name: 'Topo Designs', normalizedName: 'topo designs', aliases: ['topo'], category: 'bags', tier: 'premium' },
  { name: 'Mystery Ranch', normalizedName: 'mystery ranch', aliases: [], category: 'bags', tier: 'premium' },
  { name: 'Fjällräven', normalizedName: 'fjallraven', aliases: ['fjallraven', 'kanken'], category: 'bags', tier: 'premium' },
  { name: 'Herschel', normalizedName: 'herschel', aliases: ['herschel supply'], category: 'bags', tier: 'mid' },
  { name: 'Loungefly', normalizedName: 'loungefly', aliases: [], category: 'bags', tier: 'mid' },
  { name: 'Coach', normalizedName: 'coach', aliases: [], category: 'bags', tier: 'premium' },
  { name: 'Michael Kors', normalizedName: 'michael kors', aliases: ['mk'], category: 'bags', tier: 'premium' },
  { name: 'Kate Spade', normalizedName: 'kate spade', aliases: [], category: 'bags', tier: 'premium' },
  { name: 'Longchamp', normalizedName: 'longchamp', aliases: [], category: 'bags', tier: 'premium' },
  { name: 'Mansur Gavriel', normalizedName: 'mansur gavriel', aliases: [], category: 'bags', tier: 'luxury' },
  { name: 'Polène', normalizedName: 'polene', aliases: ['polene'], category: 'bags', tier: 'luxury' },

  // ============================================
  // WATCHES
  // ============================================

  { name: 'Rolex', normalizedName: 'rolex', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'Omega', normalizedName: 'omega', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'TAG Heuer', normalizedName: 'tag heuer', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'Tudor', normalizedName: 'tudor', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'Grand Seiko', normalizedName: 'grand seiko', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'Seiko', normalizedName: 'seiko', aliases: [], category: 'watches', tier: 'mid' },
  { name: 'Citizen', normalizedName: 'citizen', aliases: [], category: 'watches', tier: 'mid' },
  { name: 'Tissot', normalizedName: 'tissot', aliases: [], category: 'watches', tier: 'mid' },
  { name: 'Hamilton', normalizedName: 'hamilton', aliases: [], category: 'watches', tier: 'mid' },
  { name: 'Patek Philippe', normalizedName: 'patek philippe', aliases: ['patek'], category: 'watches', tier: 'luxury' },
  { name: 'Audemars Piguet', normalizedName: 'audemars piguet', aliases: ['ap', 'audemars'], category: 'watches', tier: 'luxury' },
  { name: 'Cartier', normalizedName: 'cartier', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'IWC', normalizedName: 'iwc', aliases: ['iwc schaffhausen'], category: 'watches', tier: 'luxury' },
  { name: 'Jaeger-LeCoultre', normalizedName: 'jaeger-lecoultre', aliases: ['jlc', 'jaeger lecoultre'], category: 'watches', tier: 'luxury' },
  { name: 'Breitling', normalizedName: 'breitling', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'Panerai', normalizedName: 'panerai', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'Hublot', normalizedName: 'hublot', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'Zenith', normalizedName: 'zenith', aliases: [], category: 'watches', tier: 'luxury' },
  { name: 'Longines', normalizedName: 'longines', aliases: [], category: 'watches', tier: 'premium' },
  { name: 'Nomos', normalizedName: 'nomos', aliases: ['nomos glashutte'], category: 'watches', tier: 'premium' },
  { name: 'Oris', normalizedName: 'oris', aliases: [], category: 'watches', tier: 'premium' },
  { name: 'Bell & Ross', normalizedName: 'bell & ross', aliases: ['bell and ross'], category: 'watches', tier: 'premium' },
  { name: 'Sinn', normalizedName: 'sinn', aliases: [], category: 'watches', tier: 'premium' },
  { name: 'Junghans', normalizedName: 'junghans', aliases: [], category: 'watches', tier: 'premium' },
  { name: 'Casio', normalizedName: 'casio', aliases: ['g-shock', 'gshock'], category: 'watches', tier: 'mid' },
  { name: 'Orient', normalizedName: 'orient', aliases: [], category: 'watches', tier: 'mid' },
  { name: 'Bulova', normalizedName: 'bulova', aliases: [], category: 'watches', tier: 'mid' },
  { name: 'Timex', normalizedName: 'timex', aliases: [], category: 'watches', tier: 'value' },
  { name: 'Fossil', normalizedName: 'fossil', aliases: [], category: 'watches', tier: 'mid' },
  { name: 'MVMT', normalizedName: 'mvmt', aliases: [], category: 'watches', tier: 'mid' },
  { name: 'Shinola', normalizedName: 'shinola', aliases: [], category: 'watches', tier: 'premium' },
  { name: 'Baltic', normalizedName: 'baltic', aliases: ['baltic watches'], category: 'watches', tier: 'mid' },
  { name: 'Christopher Ward', normalizedName: 'christopher ward', aliases: ['c ward'], category: 'watches', tier: 'mid' },
  { name: 'Garmin', normalizedName: 'garmin watch', aliases: [], category: 'watches', tier: 'premium' },
  { name: 'Apple Watch', normalizedName: 'apple watch', aliases: [], category: 'watches', tier: 'premium' },

  // ============================================
  // BEAUTY & COSMETICS
  // ============================================

  { name: 'Charlotte Tilbury', normalizedName: 'charlotte tilbury', aliases: ['ct'], category: 'beauty', tier: 'luxury' },
  { name: 'MAC Cosmetics', normalizedName: 'mac cosmetics', aliases: ['mac', 'm.a.c.'], category: 'beauty', tier: 'luxury' },
  { name: 'NARS Cosmetics', normalizedName: 'nars cosmetics', aliases: ['nars'], category: 'beauty', tier: 'luxury' },
  { name: 'Fenty Beauty', normalizedName: 'fenty beauty', aliases: ['fenty'], category: 'beauty', tier: 'premium' },
  { name: 'Glossier', normalizedName: 'glossier', aliases: [], category: 'beauty', tier: 'premium' },
  { name: 'Kylie Cosmetics', normalizedName: 'kylie cosmetics', aliases: ['kylie'], category: 'beauty', tier: 'premium' },
  { name: 'Rare Beauty', normalizedName: 'rare beauty', aliases: [], category: 'beauty', tier: 'premium' },
  { name: 'Tower 28 Beauty', normalizedName: 'tower 28 beauty', aliases: ['tower 28'], category: 'beauty', tier: 'premium' },
  { name: 'Urban Decay', normalizedName: 'urban decay', aliases: ['ud'], category: 'beauty', tier: 'premium' },
  { name: 'Too Faced', normalizedName: 'too faced', aliases: ['toofaced'], category: 'beauty', tier: 'premium' },
  { name: 'Tarte', normalizedName: 'tarte', aliases: ['tarte cosmetics'], category: 'beauty', tier: 'premium' },
  { name: 'Benefit', normalizedName: 'benefit', aliases: ['benefit cosmetics'], category: 'beauty', tier: 'premium' },
  { name: 'Clinique', normalizedName: 'clinique', aliases: [], category: 'beauty', tier: 'premium' },
  { name: 'Maybelline', normalizedName: 'maybelline', aliases: ['maybelline new york'], category: 'beauty', tier: 'value' },
  { name: 'Revlon', normalizedName: 'revlon', aliases: [], category: 'beauty', tier: 'mid' },
  { name: 'e.l.f.', normalizedName: 'elf', aliases: ['e.l.f', 'elf cosmetics'], category: 'beauty', tier: 'value' },
  { name: 'Laura Mercier', normalizedName: 'laura mercier', aliases: [], category: 'beauty', tier: 'luxury' },
  { name: 'Pat McGrath', normalizedName: 'pat mcgrath', aliases: ['pat mcgrath labs'], category: 'beauty', tier: 'luxury' },
  { name: 'Natasha Denona', normalizedName: 'natasha denona', aliases: [], category: 'beauty', tier: 'luxury' },
  { name: 'Tom Ford Beauty', normalizedName: 'tom ford beauty', aliases: [], category: 'beauty', tier: 'luxury' },
  { name: 'Hourglass', normalizedName: 'hourglass', aliases: ['hourglass cosmetics'], category: 'beauty', tier: 'luxury' },
  { name: 'Bobbi Brown', normalizedName: 'bobbi brown', aliases: [], category: 'beauty', tier: 'premium' },
  { name: 'Lancôme', normalizedName: 'lancome', aliases: ['lancome'], category: 'beauty', tier: 'premium' },
  { name: 'Estée Lauder', normalizedName: 'estee lauder', aliases: ['estee lauder'], category: 'beauty', tier: 'premium' },
  { name: 'YSL Beauty', normalizedName: 'ysl beauty', aliases: ['yves saint laurent beauty'], category: 'beauty', tier: 'luxury' },
  { name: 'Dior Beauty', normalizedName: 'dior beauty', aliases: [], category: 'beauty', tier: 'luxury' },
  { name: 'Chanel Beauty', normalizedName: 'chanel beauty', aliases: [], category: 'beauty', tier: 'luxury' },
  { name: 'MERIT', normalizedName: 'merit', aliases: ['merit beauty'], category: 'beauty', tier: 'premium' },
  { name: 'Saie', normalizedName: 'saie', aliases: ['saie beauty'], category: 'beauty', tier: 'premium' },
  { name: 'ILIA', normalizedName: 'ilia', aliases: ['ilia beauty'], category: 'beauty', tier: 'premium' },
  { name: 'Kosas', normalizedName: 'kosas', aliases: [], category: 'beauty', tier: 'premium' },
  { name: 'Makeup by Mario', normalizedName: 'makeup by mario', aliases: [], category: 'beauty', tier: 'premium' },
  { name: 'Morphe', normalizedName: 'morphe', aliases: [], category: 'beauty', tier: 'mid' },
  { name: 'NYX', normalizedName: 'nyx', aliases: ['nyx cosmetics', 'nyx professional'], category: 'beauty', tier: 'value' },
  { name: "L'Oréal", normalizedName: 'loreal', aliases: ['loreal', "l'oreal"], category: 'beauty', tier: 'mid' },
  { name: 'ColourPop', normalizedName: 'colourpop', aliases: ['colour pop', 'color pop'], category: 'beauty', tier: 'value' },
  { name: 'Milani', normalizedName: 'milani', aliases: [], category: 'beauty', tier: 'value' },
  { name: 'About Face', normalizedName: 'about face', aliases: [], category: 'beauty', tier: 'premium' },
  { name: 'Danessa Myricks', normalizedName: 'danessa myricks', aliases: [], category: 'beauty', tier: 'premium' },

  // ============================================
  // SKINCARE
  // ============================================

  { name: 'La Mer', normalizedName: 'la mer', aliases: [], category: 'skincare', tier: 'luxury' },
  { name: 'Aesop', normalizedName: 'aesop', aliases: [], category: 'skincare', tier: 'luxury' },
  { name: 'Drunk Elephant', normalizedName: 'drunk elephant', aliases: [], category: 'skincare', tier: 'premium' },
  { name: 'Rhode Skin', normalizedName: 'rhode skin', aliases: ['rhode'], category: 'skincare', tier: 'premium' },
  { name: 'Summer Fridays', normalizedName: 'summer fridays', aliases: [], category: 'skincare', tier: 'premium' },
  { name: 'Byoma', normalizedName: 'byoma', aliases: [], category: 'skincare', tier: 'mid' },
  { name: 'CeraVe', normalizedName: 'cerave', aliases: [], category: 'skincare', tier: 'mid' },
  { name: 'Cetaphil', normalizedName: 'cetaphil', aliases: [], category: 'skincare', tier: 'value' },
  { name: 'The Ordinary', normalizedName: 'the ordinary', aliases: ['ordinary', 'deciem'], category: 'skincare', tier: 'value' },
  { name: 'SK-II', normalizedName: 'sk-ii', aliases: ['skii', 'sk2'], category: 'skincare', tier: 'luxury' },
  { name: 'Tatcha', normalizedName: 'tatcha', aliases: [], category: 'skincare', tier: 'luxury' },
  { name: 'Sunday Riley', normalizedName: 'sunday riley', aliases: [], category: 'skincare', tier: 'premium' },
  { name: 'Kiehl\'s', normalizedName: 'kiehls', aliases: ['kiehls'], category: 'skincare', tier: 'premium' },
  { name: 'Fresh', normalizedName: 'fresh', aliases: ['fresh beauty'], category: 'skincare', tier: 'premium' },
  { name: 'Laneige', normalizedName: 'laneige', aliases: [], category: 'skincare', tier: 'premium' },
  { name: 'Innisfree', normalizedName: 'innisfree', aliases: [], category: 'skincare', tier: 'mid' },
  { name: 'COSRX', normalizedName: 'cosrx', aliases: [], category: 'skincare', tier: 'mid' },
  { name: 'Glow Recipe', normalizedName: 'glow recipe', aliases: [], category: 'skincare', tier: 'premium' },
  { name: 'Paula\'s Choice', normalizedName: 'paulas choice', aliases: ['paulas choice'], category: 'skincare', tier: 'premium' },
  { name: 'Supergoop', normalizedName: 'supergoop', aliases: [], category: 'skincare', tier: 'premium' },
  { name: 'La Roche-Posay', normalizedName: 'la roche-posay', aliases: ['la roche posay', 'lrp'], category: 'skincare', tier: 'mid' },
  { name: 'Neutrogena', normalizedName: 'neutrogena', aliases: [], category: 'skincare', tier: 'value' },
  { name: 'Olay', normalizedName: 'olay', aliases: [], category: 'skincare', tier: 'mid' },
  { name: 'First Aid Beauty', normalizedName: 'first aid beauty', aliases: ['fab'], category: 'skincare', tier: 'mid' },
  { name: 'Herbivore', normalizedName: 'herbivore', aliases: ['herbivore botanicals'], category: 'skincare', tier: 'premium' },
  { name: 'Youth to the People', normalizedName: 'youth to the people', aliases: ['yttp'], category: 'skincare', tier: 'premium' },
  { name: 'Biossance', normalizedName: 'biossance', aliases: [], category: 'skincare', tier: 'premium' },
  { name: 'Versed', normalizedName: 'versed', aliases: ['versed skin'], category: 'skincare', tier: 'mid' },
  { name: 'Good Molecules', normalizedName: 'good molecules', aliases: [], category: 'skincare', tier: 'value' },
  { name: 'Naturium', normalizedName: 'naturium', aliases: [], category: 'skincare', tier: 'mid' },
  { name: 'Dieux', normalizedName: 'dieux', aliases: ['dieux skin'], category: 'skincare', tier: 'premium' },

  // ============================================
  // HAIRCARE
  // ============================================

  { name: 'Dyson', normalizedName: 'dyson', aliases: [], category: 'haircare', tier: 'luxury' },
  { name: 'Olaplex', normalizedName: 'olaplex', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'ghd', normalizedName: 'ghd', aliases: ['good hair day'], category: 'haircare', tier: 'premium' },
  { name: 'T3', normalizedName: 't3', aliases: ['t3 micro'], category: 'haircare', tier: 'premium' },
  { name: 'Bio Ionic', normalizedName: 'bio ionic', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Amika', normalizedName: 'amika', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Living Proof', normalizedName: 'living proof', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Moroccanoil', normalizedName: 'moroccanoil', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Redken', normalizedName: 'redken', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Kerastase', normalizedName: 'kerastase', aliases: ['kérastase'], category: 'haircare', tier: 'luxury' },
  { name: 'Bumble and Bumble', normalizedName: 'bumble and bumble', aliases: ['bb'], category: 'haircare', tier: 'premium' },
  { name: 'Briogeo', normalizedName: 'briogeo', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Aveda', normalizedName: 'aveda', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Paul Mitchell', normalizedName: 'paul mitchell', aliases: [], category: 'haircare', tier: 'mid' },
  { name: 'Matrix', normalizedName: 'matrix', aliases: ['matrix biolage'], category: 'haircare', tier: 'mid' },
  { name: 'CHI', normalizedName: 'chi', aliases: ['chi haircare'], category: 'haircare', tier: 'mid' },
  { name: 'Pattern', normalizedName: 'pattern', aliases: ['pattern beauty'], category: 'haircare', tier: 'premium' },
  { name: 'Bread Beauty', normalizedName: 'bread beauty', aliases: ['bread'], category: 'haircare', tier: 'premium' },
  { name: 'DevaCurl', normalizedName: 'devacurl', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Ouai', normalizedName: 'ouai', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'Color Wow', normalizedName: 'color wow', aliases: [], category: 'haircare', tier: 'premium' },
  { name: 'IGK', normalizedName: 'igk', aliases: [], category: 'haircare', tier: 'premium' },

  // ============================================
  // GROOMING
  // ============================================

  { name: "Harry's", normalizedName: 'harrys', aliases: ['harrys'], category: 'grooming', tier: 'mid' },
  { name: 'Billie', normalizedName: 'billie', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Native', normalizedName: 'native', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Everist', normalizedName: 'everist', aliases: [], category: 'grooming', tier: 'premium' },
  { name: 'By Humankind', normalizedName: 'by humankind', aliases: [], category: 'grooming', tier: 'premium' },
  { name: 'Dollar Shave Club', normalizedName: 'dollar shave club', aliases: ['dsc'], category: 'grooming', tier: 'value' },
  { name: 'Beardbrand', normalizedName: 'beardbrand', aliases: [], category: 'grooming', tier: 'premium' },
  { name: 'Cremo', normalizedName: 'cremo', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Jack Black', normalizedName: 'jack black', aliases: ['jack black skincare'], category: 'grooming', tier: 'premium' },
  { name: 'Art of Shaving', normalizedName: 'art of shaving', aliases: ['the art of shaving'], category: 'grooming', tier: 'premium' },
  { name: 'Baxter of California', normalizedName: 'baxter of california', aliases: ['baxter'], category: 'grooming', tier: 'premium' },
  { name: 'Bevel', normalizedName: 'bevel', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Kiehl\'s', normalizedName: 'kiehls grooming', aliases: [], category: 'grooming', tier: 'premium' },
  { name: 'Every Man Jack', normalizedName: 'every man jack', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Duke Cannon', normalizedName: 'duke cannon', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Manscaped', normalizedName: 'manscaped', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Philips Norelco', normalizedName: 'philips norelco', aliases: ['norelco'], category: 'grooming', tier: 'mid' },
  { name: 'Braun', normalizedName: 'braun', aliases: [], category: 'grooming', tier: 'premium' },

  // Fragrance
  { name: 'Creed', normalizedName: 'creed', aliases: ['creed aventus', 'house of creed'], category: 'grooming', tier: 'luxury' },
  { name: 'Le Labo', normalizedName: 'le labo', aliases: [], category: 'grooming', tier: 'luxury' },
  { name: 'Byredo', normalizedName: 'byredo', aliases: [], category: 'grooming', tier: 'luxury' },
  { name: 'Maison Margiela', normalizedName: 'maison margiela', aliases: ['replica', 'margiela'], category: 'grooming', tier: 'luxury' },
  { name: 'Jo Malone', normalizedName: 'jo malone', aliases: [], category: 'grooming', tier: 'luxury' },
  { name: 'Diptyque', normalizedName: 'diptyque', aliases: [], category: 'grooming', tier: 'luxury' },
  { name: 'Acqua di Parma', normalizedName: 'acqua di parma', aliases: [], category: 'grooming', tier: 'luxury' },
  { name: 'Versace', normalizedName: 'versace fragrance', aliases: [], category: 'grooming', tier: 'premium' },
  { name: 'Dior Sauvage', normalizedName: 'dior sauvage', aliases: ['sauvage'], category: 'grooming', tier: 'premium' },
  { name: 'Bleu de Chanel', normalizedName: 'bleu de chanel', aliases: [], category: 'grooming', tier: 'premium' },

  // ============================================
  // HOME & FURNITURE
  // ============================================

  { name: 'Restoration Hardware', normalizedName: 'restoration hardware', aliases: ['rh'], category: 'home', tier: 'luxury' },
  { name: 'Design Within Reach', normalizedName: 'design within reach', aliases: ['dwr'], category: 'home', tier: 'luxury' },
  { name: 'McGee & Co.', normalizedName: 'mcgee & co.', aliases: [], category: 'home', tier: 'premium' },
  { name: 'Schoolhouse', normalizedName: 'schoolhouse', aliases: [], category: 'home', tier: 'premium' },
  { name: 'Article', normalizedName: 'article', aliases: [], category: 'home', tier: 'mid' },
  { name: 'Maiden Home', normalizedName: 'maiden home', aliases: [], category: 'home', tier: 'premium' },
  { name: 'Crate and Barrel', normalizedName: 'crate and barrel', aliases: ['crate & barrel'], category: 'home', tier: 'mid' },
  { name: 'Pottery Barn', normalizedName: 'pottery barn', aliases: [], category: 'home', tier: 'mid' },
  { name: 'West Elm', normalizedName: 'west elm', aliases: [], category: 'home', tier: 'mid' },
  { name: 'CB2', normalizedName: 'cb2', aliases: [], category: 'home', tier: 'mid' },
  { name: 'Ethan Allen', normalizedName: 'ethan allen', aliases: [], category: 'home', tier: 'premium' },
  { name: 'IKEA', normalizedName: 'ikea', aliases: [], category: 'home', tier: 'value' },

  // ============================================
  // KITCHEN & COOKWARE
  // ============================================

  { name: 'Le Creuset', normalizedName: 'le creuset', aliases: [], category: 'kitchen', tier: 'luxury' },
  { name: 'Staub', normalizedName: 'staub', aliases: [], category: 'kitchen', tier: 'luxury' },
  { name: 'All-Clad', normalizedName: 'all-clad', aliases: [], category: 'kitchen', tier: 'luxury' },
  { name: 'Smeg', normalizedName: 'smeg', aliases: [], category: 'kitchen', tier: 'luxury' },
  { name: 'Miele', normalizedName: 'miele', aliases: [], category: 'kitchen', tier: 'luxury' },
  { name: 'Williams-Sonoma', normalizedName: 'williams-sonoma', aliases: [], category: 'kitchen', tier: 'premium' },
  { name: 'Sur La Table', normalizedName: 'sur la table', aliases: [], category: 'kitchen', tier: 'premium' },
  { name: 'Zwilling J.A. Henckels', normalizedName: 'zwilling', aliases: ['zwilling', 'henckels'], category: 'kitchen', tier: 'premium' },
  { name: 'Caraway', normalizedName: 'caraway', aliases: [], category: 'kitchen', tier: 'premium' },
  { name: 'KitchenAid', normalizedName: 'kitchenaid', aliases: [], category: 'kitchen', tier: 'premium' },
  { name: 'Vitamix', normalizedName: 'vitamix', aliases: [], category: 'kitchen', tier: 'premium' },
  { name: 'Lodge', normalizedName: 'lodge', aliases: ['lodge cast iron'], category: 'kitchen', tier: 'mid' },
  { name: 'Instant Pot', normalizedName: 'instant pot', aliases: [], category: 'kitchen', tier: 'mid' },
  { name: 'Ninja', normalizedName: 'ninja', aliases: [], category: 'kitchen', tier: 'mid' },
  { name: 'OXO', normalizedName: 'oxo', aliases: [], category: 'kitchen', tier: 'mid' },

  // ============================================
  // BEDDING
  // ============================================

  { name: 'Boll & Branch', normalizedName: 'boll & branch', aliases: [], category: 'bedding', tier: 'luxury' },
  { name: 'Snowe', normalizedName: 'snowe', aliases: [], category: 'bedding', tier: 'luxury' },
  { name: 'Eight Sleep', normalizedName: 'eight sleep', aliases: [], category: 'bedding', tier: 'luxury' },
  { name: 'Brooklinen', normalizedName: 'brooklinen', aliases: [], category: 'bedding', tier: 'premium' },
  { name: 'Parachute', normalizedName: 'parachute', aliases: [], category: 'bedding', tier: 'premium' },
  { name: 'Casper', normalizedName: 'casper', aliases: [], category: 'bedding', tier: 'premium' },
  { name: 'Saatva', normalizedName: 'saatva', aliases: [], category: 'bedding', tier: 'premium' },
  { name: 'Helix', normalizedName: 'helix', aliases: [], category: 'bedding', tier: 'premium' },
  { name: 'Purple', normalizedName: 'purple', aliases: [], category: 'bedding', tier: 'premium' },
  { name: 'Tuft & Needle', normalizedName: 'tuft & needle', aliases: [], category: 'bedding', tier: 'mid' },
  { name: 'Nectar', normalizedName: 'nectar', aliases: [], category: 'bedding', tier: 'mid' },
  { name: 'Quince', normalizedName: 'quince', aliases: [], category: 'bedding', tier: 'mid' },

  // ============================================
  // OFFICE
  // ============================================

  { name: 'Herman Miller', normalizedName: 'herman miller', aliases: [], category: 'office', tier: 'luxury' },
  { name: 'Steelcase', normalizedName: 'steelcase', aliases: [], category: 'office', tier: 'luxury' },
  { name: 'Humanscale', normalizedName: 'humanscale', aliases: [], category: 'office', tier: 'luxury' },
  { name: 'Haworth', normalizedName: 'haworth', aliases: [], category: 'office', tier: 'luxury' },
  { name: 'Knoll', normalizedName: 'knoll', aliases: [], category: 'office', tier: 'luxury' },
  { name: 'Fully', normalizedName: 'fully', aliases: [], category: 'office', tier: 'premium' },
  { name: 'Uplift', normalizedName: 'uplift', aliases: [], category: 'office', tier: 'premium' },
  { name: 'Autonomous', normalizedName: 'autonomous', aliases: [], category: 'office', tier: 'mid' },
  { name: 'Vari', normalizedName: 'vari', aliases: ['varidesk'], category: 'office', tier: 'mid' },

  // ============================================
  // EYEWEAR
  // ============================================

  { name: 'Oliver Peoples', normalizedName: 'oliver peoples', aliases: [], category: 'eyewear', tier: 'luxury' },
  { name: 'Gentle Monster', normalizedName: 'gentle monster', aliases: [], category: 'eyewear', tier: 'luxury' },
  { name: 'Persol', normalizedName: 'persol', aliases: [], category: 'eyewear', tier: 'luxury' },
  { name: 'Warby Parker', normalizedName: 'warby parker', aliases: [], category: 'eyewear', tier: 'premium' },
  { name: 'Ray-Ban', normalizedName: 'ray-ban', aliases: ['rayban'], category: 'eyewear', tier: 'premium' },
  { name: 'Oakley', normalizedName: 'oakley', aliases: [], category: 'eyewear', tier: 'premium' },
  { name: 'Maui Jim', normalizedName: 'maui jim', aliases: [], category: 'eyewear', tier: 'premium' },
  { name: 'Costa', normalizedName: 'costa', aliases: ['costa del mar'], category: 'eyewear', tier: 'premium' },
  { name: 'Kaenon', normalizedName: 'kaenon', aliases: [], category: 'eyewear', tier: 'premium' },
  { name: 'Smith', normalizedName: 'smith', aliases: ['smith optics'], category: 'eyewear', tier: 'premium' },
  { name: 'Zenni', normalizedName: 'zenni', aliases: ['zenni optical'], category: 'eyewear', tier: 'value' },

  // ============================================
  // MUSIC & INSTRUMENTS
  // ============================================

  { name: 'Fender', normalizedName: 'fender', aliases: [], category: 'music', tier: 'luxury' },
  { name: 'Gibson', normalizedName: 'gibson', aliases: [], category: 'music', tier: 'luxury' },
  { name: 'Roland', normalizedName: 'roland', aliases: [], category: 'music', tier: 'premium' },
  { name: 'Yamaha', normalizedName: 'yamaha', aliases: [], category: 'music', tier: 'premium' },
  { name: 'Martin', normalizedName: 'martin', aliases: ['c.f. martin', 'martin guitar'], category: 'music', tier: 'luxury' },
  { name: 'Taylor Guitars', normalizedName: 'taylor guitars', aliases: ['taylor guitar'], category: 'music', tier: 'premium' },
  { name: 'PRS', normalizedName: 'prs', aliases: ['paul reed smith'], category: 'music', tier: 'premium' },
  { name: 'Ibanez', normalizedName: 'ibanez', aliases: [], category: 'music', tier: 'mid' },
  { name: 'Epiphone', normalizedName: 'epiphone', aliases: [], category: 'music', tier: 'mid' },
  { name: 'Squier', normalizedName: 'squier', aliases: ['squier by fender'], category: 'music', tier: 'value' },
  { name: 'Korg', normalizedName: 'korg', aliases: [], category: 'music', tier: 'premium' },
  { name: 'Moog', normalizedName: 'moog', aliases: ['moog music'], category: 'music', tier: 'luxury' },
  { name: 'Nord', normalizedName: 'nord', aliases: ['nord keyboards'], category: 'music', tier: 'luxury' },
  { name: 'Akai', normalizedName: 'akai', aliases: ['akai professional'], category: 'music', tier: 'premium' },
  { name: 'Native Instruments', normalizedName: 'native instruments', aliases: ['ni'], category: 'music', tier: 'premium' },
  { name: 'Universal Audio', normalizedName: 'universal audio', aliases: ['ua', 'uad'], category: 'music', tier: 'premium' },
  { name: 'Focusrite', normalizedName: 'focusrite', aliases: ['scarlett'], category: 'music', tier: 'mid' },
  { name: 'PreSonus', normalizedName: 'presonus', aliases: [], category: 'music', tier: 'mid' },
  { name: 'Pearl', normalizedName: 'pearl', aliases: ['pearl drums'], category: 'music', tier: 'premium' },
  { name: 'DW Drums', normalizedName: 'dw drums', aliases: ['dw', 'drum workshop'], category: 'music', tier: 'luxury' },
  { name: 'Zildjian', normalizedName: 'zildjian', aliases: [], category: 'music', tier: 'premium' },
  { name: 'Boss', normalizedName: 'boss', aliases: ['boss pedals'], category: 'music', tier: 'premium' },
  { name: 'TC Electronic', normalizedName: 'tc electronic', aliases: [], category: 'music', tier: 'mid' },
  { name: 'Line 6', normalizedName: 'line 6', aliases: [], category: 'music', tier: 'mid' },
  { name: 'Ernie Ball', normalizedName: 'ernie ball', aliases: ['music man'], category: 'music', tier: 'premium' },
  { name: "D'Addario", normalizedName: 'daddario', aliases: ["d'addario", 'daddario'], category: 'music', tier: 'mid' },

  // ============================================
  // STREAMING
  // ============================================

  { name: 'Elgato', normalizedName: 'elgato', aliases: [], category: 'streaming', tier: 'premium' },

  // ============================================
  // HOBBIES
  // ============================================

  { name: 'Games Workshop', normalizedName: 'games workshop', aliases: ['warhammer'], category: 'hobbies', tier: 'premium' },
  { name: 'LEGO', normalizedName: 'lego', aliases: [], category: 'hobbies', tier: 'mid' },
  { name: 'Bandai Hobby', normalizedName: 'bandai hobby', aliases: ['gundam', 'gunpla'], category: 'hobbies', tier: 'mid' },
  { name: 'Tamiya', normalizedName: 'tamiya', aliases: [], category: 'hobbies', tier: 'mid' },

  // ============================================
  // ART SUPPLIES
  // ============================================

  { name: 'Winsor & Newton', normalizedName: 'winsor & newton', aliases: [], category: 'art', tier: 'premium' },
  { name: 'Faber-Castell', normalizedName: 'faber-castell', aliases: [], category: 'art', tier: 'premium' },
  { name: 'Copic', normalizedName: 'copic', aliases: [], category: 'art', tier: 'premium' },
  { name: 'Prismacolor', normalizedName: 'prismacolor', aliases: [], category: 'art', tier: 'mid' },
  { name: 'Stabilo', normalizedName: 'stabilo', aliases: [], category: 'art', tier: 'mid' },

  // ============================================
  // AUTOMOTIVE
  // ============================================

  { name: 'Brembo', normalizedName: 'brembo', aliases: [], category: 'automotive', tier: 'luxury' },
  { name: 'WeatherTech', normalizedName: 'weathertech', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Borla', normalizedName: 'borla', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'K&N', normalizedName: 'k&n', aliases: ['k&n filters'], category: 'automotive', tier: 'premium' },
  { name: "Griot's Garage", normalizedName: 'griots garage', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Chemical Guys', normalizedName: 'chemical guys', aliases: [], category: 'automotive', tier: 'mid' },
  { name: "Adam's Polishes", normalizedName: 'adams polishes', aliases: [], category: 'automotive', tier: 'mid' },
  { name: "Meguiar's", normalizedName: 'meguiars', aliases: [], category: 'automotive', tier: 'mid' },
  { name: 'Turtle Wax', normalizedName: 'turtle wax', aliases: [], category: 'automotive', tier: 'value' },
  { name: 'Armor All', normalizedName: 'armor all', aliases: [], category: 'automotive', tier: 'value' },

  // ============================================
  // MOTORCYCLE
  // ============================================

  { name: 'Alpinestars', normalizedName: 'alpinestars', aliases: [], category: 'motorcycle', tier: 'luxury' },
  { name: 'Dainese', normalizedName: 'dainese', aliases: [], category: 'motorcycle', tier: 'luxury' },
  { name: 'Shoei', normalizedName: 'shoei', aliases: [], category: 'motorcycle', tier: 'premium' },
  { name: 'Arai', normalizedName: 'arai', aliases: [], category: 'motorcycle', tier: 'premium' },
  { name: 'Bell Helmets', normalizedName: 'bell helmets', aliases: ['bell'], category: 'motorcycle', tier: 'premium' },
  { name: 'Schuberth', normalizedName: 'schuberth', aliases: [], category: 'motorcycle', tier: 'premium' },
  { name: 'Fox Racing', normalizedName: 'fox racing', aliases: ['fox'], category: 'motorcycle', tier: 'premium' },
  { name: 'HJC Helmets', normalizedName: 'hjc helmets', aliases: ['hjc'], category: 'motorcycle', tier: 'mid' },

  // ============================================
  // CYCLING
  // ============================================

  { name: 'Rapha', normalizedName: 'rapha', aliases: [], category: 'cycling', tier: 'luxury' },
  { name: 'Trek', normalizedName: 'trek', aliases: ['trek bikes'], category: 'cycling', tier: 'premium' },
  { name: 'Specialized', normalizedName: 'specialized', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Cannondale', normalizedName: 'cannondale', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Scott Sports', normalizedName: 'scott sports', aliases: ['scott'], category: 'cycling', tier: 'premium' },
  { name: 'Pivot', normalizedName: 'pivot', aliases: ['pivot cycles'], category: 'cycling', tier: 'premium' },
  { name: 'Shimano', normalizedName: 'shimano', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'SRAM', normalizedName: 'sram', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Giant', normalizedName: 'giant', aliases: ['giant bicycles'], category: 'cycling', tier: 'mid' },
  { name: 'Santa Cruz', normalizedName: 'santa cruz', aliases: ['santa cruz bicycles'], category: 'cycling', tier: 'premium' },
  { name: 'Yeti Cycles', normalizedName: 'yeti cycles', aliases: ['yeti bikes'], category: 'cycling', tier: 'luxury' },
  { name: 'Cervélo', normalizedName: 'cervelo', aliases: ['cervelo'], category: 'cycling', tier: 'luxury' },
  { name: 'Pinarello', normalizedName: 'pinarello', aliases: [], category: 'cycling', tier: 'luxury' },
  { name: 'Bianchi', normalizedName: 'bianchi', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'BMC', normalizedName: 'bmc', aliases: ['bmc bikes'], category: 'cycling', tier: 'premium' },
  { name: 'Orbea', normalizedName: 'orbea', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Canyon', normalizedName: 'canyon', aliases: ['canyon bikes'], category: 'cycling', tier: 'premium' },
  { name: 'Wahoo', normalizedName: 'wahoo', aliases: ['wahoo fitness'], category: 'cycling', tier: 'premium' },
  { name: 'Garmin Cycling', normalizedName: 'garmin cycling', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Campagnolo', normalizedName: 'campagnolo', aliases: ['campy'], category: 'cycling', tier: 'luxury' },
  { name: 'Enve', normalizedName: 'enve', aliases: ['enve composites'], category: 'cycling', tier: 'luxury' },
  { name: 'Zipp', normalizedName: 'zipp', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Continental', normalizedName: 'continental', aliases: ['conti', 'continental tires'], category: 'cycling', tier: 'premium' },
  { name: 'Vittoria', normalizedName: 'vittoria', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Assos', normalizedName: 'assos', aliases: [], category: 'cycling', tier: 'luxury' },
  { name: 'Castelli', normalizedName: 'castelli', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Pearl Izumi', normalizedName: 'pearl izumi', aliases: [], category: 'cycling', tier: 'mid' },
  { name: 'Brompton', normalizedName: 'brompton', aliases: [], category: 'cycling', tier: 'premium' },
  { name: 'Surly', normalizedName: 'surly', aliases: ['surly bikes'], category: 'cycling', tier: 'mid' },
  { name: 'Kona', normalizedName: 'kona', aliases: ['kona bikes'], category: 'cycling', tier: 'mid' },

  // ============================================
  // SNOW SPORTS
  // ============================================

  { name: 'Burton', normalizedName: 'burton', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Lib Tech', normalizedName: 'lib tech', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Rossignol', normalizedName: 'rossignol', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Atomic', normalizedName: 'atomic', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Volcom', normalizedName: 'volcom', aliases: [], category: 'snow', tier: 'mid' },
  { name: 'Salomon', normalizedName: 'salomon ski', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'K2', normalizedName: 'k2', aliases: ['k2 sports'], category: 'snow', tier: 'premium' },
  { name: 'Head', normalizedName: 'head ski', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Völkl', normalizedName: 'volkl', aliases: ['volkl'], category: 'snow', tier: 'premium' },
  { name: 'Blizzard', normalizedName: 'blizzard', aliases: ['blizzard ski'], category: 'snow', tier: 'premium' },
  { name: 'Nordica', normalizedName: 'nordica', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Fischer', normalizedName: 'fischer', aliases: ['fischer ski'], category: 'snow', tier: 'premium' },
  { name: 'Jones Snowboards', normalizedName: 'jones snowboards', aliases: ['jones'], category: 'snow', tier: 'premium' },
  { name: 'Ride Snowboards', normalizedName: 'ride snowboards', aliases: ['ride'], category: 'snow', tier: 'mid' },
  { name: 'GNU', normalizedName: 'gnu', aliases: ['gnu snowboards'], category: 'snow', tier: 'mid' },
  { name: 'Capita', normalizedName: 'capita', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Marker', normalizedName: 'marker', aliases: ['marker bindings'], category: 'snow', tier: 'premium' },
  { name: 'Dynafit', normalizedName: 'dynafit', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Smith Optics', normalizedName: 'smith optics', aliases: ['smith goggles'], category: 'snow', tier: 'premium' },
  { name: 'Giro', normalizedName: 'giro', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'POC', normalizedName: 'poc', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Oakley Goggles', normalizedName: 'oakley goggles', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'The North Face', normalizedName: 'tnf snow', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Flylow', normalizedName: 'flylow', aliases: ['flylow gear'], category: 'snow', tier: 'premium' },
  { name: 'Trew', normalizedName: 'trew', aliases: ['trew gear'], category: 'snow', tier: 'premium' },
  { name: 'Black Crows', normalizedName: 'black crows', aliases: [], category: 'snow', tier: 'premium' },

  // ============================================
  // SURF
  // ============================================

  { name: 'Channel Islands', normalizedName: 'channel islands', aliases: [], category: 'surf', tier: 'premium' },
  { name: 'Rip Curl', normalizedName: 'rip curl', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'Quiksilver', normalizedName: 'quiksilver', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'Billabong', normalizedName: 'billabong', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'Hurley', normalizedName: 'hurley', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'Firewire', normalizedName: 'firewire', aliases: ['firewire surfboards'], category: 'surf', tier: 'premium' },
  { name: 'Lost Surfboards', normalizedName: 'lost surfboards', aliases: ['lost', '...lost'], category: 'surf', tier: 'premium' },
  { name: 'JS Industries', normalizedName: 'js industries', aliases: ['js surfboards'], category: 'surf', tier: 'premium' },
  { name: 'Catch Surf', normalizedName: 'catch surf', aliases: ['odysea'], category: 'surf', tier: 'mid' },
  { name: 'Wavestorm', normalizedName: 'wavestorm', aliases: [], category: 'surf', tier: 'value' },
  { name: "O'Neill", normalizedName: 'oneill', aliases: ["o'neill", 'oneill'], category: 'surf', tier: 'mid' },
  { name: 'RVCA', normalizedName: 'rvca', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'Volcom', normalizedName: 'volcom surf', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'FCS', normalizedName: 'fcs', aliases: ['fcs fins'], category: 'surf', tier: 'premium' },
  { name: 'Futures', normalizedName: 'futures', aliases: ['futures fins'], category: 'surf', tier: 'premium' },
  { name: 'Patagonia', normalizedName: 'patagonia surf', aliases: [], category: 'surf', tier: 'premium' },

  // ============================================
  // TENNIS & RACQUET SPORTS
  // ============================================

  { name: 'Babolat', normalizedName: 'babolat', aliases: [], category: 'tennis', tier: 'premium' },
  { name: 'Head', normalizedName: 'head', aliases: [], category: 'sports', tier: 'premium' },
  { name: 'Yonex', normalizedName: 'yonex', aliases: [], category: 'sports', tier: 'premium' },
  { name: 'Wilson Tennis', normalizedName: 'wilson tennis', aliases: [], category: 'tennis', tier: 'premium' },
  { name: 'Dunlop Tennis', normalizedName: 'dunlop tennis', aliases: [], category: 'tennis', tier: 'mid' },
  { name: 'Prince', normalizedName: 'prince', aliases: ['prince tennis'], category: 'tennis', tier: 'mid' },
  { name: 'Tecnifibre', normalizedName: 'tecnifibre', aliases: [], category: 'tennis', tier: 'premium' },
  { name: 'Solinco', normalizedName: 'solinco', aliases: [], category: 'tennis', tier: 'mid' },
  { name: 'Luxilon', normalizedName: 'luxilon', aliases: [], category: 'tennis', tier: 'premium' },
  { name: 'Nike Tennis', normalizedName: 'nike tennis', aliases: [], category: 'tennis', tier: 'premium' },
  { name: 'adidas Tennis', normalizedName: 'adidas tennis', aliases: [], category: 'tennis', tier: 'premium' },
  { name: 'Lacoste Tennis', normalizedName: 'lacoste tennis', aliases: [], category: 'tennis', tier: 'premium' },

  // ============================================
  // COFFEE
  // ============================================

  { name: 'Nespresso', normalizedName: 'nespresso', aliases: [], category: 'coffee', tier: 'luxury' },
  { name: 'Breville', normalizedName: 'breville', aliases: [], category: 'coffee', tier: 'premium' },
  { name: 'Fellow', normalizedName: 'fellow', aliases: [], category: 'coffee', tier: 'premium' },
  { name: 'Blue Bottle Coffee', normalizedName: 'blue bottle coffee', aliases: ['blue bottle'], category: 'coffee', tier: 'premium' },
  { name: 'Illy', normalizedName: 'illy', aliases: [], category: 'coffee', tier: 'premium' },
  { name: 'Lavazza', normalizedName: 'lavazza', aliases: [], category: 'coffee', tier: 'premium' },
  { name: 'Stumptown Coffee Roasters', normalizedName: 'stumptown coffee roasters', aliases: ['stumptown'], category: 'coffee', tier: 'premium' },
  { name: 'Chemex', normalizedName: 'chemex', aliases: [], category: 'coffee', tier: 'premium' },
  { name: 'Baratza', normalizedName: 'baratza', aliases: [], category: 'coffee', tier: 'mid' },
  { name: 'Hario', normalizedName: 'hario', aliases: [], category: 'coffee', tier: 'mid' },

  // ============================================
  // SPIRITS
  // ============================================

  { name: 'Grey Goose', normalizedName: 'grey goose', aliases: [], category: 'spirits', tier: 'luxury' },
  { name: 'Patrón', normalizedName: 'patron', aliases: ['patron'], category: 'spirits', tier: 'luxury' },
  { name: 'Macallan', normalizedName: 'macallan', aliases: ['the macallan'], category: 'spirits', tier: 'luxury' },
  { name: 'Johnnie Walker', normalizedName: 'johnnie walker', aliases: [], category: 'spirits', tier: 'premium' },
  { name: 'Jack Daniels', normalizedName: 'jack daniels', aliases: ["jack daniel's"], category: 'spirits', tier: 'mid' },
  { name: 'Maker\'s Mark', normalizedName: 'makers mark', aliases: ["maker's mark", 'makers mark'], category: 'spirits', tier: 'premium' },
  { name: 'Buffalo Trace', normalizedName: 'buffalo trace', aliases: [], category: 'spirits', tier: 'premium' },
  { name: 'Woodford Reserve', normalizedName: 'woodford reserve', aliases: ['woodford'], category: 'spirits', tier: 'premium' },
  { name: 'Bulleit', normalizedName: 'bulleit', aliases: [], category: 'spirits', tier: 'mid' },
  { name: 'Casamigos', normalizedName: 'casamigos', aliases: [], category: 'spirits', tier: 'premium' },
  { name: 'Don Julio', normalizedName: 'don julio', aliases: [], category: 'spirits', tier: 'premium' },
  { name: 'Clase Azul', normalizedName: 'clase azul', aliases: [], category: 'spirits', tier: 'luxury' },
  { name: 'Hendrick\'s', normalizedName: 'hendricks', aliases: ["hendrick's", 'hendricks'], category: 'spirits', tier: 'premium' },
  { name: 'Tanqueray', normalizedName: 'tanqueray', aliases: [], category: 'spirits', tier: 'mid' },
  { name: 'Bombay Sapphire', normalizedName: 'bombay sapphire', aliases: ['bombay'], category: 'spirits', tier: 'mid' },
  { name: 'Veuve Clicquot', normalizedName: 'veuve clicquot', aliases: ['veuve'], category: 'spirits', tier: 'luxury' },
  { name: 'Moët & Chandon', normalizedName: 'moet & chandon', aliases: ['moet', 'moët'], category: 'spirits', tier: 'luxury' },
  { name: 'Dom Pérignon', normalizedName: 'dom perignon', aliases: ['dom perignon'], category: 'spirits', tier: 'luxury' },
  { name: 'Blanton\'s', normalizedName: 'blantons', aliases: ["blanton's", 'blantons'], category: 'spirits', tier: 'luxury' },
  { name: 'Pappy Van Winkle', normalizedName: 'pappy van winkle', aliases: ['pappy'], category: 'spirits', tier: 'luxury' },
  { name: 'Yamazaki', normalizedName: 'yamazaki', aliases: [], category: 'spirits', tier: 'luxury' },
  { name: 'Hibiki', normalizedName: 'hibiki', aliases: [], category: 'spirits', tier: 'luxury' },
  { name: 'Nikka', normalizedName: 'nikka', aliases: [], category: 'spirits', tier: 'premium' },
  { name: 'Glenfiddich', normalizedName: 'glenfiddich', aliases: [], category: 'spirits', tier: 'premium' },
  { name: 'Lagavulin', normalizedName: 'lagavulin', aliases: [], category: 'spirits', tier: 'premium' },

  // ============================================
  // SUPPLEMENTS & NUTRITION
  // ============================================

  { name: 'AG1', normalizedName: 'ag1', aliases: ['athletic greens'], category: 'supplements', tier: 'premium' },
  { name: 'Ritual', normalizedName: 'ritual', aliases: [], category: 'supplements', tier: 'premium' },
  { name: 'Care/of', normalizedName: 'care/of', aliases: [], category: 'supplements', tier: 'premium' },
  { name: 'Momentous', normalizedName: 'momentous', aliases: [], category: 'supplements', tier: 'premium' },
  { name: 'Thorne', normalizedName: 'thorne', aliases: [], category: 'supplements', tier: 'premium' },
  { name: 'Transparent Labs', normalizedName: 'transparent labs', aliases: [], category: 'supplements', tier: 'premium' },
  { name: 'Legion', normalizedName: 'legion', aliases: [], category: 'supplements', tier: 'premium' },
  { name: 'Huel', normalizedName: 'huel', aliases: [], category: 'supplements', tier: 'mid' },
  { name: 'Garden of Life', normalizedName: 'garden of life', aliases: [], category: 'supplements', tier: 'mid' },
  { name: 'NOW Foods', normalizedName: 'now foods', aliases: [], category: 'supplements', tier: 'mid' },
  { name: 'Optimum Nutrition', normalizedName: 'optimum nutrition', aliases: ['on'], category: 'supplements', tier: 'mid' },

  // ============================================
  // PET
  // ============================================

  { name: 'Orijen', normalizedName: 'orijen', aliases: [], category: 'pet', tier: 'premium' },
  { name: 'Acana', normalizedName: 'acana', aliases: [], category: 'pet', tier: 'premium' },
  { name: 'Royal Canin', normalizedName: 'royal canin', aliases: [], category: 'pet', tier: 'premium' },
  { name: "Hill's", normalizedName: 'hills', aliases: ["hill's science diet"], category: 'pet', tier: 'premium' },
  { name: 'Blue Buffalo', normalizedName: 'blue buffalo', aliases: [], category: 'pet', tier: 'premium' },
  { name: "The Farmer's Dog", normalizedName: 'the farmers dog', aliases: [], category: 'pet', tier: 'premium' },
  { name: 'Ollie', normalizedName: 'ollie', aliases: [], category: 'pet', tier: 'premium' },
  { name: 'Just Food For Dogs', normalizedName: 'just food for dogs', aliases: [], category: 'pet', tier: 'premium' },
  { name: 'Wild One', normalizedName: 'wild one', aliases: [], category: 'pet', tier: 'premium' },
  { name: 'BarkBox', normalizedName: 'barkbox', aliases: ['bark'], category: 'pet', tier: 'premium' },
  { name: 'Fi', normalizedName: 'fi', aliases: ['fi collar'], category: 'pet', tier: 'premium' },
  { name: 'Purina', normalizedName: 'purina', aliases: [], category: 'pet', tier: 'mid' },
  { name: 'KONG', normalizedName: 'kong', aliases: [], category: 'pet', tier: 'mid' },
  { name: 'Figo', normalizedName: 'figo', aliases: [], category: 'pet', tier: 'mid' },

  // ============================================
  // BABY & KIDS
  // ============================================

  { name: 'UPPAbaby', normalizedName: 'uppababy', aliases: [], category: 'baby', tier: 'luxury' },
  { name: 'Bugaboo', normalizedName: 'bugaboo', aliases: [], category: 'baby', tier: 'luxury' },
  { name: 'Nuna', normalizedName: 'nuna', aliases: [], category: 'baby', tier: 'luxury' },
  { name: 'Cybex', normalizedName: 'cybex', aliases: [], category: 'baby', tier: 'luxury' },
  { name: 'Stokke', normalizedName: 'stokke', aliases: [], category: 'baby', tier: 'luxury' },
  { name: 'SNOO', normalizedName: 'snoo', aliases: ['happiest baby'], category: 'baby', tier: 'luxury' },
  { name: 'Ergobaby', normalizedName: 'ergobaby', aliases: [], category: 'baby', tier: 'premium' },
  { name: 'BabyBjörn', normalizedName: 'babybjorn', aliases: ['baby bjorn'], category: 'baby', tier: 'premium' },
  { name: 'DockATot', normalizedName: 'dockatot', aliases: [], category: 'baby', tier: 'premium' },
  { name: 'Owlet', normalizedName: 'owlet', aliases: [], category: 'baby', tier: 'premium' },
  { name: 'Lovevery', normalizedName: 'lovevery', aliases: [], category: 'baby', tier: 'premium' },
  { name: 'Chicco', normalizedName: 'chicco', aliases: [], category: 'baby', tier: 'mid' },
  { name: 'Graco', normalizedName: 'graco', aliases: [], category: 'baby', tier: 'mid' },
  { name: 'HALO', normalizedName: 'halo', aliases: [], category: 'baby', tier: 'mid' },
  { name: 'Monbebe', normalizedName: 'monbebe', aliases: [], category: 'baby', tier: 'mid' },

  // Kids
  { name: 'KiwiCo', normalizedName: 'kiwico', aliases: [], category: 'kids', tier: 'premium' },
  { name: 'Primary', normalizedName: 'primary', aliases: [], category: 'kids', tier: 'premium' },
  { name: 'Hanna Andersson', normalizedName: 'hanna andersson', aliases: [], category: 'kids', tier: 'premium' },
  { name: 'Tea Collection', normalizedName: 'tea collection', aliases: [], category: 'kids', tier: 'premium' },

  // ============================================
  // HEALTH
  // ============================================

  { name: 'Nurx', normalizedName: 'nurx', aliases: [], category: 'health', tier: 'mid' },
  { name: 'Hims', normalizedName: 'hims', aliases: [], category: 'health', tier: 'mid' },
  { name: 'Hers', normalizedName: 'hers', aliases: [], category: 'health', tier: 'mid' },
  { name: 'Ro', normalizedName: 'ro', aliases: ['roman', 'rory'], category: 'health', tier: 'mid' },

];

const BRAND_DICTIONARY_EXPANDED: BrandEntry[] = [
  // ============================================
  // EXPANDED BRANDS
  // ============================================
  // ACTIVEWEAR expansion (20 new)
  { name: 'Outdoor Voices', normalizedName: 'outdoor voices', aliases: ['outdoor voices', 'ov'], category: 'activewear', tier: 'premium' },
  { name: 'Girlfriend Collective', normalizedName: 'girlfriend collective', aliases: ['girlfriend collective', 'girlfriend'], category: 'activewear', tier: 'mid' },
  { name: 'Fabletics', normalizedName: 'fabletics', aliases: ['fabletics'], category: 'activewear', tier: 'mid' },
  { name: 'Sweaty Betty', normalizedName: 'sweaty betty', aliases: ['sweaty betty', 'sweatybetty'], category: 'activewear', tier: 'premium' },
  { name: 'Beyond Yoga', normalizedName: 'beyond yoga', aliases: ['beyond yoga', 'beyondyoga'], category: 'activewear', tier: 'premium' },
  { name: 'Varley', normalizedName: 'varley', aliases: ['varley'], category: 'activewear', tier: 'premium' },
  { name: 'SET Active', normalizedName: 'set active', aliases: ['set active', 'set'], category: 'activewear', tier: 'premium' },
  { name: 'Champion', normalizedName: 'champion', aliases: ['champion'], category: 'activewear', tier: 'value' },
  { name: 'Russell Athletic', normalizedName: 'russell athletic', aliases: ['russell athletic', 'russell'], category: 'activewear', tier: 'value' },
  { name: 'Avia', normalizedName: 'avia', aliases: ['avia'], category: 'activewear', tier: 'value' },
  { name: 'prAna', normalizedName: 'prana', aliases: ['prana', 'prana'], category: 'activewear', tier: 'mid' },
  { name: 'Bandier', normalizedName: 'bandier', aliases: ['bandier'], category: 'activewear', tier: 'premium' },
  { name: 'Year of Ours', normalizedName: 'year of ours', aliases: ['year of ours', 'yoo'], category: 'activewear', tier: 'premium' },
  { name: 'Splits59', normalizedName: 'splits59', aliases: ['splits59', 'splits 59'], category: 'activewear', tier: 'premium' },
  { name: 'Free People Movement', normalizedName: 'free people movement', aliases: ['free people movement', 'fp movement'], category: 'activewear', tier: 'premium' },
  { name: 'Calia', normalizedName: 'calia', aliases: ['calia', 'calia by carrie'], category: 'activewear', tier: 'mid' },
  { name: 'Lorna Jane', normalizedName: 'lorna jane', aliases: ['lorna jane', 'lornajane'], category: 'activewear', tier: 'mid' },
  { name: 'Carbon38', normalizedName: 'carbon38', aliases: ['carbon38', 'carbon 38'], category: 'activewear', tier: 'premium' },
  { name: 'MPG Sport', normalizedName: 'mpg sport', aliases: ['mpg', 'mpg sport'], category: 'activewear', tier: 'mid' },
  { name: 'Virus Intl', normalizedName: 'virus intl', aliases: ['virus', 'virus intl'], category: 'activewear', tier: 'mid' },
  // APPAREL expansion (20 new)
  { name: 'Dickies', normalizedName: 'dickies', aliases: [], category: 'apparel', tier: 'value' },
  { name: 'Wrangler', normalizedName: 'wrangler', aliases: ['wrangler jeans'], category: 'apparel', tier: 'value' },
  { name: 'True Religion', normalizedName: 'true religion', aliases: ['true religion jeans'], category: 'apparel', tier: 'premium' },
  { name: 'AG Jeans', normalizedName: 'ag jeans', aliases: ['ag', 'adriano goldschmied', 'ag adriano goldschmied'], category: 'apparel', tier: 'premium' },
  { name: 'Citizens of Humanity', normalizedName: 'citizens of humanity', aliases: ['coh', 'citizens'], category: 'apparel', tier: 'premium' },
  { name: '7 For All Mankind', normalizedName: '7 for all mankind', aliases: ['7fam', 'seven for all mankind', '7 for all'], category: 'apparel', tier: 'premium' },
  { name: 'Frame', normalizedName: 'frame', aliases: ['frame denim', 'frame jeans'], category: 'apparel', tier: 'premium' },
  { name: 'Madewell', normalizedName: 'madewell', aliases: [], category: 'apparel', tier: 'mid' },
  { name: 'Free People', normalizedName: 'free people', aliases: ['fp', 'free people movement'], category: 'apparel', tier: 'mid' },
  { name: 'Anthropologie', normalizedName: 'anthropologie', aliases: ['anthro'], category: 'apparel', tier: 'premium' },
  { name: 'ASOS', normalizedName: 'asos', aliases: ['asos design'], category: 'apparel', tier: 'value' },
  { name: 'PacSun', normalizedName: 'pacsun', aliases: ['pacific sunwear'], category: 'apparel', tier: 'value' },
  { name: 'Hollister', normalizedName: 'hollister', aliases: ['hollister co'], category: 'apparel', tier: 'value' },
  { name: 'American Eagle', normalizedName: 'american eagle', aliases: ['ae', 'aeo', 'american eagle outfitters', 'aerie'], category: 'apparel', tier: 'value' },
  { name: 'Old Navy', normalizedName: 'old navy', aliases: [], category: 'apparel', tier: 'value' },
  { name: 'Express', normalizedName: 'express', aliases: ['express clothing'], category: 'apparel', tier: 'mid' },
  { name: 'L.L.Bean', normalizedName: 'llbean', aliases: ['ll bean', 'l l bean', 'llbean'], category: 'apparel', tier: 'mid' },
  { name: 'Eddie Bauer', normalizedName: 'eddie bauer', aliases: [], category: 'apparel', tier: 'mid' },
  { name: 'Pendleton', normalizedName: 'pendleton', aliases: ['pendleton woolen mills'], category: 'apparel', tier: 'premium' },
  { name: 'J.Crew', normalizedName: 'jcrew', aliases: ['j crew', 'jcrew'], category: 'apparel', tier: 'mid' },
  // ART expansion (24 new)
  { name: 'Wacom', normalizedName: 'wacom', aliases: ['wacom intuos', 'wacom cintiq', 'cintiq'], category: 'art', tier: 'premium' },
  { name: 'Huion', normalizedName: 'huion', aliases: ['huion kamvas'], category: 'art', tier: 'mid' },
  { name: 'XP-Pen', normalizedName: 'xppen', aliases: ['xp pen', 'xppen', 'xp-pen artist'], category: 'art', tier: 'mid' },
  { name: 'Moleskine', normalizedName: 'moleskine', aliases: [], category: 'art', tier: 'premium' },
  { name: 'Strathmore', normalizedName: 'strathmore', aliases: ['strathmore paper'], category: 'art', tier: 'mid' },
  { name: 'Liquitex', normalizedName: 'liquitex', aliases: ['liquitex basics', 'liquitex professional'], category: 'art', tier: 'premium' },
  { name: 'Golden', normalizedName: 'golden', aliases: ['golden acrylics', 'golden artist colors', 'golden heavy body'], category: 'art', tier: 'premium' },
  { name: 'Daniel Smith', normalizedName: 'danielsmith', aliases: ['daniel smith watercolors', 'ds watercolors'], category: 'art', tier: 'luxury' },
  { name: 'Sakura', normalizedName: 'sakura', aliases: ['sakura pigma', 'pigma micron', 'sakura koi'], category: 'art', tier: 'mid' },
  { name: 'Staedtler', normalizedName: 'staedtler', aliases: ['steadtler'], category: 'art', tier: 'mid' },
  { name: 'Canson', normalizedName: 'canson', aliases: ['canson xl', 'canson mi-teintes'], category: 'art', tier: 'mid' },
  { name: 'Derwent', normalizedName: 'derwent', aliases: ['derwent pencils', 'derwent coloursoft'], category: 'art', tier: 'premium' },
  { name: 'Schmincke', normalizedName: 'schmincke', aliases: ['schmincke horadam', 'horadam'], category: 'art', tier: 'luxury' },
  { name: 'Sennelier', normalizedName: 'sennelier', aliases: ['sennelier oil pastels', 'sennelier watercolors'], category: 'art', tier: 'luxury' },
  { name: 'Holbein', normalizedName: 'holbein', aliases: ['holbein watercolors', 'holbein acryla gouache'], category: 'art', tier: 'premium' },
  { name: 'Arches', normalizedName: 'arches', aliases: ['arches watercolor paper', 'arches paper'], category: 'art', tier: 'luxury' },
  { name: 'Pentel', normalizedName: 'pentel', aliases: ['pentel brush pen', 'pentel arts'], category: 'art', tier: 'mid' },
  { name: 'Tombow', normalizedName: 'tombow', aliases: ['tombow dual brush', 'tombow fudenosuke', 'tombow mono'], category: 'art', tier: 'mid' },
  { name: 'Posca', normalizedName: 'posca', aliases: ['uni posca', 'posca markers', 'posca pens'], category: 'art', tier: 'mid' },
  { name: 'Gamblin', normalizedName: 'gamblin', aliases: ['gamblin oil colors', 'gamblin oils'], category: 'art', tier: 'premium' },
  { name: 'Procreate', normalizedName: 'procreate', aliases: ['procreate app', 'procreate dreams'], category: 'art', tier: 'premium' },
  { name: 'Clip Studio Paint', normalizedName: 'clipstudiopaint', aliases: ['clip studio', 'csp', 'manga studio'], category: 'art', tier: 'mid' },
  { name: 'Arteza', normalizedName: 'arteza', aliases: [], category: 'art', tier: 'value' },
  { name: 'Ohuhu', normalizedName: 'ohuhu', aliases: ['ohuhu markers'], category: 'art', tier: 'value' },
  // AUTOMOTIVE expansion (39 new)
  { name: 'Porsche', normalizedName: 'porsche', aliases: [], category: 'automotive', tier: 'luxury' },
  { name: 'BMW', normalizedName: 'bmw', aliases: ['bayerische motoren werke'], category: 'automotive', tier: 'luxury' },
  { name: 'Mercedes-Benz', normalizedName: 'mercedes-benz', aliases: ['mercedes', 'benz', 'merc', 'mb'], category: 'automotive', tier: 'luxury' },
  { name: 'Audi', normalizedName: 'audi', aliases: [], category: 'automotive', tier: 'luxury' },
  { name: 'Tesla', normalizedName: 'tesla', aliases: [], category: 'automotive', tier: 'luxury' },
  { name: 'Lexus', normalizedName: 'lexus', aliases: [], category: 'automotive', tier: 'luxury' },
  { name: 'Land Rover', normalizedName: 'land rover', aliases: ['range rover', 'landrover'], category: 'automotive', tier: 'luxury' },
  { name: 'Toyota', normalizedName: 'toyota', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Honda', normalizedName: 'honda', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Ford', normalizedName: 'ford', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Chevrolet', normalizedName: 'chevrolet', aliases: ['chevy'], category: 'automotive', tier: 'premium' },
  { name: 'Subaru', normalizedName: 'subaru', aliases: ['subie'], category: 'automotive', tier: 'premium' },
  { name: 'Mazda', normalizedName: 'mazda', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Volkswagen', normalizedName: 'volkswagen', aliases: ['vw'], category: 'automotive', tier: 'premium' },
  { name: 'Jeep', normalizedName: 'jeep', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'RAM', normalizedName: 'ram', aliases: ['ram trucks'], category: 'automotive', tier: 'premium' },
  { name: 'Thule', normalizedName: 'thule', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Yakima', normalizedName: 'yakima', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Magnaflow', normalizedName: 'magnaflow', aliases: ['magna flow'], category: 'automotive', tier: 'premium' },
  { name: 'Flowmaster', normalizedName: 'flowmaster', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Eibach', normalizedName: 'eibach', aliases: ['eibach springs'], category: 'automotive', tier: 'premium' },
  { name: 'Bilstein', normalizedName: 'bilstein', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'KW Suspensions', normalizedName: 'kw suspensions', aliases: ['kw'], category: 'automotive', tier: 'premium' },
  { name: 'Recaro', normalizedName: 'recaro', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Michelin', normalizedName: 'michelin', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Goodyear', normalizedName: 'goodyear', aliases: ['good year'], category: 'automotive', tier: 'premium' },
  { name: 'Pirelli', normalizedName: 'pirelli', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'BFGoodrich', normalizedName: 'bfgoodrich', aliases: ['bf goodrich', 'bfg'], category: 'automotive', tier: 'premium' },
  { name: 'Falken', normalizedName: 'falken', aliases: ['falken tires'], category: 'automotive', tier: 'mid' },
  { name: 'Toyo Tires', normalizedName: 'toyo tires', aliases: ['toyo'], category: 'automotive', tier: 'mid' },
  { name: 'Nitto', normalizedName: 'nitto', aliases: ['nitto tires'], category: 'automotive', tier: 'mid' },
  { name: 'Snap-on', normalizedName: 'snap-on', aliases: ['snapon', 'snap on'], category: 'automotive', tier: 'luxury' },
  { name: 'Milwaukee Tool', normalizedName: 'milwaukee tool', aliases: ['milwaukee'], category: 'automotive', tier: 'premium' },
  { name: 'DeWalt', normalizedName: 'dewalt', aliases: ['de walt'], category: 'automotive', tier: 'premium' },
  { name: 'Makita', normalizedName: 'makita', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Bosch', normalizedName: 'bosch', aliases: [], category: 'automotive', tier: 'premium' },
  { name: 'Craftsman', normalizedName: 'craftsman', aliases: [], category: 'automotive', tier: 'mid' },
  { name: 'Rigid', normalizedName: 'rigid', aliases: ['ridgid'], category: 'automotive', tier: 'mid' },
  { name: 'Rain-X', normalizedName: 'rain-x', aliases: ['rainx', 'rain x'], category: 'automotive', tier: 'value' },
  // BABY expansion (24 new)
  { name: 'Baby Jogger', normalizedName: 'baby jogger', aliases: ['babyjogger', 'baby jogger city'], category: 'baby', tier: 'premium' },
  { name: 'BOB', normalizedName: 'bob', aliases: ['bob gear', 'bob stroller', 'bob revolution'], category: 'baby', tier: 'premium' },
  { name: 'Clek', normalizedName: 'clek', aliases: ['clek car seat'], category: 'baby', tier: 'premium' },
  { name: 'Britax', normalizedName: 'britax', aliases: ['britax römer', 'britax romer'], category: 'baby', tier: 'premium' },
  { name: 'Maxi-Cosi', normalizedName: 'maxi-cosi', aliases: ['maxicosi', 'maxi cosi'], category: 'baby', tier: 'premium' },
  { name: 'Peg Perego', normalizedName: 'peg perego', aliases: ['pegperego', 'peg-perego'], category: 'baby', tier: 'premium' },
  { name: 'Silver Cross', normalizedName: 'silver cross', aliases: ['silvercross'], category: 'baby', tier: 'luxury' },
  { name: 'iCandy', normalizedName: 'icandy', aliases: ['i candy', 'i-candy'], category: 'baby', tier: 'luxury' },
  { name: 'Medela', normalizedName: 'medela', aliases: ['medela pump'], category: 'baby', tier: 'premium' },
  { name: 'Spectra', normalizedName: 'spectra', aliases: ['spectra baby', 'spectra pump'], category: 'baby', tier: 'premium' },
  { name: 'Tommee Tippee', normalizedName: 'tommee tippee', aliases: ['tommeetippee', 'tomee tipee'], category: 'baby', tier: 'mid' },
  { name: 'MAM', normalizedName: 'mam', aliases: ['mam baby'], category: 'baby', tier: 'mid' },
  { name: 'Nanit', normalizedName: 'nanit', aliases: ['nanit pro', 'nanit monitor'], category: 'baby', tier: 'premium' },
  { name: 'Hatch', normalizedName: 'hatch', aliases: ['hatch baby', 'hatch rest', 'hatch restore'], category: 'baby', tier: 'premium' },
  { name: 'Aden + Anais', normalizedName: 'aden + anais', aliases: ['aden and anais', 'aden anais', 'aden+anais'], category: 'baby', tier: 'premium' },
  { name: 'Copper Pearl', normalizedName: 'copper pearl', aliases: ['copperpearl'], category: 'baby', tier: 'mid' },
  { name: 'Kyte Baby', normalizedName: 'kyte baby', aliases: ['kyte', 'kytebaby'], category: 'baby', tier: 'premium' },
  { name: 'Little Unicorn', normalizedName: 'little unicorn', aliases: ['littleunicorn'], category: 'baby', tier: 'premium' },
  { name: 'Honest Company', normalizedName: 'honest company', aliases: ['honest', 'the honest company', 'honest co'], category: 'baby', tier: 'mid' },
  { name: 'Babyganics', normalizedName: 'babyganics', aliases: ['baby ganics'], category: 'baby', tier: 'mid' },
  { name: 'Baby Brezza', normalizedName: 'baby brezza', aliases: ['babybrezza', 'brezza'], category: 'baby', tier: 'premium' },
  { name: 'Elvie', normalizedName: 'elvie', aliases: ['elvie pump', 'elvie stride'], category: 'baby', tier: 'premium' },
  { name: 'Willow', normalizedName: 'willow', aliases: ['willow pump', 'willow go'], category: 'baby', tier: 'premium' },
  { name: 'Newton Baby', normalizedName: 'newton baby', aliases: ['newton', 'newton crib mattress'], category: 'baby', tier: 'premium' },
  // BASKETBALL expansion (17 new)
  { name: 'Nike Basketball', normalizedName: 'nike basketball', aliases: ['nike basketball', 'nike hoops'], category: 'basketball', tier: 'premium' },
  { name: 'AND1', normalizedName: 'and1', aliases: ['and1', 'and 1'], category: 'basketball', tier: 'value' },
  { name: 'Wilson Basketball', normalizedName: 'wilson basketball', aliases: ['wilson basketball', 'wilson nba'], category: 'basketball', tier: 'mid' },
  { name: 'Stance', normalizedName: 'stance', aliases: ['stance', 'stance socks'], category: 'basketball', tier: 'mid' },
  { name: 'DribbleUp', normalizedName: 'dribbleup', aliases: ['dribbleup', 'dribble up'], category: 'basketball', tier: 'mid' },
  { name: 'Dr. Dish', normalizedName: 'dr dish', aliases: ['dr dish', 'dr. dish'], category: 'basketball', tier: 'premium' },
  { name: 'Molten', normalizedName: 'molten', aliases: ['molten'], category: 'basketball', tier: 'mid' },
  { name: 'Adidas Basketball', normalizedName: 'adidas basketball', aliases: ['adidas basketball', 'adidas hoops'], category: 'basketball', tier: 'mid' },
  { name: 'Under Armour Basketball', normalizedName: 'under armour basketball', aliases: ['ua basketball', 'under armour basketball', 'curry brand'], category: 'basketball', tier: 'mid' },
  { name: 'PUMA Basketball', normalizedName: 'puma basketball', aliases: ['puma basketball', 'puma hoops'], category: 'basketball', tier: 'mid' },
  { name: 'New Balance Basketball', normalizedName: 'new balance basketball', aliases: ['nb basketball', 'new balance basketball'], category: 'basketball', tier: 'mid' },
  { name: 'Li-Ning Basketball', normalizedName: 'li-ning basketball', aliases: ['li-ning', 'li ning', 'li-ning basketball'], category: 'basketball', tier: 'mid' },
  { name: 'Anta Basketball', normalizedName: 'anta basketball', aliases: ['anta', 'anta basketball'], category: 'basketball', tier: 'mid' },
  { name: 'Shootaway', normalizedName: 'shootaway', aliases: ['shootaway', 'shoot away', 'the gun'], category: 'basketball', tier: 'premium' },
  { name: 'Goalrilla', normalizedName: 'goalrilla', aliases: ['goalrilla'], category: 'basketball', tier: 'mid' },
  { name: 'Lifetime Basketball', normalizedName: 'lifetime basketball', aliases: ['lifetime', 'lifetime basketball'], category: 'basketball', tier: 'value' },
  { name: 'Silverback', normalizedName: 'silverback', aliases: ['silverback', 'silverback basketball'], category: 'basketball', tier: 'mid' },
  // BEDDING expansion (21 new)
  { name: 'Beautyrest', normalizedName: 'beautyrest', aliases: ['simmons beautyrest', 'simmons'], category: 'bedding', tier: 'mid' },
  { name: 'Tempur-Pedic', normalizedName: 'tempur-pedic', aliases: ['tempurpedic', 'tempur pedic', 'tempur'], category: 'bedding', tier: 'premium' },
  { name: 'Sleep Number', normalizedName: 'sleep number', aliases: ['sleepnumber'], category: 'bedding', tier: 'premium' },
  { name: 'Leesa', normalizedName: 'leesa', aliases: ['leesa sleep'], category: 'bedding', tier: 'mid' },
  { name: 'Birch', normalizedName: 'birch', aliases: ['birch living', 'birch mattress'], category: 'bedding', tier: 'premium' },
  { name: 'Avocado', normalizedName: 'avocado', aliases: ['avocado green', 'avocado mattress', 'avocado green mattress'], category: 'bedding', tier: 'premium' },
  { name: 'Bear', normalizedName: 'bear', aliases: ['bear mattress'], category: 'bedding', tier: 'mid' },
  { name: 'DreamCloud', normalizedName: 'dreamcloud', aliases: ['dream cloud'], category: 'bedding', tier: 'mid' },
  { name: 'WinkBed', normalizedName: 'winkbed', aliases: ['winkbeds', 'wink bed'], category: 'bedding', tier: 'premium' },
  { name: 'Cocoon by Sealy', normalizedName: 'cocoon by sealy', aliases: ['cocoon', 'cocoon chill'], category: 'bedding', tier: 'mid' },
  { name: 'Layla', normalizedName: 'layla', aliases: ['layla sleep', 'layla mattress'], category: 'bedding', tier: 'mid' },
  { name: 'Coyuchi', normalizedName: 'coyuchi', aliases: [], category: 'bedding', tier: 'premium' },
  { name: 'Buffy', normalizedName: 'buffy', aliases: [], category: 'bedding', tier: 'mid' },
  { name: 'Ettitude', normalizedName: 'ettitude', aliases: [], category: 'bedding', tier: 'mid' },
  { name: 'Cozy Earth', normalizedName: 'cozy earth', aliases: ['cozyearth'], category: 'bedding', tier: 'premium' },
  { name: 'Sheex', normalizedName: 'sheex', aliases: [], category: 'bedding', tier: 'mid' },
  { name: 'Stearns & Foster', normalizedName: 'stearns & foster', aliases: ['stearns and foster'], category: 'bedding', tier: 'luxury' },
  { name: 'Serta', normalizedName: 'serta', aliases: ['serta perfect sleeper', 'serta iseries'], category: 'bedding', tier: 'mid' },
  { name: 'Sealy', normalizedName: 'sealy', aliases: ['sealy posturepedic'], category: 'bedding', tier: 'mid' },
  { name: 'Plush Beds', normalizedName: 'plush beds', aliases: ['plushbeds'], category: 'bedding', tier: 'premium' },
  { name: 'Silk & Snow', normalizedName: 'silk & snow', aliases: ['silk and snow'], category: 'bedding', tier: 'mid' },
  // COFFEE expansion (24 new)
  { name: 'Rancilio', normalizedName: 'rancilio', aliases: ['rancilio silvia', 'rancilio group'], category: 'coffee', tier: 'premium' },
  { name: 'La Marzocco', normalizedName: 'la marzocco', aliases: ['lamarzocco', 'marzocco'], category: 'coffee', tier: 'luxury' },
  { name: 'Rocket Espresso', normalizedName: 'rocket espresso', aliases: ['rocket espresso milano', 'rocket'], category: 'coffee', tier: 'luxury' },
  { name: 'Decent Espresso', normalizedName: 'decent espresso', aliases: ['decent', 'decent de1'], category: 'coffee', tier: 'luxury' },
  { name: 'Gaggia', normalizedName: 'gaggia', aliases: ['gaggia classic', 'gaggia espresso'], category: 'coffee', tier: 'mid' },
  { name: 'Eureka', normalizedName: 'eureka', aliases: ['eureka grinders', 'eureka mignon'], category: 'coffee', tier: 'premium' },
  { name: 'Comandante', normalizedName: 'comandante', aliases: ['comandante grinder', 'comandante c40'], category: 'coffee', tier: 'premium' },
  { name: '1Zpresso', normalizedName: '1zpresso', aliases: ['1z presso', 'one z presso'], category: 'coffee', tier: 'mid' },
  { name: 'Timemore', normalizedName: 'timemore', aliases: ['timemore chestnut'], category: 'coffee', tier: 'mid' },
  { name: 'Acaia', normalizedName: 'acaia', aliases: ['acaia scale', 'acaia pearl', 'acaia lunar'], category: 'coffee', tier: 'premium' },
  { name: 'Origami', normalizedName: 'origami', aliases: ['origami dripper', 'origami coffee'], category: 'coffee', tier: 'mid' },
  { name: 'Kalita', normalizedName: 'kalita', aliases: ['kalita wave', 'kalita co'], category: 'coffee', tier: 'mid' },
  { name: 'Stagg', normalizedName: 'stagg', aliases: ['fellow stagg', 'stagg ekg', 'stagg kettle'], category: 'coffee', tier: 'premium' },
  { name: 'OXO Brew', normalizedName: 'oxo brew', aliases: ['oxo', 'oxo coffee'], category: 'coffee', tier: 'mid' },
  { name: 'Moccamaster', normalizedName: 'moccamaster', aliases: ['technivorm', 'technivorm moccamaster'], category: 'coffee', tier: 'premium' },
  { name: 'Counter Culture', normalizedName: 'counter culture', aliases: ['counter culture coffee', 'ccc'], category: 'coffee', tier: 'premium' },
  { name: 'Intelligentsia', normalizedName: 'intelligentsia', aliases: ['intelligentsia coffee'], category: 'coffee', tier: 'premium' },
  { name: 'Verve', normalizedName: 'verve', aliases: ['verve coffee', 'verve coffee roasters'], category: 'coffee', tier: 'premium' },
  { name: 'Onyx Coffee Lab', normalizedName: 'onyx coffee lab', aliases: ['onyx', 'onyx coffee'], category: 'coffee', tier: 'premium' },
  { name: 'AeroPress', normalizedName: 'aeropress', aliases: ['aero press'], category: 'coffee', tier: 'mid' },
  { name: 'Flair Espresso', normalizedName: 'flair espresso', aliases: ['flair', 'flair pro', 'flair 58'], category: 'coffee', tier: 'mid' },
  { name: 'Weber Workshops', normalizedName: 'weber workshops', aliases: ['weber', 'eg-1', 'key grinder'], category: 'coffee', tier: 'luxury' },
  { name: 'Niche', normalizedName: 'niche', aliases: ['niche zero', 'niche grinder', 'niche duo'], category: 'coffee', tier: 'premium' },
  { name: 'Profitec', normalizedName: 'profitec', aliases: ['profitec espresso'], category: 'coffee', tier: 'premium' },
  // EDC expansion (29 new)
  { name: 'Zero Tolerance', normalizedName: 'zero tolerance', aliases: ['zt', 'zt knives', 'zero tolerance knives'], category: 'edc', tier: 'premium' },
  { name: 'Microtech', normalizedName: 'microtech', aliases: ['microtech knives'], category: 'edc', tier: 'premium' },
  { name: 'Hinderer', normalizedName: 'hinderer', aliases: ['hinderer knives', 'rick hinderer'], category: 'edc', tier: 'luxury' },
  { name: 'Protech', normalizedName: 'protech', aliases: ['pro-tech', 'pro tech', 'protech knives'], category: 'edc', tier: 'premium' },
  { name: 'Civivi', normalizedName: 'civivi', aliases: ['civivi knives'], category: 'edc', tier: 'mid' },
  { name: 'QSP', normalizedName: 'qsp', aliases: ['qsp knives'], category: 'edc', tier: 'value' },
  { name: 'We Knife', normalizedName: 'we knife', aliases: ['weknife', 'we knife co', 'we knives'], category: 'edc', tier: 'premium' },
  { name: 'Emisar', normalizedName: 'emisar', aliases: ['emisar flashlights'], category: 'edc', tier: 'mid' },
  { name: 'Hank Wang', normalizedName: 'hank wang', aliases: ['hanklight', 'hanklights'], category: 'edc', tier: 'mid' },
  { name: 'Prometheus', normalizedName: 'prometheus', aliases: ['prometheus design werx', 'pdw', 'prometheus lights'], category: 'edc', tier: 'premium' },
  { name: 'Tactile Turn', normalizedName: 'tactile turn', aliases: ['tactile turn pens', 'tt pens'], category: 'edc', tier: 'premium' },
  { name: 'Refyne', normalizedName: 'refyne', aliases: ['refyne pens'], category: 'edc', tier: 'mid' },
  { name: 'Machine Era', normalizedName: 'machine era', aliases: ['machine era co'], category: 'edc', tier: 'mid' },
  { name: 'Fisher Space Pen', normalizedName: 'fisher space pen', aliases: ['fisher pen', 'space pen', 'fisher'], category: 'edc', tier: 'mid' },
  { name: 'Kaweco', normalizedName: 'kaweco', aliases: ['kaweco pens', 'kaweco sport'], category: 'edc', tier: 'mid' },
  { name: 'Lamy', normalizedName: 'lamy', aliases: ['lamy pens'], category: 'edc', tier: 'mid' },
  { name: 'Montblanc', normalizedName: 'montblanc', aliases: ['mont blanc', 'montblanc pens'], category: 'edc', tier: 'luxury' },
  { name: 'Cross', normalizedName: 'cross', aliases: ['cross pens', 'a.t. cross'], category: 'edc', tier: 'mid' },
  { name: 'Baron Fig', normalizedName: 'baron fig', aliases: ['baronfig'], category: 'edc', tier: 'mid' },
  { name: 'Ekster', normalizedName: 'ekster', aliases: ['ekster wallets'], category: 'edc', tier: 'mid' },
  { name: 'Secrid', normalizedName: 'secrid', aliases: ['secrid wallets', 'secrid miniwallet'], category: 'edc', tier: 'mid' },
  { name: 'Hitch & Timber', normalizedName: 'hitch & timber', aliases: ['hitch and timber', 'hitch timber'], category: 'edc', tier: 'premium' },
  { name: 'Trayvax', normalizedName: 'trayvax', aliases: ['trayvax wallets'], category: 'edc', tier: 'mid' },
  { name: 'Dango', normalizedName: 'dango', aliases: ['dango products', 'dango wallets'], category: 'edc', tier: 'mid' },
  { name: 'Buck Knives', normalizedName: 'buck knives', aliases: ['buck', 'buck knife'], category: 'edc', tier: 'mid' },
  { name: 'SOG', normalizedName: 'sog', aliases: ['sog knives', 'sog specialty knives'], category: 'edc', tier: 'mid' },
  { name: 'Kizer', normalizedName: 'kizer', aliases: ['kizer knives', 'kizer cutlery'], category: 'edc', tier: 'mid' },
  { name: 'Rovyvon', normalizedName: 'rovyvon', aliases: ['rovy von'], category: 'edc', tier: 'value' },
  { name: 'Zebra', normalizedName: 'zebra', aliases: ['zebra pens', 'zebra pen'], category: 'edc', tier: 'value' },
  // EYEWEAR expansion (20 new)
  { name: 'Tom Ford Eyewear', normalizedName: 'tom ford eyewear', aliases: ['tom ford', 'tom ford sunglasses', 'tom ford glasses'], category: 'eyewear', tier: 'luxury' },
  { name: 'Prada Eyewear', normalizedName: 'prada eyewear', aliases: ['prada sunglasses', 'prada glasses', 'prada linea rossa'], category: 'eyewear', tier: 'luxury' },
  { name: 'Gucci Eyewear', normalizedName: 'gucci eyewear', aliases: ['gucci sunglasses', 'gucci glasses'], category: 'eyewear', tier: 'luxury' },
  { name: 'Celine', normalizedName: 'celine', aliases: ['celine eyewear', 'celine sunglasses', 'céline'], category: 'eyewear', tier: 'luxury' },
  { name: 'Cartier Eyewear', normalizedName: 'cartier eyewear', aliases: ['cartier sunglasses', 'cartier glasses'], category: 'eyewear', tier: 'luxury' },
  { name: 'Jacques Marie Mage', normalizedName: 'jacques marie mage', aliases: ['jmm', 'jacques marie'], category: 'eyewear', tier: 'luxury' },
  { name: 'Garrett Leight', normalizedName: 'garrett leight', aliases: ['glco', 'garrett leight california optical'], category: 'eyewear', tier: 'premium' },
  { name: 'Moscot', normalizedName: 'moscot', aliases: ['moscot eyewear', 'moscot lemtosh'], category: 'eyewear', tier: 'premium' },
  { name: 'Randolph', normalizedName: 'randolph', aliases: ['randolph engineering', 'randolph aviators', 'randolph usa'], category: 'eyewear', tier: 'premium' },
  { name: 'Native Eyewear', normalizedName: 'native eyewear', aliases: ['native sunglasses', 'native'], category: 'eyewear', tier: 'mid' },
  { name: 'Pit Viper', normalizedName: 'pit viper', aliases: ['pitviper', 'pit vipers'], category: 'eyewear', tier: 'value' },
  { name: 'Knockaround', normalizedName: 'knockaround', aliases: ['knockaround sunglasses'], category: 'eyewear', tier: 'value' },
  { name: 'DIFF', normalizedName: 'diff', aliases: ['diff eyewear', 'diff sunglasses'], category: 'eyewear', tier: 'value' },
  { name: 'Quay', normalizedName: 'quay', aliases: ['quay australia', 'quay sunglasses'], category: 'eyewear', tier: 'value' },
  { name: 'Barton Perreira', normalizedName: 'barton perreira', aliases: ['barton perreira eyewear'], category: 'eyewear', tier: 'luxury' },
  { name: 'Mykita', normalizedName: 'mykita', aliases: ['mykita eyewear', 'mykita sunglasses'], category: 'eyewear', tier: 'luxury' },
  { name: 'ic! berlin', normalizedName: 'ic berlin', aliases: ['ic berlin', 'ic! berlin eyewear'], category: 'eyewear', tier: 'premium' },
  { name: 'Dita', normalizedName: 'dita', aliases: ['dita eyewear', 'dita sunglasses'], category: 'eyewear', tier: 'luxury' },
  { name: 'Carrera', normalizedName: 'carrera', aliases: ['carrera sunglasses', 'carrera eyewear'], category: 'eyewear', tier: 'mid' },
  { name: 'Spy Optic', normalizedName: 'spy optic', aliases: ['spy', 'spy sunglasses', 'spy optics'], category: 'eyewear', tier: 'mid' },
  // FITNESS expansion (24 new)
  { name: 'REP Fitness', normalizedName: 'rep fitness', aliases: ['rep', 'rep fitness'], category: 'fitness', tier: 'mid' },
  { name: 'Titan Fitness', normalizedName: 'titan fitness', aliases: ['titan', 'titan fitness'], category: 'fitness', tier: 'value' },
  { name: 'Bowflex', normalizedName: 'bowflex', aliases: ['bowflex', 'bow flex'], category: 'fitness', tier: 'mid' },
  { name: 'NordicTrack', normalizedName: 'nordictrack', aliases: ['nordictrack', 'nordic track'], category: 'fitness', tier: 'mid' },
  { name: 'Life Fitness', normalizedName: 'life fitness', aliases: ['life fitness', 'lifefitness'], category: 'fitness', tier: 'premium' },
  { name: 'Precor', normalizedName: 'precor', aliases: ['precor'], category: 'fitness', tier: 'premium' },
  { name: 'Concept2', normalizedName: 'concept2', aliases: ['concept2', 'concept 2', 'c2'], category: 'fitness', tier: 'premium' },
  { name: 'Assault Fitness', normalizedName: 'assault fitness', aliases: ['assault', 'assault fitness', 'assault bike'], category: 'fitness', tier: 'premium' },
  { name: 'TRX', normalizedName: 'trx', aliases: ['trx', 'trx training'], category: 'fitness', tier: 'mid' },
  { name: 'Trigger Point', normalizedName: 'trigger point', aliases: ['trigger point', 'triggerpoint', 'tp'], category: 'fitness', tier: 'mid' },
  { name: 'Mirror', normalizedName: 'mirror', aliases: ['mirror', 'mirror fitness'], category: 'fitness', tier: 'premium' },
  { name: 'Tempo', normalizedName: 'tempo', aliases: ['tempo', 'tempo studio'], category: 'fitness', tier: 'premium' },
  { name: 'Schwinn', normalizedName: 'schwinn', aliases: ['schwinn'], category: 'fitness', tier: 'mid' },
  { name: 'Nautilus', normalizedName: 'nautilus', aliases: ['nautilus'], category: 'fitness', tier: 'mid' },
  { name: 'Hammer Strength', normalizedName: 'hammer strength', aliases: ['hammer strength', 'hammerstrength'], category: 'fitness', tier: 'premium' },
  { name: 'Eleiko', normalizedName: 'eleiko', aliases: ['eleiko'], category: 'fitness', tier: 'luxury' },
  { name: 'Kabuki Strength', normalizedName: 'kabuki strength', aliases: ['kabuki', 'kabuki strength'], category: 'fitness', tier: 'premium' },
  { name: 'ProForm', normalizedName: 'proform', aliases: ['proform', 'pro form'], category: 'fitness', tier: 'value' },
  { name: 'Sole Fitness', normalizedName: 'sole fitness', aliases: ['sole', 'sole fitness'], category: 'fitness', tier: 'mid' },
  { name: 'Echelon', normalizedName: 'echelon', aliases: ['echelon', 'echelon fitness'], category: 'fitness', tier: 'mid' },
  { name: 'SorinexX', normalizedName: 'sorinex', aliases: ['sorinex'], category: 'fitness', tier: 'premium' },
  { name: 'Power Block', normalizedName: 'power block', aliases: ['powerblock', 'power block'], category: 'fitness', tier: 'mid' },
  { name: 'Bells of Steel', normalizedName: 'bells of steel', aliases: ['bells of steel', 'bos'], category: 'fitness', tier: 'mid' },
  { name: 'Technogym', normalizedName: 'technogym', aliases: ['technogym'], category: 'fitness', tier: 'luxury' },
  // FOOD expansion (26 new)
  { name: 'Whole Foods', normalizedName: 'whole foods', aliases: ['whole foods market', 'wfm', '365 by whole foods'], category: 'food', tier: 'premium' },
  { name: 'Ghirardelli', normalizedName: 'ghirardelli', aliases: ['ghirardelli chocolate'], category: 'food', tier: 'premium' },
  { name: 'Godiva', normalizedName: 'godiva', aliases: ['godiva chocolatier', 'godiva chocolate'], category: 'food', tier: 'premium' },
  { name: 'Lindt', normalizedName: 'lindt', aliases: ['lindt chocolate', 'lindt & sprüngli', 'lindt lindor'], category: 'food', tier: 'premium' },
  { name: 'Harry & David', normalizedName: 'harry & david', aliases: ['harry and david', 'harry david'], category: 'food', tier: 'premium' },
  { name: 'Omaha Steaks', normalizedName: 'omaha steaks', aliases: [], category: 'food', tier: 'premium' },
  { name: 'ButcherBox', normalizedName: 'butcherbox', aliases: ['butcher box'], category: 'food', tier: 'premium' },
  { name: 'Crowd Cow', normalizedName: 'crowd cow', aliases: ['crowdcow'], category: 'food', tier: 'premium' },
  { name: 'Thrive Market', normalizedName: 'thrive market', aliases: ['thrive'], category: 'food', tier: 'mid' },
  { name: 'HelloFresh', normalizedName: 'hellofresh', aliases: ['hello fresh'], category: 'food', tier: 'mid' },
  { name: 'Blue Apron', normalizedName: 'blue apron', aliases: [], category: 'food', tier: 'mid' },
  { name: 'Factor', normalizedName: 'factor', aliases: ['factor meals', 'factor 75', 'factor_'], category: 'food', tier: 'mid' },
  { name: 'Hu Kitchen', normalizedName: 'hu kitchen', aliases: ['hu', 'hu chocolate'], category: 'food', tier: 'premium' },
  { name: 'RXBar', normalizedName: 'rxbar', aliases: ['rx bar', 'rxbars'], category: 'food', tier: 'mid' },
  { name: 'KIND', normalizedName: 'kind', aliases: ['kind bars', 'kind snacks'], category: 'food', tier: 'mid' },
  { name: 'Clif Bar', normalizedName: 'clif bar', aliases: ['clif', 'cliff bar', 'clif bars'], category: 'food', tier: 'value' },
  { name: 'Bonne Maman', normalizedName: 'bonne maman', aliases: ['bonne maman jam'], category: 'food', tier: 'premium' },
  { name: 'Graza', normalizedName: 'graza', aliases: ['graza olive oil'], category: 'food', tier: 'premium' },
  { name: 'Brightland', normalizedName: 'brightland', aliases: ['brightland olive oil'], category: 'food', tier: 'premium' },
  { name: 'Fly By Jing', normalizedName: 'fly by jing', aliases: ['flybyjing', 'fbj'], category: 'food', tier: 'premium' },
  { name: 'Rancho Gordo', normalizedName: 'rancho gordo', aliases: [], category: 'food', tier: 'premium' },
  { name: 'Maldon', normalizedName: 'maldon', aliases: ['maldon salt', 'maldon sea salt'], category: 'food', tier: 'mid' },
  { name: 'Jacobsen Salt', normalizedName: 'jacobsen salt', aliases: ['jacobsen salt co', 'jacobsen'], category: 'food', tier: 'premium' },
  { name: 'Partanna', normalizedName: 'partanna', aliases: ['partanna olive oil'], category: 'food', tier: 'mid' },
  { name: 'Diaspora Co', normalizedName: 'diaspora co', aliases: ['diaspora', 'diaspora spices'], category: 'food', tier: 'premium' },
  { name: 'Burlap & Barrel', normalizedName: 'burlap & barrel', aliases: ['burlap and barrel'], category: 'food', tier: 'premium' },
  // GAMING expansion (25 new)
  { name: 'Alienware', normalizedName: 'alienware', aliases: ['dell alienware', 'aw'], category: 'gaming', tier: 'premium' },
  { name: 'Cooler Master', normalizedName: 'coolermaster', aliases: ['coolermaster', 'cm'], category: 'gaming', tier: 'mid' },
  { name: 'Thermaltake', normalizedName: 'thermaltake', aliases: ['tt', 'thermaltak'], category: 'gaming', tier: 'mid' },
  { name: 'MSI Gaming', normalizedName: 'msigaming', aliases: ['msi', 'micro-star', 'micro star'], category: 'gaming', tier: 'premium' },
  { name: 'EVGA', normalizedName: 'evga', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'Zotac', normalizedName: 'zotac', aliases: ['zotac gaming'], category: 'gaming', tier: 'mid' },
  { name: 'Fractal Design', normalizedName: 'fractaldesign', aliases: ['fractal'], category: 'gaming', tier: 'premium' },
  { name: 'be quiet!', normalizedName: 'bequiet', aliases: ['be quiet', 'bequiet!'], category: 'gaming', tier: 'premium' },
  { name: 'Turtle Beach', normalizedName: 'turtlebeach', aliases: ['tb'], category: 'gaming', tier: 'mid' },
  { name: 'Astro Gaming', normalizedName: 'astrogaming', aliases: ['astro'], category: 'gaming', tier: 'premium' },
  { name: 'Glorious', normalizedName: 'glorious', aliases: ['glorious gaming', 'glorious pc gaming race', 'gpcgr'], category: 'gaming', tier: 'mid' },
  { name: 'Wooting', normalizedName: 'wooting', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'Gigabyte', normalizedName: 'gigabyte', aliases: ['gigabyte aorus', 'aorus'], category: 'gaming', tier: 'mid' },
  { name: 'ASRock', normalizedName: 'asrock', aliases: ['asrock phantom gaming'], category: 'gaming', tier: 'mid' },
  { name: 'Sapphire', normalizedName: 'sapphire', aliases: ['sapphire nitro', 'sapphire technology'], category: 'gaming', tier: 'mid' },
  { name: 'XFX', normalizedName: 'xfx', aliases: [], category: 'gaming', tier: 'mid' },
  { name: 'PowerColor', normalizedName: 'powercolor', aliases: ['power color', 'powercolor red devil'], category: 'gaming', tier: 'mid' },
  { name: 'Lian Li', normalizedName: 'lianli', aliases: ['lian-li', 'lianli'], category: 'gaming', tier: 'premium' },
  { name: 'Noctua', normalizedName: 'noctua', aliases: [], category: 'gaming', tier: 'premium' },
  { name: 'Meta Quest', normalizedName: 'metaquest', aliases: ['oculus', 'oculus quest', 'meta quest', 'quest'], category: 'gaming', tier: 'premium' },
  { name: 'Backbone', normalizedName: 'backbone', aliases: ['backbone one', 'backbone controller'], category: 'gaming', tier: 'mid' },
  { name: 'GameSir', normalizedName: 'gamesir', aliases: ['game sir'], category: 'gaming', tier: 'value' },
  { name: '8BitDo', normalizedName: '8bitdo', aliases: ['8-bitdo', '8bit do', 'eight bitdo'], category: 'gaming', tier: 'mid' },
  { name: 'Noblechairs', normalizedName: 'noblechairs', aliases: ['noble chairs'], category: 'gaming', tier: 'premium' },
  { name: 'AndaSeat', normalizedName: 'andaseat', aliases: ['anda seat'], category: 'gaming', tier: 'mid' },
  // HEALTH expansion (15 new)
  { name: 'Theragun', normalizedName: 'theragun', aliases: ['thera gun', 'therabody', 'theragun pro'], category: 'health', tier: 'premium' },
  { name: 'Omron', normalizedName: 'omron', aliases: ['omron healthcare', 'omron health'], category: 'health', tier: 'mid' },
  { name: 'ResMed', normalizedName: 'resmed', aliases: ['res med', 'res-med'], category: 'health', tier: 'premium' },
  { name: 'Dexcom', normalizedName: 'dexcom', aliases: ['dexcom cgm', 'dexcom g7'], category: 'health', tier: 'premium' },
  { name: 'Abbott', normalizedName: 'abbott', aliases: ['abbott labs', 'freestyle libre', 'abbott laboratories'], category: 'health', tier: 'premium' },
  { name: '23andMe', normalizedName: '23andme', aliases: ['23 and me', 'twenty three and me'], category: 'health', tier: 'premium' },
  { name: 'InsideTracker', normalizedName: 'insidetracker', aliases: ['inside tracker', 'inside-tracker'], category: 'health', tier: 'premium' },
  { name: 'Levels', normalizedName: 'levels', aliases: ['levels health', 'levels cgm'], category: 'health', tier: 'premium' },
  { name: 'Noom', normalizedName: 'noom', aliases: ['noom weight', 'noom coach'], category: 'health', tier: 'mid' },
  { name: 'Calm', normalizedName: 'calm', aliases: ['calm app', 'calm meditation'], category: 'health', tier: 'mid' },
  { name: 'Headspace', normalizedName: 'headspace', aliases: ['headspace app', 'headspace meditation'], category: 'health', tier: 'mid' },
  { name: 'Molekule', normalizedName: 'molekule', aliases: ['molekule air'], category: 'health', tier: 'premium' },
  { name: 'Coway', normalizedName: 'coway', aliases: ['coway air', 'coway airmega'], category: 'health', tier: 'mid' },
  { name: 'Muse', normalizedName: 'muse', aliases: ['muse headband', 'muse meditation', 'muse 2'], category: 'health', tier: 'premium' },
  { name: 'Lumen', normalizedName: 'lumen', aliases: ['lumen metabolism', 'lumen device'], category: 'health', tier: 'premium' },
  // HOBBIES expansion (25 new)
  { name: 'Hasbro', normalizedName: 'hasbro', aliases: ['hasbro gaming'], category: 'hobbies', tier: 'mid' },
  { name: 'Wizards of the Coast', normalizedName: 'wizardsofthecoast', aliases: ['wotc', 'wizards'], category: 'hobbies', tier: 'premium' },
  { name: 'Ravensburger', normalizedName: 'ravensburger', aliases: [], category: 'hobbies', tier: 'premium' },
  { name: 'Funko', normalizedName: 'funko', aliases: ['funko pop', 'funko pop!'], category: 'hobbies', tier: 'mid' },
  { name: 'Hot Toys', normalizedName: 'hottoys', aliases: ['hot toys mms'], category: 'hobbies', tier: 'luxury' },
  { name: 'Sideshow Collectibles', normalizedName: 'sideshowcollectibles', aliases: ['sideshow', 'ssc'], category: 'hobbies', tier: 'luxury' },
  { name: 'Traxxas', normalizedName: 'traxxas', aliases: [], category: 'hobbies', tier: 'premium' },
  { name: 'Arrma', normalizedName: 'arrma', aliases: ['arrma rc'], category: 'hobbies', tier: 'premium' },
  { name: 'The Pokemon Company', normalizedName: 'thepokemoncompany', aliases: ['pokemon', 'pokemon tcg', 'ptcg', 'pokémon'], category: 'hobbies', tier: 'premium' },
  { name: 'Konami', normalizedName: 'konami', aliases: ['yu-gi-oh', 'yugioh', 'yu gi oh', 'konami tcg'], category: 'hobbies', tier: 'premium' },
  { name: 'Fantasy Flight Games', normalizedName: 'fantasyflightgames', aliases: ['ffg', 'fantasy flight'], category: 'hobbies', tier: 'premium' },
  { name: 'Asmodee', normalizedName: 'asmodee', aliases: [], category: 'hobbies', tier: 'premium' },
  { name: 'Stonemaier Games', normalizedName: 'stonemaiergames', aliases: ['stonemaier'], category: 'hobbies', tier: 'premium' },
  { name: 'Czech Games Edition', normalizedName: 'czechgamesedition', aliases: ['cge', 'czech games'], category: 'hobbies', tier: 'mid' },
  { name: 'CMON', normalizedName: 'cmon', aliases: ['cool mini or not', 'coolminiornot'], category: 'hobbies', tier: 'premium' },
  { name: 'Kotobukiya', normalizedName: 'kotobukiya', aliases: ['koto'], category: 'hobbies', tier: 'premium' },
  { name: 'Good Smile Company', normalizedName: 'goodsmilecompany', aliases: ['good smile', 'gsc', 'nendoroid', 'figma'], category: 'hobbies', tier: 'premium' },
  { name: 'McFarlane Toys', normalizedName: 'mcfarlanetoys', aliases: ['mcfarlane'], category: 'hobbies', tier: 'mid' },
  { name: 'Losi', normalizedName: 'losi', aliases: ['team losi'], category: 'hobbies', tier: 'premium' },
  { name: 'Horizon Hobby', normalizedName: 'horizonhobby', aliases: ['horizon'], category: 'hobbies', tier: 'mid' },
  { name: 'Revell', normalizedName: 'revell', aliases: ['revell germany', 'revell monogram'], category: 'hobbies', tier: 'mid' },
  { name: 'Airfix', normalizedName: 'airfix', aliases: [], category: 'hobbies', tier: 'mid' },
  { name: 'Warhammer', normalizedName: 'warhammer', aliases: ['warhammer 40k', 'wh40k', 'age of sigmar', 'aos'], category: 'hobbies', tier: 'premium' },
  { name: 'Bushiroad', normalizedName: 'bushiroad', aliases: ['cardfight vanguard', 'weiss schwarz'], category: 'hobbies', tier: 'mid' },
  { name: 'Upper Deck', normalizedName: 'upperdeck', aliases: ['upper deck entertainment'], category: 'hobbies', tier: 'mid' },
  // HOME expansion (25 new)
  { name: 'Arhaus', normalizedName: 'arhaus', aliases: [], category: 'home', tier: 'premium' },
  { name: 'Room & Board', normalizedName: 'room & board', aliases: ['room and board', 'roomandboard'], category: 'home', tier: 'premium' },
  { name: 'Joybird', normalizedName: 'joybird', aliases: [], category: 'home', tier: 'premium' },
  { name: 'Living Spaces', normalizedName: 'living spaces', aliases: ['livingspaces'], category: 'home', tier: 'mid' },
  { name: 'Ashley Furniture', normalizedName: 'ashley furniture', aliases: ['ashley', 'ashley homestore'], category: 'home', tier: 'value' },
  { name: 'La-Z-Boy', normalizedName: 'la-z-boy', aliases: ['lazboy', 'lazy boy', 'la z boy', 'lazyboy'], category: 'home', tier: 'mid' },
  { name: 'Wayfair', normalizedName: 'wayfair', aliases: [], category: 'home', tier: 'mid' },
  { name: 'Anthropologie Home', normalizedName: 'anthropologie home', aliases: ['anthropologie', 'anthro home'], category: 'home', tier: 'premium' },
  { name: 'Serena & Lily', normalizedName: 'serena & lily', aliases: ['serena and lily', 'serenaandlily'], category: 'home', tier: 'premium' },
  { name: 'Lulu and Georgia', normalizedName: 'lulu and georgia', aliases: ['lulu & georgia', 'luluandgeorgia'], category: 'home', tier: 'premium' },
  { name: 'Burke Decor', normalizedName: 'burke decor', aliases: ['burkedecor'], category: 'home', tier: 'premium' },
  { name: 'Castlery', normalizedName: 'castlery', aliases: [], category: 'home', tier: 'mid' },
  { name: 'Floyd', normalizedName: 'floyd', aliases: ['floyd home', 'floyd furniture'], category: 'home', tier: 'premium' },
  { name: 'Interior Define', normalizedName: 'interior define', aliases: ['interiordefine'], category: 'home', tier: 'premium' },
  { name: 'Burrow', normalizedName: 'burrow', aliases: [], category: 'home', tier: 'mid' },
  { name: 'Albany Park', normalizedName: 'albany park', aliases: ['albanypark'], category: 'home', tier: 'mid' },
  { name: 'Apt2B', normalizedName: 'apt2b', aliases: ['apt 2b'], category: 'home', tier: 'mid' },
  { name: 'Threshold', normalizedName: 'threshold', aliases: ['target threshold'], category: 'home', tier: 'value' },
  { name: 'Hearth & Hand', normalizedName: 'hearth & hand', aliases: ['hearth and hand', 'hearth & hand with magnolia'], category: 'home', tier: 'value' },
  { name: 'Havenly', normalizedName: 'havenly', aliases: [], category: 'home', tier: 'mid' },
  { name: 'Rejuvenation', normalizedName: 'rejuvenation', aliases: [], category: 'home', tier: 'premium' },
  { name: 'Blu Dot', normalizedName: 'blu dot', aliases: ['bludot'], category: 'home', tier: 'premium' },
  { name: 'Sixpenny', normalizedName: 'sixpenny', aliases: [], category: 'home', tier: 'premium' },
  { name: 'Lulu & Georgia', normalizedName: 'lulu & georgia', aliases: ['lulu and georgia'], category: 'home', tier: 'premium' },
  { name: 'Outer', normalizedName: 'outer', aliases: ['outer furniture'], category: 'home', tier: 'premium' },
  // KIDS expansion (21 new)
  { name: 'Melissa & Doug', normalizedName: 'melissa & doug', aliases: ['melissa and doug', 'melissaanddoug', 'melissa doug'], category: 'kids', tier: 'mid' },
  { name: 'Fisher-Price', normalizedName: 'fisher-price', aliases: ['fisher price', 'fisherprice'], category: 'kids', tier: 'mid' },
  { name: 'VTech', normalizedName: 'vtech', aliases: ['v-tech', 'v tech'], category: 'kids', tier: 'mid' },
  { name: 'LeapFrog', normalizedName: 'leapfrog', aliases: ['leap frog', 'leap-frog'], category: 'kids', tier: 'mid' },
  { name: 'Magna-Tiles', normalizedName: 'magna-tiles', aliases: ['magnatiles', 'magna tiles'], category: 'kids', tier: 'premium' },
  { name: 'Fat Brain Toys', normalizedName: 'fat brain toys', aliases: ['fatbraintoys', 'fat brain'], category: 'kids', tier: 'premium' },
  { name: 'Tonies', normalizedName: 'tonies', aliases: ['toniebox', 'tonies box'], category: 'kids', tier: 'premium' },
  { name: 'Yoto', normalizedName: 'yoto', aliases: ['yoto player', 'yoto mini'], category: 'kids', tier: 'premium' },
  { name: 'Mini Boden', normalizedName: 'mini boden', aliases: ['miniboden', 'boden kids'], category: 'kids', tier: 'premium' },
  { name: 'Zara Kids', normalizedName: 'zara kids', aliases: ['zarakids', 'zara children'], category: 'kids', tier: 'mid' },
  { name: 'Crewcuts', normalizedName: 'crewcuts', aliases: ['crew cuts', 'j crew kids', 'jcrew kids'], category: 'kids', tier: 'premium' },
  { name: 'Nike Kids', normalizedName: 'nike kids', aliases: ['nikekids', 'nike youth', 'nike junior'], category: 'kids', tier: 'premium' },
  { name: 'New Balance Kids', normalizedName: 'new balance kids', aliases: ['nb kids', 'new balance youth'], category: 'kids', tier: 'premium' },
  { name: 'Nugget', normalizedName: 'nugget', aliases: ['nugget comfort', 'the nugget'], category: 'kids', tier: 'premium' },
  { name: 'Playmobil', normalizedName: 'playmobil', aliases: ['playmobile', 'play mobil'], category: 'kids', tier: 'mid' },
  { name: 'Hape', normalizedName: 'hape', aliases: ['hape toys'], category: 'kids', tier: 'mid' },
  { name: 'Osmo', normalizedName: 'osmo', aliases: ['osmo learning', 'playosmo'], category: 'kids', tier: 'premium' },
  { name: 'Tegu', normalizedName: 'tegu', aliases: ['tegu blocks', 'tegu toys'], category: 'kids', tier: 'premium' },
  { name: 'Cat & Jack', normalizedName: 'cat & jack', aliases: ['cat and jack', 'catandjack'], category: 'kids', tier: 'value' },
  { name: 'Petit Bateau', normalizedName: 'petit bateau', aliases: ['petitbateau'], category: 'kids', tier: 'luxury' },
  { name: 'Maisonette', normalizedName: 'maisonette', aliases: ['maisonette kids'], category: 'kids', tier: 'luxury' },
  // KITCHEN expansion (21 new)
  { name: 'Cuisinart', normalizedName: 'cuisinart', aliases: [], category: 'kitchen', tier: 'mid' },
  { name: 'Wüsthof', normalizedName: 'wusthof', aliases: ['wusthof', 'wuesthof'], category: 'kitchen', tier: 'premium' },
  { name: 'Shun', normalizedName: 'shun', aliases: ['shun cutlery', 'shun knives'], category: 'kitchen', tier: 'premium' },
  { name: 'Global', normalizedName: 'global', aliases: ['global knives'], category: 'kitchen', tier: 'premium' },
  { name: 'MAC Knives', normalizedName: 'mac knives', aliases: ['mac knife', 'mac'], category: 'kitchen', tier: 'premium' },
  { name: 'Miyabi', normalizedName: 'miyabi', aliases: [], category: 'kitchen', tier: 'luxury' },
  { name: 'Made In', normalizedName: 'made in', aliases: ['madein', 'made in cookware'], category: 'kitchen', tier: 'premium' },
  { name: 'Great Jones', normalizedName: 'great jones', aliases: ['greatjones'], category: 'kitchen', tier: 'mid' },
  { name: 'Our Place', normalizedName: 'our place', aliases: ['ourplace'], category: 'kitchen', tier: 'mid' },
  { name: 'HexClad', normalizedName: 'hexclad', aliases: ['hex clad'], category: 'kitchen', tier: 'premium' },
  { name: 'GreenPan', normalizedName: 'greenpan', aliases: ['green pan'], category: 'kitchen', tier: 'mid' },
  { name: 'Scanpan', normalizedName: 'scanpan', aliases: [], category: 'kitchen', tier: 'premium' },
  { name: 'Calphalon', normalizedName: 'calphalon', aliases: [], category: 'kitchen', tier: 'mid' },
  { name: 'T-fal', normalizedName: 't-fal', aliases: ['tfal', 'tefal'], category: 'kitchen', tier: 'value' },
  { name: 'Anova', normalizedName: 'anova', aliases: ['anova culinary'], category: 'kitchen', tier: 'mid' },
  { name: 'Joule', normalizedName: 'joule', aliases: ['breville joule', 'chefsteps joule'], category: 'kitchen', tier: 'premium' },
  { name: 'Wolf', normalizedName: 'wolf', aliases: ['wolf appliances', 'wolf range'], category: 'kitchen', tier: 'luxury' },
  { name: 'Viking', normalizedName: 'viking', aliases: ['viking range', 'viking appliances'], category: 'kitchen', tier: 'luxury' },
  { name: 'Sub-Zero', normalizedName: 'sub-zero', aliases: ['subzero', 'sub zero'], category: 'kitchen', tier: 'luxury' },
  { name: 'Thermador', normalizedName: 'thermador', aliases: [], category: 'kitchen', tier: 'luxury' },
  { name: 'Balmuda', normalizedName: 'balmuda', aliases: [], category: 'kitchen', tier: 'premium' },
  // MOTORCYCLE expansion (24 new)
  { name: 'Klim', normalizedName: 'klim', aliases: [], category: 'motorcycle', tier: 'luxury' },
  { name: 'AGV', normalizedName: 'agv', aliases: ['agv helmets'], category: 'motorcycle', tier: 'luxury' },
  { name: 'Akrapovic', normalizedName: 'akrapovic', aliases: ['akrapovič', 'akra'], category: 'motorcycle', tier: 'luxury' },
  { name: 'Ohlins', normalizedName: 'ohlins', aliases: ['öhlins'], category: 'motorcycle', tier: 'luxury' },
  { name: 'Sena', normalizedName: 'sena', aliases: ['sena bluetooth'], category: 'motorcycle', tier: 'premium' },
  { name: 'Cardo', normalizedName: 'cardo', aliases: ['cardo systems', 'cardo packtalk'], category: 'motorcycle', tier: 'premium' },
  { name: 'Roland Sands Design', normalizedName: 'roland sands design', aliases: ['rsd', 'roland sands'], category: 'motorcycle', tier: 'premium' },
  { name: 'Simpson', normalizedName: 'simpson', aliases: ['simpson helmets'], category: 'motorcycle', tier: 'premium' },
  { name: 'Yoshimura', normalizedName: 'yoshimura', aliases: ['yoshi'], category: 'motorcycle', tier: 'premium' },
  { name: 'Icon', normalizedName: 'icon', aliases: ['icon motosports', 'icon helmets'], category: 'motorcycle', tier: 'premium' },
  { name: 'Biltwell', normalizedName: 'biltwell', aliases: [], category: 'motorcycle', tier: 'premium' },
  { name: 'Cortech', normalizedName: 'cortech', aliases: [], category: 'motorcycle', tier: 'premium' },
  { name: 'Rizoma', normalizedName: 'rizoma', aliases: [], category: 'motorcycle', tier: 'premium' },
  { name: 'SW-Motech', normalizedName: 'sw-motech', aliases: ['sw motech', 'swmotech'], category: 'motorcycle', tier: 'premium' },
  { name: 'Givi', normalizedName: 'givi', aliases: [], category: 'motorcycle', tier: 'premium' },
  { name: 'Saddlemen', normalizedName: 'saddlemen', aliases: [], category: 'motorcycle', tier: 'premium' },
  { name: 'Scorpion EXO', normalizedName: 'scorpion exo', aliases: ['scorpion helmets', 'scorpion'], category: 'motorcycle', tier: 'premium' },
  { name: 'Held', normalizedName: 'held', aliases: ['held gloves'], category: 'motorcycle', tier: 'premium' },
  { name: 'Joe Rocket', normalizedName: 'joe rocket', aliases: ['joerocket'], category: 'motorcycle', tier: 'mid' },
  { name: 'Speed and Strength', normalizedName: 'speed and strength', aliases: ['speed & strength', 'ss'], category: 'motorcycle', tier: 'mid' },
  { name: 'Fly Racing', normalizedName: 'fly racing', aliases: ['fly'], category: 'motorcycle', tier: 'mid' },
  { name: 'Nelson-Rigg', normalizedName: 'nelson-rigg', aliases: ['nelson rigg'], category: 'motorcycle', tier: 'mid' },
  { name: 'Kuryakyn', normalizedName: 'kuryakyn', aliases: ['kuryakin'], category: 'motorcycle', tier: 'mid' },
  { name: 'Memphis Shades', normalizedName: 'memphis shades', aliases: [], category: 'motorcycle', tier: 'mid' },
  // OFFICE expansion (19 new)
  { name: 'Flexispot', normalizedName: 'flexispot', aliases: ['flexi spot'], category: 'office', tier: 'mid' },
  { name: 'BTOD', normalizedName: 'btod', aliases: ['beyond the office door'], category: 'office', tier: 'mid' },
  { name: 'Branch', normalizedName: 'branch', aliases: ['branch furniture', 'branch office'], category: 'office', tier: 'mid' },
  { name: 'HAG', normalizedName: 'hag', aliases: ['hag capisco', 'flokk hag'], category: 'office', tier: 'premium' },
  { name: 'Raynor', normalizedName: 'raynor', aliases: ['raynor group', 'eurotech'], category: 'office', tier: 'mid' },
  { name: 'Ergotron', normalizedName: 'ergotron', aliases: [], category: 'office', tier: 'premium' },
  { name: 'Jarvis', normalizedName: 'jarvis', aliases: ['fully jarvis'], category: 'office', tier: 'mid' },
  { name: 'Crandall Office', normalizedName: 'crandall office', aliases: ['crandall', 'crandall office furniture'], category: 'office', tier: 'mid' },
  { name: 'Sihoo', normalizedName: 'sihoo', aliases: [], category: 'office', tier: 'value' },
  { name: 'Hbada', normalizedName: 'hbada', aliases: [], category: 'office', tier: 'value' },
  { name: 'Omnidesk', normalizedName: 'omnidesk', aliases: [], category: 'office', tier: 'premium' },
  { name: 'HON', normalizedName: 'hon', aliases: ['hon furniture', 'the hon company'], category: 'office', tier: 'mid' },
  { name: 'Staples', normalizedName: 'staples', aliases: ['staples office'], category: 'office', tier: 'value' },
  { name: 'Sidiz', normalizedName: 'sidiz', aliases: [], category: 'office', tier: 'mid' },
  { name: 'X-Chair', normalizedName: 'x-chair', aliases: ['xchair', 'x chair'], category: 'office', tier: 'premium' },
  { name: 'Nouhaus', normalizedName: 'nouhaus', aliases: [], category: 'office', tier: 'mid' },
  { name: 'SitOnIt', normalizedName: 'sitonit', aliases: ['sit on it', 'sitonit seating'], category: 'office', tier: 'mid' },
  { name: 'Workpro', normalizedName: 'workpro', aliases: ['work pro'], category: 'office', tier: 'value' },
  { name: 'Leap', normalizedName: 'leap', aliases: ['steelcase leap'], category: 'office', tier: 'premium' },
  // PET expansion (22 new)
  { name: 'Ruffwear', normalizedName: 'ruffwear', aliases: ['ruff wear', 'ruff-wear'], category: 'pet', tier: 'premium' },
  { name: 'Kurgo', normalizedName: 'kurgo', aliases: ['kurgo dog'], category: 'pet', tier: 'premium' },
  { name: 'Outward Hound', normalizedName: 'outward hound', aliases: ['outwardhound', 'outward-hound'], category: 'pet', tier: 'mid' },
  { name: 'ChuckIt!', normalizedName: 'chuckit', aliases: ['chuckit', 'chuck it', 'chuck-it'], category: 'pet', tier: 'mid' },
  { name: 'Nylabone', normalizedName: 'nylabone', aliases: ['nyla bone', 'nyla-bone'], category: 'pet', tier: 'mid' },
  { name: 'Greenies', normalizedName: 'greenies', aliases: ['greenies treats'], category: 'pet', tier: 'mid' },
  { name: 'Ziwi Peak', normalizedName: 'ziwi peak', aliases: ['ziwipeak', 'ziwi', 'ziwi-peak'], category: 'pet', tier: 'premium' },
  { name: 'Weruva', normalizedName: 'weruva', aliases: ['weruva pets'], category: 'pet', tier: 'premium' },
  { name: 'Tiki Pets', normalizedName: 'tiki pets', aliases: ['tiki cat', 'tiki dog', 'tikipets'], category: 'pet', tier: 'premium' },
  { name: 'PetSafe', normalizedName: 'petsafe', aliases: ['pet safe', 'pet-safe'], category: 'pet', tier: 'mid' },
  { name: 'Furbo', normalizedName: 'furbo', aliases: ['furbo camera', 'furbo dog camera'], category: 'pet', tier: 'premium' },
  { name: 'Litter-Robot', normalizedName: 'litter-robot', aliases: ['litter robot', 'litterrobot'], category: 'pet', tier: 'premium' },
  { name: 'Catit', normalizedName: 'catit', aliases: ['cat it'], category: 'pet', tier: 'mid' },
  { name: 'Whistle', normalizedName: 'whistle', aliases: ['whistle gps', 'whistle tracker'], category: 'pet', tier: 'premium' },
  { name: 'Wisdom Panel', normalizedName: 'wisdom panel', aliases: ['wisdompanel', 'wisdom-panel'], category: 'pet', tier: 'premium' },
  { name: 'Embark', normalizedName: 'embark', aliases: ['embark dna', 'embark vet'], category: 'pet', tier: 'premium' },
  { name: 'Open Farm', normalizedName: 'open farm', aliases: ['openfarm', 'open-farm'], category: 'pet', tier: 'premium' },
  { name: 'Wellness', normalizedName: 'wellness', aliases: ['wellness pet', 'wellness core', 'wellness pet food'], category: 'pet', tier: 'mid' },
  { name: 'Merrick', normalizedName: 'merrick', aliases: ['merrick pet', 'merrick dog food'], category: 'pet', tier: 'mid' },
  { name: 'Lupine', normalizedName: 'lupine', aliases: ['lupine pet', 'lupine collars'], category: 'pet', tier: 'mid' },
  { name: 'West Paw', normalizedName: 'west paw', aliases: ['westpaw', 'west-paw'], category: 'pet', tier: 'premium' },
  { name: 'Benebone', normalizedName: 'benebone', aliases: ['bene bone'], category: 'pet', tier: 'mid' },
  // PHOTOGRAPHY expansion (22 new)
  { name: 'Zeiss', normalizedName: 'zeiss', aliases: ['carl zeiss', 'zeiss lenses'], category: 'photography', tier: 'luxury' },
  { name: 'Phase One', normalizedName: 'phase one', aliases: ['phaseone'], category: 'photography', tier: 'luxury' },
  { name: 'Edelkrone', normalizedName: 'edelkrone', aliases: [], category: 'photography', tier: 'luxury' },
  { name: 'Sigma', normalizedName: 'sigma', aliases: ['sigma art', 'sigma lenses'], category: 'photography', tier: 'premium' },
  { name: 'Tamron', normalizedName: 'tamron', aliases: ['tamron lenses'], category: 'photography', tier: 'premium' },
  { name: 'Voigtlander', normalizedName: 'voigtlander', aliases: ['voigtländer', 'voightlander'], category: 'photography', tier: 'premium' },
  { name: 'Olympus', normalizedName: 'olympus', aliases: ['om system', 'om digital'], category: 'photography', tier: 'premium' },
  { name: 'Tilta', normalizedName: 'tilta', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'SmallRig', normalizedName: 'smallrig', aliases: ['small rig'], category: 'photography', tier: 'premium' },
  { name: 'Zhiyun', normalizedName: 'zhiyun', aliases: ['zhiyun tech', 'zhiyun-tech'], category: 'photography', tier: 'premium' },
  { name: 'Benro', normalizedName: 'benro', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'Sekonic', normalizedName: 'sekonic', aliases: [], category: 'photography', tier: 'premium' },
  { name: 'Datacolor', normalizedName: 'datacolor', aliases: ['spyder', 'datacolor spyder'], category: 'photography', tier: 'premium' },
  { name: 'X-Rite', normalizedName: 'x-rite', aliases: ['xrite', 'x rite', 'colorchecker'], category: 'photography', tier: 'premium' },
  { name: 'Blackmagic Design', normalizedName: 'blackmagic design', aliases: ['blackmagic', 'bmpcc', 'bmd'], category: 'photography', tier: 'premium' },
  { name: 'RED', normalizedName: 'red', aliases: ['red digital cinema', 'red camera'], category: 'photography', tier: 'luxury' },
  { name: 'Atomos', normalizedName: 'atomos', aliases: ['atomos ninja', 'atomos shogun'], category: 'photography', tier: 'premium' },
  { name: 'Rokinon', normalizedName: 'rokinon', aliases: ['samyang', 'rokinon cine'], category: 'photography', tier: 'mid' },
  { name: 'Nanlite', normalizedName: 'nanlite', aliases: ['nanguang'], category: 'photography', tier: 'mid' },
  { name: 'Joby', normalizedName: 'joby', aliases: ['gorillapod'], category: 'photography', tier: 'mid' },
  { name: 'Moza', normalizedName: 'moza', aliases: ['moza air'], category: 'photography', tier: 'mid' },
  { name: 'Sirui', normalizedName: 'sirui', aliases: [], category: 'photography', tier: 'mid' },
  // RUNNING expansion (16 new)
  { name: 'On Running', normalizedName: 'on running', aliases: ['on', 'on running', 'on cloud'], category: 'running', tier: 'premium' },
  { name: 'New Balance Running', normalizedName: 'new balance running', aliases: ['nb running', 'new balance running'], category: 'running', tier: 'mid' },
  { name: 'Coros', normalizedName: 'coros', aliases: ['coros'], category: 'running', tier: 'premium' },
  { name: 'Maurten', normalizedName: 'maurten', aliases: ['maurten'], category: 'running', tier: 'luxury' },
  { name: 'GU Energy', normalizedName: 'gu energy', aliases: ['gu', 'gu energy'], category: 'running', tier: 'mid' },
  { name: 'Goodr', normalizedName: 'goodr', aliases: ['goodr'], category: 'running', tier: 'value' },
  { name: 'Shokz', normalizedName: 'shokz', aliases: ['shokz', 'aftershokz'], category: 'running', tier: 'mid' },
  { name: 'Nathan Sports', normalizedName: 'nathan sports', aliases: ['nathan', 'nathan sports'], category: 'running', tier: 'mid' },
  { name: 'Jaybird', normalizedName: 'jaybird', aliases: ['jaybird'], category: 'running', tier: 'mid' },
  { name: 'Craft Sportswear', normalizedName: 'craft sportswear', aliases: ['craft', 'craft sportswear'], category: 'running', tier: 'mid' },
  { name: 'Injinji', normalizedName: 'injinji', aliases: ['injinji'], category: 'running', tier: 'mid' },
  { name: 'Balega', normalizedName: 'balega', aliases: ['balega'], category: 'running', tier: 'mid' },
  { name: 'Flipbelt', normalizedName: 'flipbelt', aliases: ['flipbelt', 'flip belt'], category: 'running', tier: 'value' },
  { name: 'Spring Energy', normalizedName: 'spring energy', aliases: ['spring energy', 'spring'], category: 'running', tier: 'mid' },
  { name: 'Tailwind Nutrition', normalizedName: 'tailwind nutrition', aliases: ['tailwind', 'tailwind nutrition'], category: 'running', tier: 'mid' },
  { name: 'Nuun', normalizedName: 'nuun', aliases: ['nuun', 'nuun hydration'], category: 'running', tier: 'mid' },
  // SOCCER expansion (19 new)
  { name: 'Adidas Football', normalizedName: 'adidas football', aliases: ['adidas football', 'adidas soccer', 'adidas predator'], category: 'soccer', tier: 'premium' },
  { name: 'Nike Football', normalizedName: 'nike football', aliases: ['nike football', 'nike soccer', 'nike mercurial', 'nike phantom'], category: 'soccer', tier: 'premium' },
  { name: 'Puma Football', normalizedName: 'puma football', aliases: ['puma football', 'puma soccer', 'puma future', 'puma king'], category: 'soccer', tier: 'mid' },
  { name: 'Umbro', normalizedName: 'umbro', aliases: ['umbro'], category: 'soccer', tier: 'mid' },
  { name: 'Joma', normalizedName: 'joma', aliases: ['joma'], category: 'soccer', tier: 'mid' },
  { name: 'Mitre', normalizedName: 'mitre', aliases: ['mitre'], category: 'soccer', tier: 'value' },
  { name: 'Select Sport', normalizedName: 'select sport', aliases: ['select', 'select sport', 'select ball'], category: 'soccer', tier: 'mid' },
  { name: 'Storelli', normalizedName: 'storelli', aliases: ['storelli'], category: 'soccer', tier: 'mid' },
  { name: 'New Balance Football', normalizedName: 'new balance football', aliases: ['nb football', 'new balance soccer', 'nb soccer'], category: 'soccer', tier: 'mid' },
  { name: 'Diadora', normalizedName: 'diadora', aliases: ['diadora'], category: 'soccer', tier: 'mid' },
  { name: 'Lotto', normalizedName: 'lotto', aliases: ['lotto', 'lotto sport'], category: 'soccer', tier: 'mid' },
  { name: 'Hummel', normalizedName: 'hummel', aliases: ['hummel'], category: 'soccer', tier: 'mid' },
  { name: 'Uhlsport', normalizedName: 'uhlsport', aliases: ['uhlsport'], category: 'soccer', tier: 'mid' },
  { name: 'Reusch', normalizedName: 'reusch', aliases: ['reusch'], category: 'soccer', tier: 'mid' },
  { name: 'Sells', normalizedName: 'sells', aliases: ['sells', 'sells goalkeeper'], category: 'soccer', tier: 'mid' },
  { name: 'Kappa', normalizedName: 'kappa', aliases: ['kappa', 'kappa sport'], category: 'soccer', tier: 'mid' },
  { name: 'Macron', normalizedName: 'macron', aliases: ['macron', 'macron sport'], category: 'soccer', tier: 'mid' },
  { name: 'Jako', normalizedName: 'jako', aliases: ['jako'], category: 'soccer', tier: 'mid' },
  { name: 'Erima', normalizedName: 'erima', aliases: ['erima'], category: 'soccer', tier: 'mid' },
  // SPORTS expansion (19 new)
  { name: 'Spalding', normalizedName: 'spalding', aliases: ['spalding'], category: 'sports', tier: 'mid' },
  { name: 'Rawlings', normalizedName: 'rawlings', aliases: ['rawlings'], category: 'sports', tier: 'mid' },
  { name: 'DeMarini', normalizedName: 'demarini', aliases: ['demarini', 'de marini'], category: 'sports', tier: 'premium' },
  { name: 'Easton', normalizedName: 'easton', aliases: ['easton'], category: 'sports', tier: 'mid' },
  { name: 'Louisville Slugger', normalizedName: 'louisville slugger', aliases: ['louisville slugger', 'louisville'], category: 'sports', tier: 'mid' },
  { name: 'CCM', normalizedName: 'ccm', aliases: ['ccm'], category: 'sports', tier: 'mid' },
  { name: 'Bauer', normalizedName: 'bauer', aliases: ['bauer', 'bauer hockey'], category: 'sports', tier: 'premium' },
  { name: 'STX', normalizedName: 'stx', aliases: ['stx', 'stx lacrosse'], category: 'sports', tier: 'mid' },
  { name: 'Warrior', normalizedName: 'warrior', aliases: ['warrior', 'warrior sports'], category: 'sports', tier: 'mid' },
  { name: 'Shock Doctor', normalizedName: 'shock doctor', aliases: ['shock doctor', 'shockdoctor'], category: 'sports', tier: 'mid' },
  { name: 'Maverik', normalizedName: 'maverik', aliases: ['maverik', 'maverik lacrosse'], category: 'sports', tier: 'mid' },
  { name: 'Riddell', normalizedName: 'riddell', aliases: ['riddell'], category: 'sports', tier: 'mid' },
  { name: 'Schutt', normalizedName: 'schutt', aliases: ['schutt', 'schutt sports'], category: 'sports', tier: 'mid' },
  { name: 'Franklin Sports', normalizedName: 'franklin sports', aliases: ['franklin', 'franklin sports'], category: 'sports', tier: 'value' },
  { name: 'SKLZ', normalizedName: 'sklz', aliases: ['sklz'], category: 'sports', tier: 'value' },
  { name: 'EvoShield', normalizedName: 'evoshield', aliases: ['evoshield', 'evo shield'], category: 'sports', tier: 'mid' },
  { name: 'Marucci', normalizedName: 'marucci', aliases: ['marucci'], category: 'sports', tier: 'premium' },
  { name: 'StringKing', normalizedName: 'stringking', aliases: ['stringking', 'string king'], category: 'sports', tier: 'mid' },
  { name: 'Xenith', normalizedName: 'xenith', aliases: ['xenith'], category: 'sports', tier: 'premium' },
  // STREAMING expansion (18 new)
  { name: 'Neewer', normalizedName: 'neewer', aliases: [], category: 'streaming', tier: 'value' },
  { name: 'Blackmagic Design', normalizedName: 'blackmagicdesign', aliases: ['blackmagic', 'bmd', 'bmpcc'], category: 'streaming', tier: 'premium' },
  { name: 'AVerMedia', normalizedName: 'avermedia', aliases: ['aver media', 'avermedia live gamer'], category: 'streaming', tier: 'mid' },
  { name: 'Hollyland', normalizedName: 'hollyland', aliases: ['hollyland mars', 'hollyland lark'], category: 'streaming', tier: 'mid' },
  { name: 'Lume Cube', normalizedName: 'lumecube', aliases: ['lumecube'], category: 'streaming', tier: 'mid' },
  { name: 'Audio-Technica', normalizedName: 'audiotechnica', aliases: ['audio technica', 'at', 'a-t'], category: 'streaming', tier: 'premium' },
  { name: 'Blue Microphones', normalizedName: 'bluemicrophones', aliases: ['blue', 'blue yeti', 'blue snowball'], category: 'streaming', tier: 'mid' },
  { name: 'GoXLR', normalizedName: 'goxlr', aliases: ['go xlr', 'tc helicon goxlr'], category: 'streaming', tier: 'premium' },
  { name: 'Stream Deck', normalizedName: 'streamdeck', aliases: ['elgato stream deck'], category: 'streaming', tier: 'premium' },
  { name: 'OBSBOT', normalizedName: 'obsbot', aliases: ['obs bot', 'obsbot tiny', 'obsbot tail'], category: 'streaming', tier: 'mid' },
  { name: 'Sony Alpha', normalizedName: 'sonyalpha', aliases: ['sony a7', 'sony a6', 'sony alpha'], category: 'streaming', tier: 'luxury' },
  { name: 'Canon EOS', normalizedName: 'canoneos', aliases: ['canon', 'canon eos r', 'canon dslr'], category: 'streaming', tier: 'premium' },
  { name: 'Logitech StreamCam', normalizedName: 'logitechstreamcam', aliases: ['streamcam', 'logitech brio'], category: 'streaming', tier: 'mid' },
  { name: 'Razer Kiyo', normalizedName: 'razerkiyo', aliases: ['kiyo', 'razer kiyo pro'], category: 'streaming', tier: 'mid' },
  { name: 'Elgato Key Light', normalizedName: 'elgatokeylight', aliases: ['key light', 'key light air', 'key light mini'], category: 'streaming', tier: 'premium' },
  { name: 'Aputure', normalizedName: 'aputure', aliases: ['aputure amaran', 'amaran'], category: 'streaming', tier: 'premium' },
  { name: 'Deity', normalizedName: 'deity', aliases: ['deity microphones', 'deity v-mic'], category: 'streaming', tier: 'mid' },
  { name: 'Magewell', normalizedName: 'magewell', aliases: ['magewell capture'], category: 'streaming', tier: 'premium' },
  // SUPPLEMENTS expansion (23 new)
  { name: 'Vital Proteins', normalizedName: 'vital proteins', aliases: ['vitalproteins', 'vital-proteins'], category: 'supplements', tier: 'premium' },
  { name: 'Seed', normalizedName: 'seed', aliases: ['seed health', 'seed probiotic', 'seed ds-01'], category: 'supplements', tier: 'premium' },
  { name: 'LMNT', normalizedName: 'lmnt', aliases: ['element', 'lmnt electrolytes', 'drink lmnt'], category: 'supplements', tier: 'premium' },
  { name: 'Liquid I.V.', normalizedName: 'liquid i.v.', aliases: ['liquid iv', 'liquidiv', 'liquid-iv'], category: 'supplements', tier: 'mid' },
  { name: 'Olly', normalizedName: 'olly', aliases: ['olly vitamins', 'olly nutrition'], category: 'supplements', tier: 'mid' },
  { name: 'SmartyPants', normalizedName: 'smartypants', aliases: ['smarty pants', 'smarty-pants'], category: 'supplements', tier: 'mid' },
  { name: 'Nordic Naturals', normalizedName: 'nordic naturals', aliases: ['nordicnaturals', 'nordic-naturals'], category: 'supplements', tier: 'premium' },
  { name: 'MusclePharm', normalizedName: 'musclepharm', aliases: ['muscle pharm', 'muscle-pharm', 'mp'], category: 'supplements', tier: 'mid' },
  { name: 'BSN', normalizedName: 'bsn', aliases: ['bio-engineered supplements', 'bsn nutrition'], category: 'supplements', tier: 'mid' },
  { name: 'Ghost Lifestyle', normalizedName: 'ghost lifestyle', aliases: ['ghost', 'ghost supplements', 'ghost energy'], category: 'supplements', tier: 'premium' },
  { name: 'Alani Nu', normalizedName: 'alani nu', aliases: ['alaninu', 'alani-nu', 'alani'], category: 'supplements', tier: 'premium' },
  { name: 'Bloom Nutrition', normalizedName: 'bloom nutrition', aliases: ['bloom', 'bloom greens', 'bloom supplements'], category: 'supplements', tier: 'mid' },
  { name: 'Athletic Greens', normalizedName: 'athletic greens', aliases: ['athleticgreens', 'athletic-greens'], category: 'supplements', tier: 'premium' },
  { name: 'Onnit', normalizedName: 'onnit', aliases: ['onnit supplements', 'onnit alpha brain'], category: 'supplements', tier: 'premium' },
  { name: 'Four Sigmatic', normalizedName: 'four sigmatic', aliases: ['foursigmatic', 'four-sigmatic', '4 sigmatic'], category: 'supplements', tier: 'premium' },
  { name: 'Cellucor', normalizedName: 'cellucor', aliases: ['cellucor c4', 'c4 energy'], category: 'supplements', tier: 'mid' },
  { name: 'Dymatize', normalizedName: 'dymatize', aliases: ['dymatize nutrition', 'dymatize iso100'], category: 'supplements', tier: 'mid' },
  { name: 'Nature Made', normalizedName: 'nature made', aliases: ['naturemade', 'nature-made'], category: 'supplements', tier: 'value' },
  { name: 'Orgain', normalizedName: 'orgain', aliases: ['orgain protein', 'orgain organic'], category: 'supplements', tier: 'mid' },
  { name: 'Vega', normalizedName: 'vega', aliases: ['vega sport', 'vega protein', 'vega one'], category: 'supplements', tier: 'mid' },
  { name: 'Jocko Fuel', normalizedName: 'jocko fuel', aliases: ['jocko', 'jockofuel', 'jocko supplements'], category: 'supplements', tier: 'premium' },
  { name: 'Designs for Health', normalizedName: 'designs for health', aliases: ['dfh', 'designs-for-health'], category: 'supplements', tier: 'premium' },
  { name: 'Pure Encapsulations', normalizedName: 'pure encapsulations', aliases: ['pureencapsulations', 'pure-encapsulations'], category: 'supplements', tier: 'premium' },
  // WEARABLES expansion (13 new)
  { name: 'Fitbit', normalizedName: 'fitbit', aliases: ['fitbit'], category: 'wearables', tier: 'mid' },
  { name: 'Samsung Galaxy Watch', normalizedName: 'samsung galaxy watch', aliases: ['galaxy watch', 'samsung watch', 'samsung galaxy watch'], category: 'wearables', tier: 'premium' },
  { name: 'Polar', normalizedName: 'polar', aliases: ['polar', 'polar watch'], category: 'wearables', tier: 'mid' },
  { name: 'Suunto', normalizedName: 'suunto', aliases: ['suunto'], category: 'wearables', tier: 'premium' },
  { name: 'Amazfit', normalizedName: 'amazfit', aliases: ['amazfit'], category: 'wearables', tier: 'value' },
  { name: 'Withings', normalizedName: 'withings', aliases: ['withings', 'withings scanwatch'], category: 'wearables', tier: 'premium' },
  { name: 'Google Pixel Watch', normalizedName: 'google pixel watch', aliases: ['pixel watch', 'google pixel watch'], category: 'wearables', tier: 'premium' },
  { name: 'Biostrap', normalizedName: 'biostrap', aliases: ['biostrap'], category: 'wearables', tier: 'premium' },
  { name: 'Xiaomi Mi Band', normalizedName: 'xiaomi mi band', aliases: ['mi band', 'xiaomi band', 'xiaomi mi band'], category: 'wearables', tier: 'value' },
  { name: 'Huawei Watch', normalizedName: 'huawei watch', aliases: ['huawei watch', 'huawei band'], category: 'wearables', tier: 'mid' },
  { name: 'Movboi', normalizedName: 'movboi', aliases: ['movboi', 'ticwatch'], category: 'wearables', tier: 'mid' },
  { name: 'Circular Ring', normalizedName: 'circular ring', aliases: ['circular', 'circular ring'], category: 'wearables', tier: 'premium' },
  { name: 'Ultrahuman', normalizedName: 'ultrahuman', aliases: ['ultrahuman', 'ultrahuman ring'], category: 'wearables', tier: 'premium' },
];

export const BRAND_DICTIONARY: BrandEntry[] = [...BRAND_DICTIONARY_CORE, ...BRAND_DICTIONARY_EXPANDED];

// Create lookup maps for fast matching
const brandByNormalized = new Map<string, BrandEntry>();
const brandByAlias = new Map<string, BrandEntry>();

for (const brand of BRAND_DICTIONARY) {
  brandByNormalized.set(brand.normalizedName, brand);
  for (const alias of brand.aliases) {
    brandByAlias.set(alias.toLowerCase(), brand);
  }
}

/**
 * Category patterns for text-based inference
 * Comprehensive keyword mapping for 50+ categories
 */
export const CATEGORY_PATTERNS: Record<Category, string[]> = {
  // Sports & Recreation
  golf: ['driver', 'iron', 'irons', 'wedge', 'putter', 'fairway', 'hybrid', 'wood', 'shaft', 'golf ball', 'grip', 'golf bag', 'glove', 'golf tee', 'headcover', 'rangefinder', 'golf shoe', 'golf cart', 'divot', 'loft'],
  tennis: ['racket', 'racquet', 'tennis ball', 'tennis shoe', 'overgrip', 'string', 'tennis bag', 'dampener'],
  basketball: ['basketball', 'hoop', 'basketball shoe', 'jersey', 'backboard'],
  soccer: ['soccer ball', 'football', 'cleat', 'shin guard', 'soccer jersey', 'goal'],
  sports: ['ball', 'racket', 'bat', 'glove', 'athletic', 'sport'],
  cycling: ['bike', 'bicycle', 'cycling', 'handlebar', 'pedal', 'derailleur', 'cassette', 'groupset', 'cycling jersey', 'bibs', 'helmet', 'saddle'],
  running: ['running shoe', 'running shorts', 'singlet', 'gps watch', 'hydration vest', 'marathon', 'jogger'],
  snow: ['ski', 'snowboard', 'binding', 'goggle', 'ski boot', 'snow jacket', 'snow pants', 'beanie', 'pow'],
  surf: ['surfboard', 'wetsuit', 'leash', 'surf wax', 'rash guard', 'boardshorts', 'fins'],
  motorcycle: ['motorcycle', 'helmet', 'riding gear', 'leather jacket', 'motorcycle boot', 'gloves'],

  // Fitness & Wellness
  fitness: ['dumbbell', 'kettlebell', 'treadmill', 'workout', 'weights', 'yoga mat', 'resistance band', 'barbell', 'squat rack', 'bench', 'rower', 'spin bike', 'massage gun', 'foam roller'],
  activewear: ['leggings', 'sports bra', 'tank top', 'compression', 'jogger', 'athletic shorts', 'workout shirt'],
  athletic: ['jersey', 'cleats', 'athletic shoe', 'performance', 'training'],
  wearables: ['fitness tracker', 'smart ring', 'activity tracker', 'heart rate monitor'],
  supplements: ['protein', 'creatine', 'pre-workout', 'vitamin', 'supplement', 'bcaa', 'collagen', 'greens powder', 'probiotic', 'omega-3'],

  // Tech & Electronics
  tech: ['phone', 'laptop', 'tablet', 'computer', 'monitor', 'keyboard', 'mouse', 'charger', 'cable', 'smartwatch', 'iphone', 'macbook', 'ipad', 'pixel', 'galaxy', 'usb'],
  audio: ['headphones', 'earbuds', 'speaker', 'soundbar', 'amplifier', 'dac', 'turntable', 'airpods', 'microphone', 'subwoofer', 'receiver'],
  gaming: ['console', 'controller', 'playstation', 'ps5', 'xbox', 'nintendo', 'switch', 'gaming headset', 'gamepad', 'gaming mouse', 'gaming keyboard', 'steam deck', 'rgb'],
  streaming: ['webcam', 'capture card', 'ring light', 'green screen', 'stream deck', 'boom arm'],
  photography: ['camera', 'lens', 'flash', 'tripod', 'drone', 'gimbal', 'filter', 'memory card', 'mirrorless', 'dslr', 'polaroid', 'instant film', 'camera bag', 'lightroom'],

  // Fashion & Apparel
  fashion: ['shirt', 'pants', 'jacket', 'dress', 'suit', 'blazer', 'coat', 'sweater', 'cardigan', 'scarf', 'tie', 'blouse', 'skirt', 'jeans', 'chinos', 'trousers'],
  apparel: ['hoodie', 'shorts', 'joggers', 'polo', 'tee', 't-shirt', 'hat', 'cap', 'belt', 'socks', 'underwear', 'boxers', 'briefs'],
  footwear: ['shoes', 'sneakers', 'boots', 'sandals', 'loafers', 'oxford', 'heels', 'flats', 'slides', 'running shoes'],
  eyewear: ['sunglasses', 'glasses', 'frames', 'lenses', 'prescription', 'reading glasses', 'blue light'],
  bags: ['bag', 'purse', 'handbag', 'tote', 'crossbody', 'backpack', 'messenger', 'clutch', 'weekender'],
  watches: ['watch', 'wristwatch', 'chronograph', 'automatic', 'mechanical', 'quartz', 'dive watch', 'dress watch', 'smartwatch'],

  // Beauty & Personal Care
  beauty: ['makeup', 'cosmetic', 'lipstick', 'eyeshadow', 'palette', 'brush set', 'bronzer', 'highlighter', 'setting spray', 'makeup bag'],
  makeup: ['lipstick', 'eyeshadow', 'foundation', 'mascara', 'blush', 'concealer', 'primer', 'palette', 'brush', 'bronzer', 'highlighter', 'eyeliner', 'lip gloss', 'contour'],
  skincare: ['serum', 'moisturizer', 'cleanser', 'toner', 'sunscreen', 'retinol', 'vitamin c', 'hyaluronic', 'face mask', 'eye cream', 'exfoliant', 'facial oil'],
  haircare: ['shampoo', 'conditioner', 'hair dryer', 'flat iron', 'curling iron', 'hair mask', 'styling', 'hairspray', 'mousse', 'diffuser'],
  grooming: ['razor', 'shaving', 'trimmer', 'beard oil', 'aftershave', 'deodorant', 'body wash', 'cologne', 'perfume', 'fragrance'],

  // Home & Living
  home: ['furniture', 'sofa', 'couch', 'chair', 'table', 'desk', 'shelf', 'lamp', 'rug', 'curtain', 'mirror', 'frame', 'vase', 'candle', 'throw pillow', 'decor'],
  kitchen: ['cookware', 'pan', 'pot', 'knife', 'cutting board', 'blender', 'mixer', 'toaster', 'coffee maker', 'espresso', 'dutch oven', 'skillet', 'spatula', 'utensil'],
  bedding: ['sheets', 'pillow', 'mattress', 'comforter', 'duvet', 'blanket', 'bedframe', 'headboard', 'mattress topper', 'pillow case'],
  office: ['desk', 'office chair', 'monitor stand', 'desk lamp', 'filing cabinet', 'standing desk', 'ergonomic', 'desk organizer', 'desk pad'],

  // Outdoor & Adventure
  outdoor: ['tent', 'sleeping bag', 'camping', 'hiking', 'cooler', 'water bottle', 'lantern', 'hammock', 'camp stove', 'backpacking', 'trekking poles', 'camp chair', 'headlamp'],
  travel: ['luggage', 'suitcase', 'carry-on', 'duffel', 'passport holder', 'packing cubes', 'travel pillow', 'toiletry bag', 'garment bag'],
  edc: ['knife', 'flashlight', 'wallet', 'pen', 'multitool', 'keychain', 'carabiner', 'pocket knife', 'everyday carry'],

  // Hobbies & Entertainment
  music: ['guitar', 'piano', 'drum', 'amp', 'amplifier', 'microphone', 'bass', 'pedal', 'synthesizer', 'midi', 'audio interface', 'studio monitor', 'ukulele', 'violin'],
  hobbies: ['model kit', 'puzzle', 'board game', 'card game', 'miniature', 'figurine', 'collectible', 'lego', 'gundam', 'warhammer'],
  art: ['paint', 'brush', 'canvas', 'pencil', 'marker', 'sketchbook', 'easel', 'watercolor', 'acrylic', 'oil paint', 'colored pencil', 'pastel'],
  books: ['book', 'novel', 'hardcover', 'paperback', 'kindle', 'e-reader', 'audiobook', 'bookshelf'],

  // Food & Beverage
  coffee: ['coffee', 'espresso', 'grinder', 'pour over', 'french press', 'aeropress', 'coffee maker', 'moka pot', 'cold brew', 'coffee beans', 'latte'],
  food: ['snack', 'gourmet', 'chocolate', 'cooking', 'ingredient', 'spice', 'sauce', 'olive oil'],
  spirits: ['whiskey', 'bourbon', 'vodka', 'tequila', 'gin', 'rum', 'wine', 'champagne', 'liquor', 'cocktail'],

  // Automotive
  automotive: ['car', 'auto', 'vehicle', 'tire', 'wheel', 'car cover', 'dash cam', 'floor mat', 'car seat', 'detailing', 'wax', 'polish', 'car wash'],

  // Family
  baby: ['stroller', 'car seat', 'crib', 'bassinet', 'high chair', 'baby carrier', 'diaper', 'baby monitor', 'bottle', 'pacifier', 'swaddle', 'nursery'],
  kids: ['toy', 'kids clothes', 'kids shoes', 'children', 'toddler', 'playroom', 'kids book'],
  pet: ['dog food', 'cat food', 'pet toy', 'leash', 'collar', 'pet bed', 'crate', 'litter', 'pet carrier', 'treats', 'harness'],

  // Health
  health: ['medicine', 'first aid', 'thermometer', 'blood pressure', 'prescription', 'otc', 'pharmacy', 'wellness'],

  // General
  retail: ['gift card', 'store', 'shop'],
  other: [],
};

/**
 * Match brand from text using dictionary
 */
export function dictionaryMatch(text: string): DictionaryMatchResult {
  const extractedComponents: ParsedComponent[] = [];
  let brand: DictionaryMatchResult['brand'] = null;
  let fuzzyCorrection: DictionaryMatchResult['fuzzyCorrection'] = null;
  let inferredCategory: Category | null = null;
  let categoryConfidence = 0;
  let remainingText = text;

  const textLower = text.toLowerCase();

  // === Try to match brand ===
  // Sort brands by name length (longer first) to match "Good Good Golf" before "Good Good"
  const sortedBrands = [...BRAND_DICTIONARY].sort((a, b) => {
    const aLen = Math.max(a.name.length, ...a.aliases.map(al => al.length));
    const bLen = Math.max(b.name.length, ...b.aliases.map(al => al.length));
    return bLen - aLen;
  });

  // Find ALL matching brands with their positions
  const brandMatches: Array<{
    brand: BrandEntry;
    matchedText: string;
    position: number;
    confidence: number;
  }> = [];

  // Helper to check word boundary (character must not be a letter)
  const isWordBoundary = (char: string) => !/[a-z]/i.test(char);

  for (const brandEntry of sortedBrands) {
    // Try normalized name
    const normalizedPos = textLower.indexOf(brandEntry.normalizedName);
    if (normalizedPos !== -1) {
      // Check word boundary - use empty string for start/end of text
      const before = normalizedPos > 0 ? textLower[normalizedPos - 1] : '';
      const afterPos = normalizedPos + brandEntry.normalizedName.length;
      const after = afterPos < textLower.length ? textLower[afterPos] : '';

      // Word boundary: at start/end of string OR previous/next char is not a letter
      const validBefore = normalizedPos === 0 || isWordBoundary(before);
      const validAfter = afterPos >= textLower.length || isWordBoundary(after);

      if (validBefore && validAfter) {
        brandMatches.push({
          brand: brandEntry,
          matchedText: text.slice(normalizedPos, normalizedPos + brandEntry.normalizedName.length),
          position: normalizedPos,
          confidence: 0.95,
        });
      }
    }

    // Try aliases
    for (const alias of brandEntry.aliases) {
      const aliasPos = textLower.indexOf(alias.toLowerCase());
      if (aliasPos !== -1) {
        const before = aliasPos > 0 ? textLower[aliasPos - 1] : '';
        const afterPos = aliasPos + alias.length;
        const after = afterPos < textLower.length ? textLower[afterPos] : '';

        const validBefore = aliasPos === 0 || isWordBoundary(before);
        const validAfter = afterPos >= textLower.length || isWordBoundary(after);

        if (validBefore && validAfter) {
          brandMatches.push({
            brand: brandEntry,
            matchedText: text.slice(aliasPos, aliasPos + alias.length),
            position: aliasPos,
            confidence: 0.9,
          });
        }
      }
    }
  }

  // === Fuzzy brand matching fallback when exact match fails ===
  if (brandMatches.length === 0) {
    // Extract contiguous word groups from the input for fuzzy matching
    const inputWords = textLower.split(/\s+/);

    let bestFuzzyMatch: {
      brand: BrandEntry;
      matchedText: string;
      position: number;
      distance: number;
    } | null = null;

    // Try single words and 2-word combinations
    for (let i = 0; i < inputWords.length; i++) {
      const candidates = [inputWords[i]];
      if (i < inputWords.length - 1) {
        candidates.push(`${inputWords[i]} ${inputWords[i + 1]}`);
      }

      for (const candidate of candidates) {
        if (candidate.length < 4) continue; // Skip short words — too many false positives at 3 chars

        for (const brandEntry of sortedBrands) {
          // Check against normalized name
          const namesToCheck = [brandEntry.normalizedName, ...brandEntry.aliases.map(a => a.toLowerCase())];

          for (const name of namesToCheck) {
            if (name.length < 4) continue;

            // Set max distance based on name length — keep tight to avoid false positives
            // (e.g. "dog" matching "rog" at distance 1 was too loose)
            const maxDist = name.length >= 8 ? 2 : 1;

            // For short words (< 6 chars), require first character match to prevent
            // common English words from fuzzy-matching brand names (e.g. "golf" → "wolf")
            if (name.length < 6 && candidate[0] !== name[0]) continue;

            const dist = levenshteinDistance(candidate, name);
            if (dist > 0 && dist <= maxDist) {
              // Better match than previous?
              if (!bestFuzzyMatch || dist < bestFuzzyMatch.distance ||
                  (dist === bestFuzzyMatch.distance && name.length > bestFuzzyMatch.matchedText.length)) {
                // Find position in original text
                const pos = textLower.indexOf(candidate);
                bestFuzzyMatch = {
                  brand: brandEntry,
                  matchedText: candidate,
                  position: pos >= 0 ? pos : 0,
                  distance: dist,
                };
              }
            }
          }
        }
      }
    }

    if (bestFuzzyMatch) {
      brandMatches.push({
        brand: bestFuzzyMatch.brand,
        matchedText: bestFuzzyMatch.matchedText,
        position: bestFuzzyMatch.position,
        confidence: 0.7, // Lower confidence for fuzzy matches
      });
    }
  }

  // If we have brand matches, pick the best one
  // Prefer: longer match > later position (last mentioned brand is often the actual brand)
  if (brandMatches.length > 0) {
    // Sort by: longer match first, then later position
    brandMatches.sort((a, b) => {
      if (b.matchedText.length !== a.matchedText.length) {
        return b.matchedText.length - a.matchedText.length;
      }
      return b.position - a.position;
    });

    const bestMatch = brandMatches[0];
    brand = {
      value: bestMatch.brand.name,
      confidence: bestMatch.confidence,
      source: 'dictionary',
    };

    // Track fuzzy correction if the matched text doesn't exactly match the brand name or aliases
    if (bestMatch.confidence <= 0.7) {
      fuzzyCorrection = {
        original: bestMatch.matchedText,
        corrected: bestMatch.brand.name,
      };
    }

    inferredCategory = bestMatch.brand.category;
    categoryConfidence = 0.9;

    extractedComponents.push({
      type: 'brand',
      value: bestMatch.brand.name,
      confidence: bestMatch.confidence,
      source: 'dictionary',
      originalText: bestMatch.matchedText,
      startIndex: bestMatch.position,
      endIndex: bestMatch.position + bestMatch.matchedText.length,
    });

    // Remove brand from remaining text
    remainingText = remainingText.slice(0, bestMatch.position) +
      remainingText.slice(bestMatch.position + bestMatch.matchedText.length);
    remainingText = remainingText.replace(/\s+/g, ' ').trim();
  }

  // === Infer category from text patterns if not already inferred ===
  if (!inferredCategory) {
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(textLower)) {
          inferredCategory = category as Category;
          categoryConfidence = 0.7;

          extractedComponents.push({
            type: 'category_hint',
            value: category,
            confidence: 0.7,
            source: 'pattern',
            originalText: pattern,
            startIndex: textLower.indexOf(pattern),
            endIndex: textLower.indexOf(pattern) + pattern.length,
          });
          break;
        }
      }
      if (inferredCategory) break;
    }
  }

  return {
    brand,
    fuzzyCorrection,
    inferredCategory,
    categoryConfidence,
    extractedComponents,
    remainingText,
  };
}

/**
 * Get a brand entry by name (for external use)
 */
export function getBrandEntry(name: string): BrandEntry | null {
  const normalized = name.toLowerCase().trim();
  return brandByNormalized.get(normalized) || brandByAlias.get(normalized) || null;
}

/**
 * Get all brands for a category
 */
export function getBrandsForCategory(category: Category): BrandEntry[] {
  return BRAND_DICTIONARY.filter(b => b.category === category);
}
