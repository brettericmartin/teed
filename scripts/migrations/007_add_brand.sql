-- Migration 007: Add brand field to bag_items
-- This allows storing product brand separately for better filtering, search, and organization

ALTER TABLE bag_items
ADD COLUMN brand text;

COMMENT ON COLUMN bag_items.brand IS 'Product brand/manufacturer name (e.g., TaylorMade, MAC, Patagonia)';
