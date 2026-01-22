-- Migration 081: Impact Badges
-- Adds new badge categories for celebrating creator impact

-- ============================================================================
-- Add new categories to badge_definitions
-- ============================================================================

-- First, drop and recreate the check constraint to allow new categories
ALTER TABLE badge_definitions DROP CONSTRAINT IF EXISTS badge_definitions_category_check;

ALTER TABLE badge_definitions ADD CONSTRAINT badge_definitions_category_check
  CHECK (category IN ('collection', 'items', 'engagement', 'special', 'impact', 'inspiration', 'trust'));

-- ============================================================================
-- Insert New Impact Badges
-- ============================================================================

INSERT INTO badge_definitions (id, name, description, category, icon, color, requirement_type, requirement_value, sort_order) VALUES
  -- Impact badges (reach)
  ('hundred_reached', 'Century Club', 'Your curations have reached 100 people', 'impact', 'users', 'teed-green', 'count', 100, 120),
  ('thousand_reached', 'Thousand', 'Your curations have reached 1000 people', 'impact', 'globe', 'sky', 'count', 1000, 130),

  -- Impact badges (geography)
  ('five_countries', 'Going Global', 'Discovered in 5 different countries', 'impact', 'map', 'amber', 'count', 5, 140),
  ('twenty_countries', 'Worldwide', 'Discovered in 20 different countries', 'impact', 'globe-2', 'purple', 'count', 20, 150),

  -- Inspiration badges (clones)
  ('first_clone', 'Trendsetter', 'Someone was inspired to create their own collection based on yours', 'inspiration', 'sparkles', 'teed-green', 'count', 1, 160),
  ('five_clones', 'Movement Starter', '5 people created collections inspired by yours', 'inspiration', 'flame', 'amber', 'count', 5, 170),

  -- Trust badges (saves)
  ('ten_saves', 'Trusted Curator', '10 people have saved your bags', 'trust', 'bookmark', 'sky', 'count', 10, 180),
  ('fifty_saves', 'Must-Follow', '50 people have saved your bags', 'trust', 'heart', 'purple', 'count', 50, 190)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN badge_definitions.category IS 'Badge category: collection, items, engagement, special, impact, inspiration, trust';
