# Follow System Implementation

Complete social features for Teed, allowing users to follow each other and discover bags.

## Features Implemented

### 1. Database Schema
- **follows table** with RLS policies
- Helper functions: `get_follower_count()`, `get_following_count()`, `is_following()`
- Indexes for performance optimization
- Constraints: no self-follow, unique follow relationships

### 2. API Endpoints

#### Follow/Unfollow
- `POST /api/follows` - Follow a user
- `DELETE /api/follows/[userId]` - Unfollow a user
- `GET /api/follows/[userId]` - Check if current user follows a user

#### Feed & Discovery
- `GET /api/feed` - Get bags from users you follow
- `GET /api/discover` - Get all public bags for discovery
- `GET /api/auth/session` - Get current user session

### 3. Pages

#### Feed Page (`/feed`)
- Shows bags from users you follow
- Empty state with link to Discover
- Grid layout with owner info on each bag
- Same visual style as Dashboard

#### Discover Page (`/discover`)
- Browse all public bags from the community
- No authentication required (but enhanced when logged in)
- Grid layout with owner info
- Same visual style as Dashboard and Feed

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

### Following a User
1. Navigate to `/discover` to find users
2. Click on a bag to view the user's profile
3. Click "Follow" button on their profile
4. Their bags will now appear in your `/feed`

### Viewing Your Feed
1. Click "Feed" in navigation
2. See all bags from users you follow
3. Click on any bag to view details
4. Click on owner avatar/name to visit their profile

### Discovering New Content
1. Click "Discover" in navigation
2. Browse all public bags
3. Click on bags to view details
4. Follow users you find interesting

## Technical Details

### Database
- Migration file: `scripts/migrations/015_create_follows_table.sql`
- Run script: `scripts/run-follows-migration.mjs`
- Cleanup script: `scripts/drop-follows.mjs`

### Security
- Row Level Security (RLS) enabled
- Users can only create/delete their own follows
- All follows are publicly viewable (for follower counts)
- Proper authentication checks on all endpoints

### Performance
- Indexed columns for fast queries
- Limited results (50 for feed, 100 for discover)
- Featured items loaded with bags
- Photo URLs fetched in batches

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
