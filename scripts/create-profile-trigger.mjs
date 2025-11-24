import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Crimsonblue1201!@db.jvljmfdroozexzodqupg.supabase.co:5432/postgres'
});

async function createTrigger() {
  console.log('Connecting to database...');
  await client.connect();

  console.log('Creating profile trigger function...\n');

  // Create the function
  const functionSQL = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = ''
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, handle, display_name, bio, avatar_url)
      VALUES (
        NEW.id,
        COALESCE(
          NEW.raw_user_meta_data->>'handle',
          LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'))
        ),
        COALESCE(
          NEW.raw_user_meta_data->>'display_name',
          SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'bio',
        NEW.raw_user_meta_data->>'avatar_url'
      );
      RETURN NEW;
    EXCEPTION
      WHEN unique_violation THEN
        -- Handle duplicate handle by appending random suffix
        INSERT INTO public.profiles (id, handle, display_name, bio, avatar_url)
        VALUES (
          NEW.id,
          LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '', 'g')) || SUBSTR(NEW.id::text, 1, 4),
          COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'bio',
          NEW.raw_user_meta_data->>'avatar_url'
        );
        RETURN NEW;
    END;
    $$;
  `;

  try {
    await client.query(functionSQL);
    console.log('✓ Function created successfully');
  } catch (err) {
    console.error('Error creating function:', err.message);
  }

  // Create the trigger
  console.log('\nCreating trigger on auth.users...');

  const triggerSQL = `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `;

  try {
    await client.query(triggerSQL);
    console.log('✓ Trigger created successfully');
  } catch (err) {
    console.error('Error creating trigger:', err.message);
  }

  // Verify trigger exists
  console.log('\nVerifying trigger...');
  const verifySQL = `
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created';
  `;

  try {
    const result = await client.query(verifySQL);
    if (result.rows.length > 0) {
      console.log('✓ Trigger verified:', result.rows[0].trigger_name);
    } else {
      console.log('⚠ Trigger not found in information_schema (may be in auth schema)');
    }
  } catch (err) {
    console.error('Error verifying:', err.message);
  }

  await client.end();
  console.log('\nDone!');
}

createTrigger().catch(console.error);
