# Admin Affiliate System

Complete platform-level affiliate management system for earning commissions on Teed.

## Overview

The admin affiliate system allows the platform owner (brett.eric.martin@gmail.com) to configure their own affiliate tags. When enabled, **platform tags replace user tags**, allowing Teed to earn commissions on all affiliate links.

## Access

**Admin Dashboard**: `/admin`
**Admin Email**: `brett.eric.martin@gmail.com` (only this email has access)

## How It Works

### Platform-First Strategy

1. **Platform Tags Enabled** → Platform earns 100% of commissions
2. **Platform Tags Disabled** → Users earn 100% of commissions (existing behavior)

When you enable a network and add your affiliate credentials, ALL affiliate links for that network will use YOUR tags instead of user-provided tags.

## Getting Started

### Step 1: Sign Up for Affiliate Programs

Visit `/admin/setup-guides` for detailed step-by-step instructions for:

- **Amazon Associates** - Get your Associate Tag
- **Impact.com** - Get your Publisher ID
- **CJ Affiliate** - Get your Website ID
- **Rakuten** - Get your Merchant/Site IDs (guide coming soon)
- **ShareASale** - Get your Merchant/Affiliate IDs (guide coming soon)

Each guide includes:
- Direct signup links
- Exact information to provide
- What credentials to copy
- Where to paste them in Teed

### Step 2: Configure Your Affiliate Tags

Go to `/admin/affiliate-settings` to:

1. **Enter your affiliate credentials** for each network
2. **Toggle the enable switch** to activate tag injection
3. **Save** your settings

Example for Amazon:
```
Network: Amazon Associates
Status: [Toggle to Enable]
Associate Tag: your-tag-20
```

Once enabled, all Amazon links will use `your-tag-20` instead of user tags.

### Step 3: Start Earning

That's it! The system will automatically:
- Inject your tags into product links
- Track clicks (future feature)
- Earn you commissions on purchases

## Features

### Admin Dashboard (`/admin`)

Central hub with:
- Quick access to affiliate settings
- Setup guides
- Platform overview stats
- Future: Analytics and revenue tracking

### Affiliate Settings (`/admin/affiliate-settings`)

Manage all networks in one place:
- **Enable/Disable** each network individually
- **Configure credentials** for Amazon, Impact, CJ, etc.
- **Save** settings with live feedback
- **Toggle platform vs user revenue mode** per network

### Setup Guides (`/admin/setup-guides`)

Comprehensive guides for signing up:
- Step-by-step instructions
- Copy-paste helpers for common values
- Direct links to signup pages
- Explains what information to collect

## Technical Details

### Database

Table: `platform_affiliate_settings`
- Stores credentials for each network
- `is_enabled` flag to control injection
- Credentials stored as JSONB for flexibility
- Cached for 5 minutes for performance

### Link Injection

The `AffiliateServiceFactory` checks platform settings first:
1. Fetch platform settings (cached)
2. If enabled → use platform tag
3. Else → use user tag (existing behavior)

This means zero changes for users - it just works!

### Security

- **Admin-only access** via email check (`isAdmin()`)
- **Service role** for database access (bypasses RLS)
- **API routes protected** with `requireAdmin()`
- **Credentials stored securely** in database

### Supported Networks

| Network | Status | Credentials Needed |
|---------|--------|-------------------|
| Amazon Associates | ✅ Ready | Associate Tag |
| Impact.com | ✅ Ready | Publisher ID, Campaign ID (optional) |
| CJ Affiliate | ✅ Ready | Website ID / PID |
| Rakuten | 🔄 Coming Soon | MID, SID |
| ShareASale | 🔄 Coming Soon | Merchant ID, Affiliate ID |

## Revenue Model

### Current: 100% Platform or 100% User

- When platform affiliate is **enabled**: Platform earns 100%
- When platform affiliate is **disabled**: Users earn 100%

### Future: Revenue Sharing (Optional)

You could implement:
- 80/20 split (platform/creator)
- 70/30 split for premium creators
- Tiered splits based on performance

This would require:
1. Tracking who generated each click
2. Sub-affiliate IDs for attribution
3. Revenue reporting dashboard
4. Payout system for creators

## Next Steps

### Immediate

1. **Sign up for Amazon Associates** (highest priority - most popular)
2. **Configure your Associate Tag** in `/admin/affiliate-settings`
3. **Enable Amazon** and start earning

### Soon

1. **Add Impact.com** for brand partnerships (Nike, Adidas, etc.)
2. **Add CJ Affiliate** for major retailers
3. **Test** with your own bags to verify tag injection

### Future Enhancements

1. **Click Tracking** - See which bags drive the most clicks
2. **Revenue Dashboard** - Track estimated earnings
3. **Performance Reports** - Best performing products/categories
4. **Revenue Sharing** - Optional splits with top creators
5. **More Networks** - Rakuten, ShareASale, brand-direct programs

## FAQ

**Q: Will users know their tags are being replaced?**
A: No, it's transparent. Links still work the same way.

**Q: Can I enable platform tags for some networks and user tags for others?**
A: Yes! Toggle each network independently.

**Q: What if a user has a better commission rate than me?**
A: You control the toggle. Disable platform mode for that network to let users use their own tags.

**Q: Do I need to tell users about this?**
A: It's your call. Legally, you should disclose in your Terms of Service that you may earn affiliate commissions.

**Q: Can I test if it's working?**
A: Yes! Create a test bag, add an Amazon link, and check the URL - it should have your tag.

## Support

For issues or questions:
1. Check setup guides at `/admin/setup-guides`
2. Verify settings at `/admin/affiliate-settings`
3. Check logs for `[AffiliateServiceFactory]` messages

---

**Admin Access**: Only `brett.eric.martin@gmail.com` can access `/admin` routes.
