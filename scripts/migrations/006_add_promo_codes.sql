-- Migration 006: Add promo_codes field to bag_items
-- This allows storing promotional codes, discount codes, or SKU codes for items

ALTER TABLE bag_items
ADD COLUMN promo_codes text;

COMMENT ON COLUMN bag_items.promo_codes IS 'Promotional codes, discount codes, or SKU codes for this item';
