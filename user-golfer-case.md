# Golf YouTuber/Influencer Use Case - Complete Workflow & Page Requirements

**Document Purpose:** Comprehensive specification for golf influencer/YouTuber functionality on Teed, enabling golf content creators to monetize their videos and content through detailed equipment bag lists with affiliate links, discount codes, and curated product information.

**Target User:** Golf YouTubers, golf influencers, golf content creators who create instructional videos, course vlogs, equipment reviews, "what's in my bag" content, unboxings, and golf-related entertainment who need to share their equipment details with monetization capabilities.

**Last Updated:** 2025-01-15

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [User Personas & Use Cases](#user-personas--use-cases)
3. [Golf-Specific Context & Requirements](#golf-specific-context--requirements)
4. [Complete Workflow Flows](#complete-workflow-flows)
5. [Page Specifications](#page-specifications)
6. [Features & Functionality](#features--functionality)
7. [Golf Product Categories & Equipment Types](#golf-product-categories--equipment-types)
8. [Integration Requirements](#integration-requirements)
9. [Technical Considerations](#technical-considerations)
10. [Analytics & Reporting](#analytics--reporting)
11. [Consumer Experience](#consumer-experience)

---

## Executive Summary

Golf YouTubers and influencers creating content around equipment, course play, instruction, and entertainment need a specialized way to:
- Convert video transcripts or equipment lists into detailed, shoppable golf equipment collections
- Handle incomplete or ambiguous equipment mentions (e.g., "Callaway driver" needs clarification to specific model, year, loft, shaft)
- Automatically or manually attach affiliate links and discount codes to golf equipment from specialized retailers
- Generate shareable links and QR codes for their audience to easily access equipment details
- Track performance and earnings specifically for golf equipment affiliate programs
- Provide an engaging, mobile-optimized experience for golf viewers seeking equipment information

This document outlines all workflows, pages, features, and technical requirements to support golf influencers within the Teed platform, with deep consideration for the unique aspects of golf equipment and golf content creation.

---

## User Personas & Use Cases

### Primary Persona: Golf YouTuber/Influencer

**Characteristics:**
- Creates golf content: course vlogs, equipment reviews, "what's in my bag" videos, instruction, unboxings
- Uses equipment throughout videos without always explicitly naming full specifications
- May have brand partnerships (Callaway, Titleist, TaylorMade, Ping, etc.)
- Varies in technical expertise (from casual creators to professional golf instructors)
- Needs to monetize content without disrupting video flow
- Values authenticity and trust with audience
- Often needs to clarify equipment details post-recording
- May use same bag of clubs across multiple videos
- Needs to update equipment as they change clubs

### Secondary Persona: Golf Micro-Influencer

**Characteristics:**
- Smaller following (500-50K subscribers)
- May focus on specific niches (beginner tips, course reviews, budget equipment)
- Limited brand partnerships but active in affiliate programs
- Needs affordable, easy-to-use tools
- Focuses on helping viewers with equipment decisions
- May combine affiliate links with personal discount codes from retailers

### Tertiary Persona: Golf Instructor/Coach

**Characteristics:**
- Creates instructional content
- Uses specific teaching tools and training aids
- Needs to share equipment lists for students/viewers
- May want to monetize recommendations of training aids, practice equipment

### Use Case Scenarios

**Scenario 1: Course Vlog with Equipment in Use**
- Influencer films course vlog without explicitly naming every club
- Mentions clubs casually ("pulled out the 7-iron", "driver off the tee")
- Needs to provide transcript or typed list post-recording
- System must help identify and clarify club specifications
- Creates shareable link for viewers asking "what driver was that?"

**Scenario 2: "What's In My Bag" Explicit Video**
- Dedicated video showcasing all equipment
- Provides detailed list of clubs, shafts, grips, bag, accessories
- May mention specs but not comprehensively
- Needs system to enhance with images, links, codes
- Wants to reuse this bag list across multiple videos

**Scenario 3: Equipment Review/Unboxing**
- Reviews specific new equipment
- Shows product, discusses features, may compare to older models
- Needs detailed product page with affiliate links
- Wants to track performance of specific products reviewed

**Scenario 4: Seasonal/Yearly Bag Updates**
- "My 2024 Bag Setup"
- "Fall Golf Season Bag"
- Changes clubs seasonally or yearly
- Needs to maintain multiple bag lists
- Wants to compare current vs previous setups

**Scenario 5: Brand Partnership Campaign**
- Sponsored by specific brand (e.g., Callaway, Titleist)
- Needs to highlight specific products
- Requires custom tracking for brand reporting
- Needs to comply with FTC disclosure requirements
- May need to generate reports for brand partners

**Scenario 6: Budget/Value-Focused Content**
- Reviews affordable equipment options
- Compares value across retailers
- Needs to show multiple retailer options
- Highlights discount codes and deals

---

## Golf-Specific Context & Requirements

### Unique Challenges in Golf Equipment Identification

**1. Incomplete Product Mentions**
- Golfers often say "my driver" or "Callaway driver" without full model details
- Need clarification system for:
  - Model name (e.g., "Paradym" vs "Rogue ST")
  - Year/model year (2023 vs 2024)
  - Loft (9°, 10.5°, 12°)
  - Shaft type and flex (Regular, Stiff, Extra Stiff, shaft brand)
  - Grip type and size

**2. Customization Complexity**
- Golf clubs are highly customizable
- Same club can have different shafts, grips, lie angles, lofts
- Influencer may need to specify custom builds
- May need to note modifications (e.g., "cut down 1 inch")

**3. Equipment Hierarchy**
- Full bag contains 14+ clubs (driver, fairway woods, hybrids, irons, wedges, putter)
- Each club category has multiple options
- Bag itself is equipment
- Accessories (range finders, GPS devices, training aids)
- Apparel and footwear
- Golf balls (specific brand/model)

**4. Frequent Updates**
- Golfers frequently swap clubs
- May test multiple options
- Seasonal changes
- Yearly model updates
- Need to track current vs past setups

**5. Multiple Retailer Ecosystem**
- Golf-specific retailers (Golf Galaxy, PGA Tour Superstore, Rock Bottom Golf)
- Brand direct (Callaway, Titleist direct stores)
- Amazon (through Associates)
- Specialized sites (2nd Swing, Global Golf, eBay)
- Local pro shops

### Golf Content Creator Workflows

**Typical Content Creation Flow:**
1. Film video (course vlog, review, instruction)
2. Edit and publish video
3. Receive questions about equipment in comments/DMs
4. Need to quickly generate shareable equipment list
5. Update as equipment changes

**Pain Points:**
- Time-consuming to manually list all equipment after filming
- Forgetting exact specifications of clubs
- Difficulty tracking which affiliate links to use for golf equipment
- Managing multiple retailers and affiliate programs
- Need to quickly answer viewer questions
- Maintaining updated equipment lists as clubs change

---

## Complete Workflow Flows

### Workflow 1: Initial Setup & Onboarding (Golf-Specific)

**Steps:**
1. **Account Registration**
   - Sign up with email/social login
   - Choose "Golf Influencer" account type
   - Complete profile (handle, display name, bio, avatar, handicap mention optional)

2. **Golf-Specific Profile Setup**
   - Link YouTube channel
   - Link Instagram account
   - Link TikTok account (if applicable)
   - Specify content focus (reviews, vlogs, instruction, entertainment)
   - Optional: Mention handicap level (if they share it)
   - Brand partnerships (list current partnerships)

3. **Golf Affiliate Network Integration**
   - **Amazon Associates** (primary for general golf equipment)
   - **Golf-Specific Affiliate Programs:**
     - SWAG Golf Affiliate Program (up to 10% commission, 60-day cookie)
     - Golf Galaxy affiliate program
     - PGA Tour Superstore affiliate program
     - Rock Bottom Golf affiliate program
     - Global Golf affiliate program
     - 2nd Swing affiliate program
     - Brand-specific programs (if available)
   - Input default affiliate IDs/tags
   - Set regional preferences (US, UK, CA for golf equipment availability)

4. **Equipment Database Preferences**
   - Preferred brands to highlight
   - Default retailer preferences
   - Product category preferences (new clubs, used clubs, accessories)

5. **Onboarding Tutorial (Golf-Focused)**
   - Walkthrough of golf equipment entry
   - Example: Entering "Callaway driver" and clarification process
   - How to add custom specifications
   - Best practices for golf content creators
   - FTC disclosure requirements for golf affiliate links

**Pages Required:**
- Registration/Login Page
- Golf Influencer Profile Setup Page
- Golf Affiliate Integration Page
- Brand Partnership Management Page
- Golf-Specific Onboarding Tutorial (modal or multi-step)

---

### Workflow 2: Content Submission & Processing (Golf Equipment)

#### Option A: Video Transcript Upload

**Steps:**
1. **Transcript Submission**
   - Upload transcript file (txt, doc, docx) from video
   - Or paste transcript text directly
   - Or provide YouTube video URL for auto-transcription
   - Option to specify video type (course vlog, review, WIMB, instruction)

2. **Golf Equipment AI Processing**
   - Natural language processing extracts golf equipment mentions:
     - Club mentions ("driver", "7-iron", "putter", "wedges")
     - Brand mentions ("Callaway", "Titleist", "TaylorMade")
     - Model names (when mentioned)
     - Accessory mentions ("range finder", "GPS", "golf balls")
   - Identifies incomplete mentions (e.g., "my driver" without brand/model)
   - Flags equipment needing clarification

3. **Golf Product Matching**
   - Matches extracted equipment to golf equipment catalog
   - Suggests catalog items where available
   - Handles golf-specific terminology (loft, shaft flex, grip)
   - Flags products needing manual entry or clarification

4. **Clarification Prompts for Golf Equipment**
   - For ambiguous mentions (e.g., "Callaway driver"):
     - Prompt: "Which Callaway driver model? (e.g., Paradym, Rogue ST, Mavrik)"
     - Prompt: "What loft? (9°, 9.5°, 10.5°, 11.5°, 12°)"
     - Prompt: "Shaft brand and flex? (e.g., Project X 6.5 Stiff)"
   - For generic mentions ("my putter"):
     - Prompt: "Brand?"
     - Prompt: "Model?"
     - Prompt: "Type? (blade, mallet, etc.)"

5. **Review & Edit**
   - Influencer reviews extracted golf equipment
   - Confirms/corrects club specifications
   - Adds missing equipment manually
   - Removes items not actually in bag
   - Adds custom specifications (shaft, grip, modifications)

**Pages Required:**
- Golf Content Upload Page (with transcript option)
- Golf Equipment Processing Status Page
- Golf Product Extraction Review Page
- Golf Equipment Clarification Interface

#### Option B: Manual Equipment List Entry (Golf-Focused)

**Steps:**
1. **Bag Creation**
   - Create new golf bag
   - Name it (e.g., "My 2024 Bag", "Winter Setup", "Tournament Bag")
   - Set as active bag (if they have multiple)

2. **Golf Equipment Entry**
   - **By Club Category:**
     - Driver
     - Fairway Woods (3-wood, 5-wood, etc.)
     - Hybrids
     - Irons (set or individual)
     - Wedges (gap, sand, lob)
     - Putter
   - **Bag & Accessories:**
     - Golf bag
     - Range finder / GPS device
     - Training aids
     - Golf balls
     - Gloves, apparel, footwear
   - For each item, enter:
     - Product name (can be partial, e.g., "Callaway Paradym driver")
     - System prompts for missing details

3. **Specification Entry**
   - If product is recognized, pre-fill specs
   - If not, prompts for:
     - Brand
     - Model name
     - Year (if applicable)
     - Club-specific specs (loft, shaft, grip)
     - Custom modifications (if any)

**Pages Required:**
- Golf Bag Creation Page
- Golf Equipment Entry Form (with category tabs)
- Specification Entry Modal/Interface

#### Option C: Quick Entry from Existing Bag

**Steps:**
1. **Clone Previous Bag**
   - Select existing bag setup
   - Clone to new bag
   - Make updates to reflect current equipment

2. **Quick Edit Mode**
   - Update changed clubs
   - Add new equipment
   - Remove sold/traded clubs

**Pages Required:**
- Bag Management Page
- Quick Edit Interface

---

### Workflow 3: Golf Equipment Clarification & Product Matching

**Unique to Golf:** This workflow is critical due to incomplete mentions.

**Steps:**
1. **Ambiguous Product Detection**
   - System identifies products needing clarification
   - Categorizes by clarification type:
     - Missing model name
     - Missing year/model year
     - Missing specifications (loft, shaft, grip)
     - Generic category only (e.g., "driver" with no brand)

2. **Smart Question System**
   - **For Drivers/Fairway Woods:**
     - Brand → Model → Year → Loft → Shaft → Grip
   - **For Irons:**
     - Brand → Model → Year → Set or individual → Shaft → Grip
   - **For Wedges:**
     - Brand → Model → Year → Loft → Bounce → Shaft → Grip
   - **For Putters:**
     - Brand → Model → Year → Type (blade/mallet) → Length → Grip
   - Questions presented one at a time or in grouped form
   - Shows examples/images when helpful

3. **Progressive Disclosure**
   - Start with basic info (brand, model)
   - Then prompt for specifications if influencer wants detail
   - Allow "skip" for optional details
   - Can always edit later

4. **Catalog Matching**
   - Once sufficient info gathered, match to catalog
   - Show match confidence
   - Offer alternatives if multiple matches
   - Allow custom entry if no match

5. **Custom Specifications**
   - Allow entry of custom builds
   - Custom shaft combinations
   - Modifications (cut down, bent, etc.)
   - Note field for special details

**Pages Required:**
- Equipment Clarification Interface (dynamic question flow)
- Product Matching Review Page
- Custom Specification Entry Page

---

### Workflow 4: Golf Equipment Enrichment & Customization

**Steps:**
1. **Image Acquisition for Golf Equipment**
   - Auto-scrape from golf retailers:
     - Golf Galaxy
     - PGA Tour Superstore
     - Brand websites
     - Amazon (for golf equipment)
   - Or upload custom photos taken by influencer
   - Support multiple images per club (face view, address position, etc.)
   - For custom/modified clubs, influencer photos are preferred

2. **Golf Product Details Enhancement**
   - Auto-fetch specifications from golf equipment databases
   - Include:
     - Standard specs (loft, lie, length)
     - Available shaft options
     - MSRP and current pricing
     - Year of release
     - Technology features (if applicable)
   - Or write custom descriptions
   - Add personal notes (why they chose it, performance notes)

3. **Golf-Specific Affiliate Link Attachment**
   - Auto-attach based on product matching
   - Support multiple retailers per product:
     - Golf Galaxy
     - PGA Tour Superstore
     - Rock Bottom Golf (for deals/used)
     - Brand direct (if available)
     - Amazon (backup option)
   - Verify affiliate link validity
   - Handle used vs new equipment links

4. **Discount Code Integration (Golf Retailers)**
   - Golf-specific discount codes:
     - Golf Galaxy coupons
     - PGA Tour Superstore promotions
     - Rock Bottom Golf discount codes
     - Brand-specific codes from partnerships
   - Set expiration dates
   - Display code prominently on product card

5. **Golf-Specific Personal Touches**
   - Add personal review/notes per club
   - Video timestamp links ("See at 2:34")
   - "Gamer" badge (club they regularly use)
   - "Testing" badge (equipment they're trying out)
   - Performance notes ("Love this for tight lies")
   - Shaft/grip preferences and reasons
   - When they added to bag
   - Why they chose it over alternatives

**Pages Required:**
- Golf Equipment Enrichment Dashboard
- Image Upload/Selector Modal (golf-optimized)
- Golf Product Details Editor
- Golf Affiliate Link Manager
- Golf Discount Code Manager

---

### Workflow 5: Golf Bag Organization & Branding

**Steps:**
1. **Golf Bag Metadata**
   - Set bag title ("My 2024 WITB", "Winter Golf Bag Setup")
   - Write bag description
   - Add tags (year, season, tournament, casual)
   - Set publication date
   - Link to associated video(s)

2. **Golf Equipment Organization**
   - **By Category (Standard Golf Bag Layout):**
     - Driver
     - Fairway Woods
     - Hybrids
     - Irons (4-PW, 5-PW, etc.)
     - Wedges
     - Putter
   - **Additional Sections:**
     - Bag & Accessories
     - Golf Balls
     - Apparel & Footwear
     - Training Aids
   - Drag-and-drop reordering within categories
   - Option to show full detailed specs or simplified view
   - Collapsible sections for clean presentation

3. **Golf-Specific Customization**
   - Layout options:
     - Traditional bag view (visual bag representation)
     - Grid view by category
     - List view (detailed specs)
     - Card view (image-focused)
   - Color scheme (brand colors, course colors)
   - Show/hide specifications based on audience preference
   - Add bag image (if they want to show physical bag)

4. **Preview & Test**
   - Preview on desktop
   - Preview on mobile (critical for golf audience)
   - Test all affiliate links
   - Review discount code display
   - Check FTC disclosure placement

**Pages Required:**
- Golf Bag Editor Dashboard
- Golf Equipment Organization Interface (category-based)
- Golf-Specific Customization Panel
- Preview Page (mobile & desktop views)

---

### Workflow 6: Publishing & Distribution (Golf Content)

**Steps:**
1. **Link Generation for Golf Content**
   - Generate unique URL (e.g., teed.app/golf/username/2024-bag)
   - Create custom short link (e.g., teed.app/golfer/setup)
   - Golf-specific slug suggestions
   - Set link expiration (optional, for seasonal bags)

2. **QR Code Creation for Golf Videos**
   - Generate QR code for bag page
   - Customize with golf-themed design (optional)
   - Download high-res QR code for:
     - Video overlays
     - Thumbnail inclusion
     - Social media posts
   - Get embed code for websites/blogs

3. **Golf Content Social Media Integration**
   - Generate pre-formatted posts for:
     - YouTube description (with timestamp markers)
     - Instagram bio link
     - Instagram story link
     - TikTok bio link
     - Twitter/X post
   - Golf-specific templates:
     - "Full WITB link in bio"
     - "See what's in my bag: [link]"
     - "Equipment details from today's round: [link]"

4. **Publishing Options**
   - Publish immediately or schedule
   - Set visibility (public, unlisted, private)
   - Enable/disable comments
   - Share via integrated social platforms
   - Link to associated YouTube video(s)

**Pages Required:**
- Golf Publishing Dashboard
- Link Generator Page (golf-optimized)
- QR Code Generator & Download Page
- Golf Social Media Sharing Tools Page

---

### Workflow 7: Post-Publish Management (Golf Equipment Updates)

**Steps:**
1. **Ongoing Equipment Updates**
   - Golfers frequently change clubs
   - Update bag list when equipment changes
   - Add new clubs, remove old ones
   - Update specifications (new shaft, grip change)
   - Mark equipment as "sold" or "traded"

2. **Version History**
   - Track bag changes over time
   - Show "Previous Bag Setup" link
   - Compare setups side-by-side

3. **Link Management**
   - View all generated links for bag
   - Create additional share links
   - Deactivate/reactivate links
   - Set link usage limits

4. **Performance Monitoring**
   - View real-time analytics
   - Monitor clicks and conversions per club
   - Track earnings
   - See which equipment gets most interest

**Pages Required:**
- Golf Bag Management Dashboard
- Equipment Update Interface
- Link Management Page
- Version History View

---

### Workflow 8: Multi-Bag Management

**Golf-Specific:** Golfers often maintain multiple setups.

**Steps:**
1. **Multiple Bag Scenarios**
   - Tournament bag vs casual bag
   - Home course bag vs travel bag
   - Summer vs winter setup
   - Testing bag (trying new clubs)

2. **Bag Switching**
   - Set active bag
   - Quick switch between bags
   - Link different videos to different bags

3. **Bag Comparison**
   - Compare two bags side-by-side
   - See differences highlighted
   - Share comparison link

**Pages Required:**
- Multi-Bag Management Dashboard
- Bag Comparison Page
- Active Bag Selector

---

### Workflow 9: Analytics & Reporting (Golf-Specific)

**Steps:**
1. **Real-Time Monitoring**
   - View live stats on dashboard
   - See recent activity feed
   - Get notifications for milestones
   - Golf-specific metrics (which clubs get most clicks)

2. **Golf Equipment Performance Analytics**
   - View analytics per bag
   - Analyze performance by club category:
     - Drivers (typically highest interest)
     - Putters (high interest)
     - Irons
     - Wedges
     - Accessories
   - Track by golf retailer
   - View by date range

3. **Earnings Tracking (Golf Affiliates)**
   - View total earnings
   - Breakdown by bag/product
   - Earnings by golf retailer
   - Earnings by affiliate network
   - Projected vs actual earnings

4. **Brand Partnership Reporting**
   - Generate reports for golf brand partners
   - Show performance of sponsored equipment
   - Click-through rates for specific products
   - Conversion data

**Pages Required:**
- Golf Analytics Dashboard (Overview)
- Golf Equipment Performance Analytics Page
- Golf Earnings Dashboard
- Brand Partnership Report Generator

---

## Page Specifications

### 1. Golf Influencer Dashboard (Main Hub)

**Purpose:** Central hub for all golf influencer activities

**Key Sections:**
- **Quick Stats Cards**
  - Total bags created
  - Active bag status
  - Total views (last 30 days)
  - Total clicks (last 30 days)
  - Total earnings (last 30 days)
  - Most viewed bag

- **Recent Activity Feed**
  - Recently published bags
  - Recent clicks/conversions
  - Equipment update reminders
  - New comments/questions about equipment
  - System notifications

- **Quick Actions**
  - "Create New Bag" button
  - "Upload Video Transcript" button
  - "Quick Equipment Entry" button
  - "Clone Existing Bag" button

- **Active Bag Overview**
  - Current active bag preview
  - Quick edit button
  - Share link button
  - QR code download

- **Bag List View**
  - Grid or list of all bags
  - Filters: Status (draft, published, archived), Season, Year
  - Sort options: Newest, Most views, Most earnings, Active
  - Search functionality
  - Active bag indicator

- **Navigation Menu**
  - Dashboard
  - My Bags
  - Active Bag
  - Analytics
  - Earnings
  - Golf Affiliate Links
  - Settings
  - Help/Support

**Features:**
- Responsive design (mobile-optimized)
- Dark/light mode toggle
- Notification bell with alerts
- Quick search across all bags
- Golf-themed design elements (optional)

---

### 2. Golf Content Upload Page

**Purpose:** Initial entry point for creating new golf bag content

**Layout Options:**
- **Tab 1: Video Transcript Upload**
  - File upload area (drag-and-drop)
  - Supported formats: .txt, .doc, .docx, .pdf
  - Or text area for pasting transcript
  - Or YouTube URL input (auto-transcribe)
  - Video type selector:
    - Course vlog
    - Equipment review
    - What's In My Bag (WITB)
    - Unboxing
    - Instruction/tutorial
    - Other
  - Progress indicator during upload/processing

- **Tab 2: Manual Equipment Entry**
  - **Category-Based Entry:**
    - Driver
    - Fairway Woods
    - Hybrids
    - Irons
    - Wedges
    - Putter
    - Bag & Accessories
    - Golf Balls
    - Apparel & Footwear
  - Form to add items by category
  - Or text area with formatting hints
  - Bulk paste option (recognizes golf equipment patterns)
  - Preview of parsed items

- **Tab 3: Clone Existing Bag**
  - List of existing bags
  - Clone button
  - Quick edit after cloning

**Features:**
- Auto-save drafts
- Golf equipment template download
- Help tooltips with golf examples
- "Continue to Processing" button
- Golf-specific auto-suggestions

---

### 3. Golf Equipment Processing Status Page

**Purpose:** Show progress of golf equipment AI processing

**Key Elements:**
- **Progress Indicator**
  - Step 1: Uploading content (0-20%)
  - Step 2: Extracting golf equipment mentions (20-50%)
  - Step 3: Matching to golf catalog (50-70%)
  - Step 4: Identifying clarification needs (70-85%)
  - Step 5: Enriching with images/details (85-95%)
  - Step 6: Ready for review (100%)

- **Live Updates**
  - Real-time status messages
  - Golf equipment found count (by category)
  - Matching success rate
  - Items needing clarification count
  - Estimated time remaining

- **Preview Section** (as processing completes)
  - List of extracted golf equipment (organized by category)
  - Confidence scores for matches
  - Items needing manual review/clarification
  - Golf-specific flags (e.g., "Multiple Callaway driver models found")

**Features:**
- Email notification when complete (optional)
- Ability to leave page and return later
- Cancel processing option
- Golf equipment category breakdown

---

### 4. Golf Product Extraction Review Page

**Purpose:** Review and edit AI-extracted golf equipment

**Key Sections:**
- **Extraction Summary**
  - Total golf equipment found
  - By category breakdown:
    - Drivers: X
    - Irons: X
    - Wedges: X
    - Putters: X
    - Accessories: X
  - Successfully matched to catalog
  - Items needing clarification
  - Low-confidence matches

- **Golf Equipment List (Category-Organized)**
  - **Driver Section**
  - **Fairway Woods Section**
  - **Hybrids Section**
  - **Irons Section**
  - **Wedges Section**
  - **Putter Section**
  - **Accessories Section**
  
  Each product card shows:
    - Extracted name (editable)
    - Suggested catalog match (with image)
    - Confidence score
    - Clarification needed indicator
    - "Use this match" or "Create custom" or "Need clarification" buttons

- **Actions per Product:**
  - Edit product name
  - Select/deselect catalog match
  - Start clarification flow
  - Add to bag / Remove
  - Add custom specifications
  - Add notes

- **Bulk Actions:**
  - Accept all high-confidence matches
  - Flag all for clarification
  - Filter by category
  - Filter by confidence level

**Features:**
- Search/filter products
- Undo/redo functionality
- Save as draft
- "Continue to Clarification" or "Continue to Enrichment" button
- Golf equipment category tabs for navigation

---

### 5. Golf Equipment Clarification Interface

**Purpose:** Interactive system to gather missing golf equipment specifications

**Layout:**
- **Progress Indicator**
  - Shows how many items need clarification
  - Current item number

- **Question Flow (Dynamic)**
  - **For Drivers/Fairway Woods:**
    1. Brand (if missing)
       - Autocomplete with popular brands
       - Shows logo when selected
    2. Model name (if missing)
       - Autocomplete based on brand
       - Shows year options
    3. Year/model year
       - Dropdown or autocomplete
       - Shows "Current" option
    4. Loft
       - Dropdown: 9°, 9.5°, 10.5°, 11.5°, 12°, Custom
       - Visual loft guide (optional)
    5. Shaft brand and model
       - Autocomplete with popular shafts
       - Option to skip
    6. Shaft flex
       - Dropdown: Ladies, Senior, Regular, Stiff, Extra Stiff, Custom
    7. Grip brand and model
       - Autocomplete
       - Option to skip

  - **For Irons:**
    1. Brand
    2. Model name
    3. Year
    4. Set makeup (e.g., 4-PW, 5-PW, individual clubs)
    5. Shaft
    6. Flex
    7. Grip

  - **For Wedges:**
    1. Brand
    2. Model
    3. Year
    4. Loft (e.g., 50°, 52°, 54°, 56°, 58°, 60°)
    5. Bounce (if applicable)
    6. Shaft
    7. Flex
    8. Grip

  - **For Putters:**
    1. Brand
    2. Model
    3. Year
    4. Type: Blade, Mallet, Other
    5. Length: Standard, Custom (specify)
    6. Grip

- **Smart Suggestions**
  - Based on other equipment in bag (if brand-consistent)
  - Based on popular combinations
  - Shows images of suggested products

- **Skip Options**
  - Can skip optional fields
  - Can mark "Don't know" for some fields
  - Can add custom/modified specs later

- **Review Before Confirm**
  - Shows summary of entered information
  - "Looks good" or "Edit" option

**Features:**
- Auto-save progress
- Back/forward navigation
- Save for later
- "Use similar to previous" shortcut
- Product images appear as questions answered
- Help tooltips for golf terminology

---

### 6. Golf Equipment Enrichment Dashboard

**Purpose:** Add images, links, codes, and details to golf equipment

**Layout:**
- **Category Sidebar**
  - Scrollable list organized by golf equipment categories
  - Active item highlighted
  - Checkmarks for completed items
  - Count indicators (e.g., "Driver 1/1", "Irons 0/7")

- **Main Editing Area**
  - Large product image (upload/scrape/select)
  - Product name and details form
  - **Golf-Specific Specs Display:**
    - Brand, Model, Year
    - Loft, Lie, Length (for clubs)
    - Shaft info
    - Grip info
  - Affiliate links section (multiple retailers)
  - Discount codes section
  - Personal notes/review section
  - Video timestamp link (optional)
  - Custom modification notes

- **Quick Actions**
  - "Auto-fill from catalog" button
  - "Scrape images from retailer" button
  - "Generate affiliate links" button
  - "Save & Next" button

**Golf Equipment Card Components:**
- **Image Section**
  - Current image display
  - Upload custom photo (critical for custom/modified clubs)
  - Scrape from golf retailer URL
  - Select from catalog
  - Multiple image support (face view, address, etc.)

- **Golf Product Details**
  - Name (editable)
  - Brand (editable, autocomplete with golf brands)
  - Model (editable)
  - Year (editable)
  - Category (auto-set based on type)
  - **Specifications:**
    - Loft (for woods/wedges)
    - Lie angle (for irons)
    - Length
    - Shaft brand, model, flex
    - Grip brand, model, size
  - Description (editable, with AI assist)
  - Price/MSRP (editable)
  - Availability status

- **Golf Affiliate Links**
  - Link list (multiple golf retailers supported)
  - Retailers:
    - Golf Galaxy
    - PGA Tour Superstore
    - Rock Bottom Golf
    - Global Golf
    - 2nd Swing
    - Brand direct (if available)
    - Amazon (backup)
  - Add new link (with retailer selector)
  - Edit/delete links
  - Test link button
  - Default link indicator
  - "New" vs "Used" link options (for some retailers)

- **Golf Discount Codes**
  - Code input field
  - Retailer association
  - Expiration date picker
  - Code description/notes
  - Auto-apply to links toggle

- **Personal Touch (Golf-Specific)**
  - Notes/review text area
  - Why they chose it
  - Performance notes
  - When added to bag
  - Video timestamp (e.g., "See at 2:34")
  - Badges:
    - "Gamer" (regular use)
    - "Testing" (trying out)
    - "Favorite"
  - Custom modifications field

**Features:**
- Auto-save every few seconds
- Keyboard shortcuts for navigation
- Duplicate equipment detection
- Link validation
- Golf retailer-specific link formatting
- Shaft/grip database lookup assistance

---

### 7. Golf Bag Organization & Editor Page

**Purpose:** Organize golf equipment and customize bag appearance

**Key Sections:**
- **Golf Equipment Organization**
  - **Category-Based Layout (Standard Golf Bag Structure):**
    - Driver
    - Fairway Woods
    - Hybrids
    - Irons (grouped as set or individual)
    - Wedges
    - Putter
    - Bag & Accessories
    - Golf Balls
    - Apparel & Footwear
  - Drag-and-drop reordering within categories
  - Drag between categories to reassign
  - Collapsible category sections
  - Sort options (manual, name, price, brand)

- **Golf Bag Metadata**
  - Title input (e.g., "My 2024 WITB", "Winter Setup")
  - Description editor (rich text)
  - Tags input (autocomplete: year, season, tournament, casual)
  - Publication date picker
  - Link to associated YouTube video(s) (can link multiple)
  - Visibility settings

- **Categories/Sections**
  - Standard golf bag categories (cannot delete core categories)
  - Custom sections (optional, e.g., "Training Aids", "Backup Clubs")
  - Category headers on public page
  - Option to hide empty categories

- **Customization Panel**
  - Layout options:
    - Traditional bag view (visual representation)
    - Grid view by category (2, 3, 4 columns)
    - List view (detailed specs)
    - Card view (image-focused)
  - Color scheme selector
  - Font choices
  - Header image upload (can show physical bag)
  - Button style options
  - Spec detail level (full specs, simplified, minimal)

- **Preview Pane**
  - Live preview of public page
  - Mobile/desktop toggle
  - Category collapse/expand
  - Share preview link

**Features:**
- Undo/redo for organization changes
- Keyboard shortcuts
- Auto-save
- Version history (track bag changes over time)
- Golf bag visual representation option (shows clubs in bag positions)

---

### 8. Golf Publishing Dashboard

**Purpose:** Generate links, QR codes, and publish golf bag

**Key Sections:**
- **Link Generation**
  - Generated URL display (editable slug)
  - Golf-specific slug suggestions (e.g., "2024-bag", "witb-2024")
  - Custom short link option
  - Link expiration settings (optional, for seasonal bags)
  - Usage limits (optional)

- **QR Code Creation**
  - QR code preview
  - Size selector
  - Color customization
  - Logo overlay option (influencer logo or golf-themed)
  - Download buttons (PNG, SVG, PDF)
  - High-res for video overlays

- **Golf Content Social Media Tools**
  - Pre-formatted post templates:
    - YouTube description:
      - "Full WITB link: [link]"
      - "Equipment details: [link]"
      - With timestamp markers
    - Instagram bio link
    - Instagram story link ("Swipe up for full WITB")
    - TikTok bio link
    - Twitter/X post
  - Copy buttons for each
  - Preview cards for each platform

- **Publishing Options**
  - Publish now button
  - Schedule publication
  - Unpublish/unlist option
  - Private/public toggle
  - Link to YouTube video(s)
  - FTC disclosure checkbox (with auto-text)

**Features:**
- QR code generation in real-time
- Link testing
- Preview of social media cards
- Share directly to connected social accounts
- Golf-specific link templates

---

### 9. Public Golf Bag View Page (Consumer-Facing)

**Purpose:** Display golf bag to viewers/consumers

**Key Sections:**
- **Header**
  - Influencer profile (avatar, name, optional handicap)
  - Bag title
  - Bag description
  - Published date
  - Associated video link(s) (if any)
  - FTC affiliate disclosure (prominent)

- **Golf Equipment Grid/List (Category-Organized)**
  - **Driver Section** (collapsible)
  - **Fairway Woods Section**
  - **Hybrids Section**
  - **Irons Section** (can show as set or individual)
  - **Wedges Section**
  - **Putter Section**
  - **Bag & Accessories Section**
  - **Golf Balls Section**
  - **Apparel & Footwear Section** (if included)

  Each product card shows:
    - Product image (clickable gallery)
    - Product name (brand + model)
    - Year (if applicable)
    - Key specifications (loft for woods, set makeup for irons)
    - Price (if available)
    - Influencer notes/review
    - Video timestamp link (if applicable, e.g., "See at 2:34")
    - Discount code (prominent display with copy button)
    - "Shop Now" button(s) (multiple retailers if available)
    - Full specifications expandable section

- **Navigation**
  - Back to influencer profile
  - Share buttons
  - Print-friendly view
  - Filter by category
  - Search equipment

**Golf Product Card Details:**
- Image gallery (swipe on mobile, multiple angles if available)
- Product name (clickable for details)
- Brand name (with logo if available)
- Model name
- Year
- Specifications (expandable):
  - Loft, Lie, Length (clubs)
  - Shaft details
  - Grip details
- Price display
- Availability status (new, used, discontinued)
- Discount code (with copy button)
- Multiple retailer links (dropdown or tabs)
  - Shows retailer name
  - "New" or "Used" indicator (if applicable)
- Influencer review/notes
- Video link ("Watch at 2:34")
- "Gamer" or "Testing" badge (if applicable)
- Add to favorites (if logged in)

**Features:**
- Mobile-optimized responsive design (critical for golf audience)
- Fast loading (lazy images)
- SEO optimized (for "what's in my bag [influencer name]" searches)
- Social sharing meta tags
- Print-friendly CSS
- Dark mode support
- Category filtering
- Search functionality
- Golf-specific design aesthetic (optional)

---

### 10. Golf Analytics Dashboard (Overview)

**Purpose:** High-level performance metrics for golf content

**Key Metrics:**
- **Total Stats Cards**
  - Total bags created
  - Active bag status
  - Total views (all-time, last 30 days, last 7 days)
  - Total clicks
  - Total conversions
  - Total earnings (all-time, last 30 days, last 7 days)
  - Conversion rate

- **Golf Equipment Category Performance**
  - Views by category (drivers, irons, putters, etc.)
  - Clicks by category
  - Earnings by category
  - Most popular equipment types

- **Trend Charts**
  - Views over time (line chart)
  - Clicks over time
  - Earnings over time
  - Date range selector

- **Top Performing Bags**
  - List/table of bags ranked by:
    - Most views
    - Most clicks
    - Most earnings
    - Best conversion rate

- **Top Performing Equipment**
  - Most viewed clubs/equipment
  - Most clicked equipment
  - Highest earning equipment

- **Recent Activity**
  - Recent clicks
  - Recent conversions
  - Recent earnings
  - Equipment questions/comments

**Features:**
- Date range picker
- Export data (CSV, PDF)
- Comparison mode (compare date ranges)
- Real-time updates
- Golf category filters

---

### 11. Detailed Golf Analytics Page

**Purpose:** Deep dive into specific bag or overall performance

**Views:**
- **By Bag**
  - Select bag from dropdown
  - View metrics for that bag:
    - Views over time
    - Clicks per equipment category
    - Clicks per individual product
    - Conversion rate
    - Earnings breakdown
    - Top products by performance
    - Geographic data (if available)
    - Device breakdown
    - Referral sources
    - Associated video performance (if linked)

- **By Golf Equipment Category**
  - Drivers performance
  - Irons performance
  - Putters performance
  - Wedges performance
  - Accessories performance
  - Compare categories

- **By Individual Product**
  - Table/list of all equipment across bags
  - Metrics per product:
    - Total views
    - Total clicks
    - Total conversions
    - Earnings per product
    - Click-through rate
    - Conversion rate
    - Which bags it appeared in

- **By Golf Retailer**
  - Performance by retailer:
    - Golf Galaxy
    - PGA Tour Superstore
    - Rock Bottom Golf
    - Amazon
    - etc.
  - Earnings breakdown
  - Click breakdown
  - Conversion rates by retailer

- **By Brand**
  - Performance by golf brand:
    - Callaway
    - Titleist
    - TaylorMade
    - Ping
    - etc.
  - Which brands generate most interest
  - Earnings by brand

- **Custom Reports**
  - Date range selection
  - Metric selection
  - Filter options
  - Export functionality

**Features:**
- Interactive charts (hover for details)
- Drill-down capability
- Comparison views (bag vs bag, category vs category)
- Export options
- Brand partnership reporting tools

---

### 12. Golf Earnings Dashboard

**Purpose:** Track and manage earnings from golf affiliate programs

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
  - Filter by golf retailer

- **Earnings Breakdown**
  - By bag
  - By golf equipment category (drivers, irons, etc.)
  - By individual product
  - By golf retailer
  - By affiliate network
  - By date range
  - By brand

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
- Golf retailer-specific payout tracking

---

### 13. Golf Affiliate Links Management Page

**Purpose:** Manage saved affiliate links and codes for golf retailers

**Key Sections:**
- **Saved Golf Affiliate Links**
  - List/table organized by retailer:
    - Golf Galaxy
    - PGA Tour Superstore
    - Rock Bottom Golf
    - Global Golf
    - 2nd Swing
    - Brand direct links
    - Amazon (golf equipment)
  - Columns: Retailer, Default Link Template, Status, Actions
  - Add new link button
  - Edit/delete links

- **Default Affiliate IDs**
  - Per golf retailer affiliate IDs
  - Regional variations (US, UK, CA)
  - Default codes/links

- **Golf Discount Codes**
  - List of saved discount codes by retailer
  - Code, Retailer, Expiration, Status, Usage Count
  - Bulk upload option
  - Edit/delete codes
  - Set default codes per retailer

- **Golf Affiliate Network Connections**
  - Connected networks
  - Connection status
  - Disconnect/refresh options
  - Test connection buttons

**Features:**
- Link validation
- Bulk import/export
- Template creation (golf-specific)
- Auto-generation from product names (golf equipment matching)
- Golf retailer-specific link formatting rules

---

### 14. Multi-Bag Management Page

**Purpose:** Manage multiple golf bag setups

**Key Sections:**
- **Bag List**
  - All bags with preview
  - Active bag indicator
  - Status (draft, published, archived)
  - Quick stats (views, clicks, earnings)
  - Last updated date

- **Bag Actions**
  - Set as active
  - Clone bag
  - Edit bag
  - Delete bag
  - Archive bag

- **Bag Comparison Tool**
  - Select two bags to compare
  - Side-by-side comparison
  - Differences highlighted
  - Share comparison link

- **Quick Bag Switch**
  - Dropdown to quickly switch active bag
  - Shows which videos are linked to which bag

**Features:**
- Filter by status, season, year
- Search functionality
- Bulk actions
- Bag organization (folders/tags)

---

### 15. Settings Page (Golf-Specific)

**Purpose:** Account and preference management

**Key Sections:**
- **Profile Settings**
  - Display name
  - Handle/username
  - Bio
  - Avatar upload
  - Website/blog URL
  - Optional: Handicap (if they share it)
  - Preferred golf brands

- **Golf Content Preferences**
  - Default bag organization style
  - Spec detail level preference
  - Default retailers (priority order)
  - Preferred equipment categories to highlight

- **Notification Settings**
  - Email notifications
  - Push notifications
  - Notification preferences:
    - New clicks
    - Conversions
    - Earnings milestones
    - Equipment questions
    - System updates

- **Golf Affiliate Defaults**
  - Default affiliate IDs (by retailer)
  - Preferred golf retailers
  - Regional settings
  - Default discount codes

- **Privacy Settings**
  - Public profile toggle
  - Analytics visibility
  - Data sharing preferences
  - Equipment detail visibility (full specs vs simplified)

- **Billing & Payment**
  - Payment method
  - Payout preferences
  - Tax information
  - Subscription (if applicable)

- **Connected Accounts**
  - Social media accounts (YouTube, Instagram, TikTok)
  - Golf affiliate networks
  - Third-party integrations

**Features:**
- Save changes confirmation
- Two-factor authentication
- Account deletion option
- Golf-specific default settings

---

### 16. Help & Support Page (Golf-Focused)

**Purpose:** Resources and support for golf influencers

**Key Sections:**
- **Golf-Specific Documentation**
  - Getting started guide (golf influencers)
  - How to enter golf equipment
  - Clarification process explained
  - FAQ (golf equipment specific)
  - Video tutorials (golf examples)
  - Best practices for golf content creators
  - FTC disclosure requirements

- **Golf Equipment Help**
  - How to find equipment specifications
  - Where to get product images
  - Golf terminology guide
  - Common golf equipment questions

- **Support Channels**
  - Contact support form
  - Live chat (if available)
  - Email support
  - Community forum (golf influencers)

- **Resources**
  - Templates (golf bag templates)
  - Examples (example golf bag pages)
  - Case studies (golf influencer success stories)
  - Golf affiliate marketing tips

**Features:**
- Searchable documentation
- Video embeds (golf-specific)
- Downloadable guides
- Feedback form
- Golf equipment database search

---

## Features & Functionality

### Core Features

#### 1. AI-Powered Golf Equipment Extraction

**Natural Language Processing:**
- Extract golf equipment names from transcripts:
  - Club mentions ("driver", "7-iron", "putter", "wedges")
  - Brand mentions ("Callaway", "Titleist", "TaylorMade", "Ping")
  - Model names (when mentioned: "Paradym", "TSR3", "SIM2")
  - Accessory mentions ("range finder", "GPS", "golf balls")
  - Handle golf-specific terminology and slang
- Identify incomplete mentions ("my driver", "Callaway driver" without model)
- Price extraction (when mentioned)
- Multi-language support (future)

**Golf Product Matching:**
- Match to golf equipment catalog
- Golf-specific matching logic:
  - Brand name variations
  - Model year handling (2023, 2024, "current model")
  - Golf equipment hierarchies (driver > brand > model > year > specs)
- Confidence scoring
- Suggest alternatives (similar clubs)
- Handle discontinued models
- Handle custom/modified clubs

**Image Recognition (future):**
- Analyze video frames to identify clubs
- Recognize golf equipment in images
- Auto-extract product info from club images

#### 2. Golf Equipment Image Management

**Auto-Scraping:**
- Scrape from golf retailers:
  - Golf Galaxy
  - PGA Tour Superstore
  - Brand websites (Callaway, Titleist, etc.)
  - Amazon (for golf equipment)
- Multiple image sources
- Quality filtering (high-res preferred)
- Automatic cropping/resizing
- Golf equipment-specific image handling (club face, address position)

**Manual Upload:**
- Drag-and-drop interface
- Multiple image upload per club
- Image editing (crop, rotate)
- Compression optimization
- Critical for custom/modified clubs

**Golf Equipment Image Catalog:**
- Store scraped images
- Reuse across bags
- Catalog image selection
- Golf equipment image database

#### 3. Golf Affiliate Link Management

**Auto-Generation:**
- Generate affiliate links from golf product names
- Apply default affiliate IDs (by retailer)
- Support multiple retailers per product
- Golf retailer-specific link formatting

**Link Validation:**
- Verify link validity
- Check affiliate link format
- Warn about expired links
- Test links periodically

**Golf Retailer Link Templates:**
- Save link templates per retailer
- Apply to multiple products
- Region-specific variations (US, UK, CA)
- New vs used equipment link handling

**Multiple Golf Retailer Support:**
- Amazon Associates (golf equipment)
- Golf Galaxy
- PGA Tour Superstore
- Rock Bottom Golf
- Global Golf
- 2nd Swing
- Brand direct (when available)
- Custom retailers

#### 4. Golf Discount Code Management

**Code Storage:**
- Store discount codes by golf retailer
- Set expiration dates
- Code descriptions
- Retailer association
- Track usage

**Auto-Application:**
- Auto-apply codes to affiliate links
- Display prominently on product cards
- Copy-to-clipboard functionality
- Code expiration reminders

**Code Tracking:**
- Track code usage
- Expiration reminders
- Performance metrics per code
- Retailer-specific code management

#### 5. Golf Content Customization

**Layout Options:**
- Traditional bag view (visual bag representation)
- Grid layouts (2, 3, 4 columns)
- List view (detailed specs)
- Card view (image-focused)
- Category-organized view
- Responsive breakpoints

**Branding:**
- Custom color schemes (golf-themed)
- Font choices
- Header images (physical bag photos)
- Logo placement
- Golf course aesthetic options

**Organization:**
- Golf equipment categories (standard bag structure)
- Section headers
- Drag-and-drop reordering
- Sort options
- Collapsible sections
- Spec detail level (full, simplified, minimal)

#### 6. Golf Sharing & Distribution

**Link Generation:**
- Unique URLs (golf-specific slugs)
- Custom short links
- Short links for easy sharing
- Link expiration (seasonal bags)
- Usage limits

**QR Codes:**
- Multiple size options
- Custom colors
- Logo overlay
- Golf-themed designs (optional)
- Multiple format downloads (PNG, SVG, PDF)
- High-res for video overlays

**Golf Content Social Media Integration:**
- Pre-formatted posts (golf-specific templates)
- Auto-posting (optional)
- Social media preview cards
- Platform-specific optimization
- YouTube description formatting
- Instagram story templates

### Advanced Features

#### 7. Golf Analytics & Insights

**Real-Time Tracking:**
- Live view counts
- Real-time click tracking
- Conversion tracking
- Engagement metrics
- Equipment interest tracking

**Golf Performance Analysis:**
- Equipment category performance (drivers vs irons vs putters)
- Individual product performance
- Bag performance trends
- Geographic insights
- Device breakdown
- Referral source tracking
- Brand performance
- Retailer performance

**Earnings Tracking:**
- Commission tracking by golf retailer
- Earnings projections
- Payout tracking
- Tax reporting support
- Brand partnership earnings

#### 8. Golf-Specific Automation Features

**Scheduled Publishing:**
- Schedule bag publication
- Auto-unpublish on expiration
- Time-based link activation
- Seasonal bag automation

**Auto-Updates:**
- Price monitoring (golf equipment prices fluctuate)
- Availability updates
- Link health checks
- Image refresh
- New model alerts (when equipment is updated)

**Notifications:**
- Earnings milestones
- High click/conversion rates
- Expiring discount codes
- Broken link alerts
- New golf equipment questions from viewers

**Equipment Update Reminders:**
- Prompt to update bag when new models release
- Seasonal bag reminders
- Equipment change tracking

#### 9. Golf Collaboration Features (Future)

**Team Accounts:**
- Multiple users per account (golf content team)
- Role-based permissions
- Shared affiliate links
- Collaborative bag editing

**Brand Collaboration:**
- Golf brand partner portals
- Custom tracking for brand campaigns
- Performance reporting for partners
- Brand-specific landing pages

**Golf Community Features:**
- Compare bags with other influencers
- Share equipment recommendations
- Community equipment database

#### 10. Mobile App Features (Future)

**Mobile Upload:**
- Upload club photos directly
- Quick equipment entry on the go
- Voice-to-text transcription
- Scan QR codes from clubs (if available)

**Mobile Management:**
- View analytics on mobile
- Quick edits
- Push notifications
- On-course equipment updates

---

## Golf Product Categories & Equipment Types

### Core Golf Equipment Categories

#### 1. Driver
- **Specifications Needed:**
  - Brand
  - Model name
  - Year/model year
  - Loft (9°, 9.5°, 10.5°, 11.5°, 12°)
  - Shaft brand, model, flex
  - Grip brand, model, size
  - Length (if custom)
  - Weight settings (if adjustable)

#### 2. Fairway Woods
- **Types:** 3-wood, 5-wood, 7-wood, etc.
- **Specifications Needed:**
  - Brand
  - Model name
  - Year
  - Loft
  - Shaft brand, model, flex
  - Grip
  - Length (if custom)

#### 3. Hybrids
- **Types:** 2-hybrid, 3-hybrid, 4-hybrid, etc.
- **Specifications Needed:**
  - Brand
  - Model name
  - Year
  - Loft
  - Shaft brand, model, flex
  - Grip

#### 4. Irons
- **Can be:** Full set (4-PW, 5-PW, etc.) or Individual clubs
- **Specifications Needed:**
  - Brand
  - Model name
  - Year
  - Set makeup (which clubs)
  - Individual club specs (if custom):
    - Loft (per club)
    - Lie angle (per club)
    - Length (per club)
  - Shaft brand, model, flex (can vary by club)
  - Grip brand, model, size

#### 5. Wedges
- **Types:** Gap wedge (GW), Sand wedge (SW), Lob wedge (LW)
- **Can also be:** Approach wedge (AW), Pitching wedge (PW) if separate
- **Specifications Needed:**
  - Brand
  - Model name
  - Year
  - Loft (e.g., 50°, 52°, 54°, 56°, 58°, 60°)
  - Bounce (if applicable)
  - Grind (if applicable)
  - Shaft brand, model, flex
  - Grip

#### 6. Putter
- **Types:** Blade, Mallet, Other
- **Specifications Needed:**
  - Brand
  - Model name
  - Year
  - Type (blade, mallet)
  - Length (standard or custom)
  - Grip brand, model, size
  - Lie angle (if custom)
  - Toe hang (if mentioned)

### Additional Equipment Categories

#### 7. Golf Bag
- Stand bag, Cart bag, Staff bag, Sunday bag
- Brand, model, year, color/style

#### 8. Range Finder / GPS Device
- Brand, model, year, features

#### 9. Training Aids
- Alignment sticks, putting mats, swing trainers, etc.
- Brand, model, purpose

#### 10. Golf Balls
- Brand, model, year, compression, cover type

#### 11. Golf Gloves
- Brand, size, material

#### 12. Apparel & Footwear
- Shirts, pants, shoes, hats
- Brand, model, size

#### 13. Accessories
- Tees, ball markers, divot tools, towels, etc.

---

## Integration Requirements

### 1. Golf Affiliate Network Integrations

#### Amazon Associates
- API for link generation (golf equipment)
- Earnings reporting API
- Product data API (for golf equipment)
- Regional support (US, UK, CA)

#### Golf-Specific Retailer Affiliate Programs
- **Golf Galaxy**
  - Affiliate program integration
  - Link generation API (if available)
  - Commission tracking

- **PGA Tour Superstore**
  - Affiliate program integration
  - Link generation
  - Tracking

- **Rock Bottom Golf**
  - Affiliate program
  - Used equipment link handling
  - Discount code integration

- **Global Golf**
  - Affiliate integration
  - Used/new equipment differentiation

- **2nd Swing**
  - Affiliate integration
  - Used equipment focus

- **SWAG Golf**
  - Up to 10% commission, 60-day cookie
  - Specialty golf accessories

#### Brand Direct Programs
- Callaway affiliate program (if available)
- Titleist affiliate program (if available)
- TaylorMade affiliate program (if available)
- Other major golf brand programs

### 2. Social Media Integrations

#### YouTube
- OAuth for channel linking
- Video metadata API
- Description updating (if permitted)
- Analytics integration (future)
- Thumbnail generation with QR code overlay (future)

#### Instagram
- OAuth (if API available)
- Bio link updates (if permitted)
- Story link support
- Analytics (if available)

#### TikTok
- OAuth (if API available)
- Bio link updates (if permitted)
- Analytics (if available)

### 3. Payment & Payout Integrations

#### Stripe Connect
- Earnings payouts
- Tax information collection
- Payout scheduling

#### PayPal
- Alternative payout method
- Mass payout API

### 4. Golf Equipment Data Sources

#### Golf Equipment Databases
- Product specifications database
- Model year information
- Standard specifications
- Technology features
- MSRP/pricing data

#### Golf Retailer APIs (if available)
- Product catalog APIs
- Inventory APIs
- Pricing APIs
- Image APIs

### 5. Third-Party Services

#### Image CDN
- Cloudinary or similar
- Image optimization
- Delivery network
- Golf equipment image caching

#### Email Service
- Transactional emails (SendGrid, etc.)
- Notification emails
- Marketing emails (future)

#### Analytics
- Google Analytics integration
- Custom event tracking
- Conversion tracking
- Golf-specific event tracking

---

## Technical Considerations

### 1. Data Model Extensions (Golf-Specific)

Based on existing Teed schema, additional tables/fields needed:

#### Bags Table (extend existing)
- `bag_type` (text) - 'golf', 'haul', etc.
- `golf_bag_category` (text, nullable) - 'tournament', 'casual', 'winter', etc.
- `video_url` (text, nullable) - Associated YouTube video
- `video_urls` (text[], nullable) - Multiple associated videos
- `transcript_id` (uuid, nullable)
- `processing_status` (text)
- `published_at` (timestamptz, nullable)
- `scheduled_publish_at` (timestamptz, nullable)
- `expires_at` (timestamptz, nullable)
- `is_active` (boolean, default false) - Active bag indicator
- `season` (text, nullable) - 'spring', 'summer', 'fall', 'winter'
- `year` (integer, nullable) - Year of bag setup
- `view_count` (integer, default 0)
- `click_count` (integer, default 0)
- `conversion_count` (integer, default 0)
- `total_earnings` (numeric, default 0)

#### Golf Equipment Items Table (extends `bag_items`)
- All existing `bag_items` fields
- `golf_category` (text) - 'driver', 'fairway_wood', 'hybrid', 'iron', 'wedge', 'putter', 'bag', 'accessory', 'ball', 'apparel'
- `brand` (text) - Golf brand (Callaway, Titleist, etc.)
- `model_name` (text) - Model name
- `model_year` (integer, nullable) - Year of model
- `loft` (numeric, nullable) - Loft in degrees (for woods/wedges)
- `lie_angle` (numeric, nullable) - Lie angle in degrees (for irons)
- `length` (numeric, nullable) - Length in inches
- `shaft_brand` (text, nullable)
- `shaft_model` (text, nullable)
- `shaft_flex` (text, nullable) - 'Ladies', 'Senior', 'Regular', 'Stiff', 'Extra Stiff', 'Custom'
- `grip_brand` (text, nullable)
- `grip_model` (text, nullable)
- `grip_size` (text, nullable)
- `custom_modifications` (text, nullable) - Notes on customizations
- `video_timestamp` (text, nullable) - e.g., "2:34"
- `is_gamer` (boolean, default false) - Regular use club
- `is_testing` (boolean, default false) - Testing/experimenting
- `is_favorite` (boolean, default false)
- `when_added` (date, nullable) - When added to bag
- `click_count` (integer, default 0)
- `conversion_count` (integer, default 0)
- `earnings` (numeric, default 0)

#### Golf Discount Codes Table
- `id` (uuid, PK)
- `influencer_id` (uuid) → profiles.id
- `code` (text)
- `retailer` (text) - Golf retailer name
- `description` (text, nullable)
- `expires_at` (timestamptz, nullable)
- `usage_count` (integer, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

#### Golf Affiliate Links Table (extends existing or new)
- `id` (uuid, PK)
- `influencer_id` (uuid) → profiles.id
- `retailer` (text) - Golf retailer name
- `link_template` (text) - With placeholders
- `default_affiliate_id` (text)
- `region` (text, default 'US')
- `supports_used_equipment` (boolean, default false)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

#### Golf Equipment Catalog Table (for matching)
- `id` (uuid, PK)
- `brand` (text)
- `model_name` (text)
- `model_year` (integer)
- `category` (text) - 'driver', 'fairway_wood', etc.
- `standard_specs` (jsonb) - Standard specifications
- `available_lofts` (numeric[], nullable)
- `available_shafts` (jsonb, nullable)
- `msrp` (numeric, nullable)
- `image_url` (text, nullable)
- `retailer_links` (jsonb, nullable) - Available retailers
- `is_discontinued` (boolean, default false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### Golf Equipment Clarification Sessions Table
- `id` (uuid, PK)
- `bag_id` (uuid) → bags.id
- `item_id` (uuid, nullable) → bag_items.id
- `extracted_name` (text) - Original extracted name
- `clarification_questions` (jsonb) - Questions asked
- `answers` (jsonb) - Answers provided
- `matched_product_id` (uuid, nullable) → golf_equipment_catalog.id
- `status` (text) - 'pending', 'completed', 'skipped'
- `created_at` (timestamptz)
- `completed_at` (timestamptz, nullable)

#### QR Codes Table
- `id` (uuid, PK)
- `bag_id` (uuid) → bags.id
- `code_data` (text) - The URL encoded
- `design_settings` (jsonb) - Colors, logo, etc.
- `download_count` (integer, default 0)
- `created_at` (timestamptz)

#### Bag Version History Table
- `id` (uuid, PK)
- `bag_id` (uuid) → bags.id
- `version_number` (integer)
- `snapshot_data` (jsonb) - Full bag snapshot
- `changed_items` (jsonb) - What changed
- `created_at` (timestamptz)

### 2. API Endpoints Needed

#### Golf Bag Management
- `POST /api/golf/bags` - Create new golf bag
- `GET /api/golf/bags/[id]` - Get bag details
- `PUT /api/golf/bags/[id]` - Update bag
- `DELETE /api/golf/bags/[id]` - Delete bag
- `POST /api/golf/bags/[id]/publish` - Publish bag
- `POST /api/golf/bags/[id]/unpublish` - Unpublish bag
- `POST /api/golf/bags/[id]/set-active` - Set as active bag
- `POST /api/golf/bags/[id]/clone` - Clone bag
- `GET /api/golf/bags/active` - Get active bag
- `GET /api/golf/bags/[id]/versions` - Get version history

#### Golf Content Processing
- `POST /api/golf/bags/upload-transcript` - Upload transcript
- `POST /api/golf/bags/process-transcript` - Process transcript with AI
- `GET /api/golf/bags/[id]/processing-status` - Get processing status
- `POST /api/golf/bags/extract-equipment` - Extract golf equipment from text

#### Golf Equipment Management
- `POST /api/golf/bags/[id]/equipment` - Add equipment to bag
- `PUT /api/golf/equipment/[id]` - Update equipment
- `DELETE /api/golf/equipment/[id]` - Delete equipment
- `POST /api/golf/equipment/[id]/images` - Upload image
- `POST /api/golf/equipment/[id]/scrape-image` - Scrape product image
- `PUT /api/golf/equipment/reorder` - Reorder equipment
- `GET /api/golf/equipment/[id]` - Get equipment details

#### Golf Equipment Clarification
- `POST /api/golf/equipment/clarify` - Start clarification session
- `POST /api/golf/equipment/clarify/[id]/answer` - Answer clarification question
- `GET /api/golf/equipment/clarify/[id]` - Get clarification session
- `POST /api/golf/equipment/clarify/[id]/complete` - Complete clarification

#### Golf Equipment Catalog
- `GET /api/golf/catalog/search` - Search golf equipment catalog
- `GET /api/golf/catalog/[id]` - Get catalog item details
- `POST /api/golf/catalog/match` - Match equipment to catalog

#### Golf Affiliate Links
- `POST /api/golf/affiliate-links` - Create affiliate link
- `GET /api/golf/affiliate-links` - List affiliate links
- `PUT /api/golf/affiliate-links/[id]` - Update affiliate link
- `DELETE /api/golf/affiliate-links/[id]` - Delete affiliate link
- `POST /api/golf/affiliate-links/generate` - Generate link for equipment

#### Golf Discount Codes
- `POST /api/golf/discount-codes` - Create discount code
- `GET /api/golf/discount-codes` - List discount codes
- `PUT /api/golf/discount-codes/[id]` - Update discount code
- `DELETE /api/golf/discount-codes/[id]` - Delete discount code

#### Link Generation
- `POST /api/golf/bags/[id]/generate-link` - Generate shareable link
- `POST /api/golf/bags/[id]/generate-qr` - Generate QR code
- `GET /api/golf/qr-codes/[id]/download` - Download QR code

#### Golf Analytics
- `GET /api/golf/analytics/overview` - Get overview stats
- `GET /api/golf/analytics/bags/[id]` - Get bag analytics
- `GET /api/golf/analytics/earnings` - Get earnings data
- `GET /api/golf/analytics/equipment` - Get equipment performance
- `GET /api/golf/analytics/categories` - Get category performance
- `GET /api/golf/analytics/brands` - Get brand performance

#### Public Endpoints
- `GET /api/public/golf/bags/[slug]` - Get public bag view
- `POST /api/public/golf/bags/[slug]/track-view` - Track page view
- `POST /api/public/golf/bags/[slug]/track-click` - Track link click
- `POST /api/public/golf/bags/[slug]/track-conversion` - Track conversion

### 3. AI/ML Services Needed

#### Natural Language Processing
- Golf equipment name extraction from transcripts
- Golf brand identification
- Model name extraction
- Price extraction
- Golf terminology understanding
- Incomplete mention detection

#### Golf Product Matching
- Fuzzy golf product name matching
- Brand name normalization (Callaway = Callaway Golf)
- Model year handling
- Specification matching
- Catalog matching algorithms
- Confidence scoring for golf equipment

#### Image Processing
- Golf equipment image scraping
- Image quality assessment
- Automatic cropping/resizing
- Image deduplication
- Golf equipment image recognition (future)

### 4. Background Jobs/Workers

#### Processing Jobs
- Transcript processing for golf equipment
- Golf equipment extraction
- Image scraping from golf retailers
- Link validation
- Price updates for golf equipment
- Golf equipment catalog updates

#### Scheduled Jobs
- Expiring discount code notifications
- Broken link checks
- Golf equipment price monitoring
- Earnings aggregation
- Analytics rollups
- New golf equipment model alerts
- Seasonal bag reminders

---

## Analytics & Reporting

### Metrics to Track

#### Golf Bag-Level Metrics
- Total views
- Unique visitors
- Average time on page
- Bounce rate
- Total clicks (all equipment)
- Total conversions
- Conversion rate
- Total earnings
- Earnings per view
- Equipment categories viewed
- Most popular equipment

#### Golf Equipment Category-Level Metrics
- Views by category (drivers, irons, putters, wedges, etc.)
- Clicks by category
- Conversions by category
- Earnings by category
- Click-through rate by category
- Conversion rate by category

#### Individual Equipment Metrics
- Views per equipment item
- Clicks per equipment item
- Click-through rate
- Conversions per equipment item
- Conversion rate
- Earnings per equipment item
- Most popular equipment items
- Which equipment generates most questions

#### Time-Based Metrics
- Views over time (hourly, daily, weekly)
- Clicks over time
- Conversions over time
- Earnings over time
- Best performing days/times
- Seasonal trends (golf seasonality)

#### Engagement Metrics
- Discount code copies
- Video timestamp clicks
- Social shares
- Comments (if enabled)
- Return visitors
- Equipment question submissions
- "See more" clicks on specs

#### Audience Metrics (if available)
- Geographic distribution (important for golf - US, UK, etc.)
- Device breakdown (mobile vs desktop for golf audience)
- Browser breakdown
- Referral sources
- Traffic sources
- YouTube video traffic (if linked)

#### Brand Performance Metrics
- Performance by golf brand (Callaway, Titleist, etc.)
- Which brands generate most interest
- Earnings by brand
- Click-through rates by brand

#### Retailer Performance Metrics
- Performance by golf retailer
- Which retailers generate most conversions
- Earnings by retailer
- Conversion rates by retailer

### Reporting Features

#### Standard Reports
- Daily summary
- Weekly summary
- Monthly summary
- Custom date range
- Quarterly reports
- Annual reports

#### Golf-Specific Reports
- Bag performance report
- Equipment category performance report
- Brand partnership report
- Seasonal bag comparison
- Equipment update impact report

#### Export Options
- CSV export
- PDF reports (branded for partnerships)
- Excel export
- JSON API access

#### Brand Partner Reports
- Performance reports for golf brand collaborations
- Customizable branding
- Scheduled delivery
- White-label option (future)
- Equipment-specific performance
- Click-through and conversion data

---

## Consumer Experience

### Landing on Golf Bag Page

**User Journey:**
1. Consumer clicks link from YouTube video or scans QR code
2. Lands on golf bag page
3. Sees influencer profile and bag overview
4. Browses equipment by category (drivers, irons, putters, etc.)
5. Expands category of interest
6. Clicks on specific club/equipment
7. Views detailed specifications and influencer notes
8. Clicks affiliate link
9. Redirected to golf retailer
10. Makes purchase (tracked via affiliate)

### Key Consumer Features

#### Golf Equipment Discovery
- Clean, visually appealing layout (golf aesthetic)
- High-quality equipment images
- Clear product names (brand + model + year)
- Easy navigation by category
- Search functionality
- Filter by category

#### Shopping Assistance
- Multiple golf retailer options (if available)
- New vs used equipment options
- Discount codes prominently displayed
- "Copy Code" one-click functionality
- Direct "Shop Now" buttons
- Price comparisons (if available)
- Availability status

#### Equipment Information
- Full specifications (expandable)
- Shaft and grip details
- Influencer personal notes/reviews
- Why they chose it
- Performance notes
- Video timestamp links ("See at 2:34")
- Custom modifications noted

#### Engagement
- Video timestamp links
- Influencer notes add authenticity
- Social sharing options
- Mobile-optimized experience (critical)
- "Gamer" and "Testing" badges add context

#### Trust & Transparency
- Clear affiliate disclosure (FTC compliant)
- Influencer authenticity
- Product authenticity indicators
- Secure link handling
- Reliable retailer links

### Mobile Optimization (Critical for Golf Audience)

**Essential Mobile Features:**
- Responsive design (mobile-first)
- Touch-friendly buttons (large tap targets)
- Fast loading times
- Optimized images (lazy loading)
- One-thumb navigation
- Easy code copying
- Swipe gestures for images
- Category collapse/expand
- Sticky "Shop Now" buttons
- Mobile-optimized specifications display

**Mobile-Specific Considerations:**
- Many golf viewers browse on mobile during/after watching videos
- Need quick access to equipment info
- Easy affiliate link clicking
- Simple discount code copying

---

## Additional Considerations

### 1. Compliance & Legal

#### Affiliate Disclosure
- FTC-compliant disclosures (prominent on golf bag pages)
- Platform-specific requirements (YouTube, Instagram)
- International compliance (GDPR, etc.)
- Golf-specific disclosure language

#### Privacy
- Cookie consent (if using tracking)
- Privacy policy
- Data handling transparency
- Golf equipment browsing data handling

#### Terms of Service
- Influencer terms
- Consumer terms
- Golf affiliate program compliance
- Golf retailer terms compliance

### 2. Golf Industry Specifics

#### Seasonality
- Golf equipment interest varies by season
- Northern hemisphere vs southern hemisphere
- Seasonal bag setups
- Holiday shopping seasons (equipment gifts)

#### Equipment Release Cycles
- Major brands release new equipment annually
- Golf equipment becomes "last year's model" quickly
- Used equipment market is significant
- Need to handle discontinued models

#### Golf Community
- Strong community aspect
- Equipment discussion is common
- Comparison between influencers
- Equipment trends

### 3. Scalability

#### Performance
- CDN for equipment images
- Database optimization for golf equipment catalog
- Caching strategies
- Background job processing
- Golf equipment image optimization

#### Infrastructure
- Auto-scaling
- Load balancing
- Database sharding (if needed)
- Golf equipment image storage optimization
- Catalog database scaling

### 4. Security

#### Data Protection
- Encryption at rest and in transit
- Secure affiliate link handling
- Payment information security
- User data protection
- Golf equipment browsing data protection

#### Access Control
- Authentication and authorization
- API rate limiting
- Bot protection
- DDoS mitigation
- Golf equipment catalog access control

### 5. Future Enhancements

#### Potential Features
- Video frame extraction and golf equipment tagging
- Live shopping integration during videos
- Chatbot for equipment questions
- Wishlist functionality for consumers
- Email marketing integration
- SMS notifications
- Browser extension for easy link creation
- Mobile app for golf influencers
- AI-powered equipment recommendations
- Collaboration tools for golf agencies
- Multi-language support
- Golf equipment comparison tools
- Side-by-side bag comparisons
- Equipment swap/trade features
- Golf equipment database community contributions
- Integration with golf simulators
- Handicap tracking integration (if permitted)
- Course play integration (if applicable)

---

## Integration with Existing Teed Platform

### Leveraging Existing Schema

**Existing Tables to Use:**
- `profiles` - Golf influencer accounts
- `bags` - Golf bags (extend with golf-specific fields)
- `bag_items` - Golf equipment (extend with golf specifications)
- `share_links` - Generated share links
- `media_assets` - Golf equipment images
- `analytics_events` - Tracking events

**New Tables Needed:**
- Golf bag-specific metadata (or extend `bags`)
- Golf discount codes
- Golf affiliate link templates
- QR codes
- Processing jobs/status
- Golf equipment catalog
- Golf equipment clarification sessions
- Bag version history

### Extending Existing Features

**Share Links:**
- Extend to support golf bag-specific sharing
- Add QR code generation
- Add usage tracking per bag
- Golf-specific link slugs

**Media Assets:**
- Support golf equipment image scraping
- Batch image processing
- Image optimization pipeline
- Golf equipment image catalog

**Analytics:**
- Extend tracking for golf bag-specific events
- Add earnings tracking
- Add conversion tracking
- Golf equipment category tracking
- Golf brand performance tracking

---

## Conclusion

This document provides a comprehensive specification for implementing golf influencer/YouTuber functionality within the Teed platform. The workflows, pages, and features outlined here will enable golf content creators to efficiently monetize their content while providing an excellent experience for their audience seeking golf equipment information.

**Key Success Factors:**
1. Streamlined content submission and processing with golf equipment focus
2. Powerful clarification system for incomplete equipment mentions
3. Golf-specific product matching and catalog integration
4. Seamless golf retailer affiliate link and code management
5. Comprehensive analytics and reporting (golf category and brand specific)
6. Excellent consumer-facing experience (mobile-optimized)
7. Golf industry awareness (seasonality, release cycles, community)

**Priority Implementation Phases:**

**Phase 1 (MVP):**
- Basic golf equipment entry (manual list with categories)
- Equipment clarification interface (critical for golf)
- Basic golf equipment enrichment (manual)
- Link generation
- Basic public golf bag page (category-organized)
- Simple analytics

**Phase 2:**
- Video transcript processing with golf equipment extraction
- Auto golf equipment image scraping
- Auto golf affiliate link generation
- QR code generation
- Golf equipment catalog integration
- Detailed analytics (category, brand, retailer)
- Multi-bag management

**Phase 3:**
- Advanced AI features (better golf equipment matching)
- Social media integration
- Advanced customization (bag visual representation)
- Brand collaboration features
- Mobile app
- Golf equipment comparison tools
- Community features

This specification should be reviewed alongside other user case documents (e.g., `user-haul-case.md`) to identify common features and ensure cohesive platform design while maintaining golf-specific functionality.

---

**End of Document**



