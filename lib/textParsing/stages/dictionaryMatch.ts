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
export const BRAND_DICTIONARY: BrandEntry[] = [
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

  // ============================================
  // HAIRCARE
  // ============================================

  { name: 'Dyson', normalizedName: 'dyson', aliases: [], category: 'haircare', tier: 'luxury' },
  { name: 'Olaplex', normalizedName: 'olaplex', aliases: [], category: 'haircare', tier: 'premium' },

  // ============================================
  // GROOMING
  // ============================================

  { name: "Harry's", normalizedName: 'harrys', aliases: ['harrys'], category: 'grooming', tier: 'mid' },
  { name: 'Billie', normalizedName: 'billie', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Native', normalizedName: 'native', aliases: [], category: 'grooming', tier: 'mid' },
  { name: 'Everist', normalizedName: 'everist', aliases: [], category: 'grooming', tier: 'premium' },
  { name: 'By Humankind', normalizedName: 'by humankind', aliases: [], category: 'grooming', tier: 'premium' },
  { name: 'Dollar Shave Club', normalizedName: 'dollar shave club', aliases: ['dsc'], category: 'grooming', tier: 'value' },

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

  // ============================================
  // SNOW SPORTS
  // ============================================

  { name: 'Burton', normalizedName: 'burton', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Lib Tech', normalizedName: 'lib tech', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Rossignol', normalizedName: 'rossignol', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Atomic', normalizedName: 'atomic', aliases: [], category: 'snow', tier: 'premium' },
  { name: 'Volcom', normalizedName: 'volcom', aliases: [], category: 'snow', tier: 'mid' },

  // ============================================
  // SURF
  // ============================================

  { name: 'Channel Islands', normalizedName: 'channel islands', aliases: [], category: 'surf', tier: 'premium' },
  { name: 'Rip Curl', normalizedName: 'rip curl', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'Quiksilver', normalizedName: 'quiksilver', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'Billabong', normalizedName: 'billabong', aliases: [], category: 'surf', tier: 'mid' },
  { name: 'Hurley', normalizedName: 'hurley', aliases: [], category: 'surf', tier: 'mid' },

  // ============================================
  // TENNIS & RACQUET SPORTS
  // ============================================

  { name: 'Babolat', normalizedName: 'babolat', aliases: [], category: 'tennis', tier: 'premium' },
  { name: 'Head', normalizedName: 'head', aliases: [], category: 'sports', tier: 'premium' },
  { name: 'Yonex', normalizedName: 'yonex', aliases: [], category: 'sports', tier: 'premium' },

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
const CATEGORY_PATTERNS: Record<Category, string[]> = {
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
        if (candidate.length < 3) continue; // Skip very short words

        for (const brandEntry of sortedBrands) {
          // Check against normalized name
          const namesToCheck = [brandEntry.normalizedName, ...brandEntry.aliases.map(a => a.toLowerCase())];

          for (const name of namesToCheck) {
            if (name.length < 3) continue;

            // Set max distance based on name length
            const maxDist = name.length >= 6 ? 2 : name.length >= 3 ? 1 : 0;
            if (maxDist === 0) continue;

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
