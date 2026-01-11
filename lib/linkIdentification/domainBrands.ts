/**
 * Comprehensive Domain-to-Brand Database
 *
 * This is the foundation of URL Intelligence - mapping domains to brands,
 * categories, and related metadata without any network requests.
 */

export interface DomainBrandInfo {
  brand: string | null;  // null for retailers (brand comes from product)
  category: string;
  tier: 'luxury' | 'premium' | 'mid' | 'value';
  aliases: string[];
  isRetailer: boolean;
  productPatterns?: RegExp[];  // Patterns to extract product info from URL
}

/**
 * Comprehensive domain-to-brand mapping
 * Organized by category for easier maintenance
 */
export const DOMAIN_BRAND_MAP: Record<string, DomainBrandInfo> = {
  // ============================================
  // GOLF BRANDS
  // ============================================

  // Luxury Golf
  'gfore.com': { brand: 'G/FORE', category: 'golf', tier: 'luxury', aliases: ['G/Fore', 'GFORE', 'G-Fore'], isRetailer: false },
  'gforegolf.com': { brand: 'G/FORE', category: 'golf', tier: 'luxury', aliases: ['G/Fore'], isRetailer: false },
  'pxg.com': { brand: 'PXG', category: 'golf', tier: 'luxury', aliases: ['Parsons Xtreme Golf'], isRetailer: false },
  'scottycameron.com': { brand: 'Scotty Cameron', category: 'golf', tier: 'luxury', aliases: ['Titleist Scotty Cameron'], isRetailer: false },
  'bettinardi.com': { brand: 'Bettinardi', category: 'golf', tier: 'luxury', aliases: [], isRetailer: false },
  'mirabellagolf.com': { brand: 'Miura', category: 'golf', tier: 'luxury', aliases: ['Miura Golf'], isRetailer: false },
  'miuragolf.com': { brand: 'Miura', category: 'golf', tier: 'luxury', aliases: [], isRetailer: false },
  'honmagolf.com': { brand: 'Honma', category: 'golf', tier: 'luxury', aliases: ['HONMA'], isRetailer: false },
  'vessel.com': { brand: 'Vessel', category: 'golf', tier: 'luxury', aliases: ['Vessel Bags'], isRetailer: false },
  'jonessportsco.com': { brand: 'Jones Sports Co', category: 'golf', tier: 'luxury', aliases: ['Jones Golf'], isRetailer: false },
  'stitch.golf': { brand: 'Stitch Golf', category: 'golf', tier: 'luxury', aliases: ['Stitch'], isRetailer: false },
  'linksoul.com': { brand: 'Linksoul', category: 'golf', tier: 'luxury', aliases: [], isRetailer: false },

  // Premium Golf Equipment
  'taylormadegolf.com': { brand: 'TaylorMade', category: 'golf', tier: 'premium', aliases: ['TMaG'], isRetailer: false },
  'callawaygolf.com': { brand: 'Callaway', category: 'golf', tier: 'premium', aliases: [], isRetailer: false },
  'titleist.com': { brand: 'Titleist', category: 'golf', tier: 'premium', aliases: ['Acushnet'], isRetailer: false },
  'vokey.com': { brand: 'Vokey', category: 'golf', tier: 'premium', aliases: ['Titleist Vokey', 'Vokey Design'], isRetailer: false },
  'ping.com': { brand: 'PING', category: 'golf', tier: 'premium', aliases: [], isRetailer: false },
  'clevelandgolf.com': { brand: 'Cleveland', category: 'golf', tier: 'premium', aliases: ['Cleveland Golf'], isRetailer: false },
  'mizunogolf.com': { brand: 'Mizuno', category: 'golf', tier: 'premium', aliases: [], isRetailer: false },
  'mizunousa.com': { brand: 'Mizuno', category: 'golf', tier: 'premium', aliases: [], isRetailer: false },
  'srixon.com': { brand: 'Srixon', category: 'golf', tier: 'premium', aliases: [], isRetailer: false },
  'dunlopsports.com': { brand: 'Srixon', category: 'golf', tier: 'premium', aliases: ['Dunlop'], isRetailer: false },
  'cobragolf.com': { brand: 'Cobra', category: 'golf', tier: 'premium', aliases: ['Cobra Golf', 'Cobra Puma Golf'], isRetailer: false },
  'bridgestonegolf.com': { brand: 'Bridgestone', category: 'golf', tier: 'premium', aliases: ['Bridgestone Golf'], isRetailer: false },
  'wilsonsgolf.com': { brand: 'Wilson', category: 'golf', tier: 'premium', aliases: ['Wilson Golf', 'Wilson Staff'], isRetailer: false },
  'wilson.com': { brand: 'Wilson', category: 'golf', tier: 'premium', aliases: ['Wilson Sporting Goods'], isRetailer: false },
  'xxio-golf.com': { brand: 'XXIO', category: 'golf', tier: 'premium', aliases: [], isRetailer: false },

  // Golf Apparel & Footwear
  'footjoy.com': { brand: 'FootJoy', category: 'golf', tier: 'premium', aliases: ['FJ'], isRetailer: false },
  'travismathew.com': { brand: 'TravisMathew', category: 'golf', tier: 'premium', aliases: ['Travis Mathew'], isRetailer: false },
  'pumagolf.com': { brand: 'Puma Golf', category: 'golf', tier: 'premium', aliases: ['Puma', 'Cobra Puma'], isRetailer: false },
  'nike.com': { brand: 'Nike', category: 'apparel', tier: 'premium', aliases: [], isRetailer: false },
  'adidas.com': { brand: 'adidas', category: 'apparel', tier: 'premium', aliases: ['Adidas'], isRetailer: false },
  'adidasgolf.com': { brand: 'adidas Golf', category: 'golf', tier: 'premium', aliases: ['Adidas Golf'], isRetailer: false },
  'underarmour.com': { brand: 'Under Armour', category: 'apparel', tier: 'premium', aliases: ['UA'], isRetailer: false },
  'greysonclothiers.com': { brand: 'Greyson', category: 'golf', tier: 'luxury', aliases: ['Greyson Clothiers'], isRetailer: false },
  'bonobos.com': { brand: 'Bonobos', category: 'apparel', tier: 'premium', aliases: [], isRetailer: false },
  'petermillar.com': { brand: 'Peter Millar', category: 'golf', tier: 'luxury', aliases: [], isRetailer: false },
  'kjus.com': { brand: 'KJUS', category: 'golf', tier: 'luxury', aliases: [], isRetailer: false },
  'rlx.com': { brand: 'RLX Ralph Lauren', category: 'golf', tier: 'luxury', aliases: ['RLX', 'Ralph Lauren Golf'], isRetailer: false },
  'johnnie-o.com': { brand: 'Johnnie-O', category: 'golf', tier: 'premium', aliases: ['Johnnie O'], isRetailer: false },
  'dunning.com': { brand: 'Dunning', category: 'golf', tier: 'premium', aliases: ['Dunning Golf'], isRetailer: false },
  'badbirdie.com': { brand: 'Bad Birdie', category: 'golf', tier: 'mid', aliases: [], isRetailer: false },
  'swannies.co': { brand: 'Swannies', category: 'golf', tier: 'mid', aliases: [], isRetailer: false },
  'eastsidefgc.com': { brand: 'Eastside Golf', category: 'golf', tier: 'premium', aliases: [], isRetailer: false },
  'malaborlabs.com': { brand: 'Malbon Golf', category: 'golf', tier: 'luxury', aliases: ['Malbon'], isRetailer: false },
  'malbongolf.com': { brand: 'Malbon Golf', category: 'golf', tier: 'luxury', aliases: ['Malbon'], isRetailer: false },
  'melin.com': { brand: 'melin', category: 'golf', tier: 'luxury', aliases: ['Melin'], isRetailer: false },

  // Golf Tech & Rangefinders
  'bushnellgolf.com': { brand: 'Bushnell', category: 'golf', tier: 'premium', aliases: ['Bushnell Golf'], isRetailer: false },
  'garmin.com': { brand: 'Garmin', category: 'tech', tier: 'premium', aliases: [], isRetailer: false },
  'shotscope.com': { brand: 'Shot Scope', category: 'golf', tier: 'mid', aliases: [], isRetailer: false },
  'voicecaddie.com': { brand: 'Voice Caddie', category: 'golf', tier: 'mid', aliases: [], isRetailer: false },
  'arccosgolf.com': { brand: 'Arccos', category: 'golf', tier: 'premium', aliases: ['Arccos Golf'], isRetailer: false },

  // Golf Retailers
  'pgatoursuperstore.com': { brand: null, category: 'golf', tier: 'mid', aliases: [], isRetailer: true },
  'golfgalaxy.com': { brand: null, category: 'golf', tier: 'mid', aliases: [], isRetailer: true },
  'dickssportinggoods.com': { brand: null, category: 'golf', tier: 'mid', aliases: ["Dick's"], isRetailer: true },
  '2ndswing.com': { brand: null, category: 'golf', tier: 'value', aliases: ['2nd Swing'], isRetailer: true },
  'globalgolf.com': { brand: null, category: 'golf', tier: 'value', aliases: [], isRetailer: true },
  'rockbottomgolf.com': { brand: null, category: 'golf', tier: 'value', aliases: [], isRetailer: true },
  'budgetgolf.com': { brand: null, category: 'golf', tier: 'value', aliases: [], isRetailer: true },
  'carlsgolfland.com': { brand: null, category: 'golf', tier: 'mid', aliases: ["Carl's Golfland"], isRetailer: true },
  'fairwaygolfusa.com': { brand: null, category: 'golf', tier: 'mid', aliases: ['Fairway Golf'], isRetailer: true },
  'tgw.com': { brand: null, category: 'golf', tier: 'mid', aliases: ['The Golf Warehouse'], isRetailer: true },
  'golfdiscount.com': { brand: null, category: 'golf', tier: 'value', aliases: [], isRetailer: true },

  // ============================================
  // TECH & ELECTRONICS
  // ============================================

  'apple.com': { brand: 'Apple', category: 'tech', tier: 'premium', aliases: [], isRetailer: false },
  'store.apple.com': { brand: 'Apple', category: 'tech', tier: 'premium', aliases: [], isRetailer: false },
  'samsung.com': { brand: 'Samsung', category: 'tech', tier: 'premium', aliases: [], isRetailer: false },
  'sony.com': { brand: 'Sony', category: 'tech', tier: 'premium', aliases: [], isRetailer: false },
  'bose.com': { brand: 'Bose', category: 'audio', tier: 'premium', aliases: [], isRetailer: false },
  'sonos.com': { brand: 'Sonos', category: 'audio', tier: 'premium', aliases: [], isRetailer: false },
  'bang-olufsen.com': { brand: 'Bang & Olufsen', category: 'audio', tier: 'luxury', aliases: ['B&O'], isRetailer: false },
  'sennheiser.com': { brand: 'Sennheiser', category: 'audio', tier: 'premium', aliases: [], isRetailer: false },
  'audio-technica.com': { brand: 'Audio-Technica', category: 'audio', tier: 'premium', aliases: [], isRetailer: false },
  'jbl.com': { brand: 'JBL', category: 'audio', tier: 'mid', aliases: [], isRetailer: false },
  'beatsbydre.com': { brand: 'Beats', category: 'audio', tier: 'premium', aliases: ['Beats by Dre'], isRetailer: false },
  'skullcandy.com': { brand: 'Skullcandy', category: 'audio', tier: 'mid', aliases: [], isRetailer: false },
  'logitech.com': { brand: 'Logitech', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },
  'razer.com': { brand: 'Razer', category: 'gaming', tier: 'premium', aliases: [], isRetailer: false },
  'corsair.com': { brand: 'Corsair', category: 'gaming', tier: 'premium', aliases: [], isRetailer: false },
  'steelseries.com': { brand: 'SteelSeries', category: 'gaming', tier: 'premium', aliases: [], isRetailer: false },
  'hyperx.com': { brand: 'HyperX', category: 'gaming', tier: 'mid', aliases: [], isRetailer: false },
  'anker.com': { brand: 'Anker', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },
  'belkin.com': { brand: 'Belkin', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },
  'dell.com': { brand: 'Dell', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },
  'hp.com': { brand: 'HP', category: 'tech', tier: 'mid', aliases: ['Hewlett-Packard'], isRetailer: false },
  'lenovo.com': { brand: 'Lenovo', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },
  'asus.com': { brand: 'ASUS', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },
  'msi.com': { brand: 'MSI', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },
  'microsoft.com': { brand: 'Microsoft', category: 'tech', tier: 'premium', aliases: [], isRetailer: false },
  'google.com': { brand: 'Google', category: 'tech', tier: 'premium', aliases: [], isRetailer: false },
  'store.google.com': { brand: 'Google', category: 'tech', tier: 'premium', aliases: [], isRetailer: false },
  'oneplus.com': { brand: 'OnePlus', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },
  'nothing.tech': { brand: 'Nothing', category: 'tech', tier: 'mid', aliases: [], isRetailer: false },

  // Tech Retailers
  'bestbuy.com': { brand: null, category: 'tech', tier: 'mid', aliases: ['Best Buy'], isRetailer: true },
  'bhphotovideo.com': { brand: null, category: 'tech', tier: 'mid', aliases: ['B&H Photo'], isRetailer: true },
  'adorama.com': { brand: null, category: 'tech', tier: 'mid', aliases: [], isRetailer: true },
  'newegg.com': { brand: null, category: 'tech', tier: 'value', aliases: [], isRetailer: true },
  'microcenter.com': { brand: null, category: 'tech', tier: 'mid', aliases: ['Micro Center'], isRetailer: true },

  // ============================================
  // OUTDOOR & CAMPING
  // ============================================

  'patagonia.com': { brand: 'Patagonia', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'arcteryx.com': { brand: "Arc'teryx", category: 'outdoor', tier: 'luxury', aliases: ['Arcteryx'], isRetailer: false },
  'thenorthface.com': { brand: 'The North Face', category: 'outdoor', tier: 'premium', aliases: ['TNF', 'North Face'], isRetailer: false },
  'blackdiamondequipment.com': { brand: 'Black Diamond', category: 'outdoor', tier: 'premium', aliases: ['BD'], isRetailer: false },
  'marmot.com': { brand: 'Marmot', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'mountainhardwear.com': { brand: 'Mountain Hardwear', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'osprey.com': { brand: 'Osprey', category: 'outdoor', tier: 'premium', aliases: ['Osprey Packs'], isRetailer: false },
  'gregorypacks.com': { brand: 'Gregory', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'kelty.com': { brand: 'Kelty', category: 'outdoor', tier: 'mid', aliases: [], isRetailer: false },
  'bigagnes.com': { brand: 'Big Agnes', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'nemoequipment.com': { brand: 'NEMO', category: 'outdoor', tier: 'premium', aliases: ['NEMO Equipment'], isRetailer: false },
  'msrgear.com': { brand: 'MSR', category: 'outdoor', tier: 'premium', aliases: ['Mountain Safety Research'], isRetailer: false },
  'seatosummit.com': { brand: 'Sea to Summit', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'jetboil.com': { brand: 'Jetboil', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'snowpeak.com': { brand: 'Snow Peak', category: 'outdoor', tier: 'luxury', aliases: [], isRetailer: false },
  'yeti.com': { brand: 'YETI', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'hydroflask.com': { brand: 'Hydro Flask', category: 'outdoor', tier: 'mid', aliases: [], isRetailer: false },
  'stanley1913.com': { brand: 'Stanley', category: 'outdoor', tier: 'mid', aliases: [], isRetailer: false },
  'cotopaxi.com': { brand: 'Cotopaxi', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'columbia.com': { brand: 'Columbia', category: 'outdoor', tier: 'mid', aliases: ['Columbia Sportswear'], isRetailer: false },
  'salomon.com': { brand: 'Salomon', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'merrell.com': { brand: 'Merrell', category: 'outdoor', tier: 'mid', aliases: [], isRetailer: false },
  'vasque.com': { brand: 'Vasque', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'obozfootwear.com': { brand: 'Oboz', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'la-sportiva.com': { brand: 'La Sportiva', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },
  'scarpa.com': { brand: 'Scarpa', category: 'outdoor', tier: 'premium', aliases: [], isRetailer: false },

  // Outdoor Retailers
  'rei.com': { brand: null, category: 'outdoor', tier: 'premium', aliases: ['REI Co-op'], isRetailer: true },
  'backcountry.com': { brand: null, category: 'outdoor', tier: 'premium', aliases: [], isRetailer: true },
  'moosejaw.com': { brand: null, category: 'outdoor', tier: 'mid', aliases: [], isRetailer: true },
  'ems.com': { brand: null, category: 'outdoor', tier: 'mid', aliases: ['Eastern Mountain Sports'], isRetailer: true },
  'campsaver.com': { brand: null, category: 'outdoor', tier: 'mid', aliases: [], isRetailer: true },

  // ============================================
  // PHOTOGRAPHY & CAMERAS
  // ============================================

  'canon.com': { brand: 'Canon', category: 'photography', tier: 'premium', aliases: [], isRetailer: false },
  'usa.canon.com': { brand: 'Canon', category: 'photography', tier: 'premium', aliases: [], isRetailer: false },
  'nikon.com': { brand: 'Nikon', category: 'photography', tier: 'premium', aliases: [], isRetailer: false },
  'nikonusa.com': { brand: 'Nikon', category: 'photography', tier: 'premium', aliases: [], isRetailer: false },
  // 'sony.com' is already defined in Tech section
  'fujifilm.com': { brand: 'Fujifilm', category: 'photography', tier: 'premium', aliases: ['Fuji'], isRetailer: false },
  'fujifilm-x.com': { brand: 'Fujifilm', category: 'photography', tier: 'premium', aliases: ['Fuji X'], isRetailer: false },
  'panasonic.com': { brand: 'Panasonic', category: 'photography', tier: 'premium', aliases: ['Lumix'], isRetailer: false },
  'leica-camera.com': { brand: 'Leica', category: 'photography', tier: 'luxury', aliases: [], isRetailer: false },
  'hasselblad.com': { brand: 'Hasselblad', category: 'photography', tier: 'luxury', aliases: [], isRetailer: false },
  'dji.com': { brand: 'DJI', category: 'photography', tier: 'premium', aliases: [], isRetailer: false },
  'gopro.com': { brand: 'GoPro', category: 'photography', tier: 'premium', aliases: [], isRetailer: false },
  'insta360.com': { brand: 'Insta360', category: 'photography', tier: 'mid', aliases: [], isRetailer: false },
  'peakdesign.com': { brand: 'Peak Design', category: 'photography', tier: 'premium', aliases: [], isRetailer: false },
  'manfrotto.com': { brand: 'Manfrotto', category: 'photography', tier: 'premium', aliases: [], isRetailer: false },
  'gitzo.com': { brand: 'Gitzo', category: 'photography', tier: 'luxury', aliases: [], isRetailer: false },
  'lowepro.com': { brand: 'Lowepro', category: 'photography', tier: 'mid', aliases: [], isRetailer: false },
  'thinktankphoto.com': { brand: 'Think Tank', category: 'photography', tier: 'premium', aliases: ['Think Tank Photo'], isRetailer: false },
  'profoto.com': { brand: 'Profoto', category: 'photography', tier: 'luxury', aliases: [], isRetailer: false },
  'godox.com': { brand: 'Godox', category: 'photography', tier: 'mid', aliases: [], isRetailer: false },

  // ============================================
  // FOOTWEAR
  // ============================================

  'ecco.com': { brand: 'ECCO', category: 'footwear', tier: 'premium', aliases: [], isRetailer: false },
  'allbirds.com': { brand: 'Allbirds', category: 'footwear', tier: 'premium', aliases: [], isRetailer: false },
  'newbalance.com': { brand: 'New Balance', category: 'footwear', tier: 'premium', aliases: ['NB'], isRetailer: false },
  'asics.com': { brand: 'ASICS', category: 'footwear', tier: 'premium', aliases: [], isRetailer: false },
  'hoka.com': { brand: 'HOKA', category: 'footwear', tier: 'premium', aliases: ['Hoka One One'], isRetailer: false },
  'brooksrunning.com': { brand: 'Brooks', category: 'footwear', tier: 'premium', aliases: ['Brooks Running'], isRetailer: false },
  'saucony.com': { brand: 'Saucony', category: 'footwear', tier: 'premium', aliases: [], isRetailer: false },
  'on-running.com': { brand: 'On', category: 'footwear', tier: 'premium', aliases: ['On Running', 'On Cloud'], isRetailer: false },
  'vans.com': { brand: 'Vans', category: 'footwear', tier: 'mid', aliases: [], isRetailer: false },
  'converse.com': { brand: 'Converse', category: 'footwear', tier: 'mid', aliases: [], isRetailer: false },
  'birkenstock.com': { brand: 'Birkenstock', category: 'footwear', tier: 'premium', aliases: [], isRetailer: false },
  'clarks.com': { brand: 'Clarks', category: 'footwear', tier: 'mid', aliases: [], isRetailer: false },
  'colehaan.com': { brand: 'Cole Haan', category: 'footwear', tier: 'premium', aliases: [], isRetailer: false },
  'allenedmonds.com': { brand: 'Allen Edmonds', category: 'footwear', tier: 'luxury', aliases: [], isRetailer: false },

  // ============================================
  // FASHION & LUXURY
  // ============================================

  'gucci.com': { brand: 'Gucci', category: 'fashion', tier: 'luxury', aliases: [], isRetailer: false },
  'louisvuitton.com': { brand: 'Louis Vuitton', category: 'fashion', tier: 'luxury', aliases: ['LV'], isRetailer: false },
  'prada.com': { brand: 'Prada', category: 'fashion', tier: 'luxury', aliases: [], isRetailer: false },
  'hermes.com': { brand: 'Hermès', category: 'fashion', tier: 'luxury', aliases: ['Hermes'], isRetailer: false },
  'chanel.com': { brand: 'Chanel', category: 'fashion', tier: 'luxury', aliases: [], isRetailer: false },
  'dior.com': { brand: 'Dior', category: 'fashion', tier: 'luxury', aliases: ['Christian Dior'], isRetailer: false },
  'burberry.com': { brand: 'Burberry', category: 'fashion', tier: 'luxury', aliases: [], isRetailer: false },
  'balenciaga.com': { brand: 'Balenciaga', category: 'fashion', tier: 'luxury', aliases: [], isRetailer: false },
  'bottegaveneta.com': { brand: 'Bottega Veneta', category: 'fashion', tier: 'luxury', aliases: [], isRetailer: false },
  'loewe.com': { brand: 'Loewe', category: 'fashion', tier: 'luxury', aliases: [], isRetailer: false },
  'ralphlauren.com': { brand: 'Ralph Lauren', category: 'fashion', tier: 'premium', aliases: ['Polo'], isRetailer: false },
  'tommyhilfiger.com': { brand: 'Tommy Hilfiger', category: 'fashion', tier: 'mid', aliases: [], isRetailer: false },
  'calvinklein.com': { brand: 'Calvin Klein', category: 'fashion', tier: 'mid', aliases: ['CK'], isRetailer: false },
  'hugoboss.com': { brand: 'Hugo Boss', category: 'fashion', tier: 'premium', aliases: ['Boss'], isRetailer: false },
  'jcrew.com': { brand: 'J.Crew', category: 'fashion', tier: 'mid', aliases: [], isRetailer: false },
  'brooksbrothers.com': { brand: 'Brooks Brothers', category: 'fashion', tier: 'premium', aliases: [], isRetailer: false },
  'theory.com': { brand: 'Theory', category: 'fashion', tier: 'premium', aliases: [], isRetailer: false },
  'apc.fr': { brand: 'A.P.C.', category: 'fashion', tier: 'premium', aliases: ['APC'], isRetailer: false },
  'acnestudios.com': { brand: 'Acne Studios', category: 'fashion', tier: 'luxury', aliases: [], isRetailer: false },

  // Fashion Retailers
  'nordstrom.com': { brand: null, category: 'fashion', tier: 'premium', aliases: [], isRetailer: true },
  'ssense.com': { brand: null, category: 'fashion', tier: 'luxury', aliases: [], isRetailer: true },
  'mrporter.com': { brand: null, category: 'fashion', tier: 'luxury', aliases: ['Mr Porter'], isRetailer: true },
  'net-a-porter.com': { brand: null, category: 'fashion', tier: 'luxury', aliases: ['Net-a-Porter'], isRetailer: true },
  'farfetch.com': { brand: null, category: 'fashion', tier: 'luxury', aliases: [], isRetailer: true },
  'matchesfashion.com': { brand: null, category: 'fashion', tier: 'luxury', aliases: ['Matches'], isRetailer: true },
  'endclothing.com': { brand: null, category: 'fashion', tier: 'premium', aliases: ['END.'], isRetailer: true },
  'hbx.com': { brand: null, category: 'fashion', tier: 'premium', aliases: ['Hypebeast'], isRetailer: true },

  // ============================================
  // EDC & ACCESSORIES
  // ============================================

  'benchmade.com': { brand: 'Benchmade', category: 'edc', tier: 'premium', aliases: [], isRetailer: false },
  'spyderco.com': { brand: 'Spyderco', category: 'edc', tier: 'premium', aliases: [], isRetailer: false },
  'kershaw.kaiusa.com': { brand: 'Kershaw', category: 'edc', tier: 'mid', aliases: [], isRetailer: false },
  'crkt.com': { brand: 'CRKT', category: 'edc', tier: 'mid', aliases: ['Columbia River Knife & Tool'], isRetailer: false },
  'leatherman.com': { brand: 'Leatherman', category: 'edc', tier: 'premium', aliases: [], isRetailer: false },
  'gerbergear.com': { brand: 'Gerber', category: 'edc', tier: 'mid', aliases: [], isRetailer: false },
  'victorinox.com': { brand: 'Victorinox', category: 'edc', tier: 'premium', aliases: ['Swiss Army'], isRetailer: false },
  'olight.com': { brand: 'Olight', category: 'edc', tier: 'mid', aliases: [], isRetailer: false },
  'fenixlighting.com': { brand: 'Fenix', category: 'edc', tier: 'mid', aliases: [], isRetailer: false },
  'surefire.com': { brand: 'SureFire', category: 'edc', tier: 'premium', aliases: [], isRetailer: false },
  'streamlight.com': { brand: 'Streamlight', category: 'edc', tier: 'mid', aliases: [], isRetailer: false },
  'ridge.com': { brand: 'The Ridge', category: 'edc', tier: 'premium', aliases: ['Ridge Wallet'], isRetailer: false },
  'bellroy.com': { brand: 'Bellroy', category: 'edc', tier: 'premium', aliases: [], isRetailer: false },
  'tumi.com': { brand: 'Tumi', category: 'travel', tier: 'luxury', aliases: [], isRetailer: false },
  'away.com': { brand: 'Away', category: 'travel', tier: 'premium', aliases: [], isRetailer: false },
  'briggs-riley.com': { brand: 'Briggs & Riley', category: 'travel', tier: 'premium', aliases: [], isRetailer: false },
  'rimowa.com': { brand: 'Rimowa', category: 'travel', tier: 'luxury', aliases: [], isRetailer: false },

  // ============================================
  // WATCHES
  // ============================================

  'rolex.com': { brand: 'Rolex', category: 'watches', tier: 'luxury', aliases: [], isRetailer: false },
  'omegawatches.com': { brand: 'Omega', category: 'watches', tier: 'luxury', aliases: [], isRetailer: false },
  'tagheuer.com': { brand: 'TAG Heuer', category: 'watches', tier: 'luxury', aliases: [], isRetailer: false },
  'tudorwatch.com': { brand: 'Tudor', category: 'watches', tier: 'luxury', aliases: [], isRetailer: false },
  'grandseikoboutique.com': { brand: 'Grand Seiko', category: 'watches', tier: 'luxury', aliases: [], isRetailer: false },
  'seikowatches.com': { brand: 'Seiko', category: 'watches', tier: 'mid', aliases: [], isRetailer: false },
  'citizenwatch.com': { brand: 'Citizen', category: 'watches', tier: 'mid', aliases: [], isRetailer: false },
  'tissotwatches.com': { brand: 'Tissot', category: 'watches', tier: 'mid', aliases: [], isRetailer: false },
  'hamiltonwatch.com': { brand: 'Hamilton', category: 'watches', tier: 'mid', aliases: [], isRetailer: false },
  // 'garmin.com' is already defined in Tech section

  // ============================================
  // BEAUTY & COSMETICS
  // ============================================

  // Beauty Retailers
  'sephora.com': { brand: null, category: 'beauty', tier: 'premium', aliases: [], isRetailer: true },
  'ulta.com': { brand: null, category: 'beauty', tier: 'mid', aliases: ['Ulta Beauty'], isRetailer: true },

  // Luxury Makeup
  'charlottetilbury.com': { brand: 'Charlotte Tilbury', category: 'beauty', tier: 'luxury', aliases: [], isRetailer: false },
  'maccosmetics.com': { brand: 'MAC Cosmetics', category: 'beauty', tier: 'luxury', aliases: ['MAC', 'M.A.C.'], isRetailer: false },
  'narscosmetics.com': { brand: 'NARS Cosmetics', category: 'beauty', tier: 'luxury', aliases: ['NARS'], isRetailer: false },

  // Popular Makeup Brands
  'fentybeauty.com': { brand: 'Fenty Beauty', category: 'beauty', tier: 'premium', aliases: ['Fenty'], isRetailer: false },
  'glossier.com': { brand: 'Glossier', category: 'beauty', tier: 'premium', aliases: [], isRetailer: false },
  'kyliecosmetics.com': { brand: 'Kylie Cosmetics', category: 'beauty', tier: 'premium', aliases: ['Kylie'], isRetailer: false },
  'rarebeauty.com': { brand: 'Rare Beauty', category: 'beauty', tier: 'premium', aliases: [], isRetailer: false },
  'tower28beauty.com': { brand: 'Tower 28 Beauty', category: 'beauty', tier: 'premium', aliases: ['Tower 28'], isRetailer: false },

  // Skincare
  'cerave.com': { brand: 'CeraVe', category: 'skincare', tier: 'mid', aliases: [], isRetailer: false },
  'drunkelephant.com': { brand: 'Drunk Elephant', category: 'skincare', tier: 'premium', aliases: [], isRetailer: false },
  'theordinary.com': { brand: 'The Ordinary', category: 'skincare', tier: 'value', aliases: ['Deciem'], isRetailer: false },
  'byoma.com': { brand: 'Byoma', category: 'skincare', tier: 'mid', aliases: [], isRetailer: false },
  'cetaphil.com': { brand: 'Cetaphil', category: 'skincare', tier: 'value', aliases: [], isRetailer: false },
  'rhodeskin.com': { brand: 'Rhode Skin', category: 'skincare', tier: 'premium', aliases: ['Rhode'], isRetailer: false },

  // Haircare
  'olaplex.com': { brand: 'Olaplex', category: 'haircare', tier: 'premium', aliases: [], isRetailer: false },
  'dyson.com': { brand: 'Dyson', category: 'home', tier: 'luxury', aliases: [], isRetailer: false },

  // Mass-Market Beauty
  'maybelline.com': { brand: 'Maybelline', category: 'beauty', tier: 'value', aliases: ['Maybelline New York'], isRetailer: false },
  'revlon.com': { brand: 'Revlon', category: 'beauty', tier: 'mid', aliases: [], isRetailer: false },

  // ============================================
  // HOME & FURNITURE
  // ============================================

  // Major Home Retailers
  'wayfair.com': { brand: null, category: 'home', tier: 'mid', aliases: [], isRetailer: true },
  'crateandbarrel.com': { brand: 'Crate and Barrel', category: 'home', tier: 'mid', aliases: ['Crate & Barrel'], isRetailer: true },
  'potterybarn.com': { brand: 'Pottery Barn', category: 'home', tier: 'mid', aliases: [], isRetailer: true },
  'westelm.com': { brand: 'West Elm', category: 'home', tier: 'mid', aliases: [], isRetailer: true },
  'cb2.com': { brand: 'CB2', category: 'home', tier: 'mid', aliases: [], isRetailer: true },
  'ikea.com': { brand: 'IKEA', category: 'home', tier: 'value', aliases: [], isRetailer: true },

  // Luxury Home
  'rh.com': { brand: 'Restoration Hardware', category: 'home', tier: 'luxury', aliases: ['RH'], isRetailer: true },
  'dwr.com': { brand: 'Design Within Reach', category: 'home', tier: 'luxury', aliases: ['DWR'], isRetailer: true },
  'mcgeeandco.com': { brand: 'McGee & Co.', category: 'home', tier: 'premium', aliases: [], isRetailer: false },
  'schoolhouse.com': { brand: 'Schoolhouse', category: 'home', tier: 'premium', aliases: [], isRetailer: false },
  'ethanallen.com': { brand: 'Ethan Allen', category: 'home', tier: 'premium', aliases: [], isRetailer: true },

  // Modern Furniture
  'article.com': { brand: 'Article', category: 'home', tier: 'mid', aliases: [], isRetailer: false },
  'allmodern.com': { brand: 'AllModern', category: 'home', tier: 'mid', aliases: [], isRetailer: true },
  'maidenhome.com': { brand: 'Maiden Home', category: 'home', tier: 'premium', aliases: [], isRetailer: false },

  // Kitchen & Cookware
  'williams-sonoma.com': { brand: 'Williams-Sonoma', category: 'kitchen', tier: 'premium', aliases: [], isRetailer: true },
  'surlatable.com': { brand: 'Sur La Table', category: 'kitchen', tier: 'premium', aliases: [], isRetailer: true },
  'lecreuset.com': { brand: 'Le Creuset', category: 'kitchen', tier: 'luxury', aliases: [], isRetailer: false },
  'staub-usa.com': { brand: 'Staub', category: 'kitchen', tier: 'luxury', aliases: [], isRetailer: false },
  'all-clad.com': { brand: 'All-Clad', category: 'kitchen', tier: 'luxury', aliases: [], isRetailer: false },
  'lodgecastiron.com': { brand: 'Lodge', category: 'kitchen', tier: 'mid', aliases: ['Lodge Cast Iron'], isRetailer: false },
  'zwilling.com': { brand: 'Zwilling J.A. Henckels', category: 'kitchen', tier: 'premium', aliases: ['Zwilling', 'Henckels'], isRetailer: false },
  'carawayhome.com': { brand: 'Caraway', category: 'kitchen', tier: 'premium', aliases: [], isRetailer: false },
  'kitchenaid.com': { brand: 'KitchenAid', category: 'kitchen', tier: 'premium', aliases: [], isRetailer: false },
  'vitamix.com': { brand: 'Vitamix', category: 'kitchen', tier: 'premium', aliases: [], isRetailer: false },
  'instantpot.com': { brand: 'Instant Pot', category: 'kitchen', tier: 'mid', aliases: [], isRetailer: false },
  'ninjakitchen.com': { brand: 'Ninja', category: 'kitchen', tier: 'mid', aliases: [], isRetailer: false },
  'smeg.com': { brand: 'Smeg', category: 'kitchen', tier: 'luxury', aliases: [], isRetailer: false },
  'mieleusa.com': { brand: 'Miele', category: 'kitchen', tier: 'luxury', aliases: [], isRetailer: false },
  'oxo.com': { brand: 'OXO', category: 'kitchen', tier: 'mid', aliases: [], isRetailer: false },

  // Bedding
  'brooklinen.com': { brand: 'Brooklinen', category: 'bedding', tier: 'premium', aliases: [], isRetailer: false },
  'parachutehome.com': { brand: 'Parachute', category: 'bedding', tier: 'premium', aliases: [], isRetailer: false },
  'caspersleep.com': { brand: 'Casper', category: 'bedding', tier: 'premium', aliases: [], isRetailer: true },
  'bollandbranch.com': { brand: 'Boll & Branch', category: 'bedding', tier: 'luxury', aliases: [], isRetailer: false },
  'snowehome.com': { brand: 'Snowe', category: 'bedding', tier: 'luxury', aliases: [], isRetailer: false },
  'onequince.com': { brand: 'Quince', category: 'bedding', tier: 'mid', aliases: [], isRetailer: false },

  // ============================================
  // FITNESS & ACTIVEWEAR
  // ============================================

  // Premium Activewear
  'lululemon.com': { brand: 'Lululemon', category: 'activewear', tier: 'luxury', aliases: [], isRetailer: false },
  'aloyoga.com': { brand: 'Alo Yoga', category: 'activewear', tier: 'luxury', aliases: ['Alo'], isRetailer: false },
  'vuori.com': { brand: 'Vuori', category: 'activewear', tier: 'premium', aliases: [], isRetailer: false },
  'rhone.com': { brand: 'Rhone', category: 'activewear', tier: 'premium', aliases: [], isRetailer: false },
  'athleta.gap.com': { brand: 'Athleta', category: 'activewear', tier: 'premium', aliases: [], isRetailer: false },

  // Athletic Brands
  'puma.com': { brand: 'Puma', category: 'athletic', tier: 'mid', aliases: [], isRetailer: false },
  'reebok.com': { brand: 'Reebok', category: 'athletic', tier: 'mid', aliases: [], isRetailer: false },
  'tracksmith.com': { brand: 'Tracksmith', category: 'running', tier: 'premium', aliases: [], isRetailer: false },

  // Gym/CrossFit Brands
  'gymshark.com': { brand: 'Gymshark', category: 'activewear', tier: 'premium', aliases: [], isRetailer: false },
  'nobull.com': { brand: 'NOBULL', category: 'activewear', tier: 'premium', aliases: [], isRetailer: false },
  'tenthousand.cc': { brand: 'Ten Thousand', category: 'activewear', tier: 'premium', aliases: [], isRetailer: false },

  // Fitness Equipment & Recovery
  'therabody.com': { brand: 'Therabody', category: 'fitness', tier: 'premium', aliases: ['Theragun'], isRetailer: false },
  'hyperice.com': { brand: 'Hyperice', category: 'fitness', tier: 'premium', aliases: [], isRetailer: false },
  'peloton.com': { brand: 'Peloton', category: 'fitness', tier: 'premium', aliases: [], isRetailer: false },
  'tonal.com': { brand: 'Tonal', category: 'fitness', tier: 'luxury', aliases: [], isRetailer: false },
  'hydrow.com': { brand: 'Hydrow', category: 'fitness', tier: 'premium', aliases: [], isRetailer: false },
  'roguefitness.com': { brand: 'Rogue Fitness', category: 'fitness', tier: 'mid', aliases: ['Rogue'], isRetailer: true },

  // Wearables
  'whoop.com': { brand: 'WHOOP', category: 'wearables', tier: 'premium', aliases: [], isRetailer: false },
  'ouraring.com': { brand: 'Oura', category: 'wearables', tier: 'premium', aliases: ['Oura Ring'], isRetailer: false },

  // ============================================
  // GAMING & ENTERTAINMENT
  // ============================================

  // Gaming Consoles & Platforms
  'playstation.com': { brand: 'PlayStation', category: 'gaming', tier: 'luxury', aliases: ['Sony PlayStation', 'PS5', 'PS4'], isRetailer: false },
  'xbox.com': { brand: 'Xbox', category: 'gaming', tier: 'luxury', aliases: ['Microsoft Xbox'], isRetailer: false },
  'nintendo.com': { brand: 'Nintendo', category: 'gaming', tier: 'premium', aliases: [], isRetailer: false },
  'steampowered.com': { brand: 'Steam', category: 'gaming', tier: 'premium', aliases: ['Valve'], isRetailer: true },

  // PC Gaming Hardware & Peripherals
  'nzxt.com': { brand: 'NZXT', category: 'gaming', tier: 'premium', aliases: [], isRetailer: false },
  'secretlab.co': { brand: 'Secretlab', category: 'gaming', tier: 'luxury', aliases: [], isRetailer: false },
  'rog.asus.com': { brand: 'ASUS ROG', category: 'gaming', tier: 'premium', aliases: ['Republic of Gamers'], isRetailer: false },
  'benq.com': { brand: 'BenQ', category: 'gaming', tier: 'premium', aliases: [], isRetailer: false },
  'logitechg.com': { brand: 'Logitech G', category: 'gaming', tier: 'premium', aliases: [], isRetailer: false },
  'scufgaming.com': { brand: 'SCUF Gaming', category: 'gaming', tier: 'premium', aliases: ['SCUF'], isRetailer: false },

  // Mechanical Keyboards
  'keychron.com': { brand: 'Keychron', category: 'gaming', tier: 'mid', aliases: [], isRetailer: false },
  'ducky.global': { brand: 'Ducky', category: 'gaming', tier: 'premium', aliases: [], isRetailer: false },

  // Streaming & Audio Equipment
  'elgato.com': { brand: 'Elgato', category: 'streaming', tier: 'premium', aliases: [], isRetailer: false },
  'rode.com': { brand: 'RODE', category: 'audio', tier: 'premium', aliases: ['Rode'], isRetailer: false },
  'shure.com': { brand: 'Shure', category: 'audio', tier: 'luxury', aliases: [], isRetailer: false },

  // Musical Instruments
  'fender.com': { brand: 'Fender', category: 'music', tier: 'luxury', aliases: [], isRetailer: false },
  'gibson.com': { brand: 'Gibson', category: 'music', tier: 'luxury', aliases: [], isRetailer: false },
  'roland.com': { brand: 'Roland', category: 'music', tier: 'premium', aliases: [], isRetailer: false },
  'yamaha.com': { brand: 'Yamaha', category: 'music', tier: 'premium', aliases: [], isRetailer: false },

  // Hobbies & Model Kits
  'games-workshop.com': { brand: 'Games Workshop', category: 'hobbies', tier: 'premium', aliases: ['Warhammer'], isRetailer: false },
  'lego.com': { brand: 'LEGO', category: 'hobbies', tier: 'mid', aliases: [], isRetailer: false },
  'bandai-hobby.net': { brand: 'Bandai Hobby', category: 'hobbies', tier: 'mid', aliases: ['Gundam', 'Gunpla'], isRetailer: false },
  'tamiya.com': { brand: 'Tamiya', category: 'hobbies', tier: 'mid', aliases: [], isRetailer: false },

  // ============================================
  // AUTOMOTIVE & MOTORCYCLE
  // ============================================

  // Auto Parts Retailers
  'autozone.com': { brand: null, category: 'automotive', tier: 'value', aliases: ['AutoZone'], isRetailer: true },
  'rockauto.com': { brand: null, category: 'automotive', tier: 'value', aliases: ['RockAuto'], isRetailer: true },
  'napaonline.com': { brand: 'NAPA', category: 'automotive', tier: 'mid', aliases: ['NAPA Auto Parts'], isRetailer: true },
  'advanceautoparts.com': { brand: 'Advance Auto Parts', category: 'automotive', tier: 'mid', aliases: [], isRetailer: true },
  'oreillyauto.com': { brand: "O'Reilly Auto Parts", category: 'automotive', tier: 'mid', aliases: [], isRetailer: true },
  'weathertech.com': { brand: 'WeatherTech', category: 'automotive', tier: 'premium', aliases: [], isRetailer: false },

  // Motorcycle Gear Retailers
  'revzilla.com': { brand: null, category: 'motorcycle', tier: 'mid', aliases: ['RevZilla'], isRetailer: true },

  // Motorcycle Gear Brands
  'alpinestars.com': { brand: 'Alpinestars', category: 'motorcycle', tier: 'luxury', aliases: [], isRetailer: false },
  'dainese.com': { brand: 'Dainese', category: 'motorcycle', tier: 'luxury', aliases: [], isRetailer: false },
  'shoei-helmets.com': { brand: 'Shoei', category: 'motorcycle', tier: 'premium', aliases: [], isRetailer: false },
  'araiamericas.com': { brand: 'Arai', category: 'motorcycle', tier: 'premium', aliases: [], isRetailer: false },
  'bellhelmets.com': { brand: 'Bell Helmets', category: 'motorcycle', tier: 'premium', aliases: ['Bell'], isRetailer: false },
  'hjchelmets.com': { brand: 'HJC Helmets', category: 'motorcycle', tier: 'mid', aliases: ['HJC'], isRetailer: false },
  'schuberth.com': { brand: 'Schuberth', category: 'motorcycle', tier: 'premium', aliases: [], isRetailer: false },
  'foxracing.com': { brand: 'Fox Racing', category: 'motorcycle', tier: 'premium', aliases: ['Fox'], isRetailer: false },

  // Cycling - Bike Manufacturers
  'trekbikes.com': { brand: 'Trek', category: 'cycling', tier: 'premium', aliases: ['Trek Bikes'], isRetailer: false },
  'specialized.com': { brand: 'Specialized', category: 'cycling', tier: 'premium', aliases: [], isRetailer: false },
  'cannondale.com': { brand: 'Cannondale', category: 'cycling', tier: 'premium', aliases: [], isRetailer: false },
  'giant-bicycles.com': { brand: 'Giant', category: 'cycling', tier: 'mid', aliases: ['Giant Bicycles'], isRetailer: false },
  'scott-sports.com': { brand: 'Scott Sports', category: 'cycling', tier: 'premium', aliases: ['Scott'], isRetailer: false },
  'pivotcycles.com': { brand: 'Pivot', category: 'cycling', tier: 'premium', aliases: ['Pivot Cycles'], isRetailer: false },

  // Cycling - Apparel & Accessories
  'rapha.cc': { brand: 'Rapha', category: 'cycling', tier: 'luxury', aliases: [], isRetailer: false },

  // Cycling - Components
  'shimano.com': { brand: 'Shimano', category: 'cycling', tier: 'premium', aliases: [], isRetailer: false },
  'sram.com': { brand: 'SRAM', category: 'cycling', tier: 'premium', aliases: [], isRetailer: false },

  // Car Care & Detailing
  'chemicalguys.com': { brand: 'Chemical Guys', category: 'automotive', tier: 'mid', aliases: [], isRetailer: false },
  'adamspolishes.com': { brand: "Adam's Polishes", category: 'automotive', tier: 'mid', aliases: [], isRetailer: false },
  'meguiarsdirect.com': { brand: "Meguiar's", category: 'automotive', tier: 'mid', aliases: [], isRetailer: false },
  'griotsgarage.com': { brand: "Griot's Garage", category: 'automotive', tier: 'premium', aliases: [], isRetailer: false },
  'turtlewax.com': { brand: 'Turtle Wax', category: 'automotive', tier: 'value', aliases: [], isRetailer: false },
  'armorall.com': { brand: 'Armor All', category: 'automotive', tier: 'value', aliases: [], isRetailer: false },

  // Performance Parts
  'borla.com': { brand: 'Borla', category: 'automotive', tier: 'premium', aliases: [], isRetailer: false },
  'knfilters.com': { brand: 'K&N', category: 'automotive', tier: 'premium', aliases: ['K&N Filters'], isRetailer: false },
  'brembo.com': { brand: 'Brembo', category: 'automotive', tier: 'luxury', aliases: [], isRetailer: false },

  // ============================================
  // COFFEE & BEVERAGES
  // ============================================

  // Coffee Equipment & Brands
  'nespresso.com': { brand: 'Nespresso', category: 'coffee', tier: 'luxury', aliases: [], isRetailer: false },
  'breville.com': { brand: 'Breville', category: 'coffee', tier: 'premium', aliases: [], isRetailer: false },
  'fellowproducts.com': { brand: 'Fellow', category: 'coffee', tier: 'premium', aliases: [], isRetailer: false },
  'bluebottlecoffee.com': { brand: 'Blue Bottle Coffee', category: 'coffee', tier: 'premium', aliases: ['Blue Bottle'], isRetailer: false },
  'illy.com': { brand: 'Illy', category: 'coffee', tier: 'premium', aliases: [], isRetailer: false },
  'lavazza.com': { brand: 'Lavazza', category: 'coffee', tier: 'premium', aliases: [], isRetailer: false },
  'stumptowncoffee.com': { brand: 'Stumptown Coffee Roasters', category: 'coffee', tier: 'premium', aliases: ['Stumptown'], isRetailer: false },
  'baratza.com': { brand: 'Baratza', category: 'coffee', tier: 'mid', aliases: [], isRetailer: false },
  'hario-usa.com': { brand: 'Hario', category: 'coffee', tier: 'mid', aliases: [], isRetailer: false },
  'chemexcoffeemaker.com': { brand: 'Chemex', category: 'coffee', tier: 'premium', aliases: [], isRetailer: false },

  // Food Retailers
  'wholefoodsmarket.com': { brand: null, category: 'food', tier: 'premium', aliases: ['Whole Foods'], isRetailer: true },
  'traderjoes.com': { brand: null, category: 'food', tier: 'mid', aliases: ["Trader Joe's"], isRetailer: true },

  // Premium Spirits
  'greygoose.com': { brand: 'Grey Goose', category: 'spirits', tier: 'luxury', aliases: [], isRetailer: false },
  'patrontequila.com': { brand: 'Patrón', category: 'spirits', tier: 'luxury', aliases: ['Patron'], isRetailer: false },

  // ============================================
  // GENERAL RETAILERS
  // ============================================

  'amazon.com': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'amazon.co.uk': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'amazon.ca': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'amazon.de': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'ebay.com': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'walmart.com': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'target.com': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'costco.com': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'homedepot.com': { brand: null, category: 'home', tier: 'value', aliases: ['Home Depot'], isRetailer: true },
  'lowes.com': { brand: null, category: 'home', tier: 'value', aliases: ["Lowe's"], isRetailer: true },
  'samsclub.com': { brand: null, category: 'retail', tier: 'value', aliases: ["Sam's Club"], isRetailer: true },
  'bjs.com': { brand: null, category: 'retail', tier: 'value', aliases: ["BJ's"], isRetailer: true },

  // ============================================
  // PET SUPPLIES
  // ============================================

  // Pet Retailers
  'chewy.com': { brand: null, category: 'pet', tier: 'mid', aliases: [], isRetailer: true },
  'petco.com': { brand: null, category: 'pet', tier: 'mid', aliases: [], isRetailer: true },
  'petsmart.com': { brand: null, category: 'pet', tier: 'mid', aliases: [], isRetailer: true },

  // Pet Brands
  'orijen.com': { brand: 'Orijen', category: 'pet', tier: 'premium', aliases: [], isRetailer: false },
  'acana.com': { brand: 'Acana', category: 'pet', tier: 'premium', aliases: [], isRetailer: false },
  'royalcanin.com': { brand: 'Royal Canin', category: 'pet', tier: 'premium', aliases: [], isRetailer: false },
  'hillspet.com': { brand: "Hill's", category: 'pet', tier: 'premium', aliases: ["Hill's Science Diet"], isRetailer: false },
  'purina.com': { brand: 'Purina', category: 'pet', tier: 'mid', aliases: [], isRetailer: false },
  'bluebu.com': { brand: 'Blue Buffalo', category: 'pet', tier: 'premium', aliases: [], isRetailer: false },
  'thefarmersdog.com': { brand: "The Farmer's Dog", category: 'pet', tier: 'premium', aliases: [], isRetailer: false },
  'ollie.com': { brand: 'Ollie', category: 'pet', tier: 'premium', aliases: [], isRetailer: false },
  'justfoodfordogs.com': { brand: 'Just Food For Dogs', category: 'pet', tier: 'premium', aliases: [], isRetailer: false },
  'wildone.com': { brand: 'Wild One', category: 'pet', tier: 'premium', aliases: [], isRetailer: false },
  'figopetinsurance.com': { brand: 'Figo', category: 'pet', tier: 'mid', aliases: [], isRetailer: false },
  'kongcompany.com': { brand: 'KONG', category: 'pet', tier: 'mid', aliases: [], isRetailer: false },
  'barkbox.com': { brand: 'BarkBox', category: 'pet', tier: 'premium', aliases: ['Bark'], isRetailer: false },
  'fi.co': { brand: 'Fi', category: 'pet', tier: 'premium', aliases: ['Fi Collar'], isRetailer: false },

  // ============================================
  // BABY & KIDS
  // ============================================

  // Baby Retailers
  'buybuybaby.com': { brand: null, category: 'baby', tier: 'mid', aliases: [], isRetailer: true },
  'babylist.com': { brand: null, category: 'baby', tier: 'mid', aliases: [], isRetailer: true },

  // Baby Brands
  'uppababy.com': { brand: 'UPPAbaby', category: 'baby', tier: 'luxury', aliases: [], isRetailer: false },
  'bugaboo.com': { brand: 'Bugaboo', category: 'baby', tier: 'luxury', aliases: [], isRetailer: false },
  'nuna.eu': { brand: 'Nuna', category: 'baby', tier: 'luxury', aliases: [], isRetailer: false },
  'cybex-online.com': { brand: 'Cybex', category: 'baby', tier: 'luxury', aliases: [], isRetailer: false },
  'stokke.com': { brand: 'Stokke', category: 'baby', tier: 'luxury', aliases: [], isRetailer: false },
  'chiccousa.com': { brand: 'Chicco', category: 'baby', tier: 'mid', aliases: [], isRetailer: false },
  'gracobaby.com': { brand: 'Graco', category: 'baby', tier: 'mid', aliases: [], isRetailer: false },
  'owletcare.com': { brand: 'Owlet', category: 'baby', tier: 'premium', aliases: [], isRetailer: false },
  'halo.com': { brand: 'HALO', category: 'baby', tier: 'mid', aliases: [], isRetailer: false },
  'ergobabycarrier.com': { brand: 'Ergobaby', category: 'baby', tier: 'premium', aliases: [], isRetailer: false },
  'babybjorn.com': { brand: 'BabyBjörn', category: 'baby', tier: 'premium', aliases: ['Baby Bjorn'], isRetailer: false },
  'dockatot.com': { brand: 'DockATot', category: 'baby', tier: 'premium', aliases: [], isRetailer: false },
  'snoobassinest.com': { brand: 'SNOO', category: 'baby', tier: 'luxury', aliases: ['Happiest Baby'], isRetailer: false },
  'monbebe.com': { brand: 'Monbebe', category: 'baby', tier: 'mid', aliases: [], isRetailer: false },
  'loveevery.com': { brand: 'Lovevery', category: 'baby', tier: 'premium', aliases: [], isRetailer: false },
  'kiwico.com': { brand: 'KiwiCo', category: 'kids', tier: 'premium', aliases: [], isRetailer: false },

  // Kids Apparel
  'primarykids.com': { brand: 'Primary', category: 'kids', tier: 'premium', aliases: [], isRetailer: false },
  'hannaandersson.com': { brand: 'Hanna Andersson', category: 'kids', tier: 'premium', aliases: [], isRetailer: false },
  'teacollection.com': { brand: 'Tea Collection', category: 'kids', tier: 'premium', aliases: [], isRetailer: false },

  // ============================================
  // EYEWEAR
  // ============================================

  'warbyparker.com': { brand: 'Warby Parker', category: 'eyewear', tier: 'premium', aliases: [], isRetailer: false },
  'rayban.com': { brand: 'Ray-Ban', category: 'eyewear', tier: 'premium', aliases: [], isRetailer: false },
  'oakley.com': { brand: 'Oakley', category: 'eyewear', tier: 'premium', aliases: [], isRetailer: false },
  'persol.com': { brand: 'Persol', category: 'eyewear', tier: 'luxury', aliases: [], isRetailer: false },
  'oliverpeoples.com': { brand: 'Oliver Peoples', category: 'eyewear', tier: 'luxury', aliases: [], isRetailer: false },
  'gentlemonster.com': { brand: 'Gentle Monster', category: 'eyewear', tier: 'luxury', aliases: [], isRetailer: false },
  'sunglasshut.com': { brand: null, category: 'eyewear', tier: 'mid', aliases: [], isRetailer: true },
  'zenni.com': { brand: 'Zenni', category: 'eyewear', tier: 'value', aliases: ['Zenni Optical'], isRetailer: false },
  'maui-jim.com': { brand: 'Maui Jim', category: 'eyewear', tier: 'premium', aliases: [], isRetailer: false },
  'costa.com': { brand: 'Costa', category: 'eyewear', tier: 'premium', aliases: ['Costa Del Mar'], isRetailer: false },
  'kaenon.com': { brand: 'Kaenon', category: 'eyewear', tier: 'premium', aliases: [], isRetailer: false },
  'smithoptics.com': { brand: 'Smith', category: 'eyewear', tier: 'premium', aliases: ['Smith Optics'], isRetailer: false },

  // ============================================
  // SUPPLEMENTS & NUTRITION
  // ============================================

  'athleticgreens.com': { brand: 'AG1', category: 'supplements', tier: 'premium', aliases: ['Athletic Greens'], isRetailer: false },
  'ritual.com': { brand: 'Ritual', category: 'supplements', tier: 'premium', aliases: [], isRetailer: false },
  'care-of.com': { brand: 'Care/of', category: 'supplements', tier: 'premium', aliases: [], isRetailer: false },
  'momentous.com': { brand: 'Momentous', category: 'supplements', tier: 'premium', aliases: [], isRetailer: false },
  'thorne.com': { brand: 'Thorne', category: 'supplements', tier: 'premium', aliases: [], isRetailer: false },
  'gardenoflife.com': { brand: 'Garden of Life', category: 'supplements', tier: 'mid', aliases: [], isRetailer: false },
  'nowfoods.com': { brand: 'NOW Foods', category: 'supplements', tier: 'mid', aliases: [], isRetailer: false },
  'optimumnutrition.com': { brand: 'Optimum Nutrition', category: 'supplements', tier: 'mid', aliases: ['ON'], isRetailer: false },
  'transparentlabs.com': { brand: 'Transparent Labs', category: 'supplements', tier: 'premium', aliases: [], isRetailer: false },
  'legionathletics.com': { brand: 'Legion', category: 'supplements', tier: 'premium', aliases: [], isRetailer: false },
  'bodybuilding.com': { brand: null, category: 'supplements', tier: 'mid', aliases: [], isRetailer: true },
  'gnc.com': { brand: null, category: 'supplements', tier: 'mid', aliases: ['GNC'], isRetailer: true },
  'vitaminshoppe.com': { brand: null, category: 'supplements', tier: 'mid', aliases: ['Vitamin Shoppe'], isRetailer: true },
  'huel.com': { brand: 'Huel', category: 'supplements', tier: 'mid', aliases: [], isRetailer: false },
  'drinkag1.com': { brand: 'AG1', category: 'supplements', tier: 'premium', aliases: [], isRetailer: false },

  // ============================================
  // OFFICE & DESK SETUP
  // ============================================

  'autonomous.ai': { brand: 'Autonomous', category: 'office', tier: 'mid', aliases: [], isRetailer: false },
  'fully.com': { brand: 'Fully', category: 'office', tier: 'premium', aliases: [], isRetailer: false },
  'upliftdesk.com': { brand: 'Uplift', category: 'office', tier: 'premium', aliases: [], isRetailer: false },
  'hermanmiller.com': { brand: 'Herman Miller', category: 'office', tier: 'luxury', aliases: [], isRetailer: false },
  'steelcase.com': { brand: 'Steelcase', category: 'office', tier: 'luxury', aliases: [], isRetailer: false },
  'humanscale.com': { brand: 'Humanscale', category: 'office', tier: 'luxury', aliases: [], isRetailer: false },
  'vari.com': { brand: 'Vari', category: 'office', tier: 'mid', aliases: ['Varidesk'], isRetailer: false },
  'staples.com': { brand: null, category: 'office', tier: 'value', aliases: [], isRetailer: true },
  'officedepot.com': { brand: null, category: 'office', tier: 'value', aliases: [], isRetailer: true },
  'haworth.com': { brand: 'Haworth', category: 'office', tier: 'luxury', aliases: [], isRetailer: false },
  'knoll.com': { brand: 'Knoll', category: 'office', tier: 'luxury', aliases: [], isRetailer: false },

  // ============================================
  // SPORTS EQUIPMENT (Beyond Golf)
  // ============================================

  // Tennis (wilson.com already defined in golf section)
  'babolat.com': { brand: 'Babolat', category: 'tennis', tier: 'premium', aliases: [], isRetailer: false },
  'head.com': { brand: 'Head', category: 'sports', tier: 'premium', aliases: [], isRetailer: false },
  'yonex.com': { brand: 'Yonex', category: 'sports', tier: 'premium', aliases: [], isRetailer: false },
  'tennisexpress.com': { brand: null, category: 'tennis', tier: 'mid', aliases: [], isRetailer: true },
  'tennis-warehouse.com': { brand: null, category: 'tennis', tier: 'mid', aliases: [], isRetailer: true },

  // Basketball
  'nba.com/store': { brand: null, category: 'basketball', tier: 'mid', aliases: [], isRetailer: true },

  // Soccer/Football
  'soccer.com': { brand: null, category: 'soccer', tier: 'mid', aliases: [], isRetailer: true },

  // Skiing/Snowboarding
  'burton.com': { brand: 'Burton', category: 'snow', tier: 'premium', aliases: [], isRetailer: false },
  'lib-tech.com': { brand: 'Lib Tech', category: 'snow', tier: 'premium', aliases: [], isRetailer: false },
  'rossignol.com': { brand: 'Rossignol', category: 'snow', tier: 'premium', aliases: [], isRetailer: false },
  'volcom.com': { brand: 'Volcom', category: 'snow', tier: 'mid', aliases: [], isRetailer: false },
  'atomic.com': { brand: 'Atomic', category: 'snow', tier: 'premium', aliases: [], isRetailer: false },
  'thehouseoutdoors.com': { brand: null, category: 'snow', tier: 'mid', aliases: ['The House'], isRetailer: true },
  'evo.com': { brand: null, category: 'snow', tier: 'mid', aliases: [], isRetailer: true },

  // Surfing
  'channel-islands.com': { brand: 'Channel Islands', category: 'surf', tier: 'premium', aliases: [], isRetailer: false },
  'ripcurl.com': { brand: 'Rip Curl', category: 'surf', tier: 'mid', aliases: [], isRetailer: false },
  'quiksilver.com': { brand: 'Quiksilver', category: 'surf', tier: 'mid', aliases: [], isRetailer: false },
  'billabong.com': { brand: 'Billabong', category: 'surf', tier: 'mid', aliases: [], isRetailer: false },
  'hurley.com': { brand: 'Hurley', category: 'surf', tier: 'mid', aliases: [], isRetailer: false },

  // General Sports Retailers (dickssportinggoods.com already defined in golf section)
  'academy.com': { brand: null, category: 'sports', tier: 'value', aliases: ['Academy Sports'], isRetailer: true },
  'sportsmanswarehouse.com': { brand: null, category: 'sports', tier: 'mid', aliases: ["Sportsman's Warehouse"], isRetailer: true },

  // ============================================
  // ART SUPPLIES
  // ============================================

  'dickblick.com': { brand: null, category: 'art', tier: 'mid', aliases: ['Blick Art'], isRetailer: true },
  'jerrysartarama.com': { brand: null, category: 'art', tier: 'mid', aliases: ["Jerry's Artarama"], isRetailer: true },
  'michaels.com': { brand: null, category: 'art', tier: 'value', aliases: [], isRetailer: true },
  'hobbylobby.com': { brand: null, category: 'art', tier: 'value', aliases: ['Hobby Lobby'], isRetailer: true },
  'joann.com': { brand: null, category: 'art', tier: 'value', aliases: ['Jo-Ann'], isRetailer: true },
  'winsorandnewton.com': { brand: 'Winsor & Newton', category: 'art', tier: 'premium', aliases: [], isRetailer: false },
  'copic.jp': { brand: 'Copic', category: 'art', tier: 'premium', aliases: [], isRetailer: false },
  'prismacolor.com': { brand: 'Prismacolor', category: 'art', tier: 'mid', aliases: [], isRetailer: false },
  'stabilo.com': { brand: 'Stabilo', category: 'art', tier: 'mid', aliases: [], isRetailer: false },
  'fabercastell.com': { brand: 'Faber-Castell', category: 'art', tier: 'premium', aliases: [], isRetailer: false },

  // ============================================
  // D2C / POPULAR DIRECT-TO-CONSUMER BRANDS
  // ============================================

  // Apparel
  'everlane.com': { brand: 'Everlane', category: 'apparel', tier: 'premium', aliases: [], isRetailer: false },
  'kotn.com': { brand: 'Kotn', category: 'apparel', tier: 'premium', aliases: [], isRetailer: false },
  'cuyana.com': { brand: 'Cuyana', category: 'apparel', tier: 'premium', aliases: [], isRetailer: false },
  'reformation.com': { brand: 'Reformation', category: 'apparel', tier: 'premium', aliases: [], isRetailer: false },
  'marine-layer.com': { brand: 'Marine Layer', category: 'apparel', tier: 'mid', aliases: [], isRetailer: false },
  'untuckit.com': { brand: 'UNTUCKit', category: 'apparel', tier: 'mid', aliases: [], isRetailer: false },
  'buckmason.com': { brand: 'Buck Mason', category: 'apparel', tier: 'premium', aliases: [], isRetailer: false },
  'toddsnyder.com': { brand: 'Todd Snyder', category: 'apparel', tier: 'premium', aliases: [], isRetailer: false },

  // Bags & Accessories (cuyana.com already defined in apparel section)
  'dagnedover.com': { brand: 'Dagne Dover', category: 'bags', tier: 'premium', aliases: [], isRetailer: false },
  'calpaktravel.com': { brand: 'CALPAK', category: 'bags', tier: 'mid', aliases: [], isRetailer: false },
  'beistravel.com': { brand: 'Béis', category: 'bags', tier: 'mid', aliases: ['Beis'], isRetailer: false },
  'senreve.com': { brand: 'Senreve', category: 'bags', tier: 'luxury', aliases: [], isRetailer: false },

  // Mattresses
  'purple.com': { brand: 'Purple', category: 'bedding', tier: 'premium', aliases: [], isRetailer: false },
  'tuftandneedle.com': { brand: 'Tuft & Needle', category: 'bedding', tier: 'mid', aliases: [], isRetailer: false },
  'nectar.com': { brand: 'Nectar', category: 'bedding', tier: 'mid', aliases: [], isRetailer: false },
  'saatva.com': { brand: 'Saatva', category: 'bedding', tier: 'premium', aliases: [], isRetailer: false },
  'helixsleep.com': { brand: 'Helix', category: 'bedding', tier: 'premium', aliases: [], isRetailer: false },
  'eightsleep.com': { brand: 'Eight Sleep', category: 'bedding', tier: 'luxury', aliases: [], isRetailer: false },

  // Personal Care
  'harrys.com': { brand: "Harry's", category: 'grooming', tier: 'mid', aliases: [], isRetailer: false },
  'dollarshaveclub.com': { brand: 'Dollar Shave Club', category: 'grooming', tier: 'value', aliases: ['DSC'], isRetailer: false },
  'billie.com': { brand: 'Billie', category: 'grooming', tier: 'mid', aliases: [], isRetailer: false },
  'native.com': { brand: 'Native', category: 'grooming', tier: 'mid', aliases: [], isRetailer: false },
  'everist.com': { brand: 'Everist', category: 'grooming', tier: 'premium', aliases: [], isRetailer: false },
  'by-humankind.com': { brand: 'By Humankind', category: 'grooming', tier: 'premium', aliases: [], isRetailer: false },

  // ============================================
  // BOOKS & READING
  // ============================================

  'barnesandnoble.com': { brand: null, category: 'books', tier: 'mid', aliases: ['Barnes & Noble'], isRetailer: true },
  'bookshop.org': { brand: null, category: 'books', tier: 'mid', aliases: [], isRetailer: true },
  'thriftbooks.com': { brand: null, category: 'books', tier: 'value', aliases: [], isRetailer: true },
  'abebooks.com': { brand: null, category: 'books', tier: 'value', aliases: [], isRetailer: true },
  'alibris.com': { brand: null, category: 'books', tier: 'value', aliases: [], isRetailer: true },
  'kindle.amazon.com': { brand: 'Kindle', category: 'books', tier: 'mid', aliases: [], isRetailer: true },

  // ============================================
  // HEALTH & MEDICAL
  // ============================================

  'cvs.com': { brand: null, category: 'health', tier: 'value', aliases: ['CVS Pharmacy'], isRetailer: true },
  'walgreens.com': { brand: null, category: 'health', tier: 'value', aliases: [], isRetailer: true },
  'riteaid.com': { brand: null, category: 'health', tier: 'value', aliases: ['Rite Aid'], isRetailer: true },
  'nurx.com': { brand: 'Nurx', category: 'health', tier: 'mid', aliases: [], isRetailer: false },
  'hims.com': { brand: 'Hims', category: 'health', tier: 'mid', aliases: [], isRetailer: false },
  'forhers.com': { brand: 'Hers', category: 'health', tier: 'mid', aliases: [], isRetailer: false },
  'ro.co': { brand: 'Ro', category: 'health', tier: 'mid', aliases: ['Roman', 'Rory'], isRetailer: false },

  // ============================================
  // INTERNATIONAL RETAILERS
  // ============================================

  // UK
  'johnlewis.com': { brand: null, category: 'retail', tier: 'premium', aliases: ['John Lewis'], isRetailer: true },
  'argos.co.uk': { brand: null, category: 'retail', tier: 'value', aliases: [], isRetailer: true },
  'currys.co.uk': { brand: null, category: 'tech', tier: 'mid', aliases: [], isRetailer: true },
  'boots.com': { brand: null, category: 'health', tier: 'mid', aliases: [], isRetailer: true },

  // EU
  'zalando.com': { brand: null, category: 'fashion', tier: 'mid', aliases: [], isRetailer: true },
  'aboutyou.com': { brand: null, category: 'fashion', tier: 'mid', aliases: [], isRetailer: true },
  'otto.de': { brand: null, category: 'retail', tier: 'mid', aliases: [], isRetailer: true },

  // Australia
  'myer.com.au': { brand: null, category: 'retail', tier: 'mid', aliases: [], isRetailer: true },
  'davidjones.com': { brand: null, category: 'fashion', tier: 'premium', aliases: ['David Jones'], isRetailer: true },
  'kogan.com': { brand: null, category: 'tech', tier: 'value', aliases: [], isRetailer: true },

  // Canada
  'canadiantire.ca': { brand: null, category: 'retail', tier: 'value', aliases: ['Canadian Tire'], isRetailer: true },
  'sportchek.ca': { brand: null, category: 'sports', tier: 'mid', aliases: ['Sport Chek'], isRetailer: true },
  'thebay.com': { brand: null, category: 'retail', tier: 'mid', aliases: ['Hudson Bay', 'The Bay'], isRetailer: true },
};

/**
 * Get brand info from a domain
 */
export function getBrandFromDomain(domain: string): DomainBrandInfo | null {
  // Normalize domain
  const normalized = domain.toLowerCase().replace(/^www\./, '');

  // Direct lookup
  if (DOMAIN_BRAND_MAP[normalized]) {
    return DOMAIN_BRAND_MAP[normalized];
  }

  // Try without subdomain
  const parts = normalized.split('.');
  if (parts.length > 2) {
    const rootDomain = parts.slice(-2).join('.');
    if (DOMAIN_BRAND_MAP[rootDomain]) {
      return DOMAIN_BRAND_MAP[rootDomain];
    }
  }

  return null;
}

/**
 * Get all brands for a category
 */
export function getBrandsByCategory(category: string): string[] {
  return Object.values(DOMAIN_BRAND_MAP)
    .filter(info => info.category === category && info.brand)
    .map(info => info.brand!)
    .filter((brand, index, self) => self.indexOf(brand) === index);
}

/**
 * Get domain count for debugging
 */
export function getDomainCount(): number {
  return Object.keys(DOMAIN_BRAND_MAP).length;
}
