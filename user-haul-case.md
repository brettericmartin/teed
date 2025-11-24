# Influencer Shopping Haul Use Case - Complete Workflow & Page Requirements

**Document Purpose:** Comprehensive specification for influencer shopping haul functionality on Teed, enabling content creators to monetize their haul videos/content through affiliate links, codes, and curated product lists.

**Target User:** Content creators/influencers who create shopping haul videos (YouTube, TikTok, Instagram) and need to share product details with monetization capabilities.

**Last Updated:** 2025-01-15

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [User Personas & Use Cases](#user-personas--use-cases)
3. [Complete Workflow Flows](#complete-workflow-flows)
4. [Page Specifications](#page-specifications)
5. [Features & Functionality](#features--functionality)
6. [Integration Requirements](#integration-requirements)
7. [Technical Considerations](#technical-considerations)
8. [Analytics & Reporting](#analytics--reporting)
9. [Consumer Experience](#consumer-experience)

---

## Executive Summary

Influencers creating shopping haul content need a streamlined way to:
- Convert video transcripts or item lists into curated, shoppable product collections
- Automatically or manually attach affiliate links and discount codes to each product
- Generate shareable links and QR codes for their audience
- Track performance and earnings from their haul content
- Provide an engaging, mobile-optimized shopping experience for viewers

This document outlines all workflows, pages, features, and technical requirements to support this use case within the Teed platform.

---

## User Personas & Use Cases

### Primary Persona: Shopping Haul Influencer

**Characteristics:**
- Creates regular shopping haul videos on YouTube, TikTok, or Instagram
- Collaborates with brands and participates in affiliate programs
- Has varying technical expertise (from novice to power user)
- Needs to monetize content efficiently without excessive manual work
- Values time-saving automation but wants control over final output

### Secondary Persona: Micro-Influencer

**Characteristics:**
- Smaller following (1K-100K followers)
- May have limited brand partnerships
- Needs affordable/easy-to-use tools
- Focuses on authenticity and personal recommendations
- May combine affiliate links with personal discount codes

### Use Case Scenarios

**Scenario 1: Video Transcript Processing**
- Influencer uploads YouTube video transcript
- System extracts product mentions using NLP/AI
- Automatically matches products to catalog or creates custom entries
- Generates curated list with affiliate links

**Scenario 2: Manual Item List**
- Influencer types list of items from their haul
- Adds affiliate links/codes manually or from saved presets
- Uploads product photos they took themselves
- Creates shareable page

**Scenario 3: Hybrid Approach**
- Influencer provides basic list
- System enriches with images and descriptions
- Influencer reviews and edits before publishing
- Adds personal notes/reviews to each item

**Scenario 4: Brand Partnership Haul**
- Influencer has specific brand partnerships
- Needs to prioritize certain products
- Requires custom discount codes from brands
- Needs performance reporting for brand collaboration

**Scenario 5: Seasonal/Themed Hauls**
- "Summer Haul 2024"
- "Target Dollar Spot Haul"
- "Amazon Prime Day Haul"
- Needs categorization and organization

---

## Complete Workflow Flows

### Workflow 1: Initial Setup & Onboarding

**Steps:**
1. **Account Registration**
   - Sign up with email/social login
   - Choose influencer account type
   - Complete profile (handle, display name, bio, avatar)

2. **Affiliate Network Integration**
   - Connect affiliate accounts (Amazon Associates, LTK, ShareASale, etc.)
   - Input default affiliate IDs/tags
   - Upload/store discount codes for various retailers
   - Set regional preferences (US, UK, CA, etc.)

3. **Social Media Linking** (Optional)
   - Link YouTube channel
   - Link TikTok account
   - Link Instagram account
   - Enable auto-posting/sharing features

4. **Brand Partnerships Setup**
   - Add brand partnerships
   - Assign specific affiliate links/codes to brands
   - Set up custom tracking for brand campaigns

5. **Onboarding Tutorial**
   - Walkthrough of key features
   - Sample haul creation demo
   - Best practices guide

**Pages Required:**
- Registration/Login Page
- Profile Setup Page
- Affiliate Integration Page
- Social Media Connection Page
- Brand Partnership Management Page
- Onboarding Tutorial (modal or multi-step)

---

### Workflow 2: Content Submission & Processing

#### Option A: Video Transcript Upload

**Steps:**
1. **Transcript Submission**
   - Upload transcript file (txt, doc, docx)
   - Or paste transcript text directly
   - Or provide YouTube video URL for auto-transcription

2. **AI Processing**
   - Natural language processing extracts product mentions
   - Identifies brands, product names, prices mentioned
   - Creates initial item list

3. **Product Matching**
   - Matches extracted products to catalog
   - Suggests catalog items where available
   - Flags products that need manual entry

4. **Review & Edit**
   - Influencer reviews extracted items
   - Confirms/corrects product names
   - Adds missing items manually
   - Removes items not actually featured

**Pages Required:**
- Content Upload Page (with transcript option)
- Processing Status Page
- Product Extraction Review Page

#### Option B: Manual List Entry

**Steps:**
1. **List Creation**
   - Create new haul
   - Add items one by one
   - Or paste bulk list with formatting

2. **Item Entry**
   - Product name
   - Brand (optional)
   - Price (optional)
   - Notes/description

3. **Affiliate Link Entry**
   - Add affiliate link per item
   - Or use saved preset links
   - Add discount codes

**Pages Required:**
- Manual List Entry Page
- Item Addition Form/Modal

#### Option C: Bulk Import

**Steps:**
1. **CSV/Excel Import**
   - Upload spreadsheet with columns:
     - Product Name
     - Brand
     - Affiliate Link
     - Discount Code
     - Price
     - Notes

2. **Column Mapping**
   - Map spreadsheet columns to fields
   - Preview import

3. **Validation & Import**
   - Validate data
   - Show errors/warnings
   - Confirm and import

**Pages Required:**
- Bulk Import Page
- Import Preview & Validation Page

---

### Workflow 3: Product Enrichment & Customization

**Steps:**
1. **Image Acquisition**
   - Auto-scrape product images from retail sites
   - Or upload custom photos taken by influencer
   - Or select from catalog images
   - Support multiple images per product

2. **Product Details Enhancement**
   - Auto-fetch descriptions from retailers
   - Or write custom descriptions
   - Add pricing information
   - Add availability status

3. **Affiliate Link Attachment**
   - Auto-attach based on product name/brand matching
   - Manual override/addition
   - Support multiple links per product (different retailers)
   - Verify affiliate link validity

4. **Discount Code Integration**
   - Attach discount codes to products
   - Set code expiration dates
   - Display code prominently on product card

5. **Personal Touches**
   - Add influencer notes/reviews per product
   - Include video timestamp links ("See at 2:34")
   - Add "favorite" or "recommended" badges
   - Create categories (e.g., "Beauty", "Home", "Fashion")

**Pages Required:**
- Product Enrichment Dashboard
- Image Upload/Selector Modal
- Product Details Editor
- Affiliate Link Manager
- Discount Code Manager

---

### Workflow 4: Haul Organization & Branding

**Steps:**
1. **Haul Metadata**
   - Set haul title ("Summer Haul 2024")
   - Write haul description
   - Add tags/categories
   - Set publication date

2. **Product Organization**
   - Drag-and-drop reordering
   - Group into categories/sections
   - Add section headers
   - Sort by price, brand, category

3. **Customization**
   - Choose layout style (grid, list, carousel)
   - Select color scheme
   - Add influencer branding/header image
   - Customize button styles

4. **Preview & Test**
   - Preview on desktop
   - Preview on mobile
   - Test all links
   - Review affiliate code display

**Pages Required:**
- Haul Editor Dashboard
- Product Organization Interface
- Customization Panel
- Preview Page (mobile & desktop views)

---

### Workflow 5: Publishing & Distribution

**Steps:**
1. **Link Generation**
   - Generate unique URL (e.g., teed.app/haul/summer-2024-jane)
   - Create custom short link (e.g., teed.app/janeshaul/summer)
   - Set link expiration (optional)

2. **QR Code Creation**
   - Generate QR code for haul page
   - Customize QR code design (colors, logo)
   - Download high-res QR code image
   - Get embed code for websites

3. **Social Media Integration**
   - Generate social media preview cards
   - Create pre-formatted posts for:
     - YouTube description
     - TikTok bio link
     - Instagram story link
     - Twitter/X post

4. **Publishing**
   - Publish immediately or schedule
   - Set visibility (public, unlisted, private)
   - Enable/disable comments
   - Share via integrated social platforms

**Pages Required:**
- Publishing Dashboard
- Link Generator Page
- QR Code Generator & Download Page
- Social Media Sharing Tools Page

---

### Workflow 6: Post-Publish Management

**Steps:**
1. **Ongoing Editing**
   - Edit products/links after publishing
   - Add new items to existing haul
   - Update prices/availability
   - Update discount codes

2. **Link Management**
   - View all generated links
   - Create additional share links with different slugs
   - Deactivate/reactivate links
   - Set link usage limits

3. **Performance Monitoring**
   - View real-time analytics
   - Monitor clicks and conversions
   - Track earnings

4. **Maintenance**
   - Update broken affiliate links
   - Refresh product images/prices
   - Archive old hauls

**Pages Required:**
- Haul Management Dashboard
- Link Management Page
- Edit Published Haul Page

---

### Workflow 7: Analytics & Reporting

**Steps:**
1. **Real-Time Monitoring**
   - View live stats on dashboard
   - See recent activity feed
   - Get notifications for milestones

2. **Detailed Analytics**
   - View analytics per haul
   - Analyze performance by product
   - Track by affiliate network
   - View by date range

3. **Earnings Tracking**
   - View total earnings
   - Breakdown by haul/product
   - Earnings by affiliate network
   - Projected vs actual earnings

4. **Reporting**
   - Generate reports for brand partners
   - Export data (CSV, PDF)
   - Schedule automated reports

**Pages Required:**
- Analytics Dashboard (Overview)
- Detailed Analytics Page
- Earnings Dashboard
- Report Generator Page

---

## Page Specifications

### 1. Influencer Dashboard (Main Hub)

**Purpose:** Central hub for all influencer activities

**Key Sections:**
- **Quick Stats Cards**
  - Total hauls created
  - Total views (last 30 days)
  - Total clicks (last 30 days)
  - Total earnings (last 30 days)

- **Recent Activity Feed**
  - Recently published hauls
  - Recent clicks/conversions
  - New comments/reviews
  - System notifications

- **Quick Actions**
  - "Create New Haul" button
  - "Upload Transcript" button
  - "Import Spreadsheet" button

- **Haul List View**
  - Grid or list of all hauls
  - Filters: Status (draft, published, archived), Date, Performance
  - Sort options: Newest, Most views, Most earnings
  - Search functionality

- **Navigation Menu**
  - Dashboard
  - My Hauls
  - Analytics
  - Earnings
  - Affiliate Links
  - Settings
  - Help/Support

**Features:**
- Responsive design (mobile-optimized)
- Dark/light mode toggle
- Notification bell with alerts
- Quick search across all hauls

---

### 2. Content Upload Page

**Purpose:** Initial entry point for creating new haul content

**Layout Options:**
- **Tab 1: Transcript Upload**
  - File upload area (drag-and-drop)
  - Supported formats: .txt, .doc, .docx, .pdf
  - Or text area for pasting transcript
  - Or YouTube URL input (auto-transcribe)
  - Progress indicator during upload/processing

- **Tab 2: Manual List Entry**
  - Form to add items one by one
  - Or text area with formatting hints
  - Bulk paste option with line breaks
  - Preview of parsed items

- **Tab 3: Spreadsheet Import**
  - File upload (CSV, Excel)
  - Column mapping interface
  - Preview table of imported data
  - Validation errors display

**Features:**
- Auto-save drafts
- Template download (CSV example)
- Help tooltips and examples
- "Continue to Processing" button

---

### 3. Processing Status Page

**Purpose:** Show progress of AI/content processing

**Key Elements:**
- **Progress Indicator**
  - Step 1: Uploading content (0-20%)
  - Step 2: Extracting products (20-50%)
  - Step 3: Matching to catalog (50-70%)
  - Step 4: Enriching with images/details (70-90%)
  - Step 5: Ready for review (100%)

- **Live Updates**
  - Real-time status messages
  - Products found count
  - Matching success rate
  - Estimated time remaining

- **Preview Section** (as processing completes)
  - List of extracted products
  - Confidence scores for matches
  - Items needing manual review

**Features:**
- Email notification when complete (optional)
- Ability to leave page and return later
- Cancel processing option

---

### 4. Product Extraction Review Page

**Purpose:** Review and edit AI-extracted products

**Key Sections:**
- **Extraction Summary**
  - Total products found
  - Successfully matched to catalog
  - Items needing manual entry
  - Low-confidence matches

- **Product List**
  - Each product card shows:
    - Extracted name (editable)
    - Suggested catalog match (with image)
    - Confidence score
    - "Use this match" or "Create custom" buttons

- **Actions per Product:**
  - Edit product name
  - Select/deselect catalog match
  - Add to haul / Remove
  - Add notes

- **Bulk Actions:**
  - Accept all matches
  - Reject all matches
  - Filter by confidence level

**Features:**
- Search/filter products
- Undo/redo functionality
- Save as draft
- "Continue to Enrichment" button

---

### 5. Product Enrichment Dashboard

**Purpose:** Add images, links, codes, and details to products

**Layout:**
- **Product List Sidebar**
  - Scrollable list of all products in haul
  - Active product highlighted
  - Checkmarks for completed items

- **Main Editing Area**
  - Large product image (upload/scrape/select)
  - Product name and details form
  - Affiliate links section
  - Discount codes section
  - Notes/review section
  - Video timestamp link (optional)

- **Quick Actions**
  - "Auto-fill from catalog" button
  - "Scrape images" button
  - "Generate affiliate links" button
  - "Save & Next" button

**Product Card Components:**
- **Image Section**
  - Current image display
  - Upload new image
  - Scrape from URL
  - Select from catalog
  - Multiple image support (gallery)

- **Product Details**
  - Name (editable)
  - Brand (editable, autocomplete)
  - Description (editable, with AI assist)
  - Price (editable)
  - Availability toggle

- **Affiliate Links**
  - Link list (multiple retailers supported)
  - Add new link (with retailer selector)
  - Edit/delete links
  - Test link button
  - Default link indicator

- **Discount Codes**
  - Code input field
  - Expiration date picker
  - Code description/notes
  - Auto-apply to links toggle

- **Personal Touch**
  - Notes/review text area
  - Video timestamp (e.g., "2:34")
  - "Favorite" badge toggle
  - "Recommended" badge toggle

**Features:**
- Auto-save every few seconds
- Keyboard shortcuts for navigation
- Duplicate product detection
- Link validation

---

### 6. Haul Organization & Editor Page

**Purpose:** Organize products and customize haul appearance

**Key Sections:**
- **Product Organization**
  - Drag-and-drop list/grid
  - Category grouping
  - Section headers
  - Sort options (manual, name, price, brand)

- **Haul Metadata**
  - Title input
  - Description editor (rich text)
  - Tags input (autocomplete)
  - Publication date picker
  - Visibility settings

- **Categories/Sections**
  - Create/edit categories
  - Assign products to categories
  - Category headers on public page
  - Collapsible sections

- **Customization Panel**
  - Layout options:
    - Grid view (2, 3, 4 columns)
    - List view
    - Carousel view
  - Color scheme selector
  - Font choices
  - Header image upload
  - Button style options

- **Preview Pane**
  - Live preview of public page
  - Mobile/desktop toggle
  - Share preview link

**Features:**
- Undo/redo for organization changes
- Keyboard shortcuts
- Auto-save
- Version history (optional)

---

### 7. Publishing Dashboard

**Purpose:** Generate links, QR codes, and publish haul

**Key Sections:**
- **Link Generation**
  - Generated URL display (editable slug)
  - Custom short link option
  - Link expiration settings
  - Usage limits (optional)

- **QR Code Generation**
  - QR code preview
  - Size selector
  - Color customization
  - Logo overlay option
  - Download buttons (PNG, SVG, PDF)

- **Social Media Tools**
  - Pre-formatted post templates:
    - YouTube description
    - TikTok bio link
    - Instagram story link
    - Twitter/X post
    - Facebook post
  - Copy buttons for each
  - Preview cards for each platform

- **Publishing Options**
  - Publish now button
  - Schedule publication
  - Unpublish/unlist option
  - Private/public toggle

**Features:**
- QR code generation in real-time
- Link testing
- Preview of social media cards
- Share directly to connected social accounts

---

### 8. Public Haul View Page (Consumer-Facing)

**Purpose:** Display haul to viewers/consumers

**Key Sections:**
- **Header**
  - Influencer profile (avatar, name)
  - Haul title
  - Haul description
  - Published date

- **Product Grid/List**
  - Product cards with:
    - Product image (clickable gallery)
    - Product name
    - Brand
    - Price (if available)
    - Influencer notes/review
    - Video timestamp link (if applicable)
    - Discount code (prominent display)
    - "Shop Now" button(s) (multiple retailers)
    - "Copy Code" button

- **Categories/Sections** (if used)
  - Collapsible category sections
  - Filter by category
  - Category badges

- **Navigation**
  - Back to influencer profile
  - Share buttons
  - Print-friendly view

**Product Card Details:**
- Image gallery (swipe on mobile)
- Product name (clickable for details)
- Brand name
- Price display
- Availability status
- Discount code (with copy button)
- Multiple retailer links (dropdown or tabs)
- Influencer review/notes
- Video link ("Watch at 2:34")
- Add to favorites (if logged in)

**Features:**
- Mobile-optimized responsive design
- Fast loading (lazy images)
- SEO optimized
- Social sharing meta tags
- Print-friendly CSS
- Dark mode support

---

### 9. Analytics Dashboard (Overview)

**Purpose:** High-level performance metrics

**Key Metrics:**
- **Total Stats Cards**
  - Total hauls
  - Total views (all-time, last 30 days, last 7 days)
  - Total clicks
  - Total conversions
  - Total earnings (all-time, last 30 days, last 7 days)
  - Conversion rate

- **Trend Charts**
  - Views over time (line chart)
  - Clicks over time
  - Earnings over time
  - Date range selector

- **Top Performing Hauls**
  - List/table of hauls ranked by:
    - Most views
    - Most clicks
    - Most earnings
    - Best conversion rate

- **Recent Activity**
  - Recent clicks
  - Recent conversions
  - Recent earnings

**Features:**
- Date range picker
- Export data (CSV, PDF)
- Comparison mode (compare date ranges)
- Real-time updates

---

### 10. Detailed Analytics Page

**Purpose:** Deep dive into specific haul or overall performance

**Views:**
- **By Haul**
  - Select haul from dropdown
  - View metrics for that haul:
    - Views over time
    - Clicks per product
    - Conversion rate
    - Earnings breakdown
    - Top products by performance
    - Geographic data (if available)
    - Device breakdown
    - Referral sources

- **By Product**
  - Table/list of all products across hauls
  - Metrics per product:
    - Total views
    - Total clicks
    - Total conversions
    - Earnings per product
    - Click-through rate
    - Conversion rate

- **By Affiliate Network**
  - Performance by network:
    - Amazon Associates
    - LTK
    - ShareASale
    - etc.
  - Earnings breakdown
  - Click breakdown

- **Custom Reports**
  - Date range selection
  - Metric selection
  - Filter options
  - Export functionality

**Features:**
- Interactive charts (hover for details)
- Drill-down capability
- Comparison views
- Export options

---

### 11. Earnings Dashboard

**Purpose:** Track and manage earnings

**Key Sections:**
- **Earnings Summary**
  - Total earnings (all-time)
  - Pending earnings
  - Paid earnings
  - Earnings this month
  - Projected earnings (if available)

- **Earnings Timeline**
  - Chart showing earnings over time
  - Grouped by month/week
  - Filter by affiliate network

- **Earnings Breakdown**
  - By haul
  - By product
  - By affiliate network
  - By date range

- **Payout Information**
  - Payout history
  - Pending payouts
  - Payment method settings
  - Tax information (if applicable)

**Features:**
- Export earnings reports
- Filter and sort options
- Estimated vs actual earnings comparison
- Payout schedule information

---

### 12. Affiliate Links Management Page

**Purpose:** Manage saved affiliate links and codes

**Key Sections:**
- **Saved Affiliate Links**
  - List/table of saved links
  - Columns: Retailer, Default Link Template, Status, Actions
  - Add new link button
  - Edit/delete links

- **Default Affiliate IDs**
  - Per retailer affiliate IDs
  - Regional variations
  - Default codes/links

- **Discount Codes**
  - List of saved discount codes
  - Code, Retailer, Expiration, Status
  - Bulk upload option
  - Edit/delete codes

- **Affiliate Network Connections**
  - Connected networks
  - Connection status
  - Disconnect/refresh options

**Features:**
- Link validation
- Bulk import/export
- Template creation
- Auto-generation from product names

---

### 13. Settings Page

**Purpose:** Account and preference management

**Key Sections:**
- **Profile Settings**
  - Display name
  - Handle/username
  - Bio
  - Avatar upload
  - Website/blog URL

- **Notification Settings**
  - Email notifications
  - Push notifications
  - Notification preferences:
    - New clicks
    - Conversions
    - Earnings milestones
    - System updates

- **Affiliate Defaults**
  - Default affiliate IDs
  - Preferred retailers
  - Regional settings

- **Privacy Settings**
  - Public profile toggle
  - Analytics visibility
  - Data sharing preferences

- **Billing & Payment**
  - Payment method
  - Payout preferences
  - Tax information
  - Subscription (if applicable)

- **Connected Accounts**
  - Social media accounts
  - Affiliate networks
  - Third-party integrations

**Features:**
- Save changes confirmation
- Two-factor authentication
- Account deletion option

---

### 14. Help & Support Page

**Purpose:** Resources and support for influencers

**Key Sections:**
- **Documentation**
  - Getting started guide
  - FAQ
  - Video tutorials
  - Best practices

- **Support Channels**
  - Contact support form
  - Live chat (if available)
  - Email support
  - Community forum

- **Resources**
  - Templates
  - Examples
  - Case studies
  - Affiliate marketing tips

**Features:**
- Searchable documentation
- Video embeds
- Downloadable guides
- Feedback form

---

## Features & Functionality

### Core Features

#### 1. AI-Powered Product Extraction
- **Natural Language Processing**
  - Extract product names from transcripts
  - Identify brands and prices
  - Handle variations in product naming
  - Multi-language support (future)

- **Product Matching**
  - Match to catalog items
  - Confidence scoring
  - Suggest alternatives
  - Handle brand variations

- **Image Recognition** (future)
  - Analyze video frames
  - Identify products in images
  - Auto-extract product info

#### 2. Product Image Management
- **Auto-Scraping**
  - Scrape from retail websites
  - Multiple image sources
  - Quality filtering
  - Automatic cropping/resizing

- **Manual Upload**
  - Drag-and-drop interface
  - Multiple image upload
  - Image editing (crop, rotate)
  - Compression optimization

- **Image Catalog**
  - Store scraped images
  - Reuse across hauls
  - Catalog image selection

#### 3. Affiliate Link Management
- **Auto-Generation**
  - Generate affiliate links from product names
  - Apply default affiliate IDs
  - Support multiple retailers per product

- **Link Validation**
  - Verify link validity
  - Check affiliate link format
  - Warn about expired links

- **Link Templates**
  - Save link templates
  - Apply to multiple products
  - Region-specific variations

- **Multiple Retailer Support**
  - Amazon Associates
  - LTK (LiketoKnow.it)
  - ShareASale
  - CJ Affiliate
  - Custom retailers

#### 4. Discount Code Management
- **Code Storage**
  - Store discount codes
  - Set expiration dates
  - Code descriptions
  - Retailer association

- **Auto-Application**
  - Auto-apply codes to links
  - Display prominently on product cards
  - Copy-to-clipboard functionality

- **Code Tracking**
  - Track code usage
  - Expiration reminders
  - Performance metrics

#### 5. Content Customization
- **Layout Options**
  - Grid layouts (2, 3, 4 columns)
  - List view
  - Carousel view
  - Responsive breakpoints

- **Branding**
  - Custom color schemes
  - Font selection
  - Header images
  - Logo placement

- **Organization**
  - Product categories
  - Section headers
  - Drag-and-drop reordering
  - Sort options

#### 6. Sharing & Distribution
- **Link Generation**
  - Unique URLs
  - Custom slugs
  - Short links
  - Link expiration

- **QR Codes**
  - Multiple size options
  - Custom colors
  - Logo overlay
  - Multiple format downloads

- **Social Media Integration**
  - Pre-formatted posts
  - Auto-posting (optional)
  - Social media preview cards
  - Platform-specific optimization

### Advanced Features

#### 7. Analytics & Insights
- **Real-Time Tracking**
  - Live view counts
  - Real-time click tracking
  - Conversion tracking
  - Engagement metrics

- **Performance Analysis**
  - Product performance comparison
  - Haul performance trends
  - Geographic insights
  - Device breakdown
  - Referral source tracking

- **Earnings Tracking**
  - Commission tracking
  - Earnings projections
  - Payout tracking
  - Tax reporting support

#### 8. Automation Features
- **Scheduled Publishing**
  - Schedule haul publication
  - Auto-unpublish on expiration
  - Time-based link activation

- **Auto-Updates**
  - Price monitoring
  - Availability updates
  - Link health checks
  - Image refresh

- **Notifications**
  - Earnings milestones
  - High click/conversion rates
  - Expiring discount codes
  - Broken link alerts

#### 9. Collaboration Features (Future)
- **Team Accounts**
  - Multiple users per account
  - Role-based permissions
  - Shared affiliate links

- **Brand Collaboration**
  - Brand partner portals
  - Custom tracking for brands
  - Performance reporting for partners

#### 10. Mobile App Features (Future)
- **Mobile Upload**
  - Upload photos directly
  - Quick item entry
  - Voice-to-text transcription

- **Mobile Management**
  - View analytics on mobile
  - Quick edits
  - Push notifications

---

## Integration Requirements

### 1. Affiliate Network Integrations

#### Amazon Associates
- API for link generation
- Earnings reporting API
- Product data API (if available)
- Regional support (US, UK, CA, etc.)

#### LTK (LiketoKnow.it)
- OAuth integration
- Link generation API
- Earnings tracking
- Product catalog access

#### ShareASale
- API for link generation
- Reporting API
- Commission tracking

#### CJ Affiliate
- Link building API
- Performance reporting
- Product feed access

#### Custom Retailers
- Manual link entry
- Link template system
- Custom tracking parameters

### 2. Social Media Integrations

#### YouTube
- OAuth for channel linking
- Video metadata API
- Description updating (if permitted)
- Analytics integration (future)

#### TikTok
- OAuth (if API available)
- Bio link updates (if permitted)
- Analytics (if available)

#### Instagram
- Basic link in bio support
- Story link support
- Analytics (if available)

### 3. Payment & Payout Integrations

#### Stripe Connect
- Earnings payouts
- Tax information collection
- Payout scheduling

#### PayPal
- Alternative payout method
- Mass payout API

### 4. Third-Party Services

#### Image CDN
- Cloudinary or similar
- Image optimization
- Delivery network

#### Email Service
- Transactional emails (SendGrid, etc.)
- Notification emails
- Marketing emails (future)

#### Analytics
- Google Analytics integration
- Custom event tracking
- Conversion tracking

---

## Technical Considerations

### 1. Data Model Extensions

Based on existing Teed schema, additional tables/fields needed:

#### Hauls Table (extends `bags`)
- `haul_type` (text) - 'video_transcript', 'manual_list', etc.
- `video_url` (text, nullable)
- `transcript_id` (uuid, nullable)
- `processing_status` (text)
- `published_at` (timestamptz, nullable)
- `scheduled_publish_at` (timestamptz, nullable)
- `expires_at` (timestamptz, nullable)
- `influencer_id` (uuid) → profiles.id
- `view_count` (integer, default 0)
- `click_count` (integer, default 0)
- `conversion_count` (integer, default 0)
- `total_earnings` (numeric, default 0)

#### Discount Codes Table
- `id` (uuid, PK)
- `influencer_id` (uuid) → profiles.id
- `code` (text)
- `retailer` (text)
- `description` (text, nullable)
- `expires_at` (timestamptz, nullable)
- `usage_count` (integer, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

#### Affiliate Links Table (extends existing or new)
- `id` (uuid, PK)
- `influencer_id` (uuid) → profiles.id
- `product_name` (text) - for matching
- `retailer` (text)
- `link_template` (text) - with placeholders
- `default_affiliate_id` (text)
- `region` (text, default 'US')
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

#### Haul Items Table (extends `bag_items`)
- All existing `bag_items` fields
- `video_timestamp` (text, nullable) - e.g., "2:34"
- `is_favorite` (boolean, default false)
- `is_recommended` (boolean, default false)
- `category` (text, nullable)
- `discount_code_id` (uuid, nullable) → discount_codes.id
- `primary_affiliate_link` (uuid, nullable) → links.id
- `click_count` (integer, default 0)
- `conversion_count` (integer, default 0)
- `earnings` (numeric, default 0)

#### Analytics Events Table (extends existing)
- All existing fields
- `haul_id` (uuid, nullable) → hauls.id
- `event_type` values: 'view', 'click', 'conversion', 'code_copied', etc.
- `referrer` (text, nullable)
- `user_agent` (text, nullable)
- `ip_address` (text, nullable) - hashed for privacy
- `device_type` (text, nullable)
- `country` (text, nullable)

#### QR Codes Table
- `id` (uuid, PK)
- `haul_id` (uuid) → hauls.id
- `code_data` (text) - the URL encoded
- `design_settings` (jsonb) - colors, logo, etc.
- `download_count` (integer, default 0)
- `created_at` (timestamptz)

### 2. API Endpoints Needed

#### Haul Management
- `POST /api/hauls` - Create new haul
- `GET /api/hauls/[id]` - Get haul details
- `PUT /api/hauls/[id]` - Update haul
- `DELETE /api/hauls/[id]` - Delete haul
- `POST /api/hauls/[id]/publish` - Publish haul
- `POST /api/hauls/[id]/unpublish` - Unpublish haul

#### Content Processing
- `POST /api/hauls/upload-transcript` - Upload transcript
- `POST /api/hauls/process-transcript` - Process transcript with AI
- `GET /api/hauls/[id]/processing-status` - Get processing status
- `POST /api/hauls/extract-products` - Extract products from text

#### Product Management
- `POST /api/hauls/[id]/items` - Add item to haul
- `PUT /api/hauls/items/[id]` - Update item
- `DELETE /api/hauls/items/[id]` - Delete item
- `POST /api/hauls/items/[id]/images` - Upload image
- `POST /api/hauls/items/[id]/scrape-image` - Scrape product image
- `PUT /api/hauls/items/reorder` - Reorder items

#### Affiliate Links
- `POST /api/affiliate-links` - Create affiliate link
- `GET /api/affiliate-links` - List affiliate links
- `PUT /api/affiliate-links/[id]` - Update affiliate link
- `DELETE /api/affiliate-links/[id]` - Delete affiliate link
- `POST /api/affiliate-links/generate` - Generate link for product

#### Discount Codes
- `POST /api/discount-codes` - Create discount code
- `GET /api/discount-codes` - List discount codes
- `PUT /api/discount-codes/[id]` - Update discount code
- `DELETE /api/discount-codes/[id]` - Delete discount code

#### Link Generation
- `POST /api/hauls/[id]/generate-link` - Generate shareable link
- `POST /api/hauls/[id]/generate-qr` - Generate QR code
- `GET /api/qr-codes/[id]/download` - Download QR code

#### Analytics
- `GET /api/analytics/overview` - Get overview stats
- `GET /api/analytics/hauls/[id]` - Get haul analytics
- `GET /api/analytics/earnings` - Get earnings data
- `GET /api/analytics/products` - Get product performance

#### Public Endpoints
- `GET /api/public/hauls/[slug]` - Get public haul view
- `POST /api/public/hauls/[slug]/track-view` - Track page view
- `POST /api/public/hauls/[slug]/track-click` - Track link click
- `POST /api/public/hauls/[slug]/track-conversion` - Track conversion

### 3. AI/ML Services Needed

#### Natural Language Processing
- Product name extraction from transcripts
- Brand identification
- Price extraction
- Product description generation

#### Image Processing
- Product image scraping
- Image quality assessment
- Automatic cropping/resizing
- Image deduplication

#### Product Matching
- Fuzzy product name matching
- Brand name normalization
- Catalog matching algorithms

### 4. Background Jobs/Workers

#### Processing Jobs
- Transcript processing
- Product extraction
- Image scraping
- Link validation
- Price updates

#### Scheduled Jobs
- Expiring discount code notifications
- Broken link checks
- Price monitoring
- Earnings aggregation
- Analytics rollups

---

## Analytics & Reporting

### Metrics to Track

#### Haul-Level Metrics
- Total views
- Unique visitors
- Average time on page
- Bounce rate
- Total clicks (all products)
- Total conversions
- Conversion rate
- Total earnings
- Earnings per view
- Products clicked

#### Product-Level Metrics
- Views per product
- Clicks per product
- Click-through rate
- Conversions per product
- Conversion rate
- Earnings per product
- Most popular products

#### Time-Based Metrics
- Views over time (hourly, daily, weekly)
- Clicks over time
- Conversions over time
- Earnings over time
- Best performing days/times

#### Engagement Metrics
- Discount code copies
- Video timestamp clicks
- Social shares
- Comments (if enabled)
- Return visitors

#### Audience Metrics (if available)
- Geographic distribution
- Device breakdown
- Browser breakdown
- Referral sources
- Traffic sources

### Reporting Features

#### Standard Reports
- Daily summary
- Weekly summary
- Monthly summary
- Custom date range

#### Export Options
- CSV export
- PDF reports
- Excel export
- JSON API access

#### Brand Partner Reports
- Performance reports for brand collaborations
- Customizable branding
- Scheduled delivery
- White-label option (future)

---

## Consumer Experience

### Landing on Haul Page

**User Journey:**
1. Consumer clicks link or scans QR code
2. Lands on haul page
3. Sees influencer profile and haul overview
4. Browses product grid/list
5. Clicks on product of interest
6. Views product details
7. Clicks affiliate link
8. Redirected to retailer
9. Makes purchase (tracked via affiliate)

### Key Consumer Features

#### Product Discovery
- Clean, visually appealing layout
- High-quality product images
- Clear product names and descriptions
- Easy navigation

#### Shopping Assistance
- Multiple retailer options (if available)
- Discount codes prominently displayed
- "Copy Code" one-click functionality
- Direct "Shop Now" buttons
- Price comparisons (if available)

#### Engagement
- Video timestamp links ("See in video")
- Influencer notes/reviews
- Social sharing options
- Mobile-optimized experience

#### Trust & Transparency
- Clear affiliate disclosure
- Influencer authenticity
- Product authenticity indicators
- Secure link handling

### Mobile Optimization

**Critical for Consumer Experience:**
- Responsive design
- Touch-friendly buttons
- Fast loading times
- Optimized images
- One-thumb navigation
- Easy code copying
- Swipe gestures for images

---

## Additional Considerations

### 1. Compliance & Legal

#### Affiliate Disclosure
- FTC-compliant disclosures
- Platform-specific requirements
- International compliance (GDPR, etc.)

#### Privacy
- Cookie consent (if using tracking)
- Privacy policy
- Data handling transparency

#### Terms of Service
- Influencer terms
- Consumer terms
- Affiliate program compliance

### 2. Scalability

#### Performance
- CDN for images
- Database optimization
- Caching strategies
- Background job processing

#### Infrastructure
- Auto-scaling
- Load balancing
- Database sharding (if needed)
- Image storage optimization

### 3. Security

#### Data Protection
- Encryption at rest and in transit
- Secure affiliate link handling
- Payment information security
- User data protection

#### Access Control
- Authentication and authorization
- API rate limiting
- Bot protection
- DDoS mitigation

### 4. Future Enhancements

#### Potential Features
- Video frame extraction and product tagging
- Live shopping integration
- Chatbot for product questions
- Wishlist functionality for consumers
- Email marketing integration
- SMS notifications
- Browser extension for easy link creation
- Mobile app for influencers
- AI-powered content suggestions
- Collaboration tools for agencies
- Multi-language support

---

## Integration with Existing Teed Platform

### Leveraging Existing Schema

**Existing Tables to Use:**
- `profiles` - Influencer accounts
- `bags` - Hauls (extend with haul-specific fields)
- `bag_items` - Products in hauls (extend as needed)
- `share_links` - Generated share links
- `media_assets` - Product images
- `analytics_events` - Tracking events

**New Tables Needed:**
- Haul-specific metadata (or extend `bags`)
- Discount codes
- Affiliate link templates
- QR codes
- Processing jobs/status

### Extending Existing Features

**Share Links:**
- Extend to support haul-specific sharing
- Add QR code generation
- Add usage tracking per haul

**Media Assets:**
- Support product image scraping
- Batch image processing
- Image optimization pipeline

**Analytics:**
- Extend tracking for haul-specific events
- Add earnings tracking
- Add conversion tracking

---

## Conclusion

This document provides a comprehensive specification for implementing influencer shopping haul functionality within the Teed platform. The workflows, pages, and features outlined here will enable influencers to efficiently monetize their content while providing an excellent experience for their audience.

**Key Success Factors:**
1. Streamlined content submission and processing
2. Powerful but intuitive editing tools
3. Seamless affiliate link and code management
4. Comprehensive analytics and reporting
5. Excellent consumer-facing experience
6. Mobile-first design

**Priority Implementation Phases:**

**Phase 1 (MVP):**
- Basic content upload (manual list)
- Product enrichment (manual)
- Link generation
- Basic public page
- Simple analytics

**Phase 2:**
- Transcript processing
- Auto image scraping
- Auto affiliate link generation
- QR code generation
- Detailed analytics

**Phase 3:**
- Advanced AI features
- Social media integration
- Advanced customization
- Brand collaboration features
- Mobile app

This specification should be reviewed alongside other user case documents to identify common features and ensure cohesive platform design.

---

**End of Document**





