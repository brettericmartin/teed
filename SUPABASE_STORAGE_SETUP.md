# Supabase Storage Setup for Item Photos

## Overview
Before you can upload item photos, you need to create a storage bucket in Supabase and configure RLS policies.

---

## Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/jvljmfdroozexzodqupg

2. **Navigate to Storage:**
   - Click "Storage" in the left sidebar
   - Click "New bucket"

3. **Create Bucket:**
   - **Name:** `item-photos`
   - **Public bucket:** ✅ **Check this box** (so photos are publicly accessible)
   - Click "Create bucket"

---

## Step 2: Set Up RLS Policies

### 2a. Allow Authenticated Users to Upload

1. Click on the `item-photos` bucket
2. Go to "Policies" tab
3. Click "New Policy"
4. Choose "Custom" policy
5. **Configuration:**
   - **Policy name:** `Allow authenticated users to upload`
   - **Allowed operation:** INSERT
   - **Target roles:** authenticated
   - **Policy definition:**
     ```sql
     (bucket_id = 'item-photos')
     ```
6. Click "Save policy"

### 2b. Allow Public Read Access (Anon Users)

1. Click "New Policy" again
2. Choose "Custom" policy
3. **Configuration:**
   - **Policy name:** `Allow public read access`
   - **Allowed operation:** SELECT
   - **Target roles:** anon (this is the "public" role in Supabase)
   - **Policy definition:**
     ```sql
     (bucket_id = 'item-photos')
     ```
4. Click "Save policy"

### 2c. Allow Users to Delete Their Own Photos

1. Click "New Policy" again
2. Choose "Custom" policy
3. **Configuration:**
   - **Policy name:** `Allow users to delete own photos`
   - **Allowed operation:** DELETE
   - **Target roles:** authenticated
   - **Policy definition:**
     ```sql
     (bucket_id = 'item-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
     ```
     *(This checks if the first folder in the path matches the user's ID)*
4. Click "Save policy"

---

## Step 3: Verify Setup

Run this test to verify everything works:

```bash
cd /home/brettm/development/teed/teed
npm run dev
```

1. Open http://localhost:3000
2. Login to your account
3. Go to a bag
4. Expand an item
5. Try uploading a photo in the "Photo" section
6. If successful, the photo should appear!

---

## Storage Path Structure

Photos are organized by user ID and item ID:

```
item-photos/
  {user_id}/
    {item_id}/
      {timestamp}.jpg
```

Example:
```
item-photos/
  abc123-def456/
    item-789xyz/
      1700000000000.jpg
```

---

## How API Uploads Work (Technical Explanation)

**Question:** If only authenticated users can INSERT, how does the API upload photos?

**Answer:** The API uses the **Service Role Key**, which **bypasses RLS policies entirely**.

### The Flow:

1. **User uploads photo** → Sends to `/api/media/upload`
2. **API checks authentication** → Verifies user is logged in (using anon key)
3. **API verifies ownership** → Confirms user owns the item
4. **API uploads to storage** → Uses **service role key** (`SUPABASE_SERVICE_ROLE_KEY`)
5. **Service role bypasses RLS** → Can INSERT even though policy says "authenticated only"

### Code Example:

```typescript
// In lib/supabaseStorage.ts
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // 🔑 Service role = bypass RLS
  );
}

// In app/api/media/upload/route.ts
// 1. Check auth with anon key (respects RLS)
const supabase = createServerClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY // Regular key, RLS enforced
);
const { data: { user } } = await supabase.auth.getUser();
if (!user) return 401; // Must be logged in

// 2. Upload with service role (bypasses RLS)
await uploadItemPhoto(file, userId, itemId); // Uses service role internally
```

### Why This Is Secure:

✅ API endpoint checks authentication before allowing upload
✅ API verifies user owns the item
✅ Service role only used server-side (never exposed to browser)
✅ RLS policies still protect direct database access

### The Roles:

| Role | Access Level | Used By |
|------|--------------|---------|
| `anon` | Unauthenticated users | Browser (before login) |
| `authenticated` | Logged-in users | Browser (after login) |
| `service_role` | **Bypasses ALL RLS** | Server-side APIs only |

---

## Troubleshooting

### Error: "Failed to upload photo: new row violates row-level security policy"

**Solution:** Make sure you created the INSERT policy for authenticated users (Step 2a)

### Error: "Image not loading"

**Solution:**
1. Make sure the bucket is marked as **Public**
2. Verify the SELECT policy exists (Step 2b)

### Error: "Cannot delete photo"

**Solution:** Check that the DELETE policy exists (Step 2c) and uses the correct path check

---

## Migration Check

Verify the `media_assets` table exists:

```sql
SELECT * FROM media_assets LIMIT 1;
```

If it doesn't exist, you need to create it:

```sql
CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  source_type text,
  alt text,
  width integer,
  height integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_media_assets_owner ON media_assets(owner_id);
```

---

## Next Steps

Once setup is complete:
1. Upload photos to items
2. Photos appear as thumbnails on item cards
3. Click expand to manage photos (change/delete)
4. Photos are stored permanently in Supabase Storage

---

## Cost Estimates

**Supabase Storage Pricing (Free Tier):**
- **Storage:** 1GB free
- **Bandwidth:** 2GB/month free
- **API Requests:** Unlimited

**Average photo:** ~200KB
- **1GB** = ~5,000 photos
- **2GB bandwidth** = ~10,000 photo views/month

For most users, this stays within free tier!
