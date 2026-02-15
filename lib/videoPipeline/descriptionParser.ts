/**
 * Enhanced Description Parser for Video-to-Bag Pipeline
 * Parses structured product lists from YouTube video descriptions.
 * Handles common formats: numbered lists, timestamp+product+URL, section-grouped, etc.
 */

import { extractUrlsFromDescription } from '../contentIdeas/youtube';
import type { ExtractedLink } from '../types/contentIdeas';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface DescriptionProduct {
  name: string;
  brand?: string;
  url?: string;
  label?: string;
  section?: string;          // Section header this product was under
  timestamp?: string;        // e.g., "2:34"
  isAffiliate: boolean;
}

export interface DescriptionParseResult {
  products: DescriptionProduct[];
  links: ExtractedLink[];
  sections: string[];         // Detected section headers
  hasStructuredList: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Section Detection
// ═══════════════════════════════════════════════════════════════════

const SECTION_PATTERNS = [
  /^[═=─-]{3,}/,                                   // Dividers
  /^#{1,3}\s+(.+)/,                                // Markdown headers
  /^[A-Z][A-Z\s&/]+:?\s*$/,                        // ALL CAPS HEADER
  /^(?:▶|►|⭐|🔥|👇|📦|🎒|💼|🏌️|📸|💄|🎮|🎵)\s*(.+)/,  // Emoji-prefixed sections
  /^\d{1,2}\.\s*[A-Z].*:?\s*$/,                    // "1. SECTION NAME:"
];

function detectSections(lines: string[]): Map<number, string> {
  const sections = new Map<number, string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    for (const pattern of SECTION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const sectionName = (match[1] || line)
          .replace(/^[═=─\-#\s]+/, '')
          .replace(/[═=─\-:\s]+$/, '')
          .trim();
        if (sectionName.length > 1 && sectionName.length < 60) {
          sections.set(i, sectionName);
        }
        break;
      }
    }
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════════════
// Product Line Detection
// ═══════════════════════════════════════════════════════════════════

const TIMESTAMP_PATTERN = /^(?:\d{1,2}:)?\d{1,2}:\d{2}\s*/;
const URL_IN_LINE_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/;

/**
 * Parse a single line that may contain a product reference.
 * Common formats:
 *   - "TaylorMade Stealth 2 Driver - https://amzn.to/xxx"
 *   - "2:34 - Scotty Cameron Phantom X 5"
 *   - "1. Titleist Pro V1x → https://geni.us/xxx"
 *   - "Driver: TaylorMade Qi10 Max (https://amzn.to/xxx)"
 *   - "My putter ► Scotty Cameron Special Select"
 */
function parseProductLine(line: string): DescriptionProduct | null {
  let remaining = line.trim();
  if (!remaining || remaining.length < 5) return null;

  // Skip common non-product lines
  if (/^(subscribe|follow|like|comment|social|instagram|twitter|tiktok|facebook|#|@|thanks|thank you|music|song|intro|outro|disclaimer|disclosure|ftc|affiliate)/i.test(remaining)) {
    return null;
  }

  // Extract timestamp if present
  let timestamp: string | undefined;
  const tsMatch = remaining.match(TIMESTAMP_PATTERN);
  if (tsMatch) {
    timestamp = tsMatch[0].trim();
    remaining = remaining.slice(tsMatch[0].length).trim();
  }

  // Extract URL if present
  let url: string | undefined;
  let isAffiliate = false;
  const urlMatch = remaining.match(URL_IN_LINE_PATTERN);
  if (urlMatch) {
    url = urlMatch[0].replace(/[.,;:!?)]+$/, '');
    isAffiliate = /amzn\.to|geni\.us|bit\.ly|rstyle\.me|go\.magik\.ly|howl\.me|prf\.hn|shopstyle|shareasale|tag=|affid=/i.test(url);
    remaining = remaining.replace(urlMatch[0], '').trim();
  }

  // Clean up separators and markers
  remaining = remaining
    .replace(/^[\d]+[.)]\s*/, '')          // "1. " or "1) "
    .replace(/^[•·◦▪★☆►▶→➤\-–—]\s*/, '') // Bullet points
    .replace(/\s*[-–—→►:]\s*$/, '')        // Trailing separators
    .replace(/\s*\(.*?\)\s*$/, '')         // Trailing parenthetical (often "(affiliate)")
    .trim();

  if (!remaining || remaining.length < 3) return null;

  // Try to extract brand from "Brand - Product" or "Brand: Product" patterns
  let brand: string | undefined;
  const brandSplit = remaining.match(/^([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\s*[-:–]\s*(.+)/);
  if (brandSplit && brandSplit[1].length < 30) {
    brand = brandSplit[1];
  }

  return {
    name: remaining,
    brand,
    url,
    timestamp,
    isAffiliate,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Main Parser
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a video description for structured product lists.
 * Returns both structured products and raw extracted links.
 */
export function parseDescriptionForProducts(description: string): DescriptionParseResult {
  // Get raw links using existing extractor
  const links = extractUrlsFromDescription(description);

  const lines = description.split('\n');
  const sections = detectSections(lines);
  const sectionNames = Array.from(sections.values());

  const products: DescriptionProduct[] = [];
  let currentSection: string | undefined;
  let hasStructuredList = false;

  // Count lines that look like product entries to determine if this is structured
  let productLineCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const hasUrl = URL_IN_LINE_PATTERN.test(trimmed);
    const hasTimestamp = TIMESTAMP_PATTERN.test(trimmed);
    const hasNumbering = /^\d+[.)]\s/.test(trimmed);
    const hasBullet = /^[•·◦▪★☆►▶→➤\-–—]\s/.test(trimmed);

    if (hasUrl || hasTimestamp || hasNumbering || hasBullet) {
      productLineCount++;
    }
  }

  // If we have 3+ structured lines, this description has a product list
  hasStructuredList = productLineCount >= 3;

  for (let i = 0; i < lines.length; i++) {
    // Update current section
    if (sections.has(i)) {
      currentSection = sections.get(i);
      continue;
    }

    const product = parseProductLine(lines[i]);
    if (product) {
      product.section = currentSection;

      // Match with extracted links if product doesn't have a URL
      if (!product.url) {
        const matchingLink = links.find(l => {
          if (!l.productHint) return false;
          const hint = l.productHint.toLowerCase();
          const name = product.name.toLowerCase();
          return name.includes(hint) || hint.includes(name);
        });
        if (matchingLink) {
          product.url = matchingLink.url;
          product.isAffiliate = matchingLink.isAffiliate;
        }
      }

      products.push(product);
    }
  }

  return {
    products,
    links,
    sections: sectionNames,
    hasStructuredList,
  };
}
