# Follow System & Discovery with Filters

Complete social and discovery features for Teed, allowing users to follow each other and discover bags with powerful filtering.

## Features Implemented

### 1. Database Schema
- **follows table** with RLS policies
- **category field** on bags table for filtering
- Helper functions: `get_follower_count()`, `get_following_count()`, `is_following()`
- Indexes for performance optimization
- Constraints: no self-follow, unique follow relationships

### 2. API Endpoints

#### Follow/Unfollow
- `POST /api/follows` - Follow a user
- `DELETE /api/follows/[userId]` - Unfollow a user
- `GET /api/follows/[userId]` - Check if current user follows a user

#### Discovery with Filters
- `GET /api/discover` - Get public bags with optional filters:
  - `?following=true` - Show only bags from followed users
  - `?category=golf` - Filter by category
  - `?search=query` - Search bag titles/descriptions
- `GET /api/auth/session` - Get current user session

### 3. Discover Page (`/discover`)

The unified discovery page with powerful filtering:

**Filter Options:**
- **Following Toggle** - Show only bags from people you follow (requires login)
- **Category Pills** - Filter by category (Golf, Travel, Outdoor, Tech, Fashion, Fitness, Photography, Gaming, Music, Other)
- **Search Bar** - Search bag titles and descriptions
- **Clear Filters** - Reset all filters at once

**Features:**
- Real-time filtering (fetches on filter change)
- Loading states
- Empty states with context-aware messaging
- Grid layout with owner info on each bag
- Same visual style as Dashboard

### 4. UI Components

#### Navigation Updates
- Desktop: Dashboard, Feed, Discover links in navbar
- Mobile: Same links in dropdown menu
- Active state highlighting
- Responsive design

#### User Profile Follow Button
- Follow/Unfollow button on user profiles
- Only shown when:
  - User is authenticated
  - Viewing someone else's profile (not own)
- Loading states
- Visual feedback (different styles for following vs not following)

## User Flow

### Discovering Content
1. Navigate to `/discover`
2. **Filter by Following**: Toggle "Following" to see only bags from users you follow
3. **Filter by Category**: Click category pills to filter (e.g., Golf, Travel, Tech)
4. **Search**: Type in search bar to find specific bags
5. **Combine Filters**: Use multiple filters together (e.g., Following + Golf)
6. Click on bags to view details

### Following a User
1. Browse bags in Discover
2. Click on a bag → view user's profile
3. Click "Follow" button on their profile
4. Return to Discover → toggle "Following" to see their bags

## Technical Details

### Database
- **Follows table**: `scripts/migrations/015_create_follows_table.sql`
- **Categories**: `scripts/migrations/016_add_category_to_bags.sql`
- Run script: `scripts/run-follows-migration.mjs`
- Cleanup script: `scripts/drop-follows.mjs`

### Security
- Row Level Security (RLS) enabled
- Users can only create/delete their own follows
- All follows are publicly viewable (for follower counts)
- Proper authentication checks on all endpoints
- Following filter requires authentication

### Performance
- Indexed columns for fast queries (category, follows)
- Limited results (100 bags per query)
- Featured items loaded with bags
- Photo URLs fetched in batches
- Client-side filtering updates with debounce

### Categories
Available categories with icons:
- ⛳ Golf
- ✈️ Travel
- 🏔️ Outdoor
- 💻 Tech
- 👔 Fashion
- 💪 Fitness
- 📷 Photography
- 🎮 Gaming
- 🎵 Music
- 📦 Other

## Next Steps (Potential Enhancements)

1. **Follower/Following Counts**
   - Display counts on user profiles
   - Show lists of followers/following

2. **Notifications**
   - Notify when someone follows you
   - Notify when followed users post new bags

3. **Search**
   - Search for users by handle or name
   - Search for bags by title or description
   - Filter discover page by categories

4. **Trending**
   - Most followed users
   - Most liked bags
   - Recently active users

5. **Activity Feed**
   - Show when followed users update bags
   - Show when followed users add new items
   - Timeline view of activity
