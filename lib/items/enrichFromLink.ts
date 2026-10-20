/**
 * Read a product page once and let the link do the work: photo, brand, category,
 * list price, and the facts the Enhance step needs. Server only.
 *
 * Before 2026-10-20 a link added in the editor was analysed by a GPT page-reader
 * that could not fetch Amazon (bot-blocked), stored its guess in link metadata and
 * touched nothing on the item; "Find product image" and "Enhance details" then
 * searched by the item's name and ignored the link entirely, so an Amazon link on
 * a projector produced unrelated pictures and generic text.
 *
 * `identifyProduct` is the same pipeline the bulk importer and the dashboard's
 * add-by-URL use: Amazon ASIN lookup, JSON-LD / og tags, Firecrawl when a site
 * blocks plain fetches, AI on the page text as the last resort.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { identifyProduct, type ProductIdentificationResult } from '@/lib/linkIdentification';
import { uploadItemPhoto, createMediaAsset } from '@/lib/supabaseStorage';
import { validateExternalUrl } from '@/lib/urlValidation';

/** Link kinds that point at a product page rather than a review, video or thread. */
export const PRODUCT_LINK_KINDS = new Set(['product', 'purchase', 'shop', 'buy', 'affiliate']);

export function isProductLinkKind(kind: string | null | undefined): boolean {
  return !!kind && PRODUCT_LINK_KINDS.has(kind.trim().toLowerCase());
}

export interface PageFacts {
  url: string;
  domain: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  price: string | null;
  priceNumber: number | null;
  specifications: string[];
  imageUrl: string | null;
  confidence: number;
  source: string;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function parsePrice(price: string | null): number | null {
  if (!price) return null;
  const m = price.replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Read the product page. Never throws; returns null when nothing usable came back. */
export async function readProductPage(url: string): Promise<PageFacts | null> {
  let id: ProductIdentificationResult;
  try {
    id = await identifyProduct(url, { fetchTimeout: 8000, earlyExitConfidence: 0.85 });
  } catch (error) {
    console.error('[enrichFromLink] identifyProduct failed:', error);
    return null;
  }
  const name = id.fullName || id.productName || null;
  const empty = !name || /^unknown product$/i.test(name) || /^product from /i.test(name);
  if (empty && !id.imageUrl && !id.brand) return null;
  return {
    url,
    domain: domainOf(url),
    name: empty ? null : name,
    brand: id.brand || null,
    category: id.category || null,
    price: id.price || null,
    priceNumber: parsePrice(id.price),
    specifications: id.specifications || [],
    imageUrl: id.imageUrl || null,
    confidence: id.confidence,
    source: id.primarySource,
  };
}

interface ItemRow {
  id: string;
  brand: string | null;
  category: string | null;
  photo_url: string | null;
  custom_photo_id: string | null;
  specs: Record<string, unknown> | null;
}

export interface ApplyResult {
  /** Fields written to bag_items (also what the editor should merge into its state). */
  updates: Record<string, unknown>;
  /** Plain words for the editor: "photo, brand, list price". */
  filled: string[];
}

async function downloadImage(imageUrl: string): Promise<Blob | null> {
  if (validateExternalUrl(imageUrl)) return null;
  try {
    const amazon = /amazon|media-amazon\.com/.test(imageUrl);
    const res = await fetch(imageUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: amazon ? 'https://www.amazon.com/' : `https://${domainOf(imageUrl)}/`,
      },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = res.headers.get('content-type') || blob.type;
    if (blob.size < 100 || !type.startsWith('image/')) return null;
    return blob;
  } catch {
    return null;
  }
}

/**
 * Write what the page says onto the item, filling only what is empty:
 * the photo (downloaded into storage, photo_url as the fallback), brand,
 * category and specs.list_price. The name is never touched.
 */
export async function applyPageFactsToItem(
  supabase: SupabaseClient,
  userId: string,
  item: ItemRow,
  facts: PageFacts
): Promise<ApplyResult> {
  const updates: Record<string, unknown> = {};
  const filled: string[] = [];

  if (facts.imageUrl && !item.custom_photo_id && !item.photo_url) {
    const blob = await downloadImage(facts.imageUrl);
    if (blob) {
      try {
        const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
        const file = new File([blob], `product.${ext}`, { type: blob.type });
        const uploaded = await uploadItemPhoto(file, userId, item.id);
        const mediaAssetId = await createMediaAsset(uploaded.url, userId, { sourceType: 'product_link' });
        updates.custom_photo_id = mediaAssetId;
        updates.photo_url = uploaded.url;
      } catch (error) {
        console.error('[enrichFromLink] photo upload failed, keeping the external URL:', error);
        updates.photo_url = facts.imageUrl;
      }
    } else {
      updates.photo_url = facts.imageUrl;
    }
    filled.push('photo');
  }

  if (!item.brand && facts.brand) {
    updates.brand = facts.brand;
    filled.push('brand');
  }
  if (!item.category && facts.category) {
    updates.category = facts.category;
    filled.push('category');
  }
  const specs = (item.specs && typeof item.specs === 'object' ? item.specs : {}) as Record<string, unknown>;
  if (facts.priceNumber && specs.list_price === undefined) {
    updates.specs = { ...specs, list_price: facts.priceNumber };
    filled.push('list price');
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('bag_items').update(updates).eq('id', item.id);
    if (error) {
      console.error('[enrichFromLink] item update failed:', error);
      return { updates: {}, filled: [] };
    }
  }
  return { updates, filled };
}

/** One paragraph of page facts for a prompt; empty string when there are none. */
export function pageFactsForPrompt(facts: PageFacts | null): string {
  if (!facts) return '';
  const lines = [`Facts read from the product page at ${facts.domain}:`];
  if (facts.name) lines.push(`- Listed name: ${facts.name}`);
  if (facts.brand) lines.push(`- Brand: ${facts.brand}`);
  if (facts.price) lines.push(`- Price shown: ${facts.price}`);
  if (facts.specifications.length > 0) lines.push(`- Specifications: ${facts.specifications.slice(0, 12).join(' | ')}`);
  return lines.join('\n');
}
