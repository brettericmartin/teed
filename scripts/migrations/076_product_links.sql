-- Migration 076: Add Product Links to Discovered Products
-- Each product should have:
-- 1. Source link (where we discovered it - video/article)
-- 2. Product links (where to buy/learn more)

-- Add product_links column to store SmartLinkFinder results
ALTER TABLE discovered_products
ADD COLUMN IF NOT EXISTS product_links JSONB DEFAULT '[]';

-- Rename source_link to be clearer (it was for affiliate links from videos)
-- Keep it for backwards compatibility but add clearer column
ALTER TABLE discovered_products
ADD COLUMN IF NOT EXISTS buy_url TEXT;

COMMENT ON COLUMN discovered_products.product_links IS 'Array of product purchase links from SmartLinkFinder: [{url, source, label, affiliatable}]';
COMMENT ON COLUMN discovered_products.buy_url IS 'Primary purchase URL for the product';
COMMENT ON COLUMN discovered_products.source_link IS 'Affiliate/product link mentioned in the source video/article';
