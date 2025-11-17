-- Migration: Username-scoped bag codes
-- This migration changes bag codes from globally unique to unique per user
-- New URL structure: /u/[handle]/[code] instead of /c/[code]

-- Step 1: Handle any potential duplicates by adding suffixes
-- This ensures no conflicts when we add the new constraint
DO $$
DECLARE
    duplicate_record RECORD;
    new_code TEXT;
    suffix INTEGER;
BEGIN
    -- Find bags that would have duplicate codes within the same owner
    FOR duplicate_record IN
        SELECT b1.id, b1.owner_id, b1.code
        FROM bags b1
        INNER JOIN bags b2 ON b1.owner_id = b2.owner_id AND b1.code = b2.code AND b1.id > b2.id
        ORDER BY b1.owner_id, b1.code, b1.created_at
    LOOP
        -- Generate a new code with suffix
        suffix := 2;
        new_code := duplicate_record.code || '-' || suffix;

        -- Keep incrementing suffix until we find a unique code for this user
        WHILE EXISTS (
            SELECT 1 FROM bags
            WHERE owner_id = duplicate_record.owner_id
            AND code = new_code
        ) LOOP
            suffix := suffix + 1;
            new_code := duplicate_record.code || '-' || suffix;
        END LOOP;

        -- Update the duplicate bag with the new code
        UPDATE bags SET code = new_code WHERE id = duplicate_record.id;

        RAISE NOTICE 'Updated bag % code from % to %', duplicate_record.id, duplicate_record.code, new_code;
    END LOOP;
END $$;

-- Step 2: Drop the global unique constraint
ALTER TABLE bags DROP CONSTRAINT IF EXISTS bags_code_key;
DROP INDEX IF EXISTS idx_bags_code;

-- Step 3: Add composite unique constraint (owner_id, code)
CREATE UNIQUE INDEX idx_bags_owner_code ON bags(owner_id, code);

-- Step 4: Update the generate_bag_code function to check uniqueness per-user
CREATE OR REPLACE FUNCTION generate_bag_code(title_text text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    base_code text;
    final_code text;
    suffix integer;
BEGIN
    -- Convert title to lowercase and replace non-alphanumeric with hyphens
    base_code := lower(regexp_replace(title_text, '[^a-zA-Z0-9]+', '-', 'g'));

    -- Trim leading/trailing hyphens
    base_code := trim(both '-' from base_code);

    -- Limit length to 50 characters
    base_code := substring(base_code from 1 for 50);

    -- Start with the base code
    final_code := base_code;
    suffix := 2;

    -- Check for uniqueness within this user's bags only
    WHILE EXISTS (
        SELECT 1 FROM bags
        WHERE owner_id = user_id
        AND code = final_code
    ) LOOP
        -- Add numeric suffix if code exists for this user
        final_code := base_code || '-' || suffix;
        suffix := suffix + 1;
    END LOOP;

    RETURN final_code;
END;
$$;

-- Step 5: Add helpful comment
COMMENT ON FUNCTION generate_bag_code(text, uuid) IS
'Generates a unique URL-friendly code from a bag title. Codes are unique per user (owner_id), allowing different users to have bags with the same code.';

-- Verification query (run this after migration to check results)
-- SELECT owner_id, code, COUNT(*)
-- FROM bags
-- GROUP BY owner_id, code
-- HAVING COUNT(*) > 1;
-- This should return 0 rows if migration succeeded
