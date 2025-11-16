# Casual User Use Case - Complete Workflow & Page Requirements

**Document Purpose:** Comprehensive specification for casual user functionality on Teed, enabling everyday users to easily document and share their personal gear setups (golf bags, camera bags, office setups, etc.) with friends and family through intuitive image-based workflows and simplified item entry.

**Target User:** Regular users (non-influencers, non-content creators) who want to:
- Document their personal gear collections for sharing with friends/family
- Use photos instead of typing detailed product information
- Benefit from AI-assisted product identification and detail completion
- Share their setups via simple links or QR codes
- Optionally include purchase links but primarily focus on sharing and documentation

**Last Updated:** 2025-01-15

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [User Personas & Use Cases](#user-personas--use-cases)
3. [Complete Workflow Flows](#complete-workflow-flows)
4. [Page Specifications](#page-specifications)
5. [Features & Functionality](#features--functionality)
6. [AI & Image Recognition Requirements](#ai--image-recognition-requirements)
7. [Integration Requirements](#integration-requirements)
8. [Technical Considerations](#technical-considerations)
9. [Consumer/Viewer Experience](#consumerviewer-experience)
10. [Research & Insights](#research--insights)

---

## Executive Summary

Casual users want a simple, visual way to document and share their personal gear collections without the complexity of professional content creation. Key needs include:

- **Primary: Photo-Based Entry** - Upload a photo of their golf bag, camera gear, or office setup and let AI identify products automatically
- **Secondary: Conversational Item Entry** - Type partial information (e.g., "Callaway Elyte driver") and receive smart prompts to complete details
- **Tertiary: Manual Entry** - Full manual entry option for users who prefer typing everything out
- **Sharing Focus** - Generate shareable links and QR codes for easy distribution to friends and family
- **Optional Monetization** - Ability to add affiliate links/codes if desired, but not required
- **Privacy Control** - Simple privacy settings (public, unlisted, private)
- **Minimal Effort** - The system should do the heavy lifting, asking clarifying questions only when necessary

This document outlines all workflows, pages, features, and technical requirements to support this use case within the Teed platform.

---

## User Personas & Use Cases

### Primary Persona: Casual Gear Enthusiast

**Characteristics:**
- Personal hobbyist (golf, photography, tech, camping, etc.)
- Not a content creator or influencer
- Wants to share gear setups with friends, family, or online communities
- May not remember exact model numbers or technical specifications
- Values simplicity and ease of use over advanced features
- Typically uses mobile devices for photo uploads
- May have varying technical expertise (from novice to tech-savvy)

**Motivations:**
- Show off a new setup to friends
- Share recommendations with others interested in similar gear
- Keep a personal inventory for insurance or organization purposes
- Help others who ask "what's in your bag?"
- Document gear for travel or event preparation

**Pain Points:**
- Doesn't want to spend time researching exact product models
- Finds typing detailed product information tedious
- May not know all technical specifications
- Wants something quick and easy, not time-consuming
- Doesn't need monetization features but appreciates options

### Secondary Persona: Social Sharer

**Characteristics:**
- Active on social media (but not as influencer)
- Enjoys sharing personal interests with online communities
- Wants to help others discover products they love
- May join hobby-specific forums or groups
- Comfortable with technology but not professional creator tools

### Use Case Scenarios

**Scenario 1: Golf Bag Setup**
- User wants to share their golf bag setup with golf buddies
- Takes a photo of their golf bag with clubs visible
- System identifies clubs (Callaway driver, Titleist irons, etc.)
- System asks clarifying questions: "What's the loft on your driver?" "What flex is your shaft?"
- User confirms or corrects AI suggestions
- Shares link with friends via text/email

**Scenario 2: Camera Bag Documentation**
- Photographer wants to document their camera gear for insurance
- Uploads multiple photos of camera equipment
- AI identifies cameras, lenses, accessories
- User adds personal notes (e.g., "My go-to lens for portraits")
- Generates private shareable list for personal records

**Scenario 3: Office Setup Sharing**
- Tech enthusiast wants to show office setup to Reddit community
- Takes wide-angle photo of desk setup
- AI identifies monitor brands, keyboard, mouse, desk accessories
- System prompts: "What size is that monitor?" "Is that a mechanical keyboard?"
- User adds purchase links (optional)
- Shares to Reddit via generated link

**Scenario 4: Travel Packing List**
- User wants to share travel gear packing list with family
- Takes photos of items laid out before packing
- AI identifies luggage, electronics, clothing items
- User organizes into categories (carry-on, checked, etc.)
- Shares with family planning similar trip

**Scenario 5: Minimal Effort Sharing**
- User has partial knowledge: "I have a Callaway driver and some Titleist irons"
- Types in basic info: "Callaway Elyte driver"
- System recognizes ambiguity and asks: "Which Callaway Epic model do you have?" (shows options)
- User selects from AI suggestions
- System enriches with details automatically
- Quick share link generated

**Scenario 6: Photo-Only Workflow**
- User uploads photo of gear spread out on floor
- AI identifies everything visible in photo
- User reviews list, confirms/corrects items
- Adds minimal personal context if desired
- Shares immediately - no additional work needed

---

## Complete Workflow Flows

### Workflow 1: Initial Setup & Onboarding

**Steps:**
1. **Account Registration**
   - Sign up with email/social login (Google, Apple, Facebook)
   - Minimal information required
   - Option to skip profile completion initially

2. **Profile Setup (Optional, Can Complete Later)**
   - Display name
   - Avatar/photo (optional)
   - Bio (optional)
   - Preferred interests/categories (helps with AI suggestions)

3. **Quick Onboarding Tutorial**
   - Interactive walkthrough showing:
     - How to create a new bag/collection
     - Photo upload feature (highlight this as primary method)
     - How AI identification works
     - How to share via link/QR code
   - Skip option available
   - Can replay tutorial later

**Pages Required:**
- Registration/Login Page (minimal, fast)
- Welcome/Onboarding Page (optional, skippable)
- Dashboard (landing page after login)

**Key Design Principles:**
- Minimal friction - don't require extensive setup
- Show value immediately (demo or example)
- Highlight photo upload as primary method
- Make sharing obvious and easy

---

### Workflow 2: Creating a New Gear Collection (Primary Flow)

#### Option A: Photo-First Workflow (Recommended Primary Method)

**Steps:**
1. **Start New Collection**
   - Click "Create New Collection" from dashboard
   - Enter collection name (e.g., "My Golf Bag", "Camera Gear 2024")
   - Optionally add description or category

2. **Upload Photo(s)**
   - Drag-and-drop or click to upload
   - Support multiple photos (can combine different angles)
   - Mobile: Use camera directly or select from gallery
   - Show upload progress

3. **AI Processing**
   - Display processing status with progress indicator
   - Show live updates: "Identifying products...", "Finding matches...", "Extracting details..."
   - Estimated time: 10-30 seconds per photo

4. **Review AI Results**
   - Display identified items with:
     - Detected product name
     - Confidence score (visual indicator)
     - Suggested image crop for each item
     - Catalog match (if found) with image
   - User can:
     - Accept AI suggestion
     - Edit product name/details
     - Reject incorrect identifications
     - Add missing items manually

5. **Detail Completion (AI-Powered Prompts)**
   - For items with partial information, system asks clarifying questions:
     - Example: "Callaway driver detected. Which model?" (shows options with images)
     - Example: "Monitor identified. What size?" (dropdown: 24", 27", 32", etc.)
     - Example: "Lens detected. What focal length?" (text input with suggestions)
   - Smart question flow - only ask what's needed
   - User can skip questions if they don't know

6. **Enrichment (Optional)**
   - User can add:
     - Personal notes (e.g., "My favorite driver", "Bought in 2022")
     - Purchase links (optional - system can search/crawl if user provides retailer)
     - Affiliate links/codes (optional, only if user wants)
     - Additional photos per item

7. **Organization**
   - Drag-and-drop to reorder items
   - Optional: Group into categories (AI suggests categories)
   - Add section headers if desired

8. **Save & Share**
   - Save collection
   - Generate share link automatically
   - Option to create QR code
   - Copy link or share directly

**Pages Required:**
- Create Collection Page
- Photo Upload Interface
- AI Processing Status Page
- Product Review & Confirmation Page
- Detail Completion Wizard (question prompts)
- Collection Editor Page

**Key Features:**
- Always allow user to proceed even if unsure about details
- Don't block progress - let users skip or add details later
- Show what AI found even if confidence is low - let user decide
- Mobile-optimized photo upload and review

---

#### Option B: Conversational Entry Workflow (Secondary Method)

**Steps:**
1. **Start New Collection**
   - Same as Option A

2. **Text Entry**
   - User types partial information:
     - "Callaway Elyte driver"
     - "Titleist irons"
     - "Nikon camera with 50mm lens"

3. **AI Recognition & Question Generation**
   - System analyzes input for ambiguities
   - Identifies missing critical information
   - Generates smart questions:
     - "Callaway has multiple Epic models. Which do you have?"
        - Shows visual options with images
        - Options: Epic Speed, Epic Max, Epic LS, Epic Flash, etc.
     - "What's the loft on your driver?" (for golf clubs)
     - "What's the shaft flex?" (for golf clubs)
     - "What specific Titleist iron model?" (shows options)

4. **Progressive Detail Collection**
   - System asks 1-2 questions at a time (not overwhelming)
   - Shows why question matters (contextual help)
   - User can:
     - Answer from suggestions
     - Type custom answer
     - Skip if unknown
     - Say "I don't know" - system moves on

5. **Automatic Enrichment**
   - Once enough details gathered, system:
     - Fetches product images from catalog
     - Adds product descriptions
     - Suggests specifications
     - User can accept/reject/enhance

6. **Continue Adding Items**
   - User can add more items using same method
   - Or switch to photo upload mid-process
   - Batch entry supported

7. **Review & Complete**
   - Review all items
   - Add photos if desired (can upload photos later)
   - Finalize and share

**Pages Required:**
- Text Entry Interface
- Question Prompt Wizard (progressive)
- Product Selection Interface (with visual options)
- Review & Completion Page

**Key Features:**
- Conversational UI - feels like chat/assistant
- Visual product selection (images, not just text)
- Remember context across questions
- Allow backtracking/editing
- Mobile-friendly text input with autocomplete

---

#### Option C: Manual Entry Workflow (Tertiary Method)

**Steps:**
1. **Start New Collection**
   - Same as previous options

2. **Manual Item Entry Form**
   - Traditional form fields:
     - Product name
     - Brand
     - Model (optional)
     - Description (optional)
     - Photos (can add later)
     - Links (optional)
   - AI assists with autocomplete suggestions
   - Catalog search available if user wants

3. **Add Multiple Items**
   - Quick add form (minimal fields)
   - Bulk entry option (paste list, AI parses)
   - Import from spreadsheet (future)

4. **Review & Share**
   - Standard editor view
   - Share as before

**Pages Required:**
- Manual Entry Form
- Item List Editor
- Bulk Entry Interface

**Key Features:**
- Still leverage AI for autocomplete/search
- Don't require all fields
- Fast entry option (minimal form)

---

### Workflow 3: Photo-Based Product Identification (Detailed)

**This is a core differentiator for casual users.**

**Technical Flow:**
1. **Image Upload & Processing**
   - User uploads photo(s)
   - System processes image(s):
     - Object detection (identify individual products)
     - Segmentation (separate items in photo)
     - Brand logo recognition
     - Text recognition (OCR for model numbers/labels)

2. **Product Identification**
   - Multi-modal AI approach:
     - **Visual Recognition**: Match visual features to product catalog
     - **Brand/Model Detection**: Identify brand logos and model numbers
     - **Contextual Understanding**: Use surrounding items for context
       - Example: Golf clubs together suggest all are golf equipment
       - Example: Camera with lens suggests photography gear
     - **Size Estimation**: Estimate relative sizes to narrow product options

3. **Catalog Matching**
   - Search product catalog for matches:
     - Visual similarity search
     - Brand + model matching
     - Category filtering based on context
   - Return top matches with confidence scores

4. **Presentation to User**
   - Show identified items with:
     - Bounding box or highlight on original photo
     - Detected product name
     - Confidence indicator (high/medium/low)
     - Suggested catalog match with image
     - Alternative suggestions if multiple matches found

5. **User Confirmation**
   - User reviews each detection:
     - ✅ Accept - item added to collection
     - ✏️ Edit - modify product name/details
     - ❌ Reject - mark as incorrect (helps AI learn)
     - ➕ Add - mark item as present but not detected
   - System learns from corrections

6. **Detail Refinement**
   - For accepted items, system may prompt for:
     - Specific model variant
     - Configuration details (size, color, etc.)
     - Purchase details (optional)
   - Only asks if information would be valuable or necessary

**Pages Required:**
- Photo Upload Interface
- AI Processing Status Page
- Photo Review Interface (annotated image)
- Product Confirmation Interface
- Detail Refinement Wizard

**Key Features:**
- Visual feedback on photo (highlight detected items)
- Confidence indicators (but don't hide low-confidence results)
- Easy correction interface
- Batch accept/reject options
- Mobile-optimized touch interactions

---

### Workflow 4: Smart Question Generation for Incomplete Items

**This addresses the "Callaway Elyte driver" example.**

**When User Provides Partial Information:**
- "Callaway Elyte driver" (may mean Callaway Epic, typo, or partial name)
- "Titleist irons" (many iron models exist)
- "Nikon camera" (many camera models)
- "MacBook" (many variants)

**AI Question Generation Logic:**

1. **Ambiguity Detection**
   - Parse user input
   - Identify known ambiguities:
     - Multiple models exist
     - Incomplete information
     - Typos or variations
     - Missing critical specs

2. **Question Priority**
   - Ask most important questions first
   - Golf clubs: Model → Loft → Shaft flex → Shaft type
   - Cameras: Model → Lens → Accessories
   - Electronics: Model → Size/Specs → Year

3. **Visual Question Interface**
   - **Not just text dropdowns** - show images!
   - Example for "Callaway driver":
     - "Which Callaway driver do you have?"
     - Show grid of images: Epic Speed, Epic Max, Epic LS, Mavrik, etc.
     - User clicks/taps on matching image
   - For specs (loft, size, etc.):
     - Dropdown with options
     - Visual guide if applicable (e.g., loft angle diagram)
     - "I don't know" option always available

4. **Progressive Disclosure**
   - Ask 1-2 questions at a time
   - Don't overwhelm with form
   - Show progress indicator
   - Allow skipping non-critical questions

5. **Contextual Help**
   - Explain why question is asked
   - Show where to find information (if applicable)
   - Provide examples

6. **Smart Defaults**
   - Use AI to infer likely answers
   - Pre-select most common option
   - User can override

**Pages Required:**
- Question Prompt Wizard (modal or full-page)
- Product Selection Interface (visual grid)
- Specification Input Interface

**Key Features:**
- Conversational tone
- Visual product selection (critical!)
- Mobile-friendly touch targets
- Skip option always available
- Context-aware questions

---

### Workflow 5: Collection Editing & Management

**Steps:**
1. **Access Collection**
   - From dashboard, click on collection
   - View collection in edit mode or view mode

2. **Edit Items**
   - Click on item to edit
   - Modify any details
   - Add/remove photos
   - Add/remove links
   - Delete item

3. **Add More Items**
   - Use any method (photo, text, manual)
   - Add to existing collection

4. **Organize Items**
   - Drag-and-drop reordering
   - Create categories/sections (optional)
   - Group related items

5. **Collection Settings**
   - Edit title/description
   - Change privacy settings
   - Update cover image
   - Manage share links

6. **Save Changes**
   - Auto-save as user works
   - Manual save also available
   - Changes reflected immediately in shared view

**Pages Required:**
- Collection Editor/Dashboard
- Item Detail Editor (modal or page)
- Collection Settings Page

**Key Features:**
- Auto-save functionality
- Undo/redo for changes
- Mobile-friendly editing
- Live preview of public view

---

### Workflow 6: Sharing & Distribution

**Steps:**
1. **Generate Share Link**
   - Automatically generated when collection created
   - Custom slug option (e.g., `/c/johns-golf-bag`)
   - Link preview shows what viewers will see

2. **QR Code Generation**
   - Click "Generate QR Code"
   - Customize QR code design (optional):
     - Size selection
     - Color options
     - Logo overlay (if user wants)
   - Download in various formats (PNG, SVG, PDF)

3. **Share Options**
   - Copy link to clipboard
   - Share via:
     - Email
     - Text message
     - Social media (Twitter, Facebook, Reddit, etc.)
     - Direct link sharing
   - Embed code (if collection is public)

4. **Privacy Settings**
   - Public: Anyone with link can view
   - Unlisted: Only people with link can view (not searchable)
   - Private: Only user can view (or password-protected)

5. **Share Analytics (Optional, Basic)**
   - View count (simple counter)
   - Last viewed timestamp
   - No detailed analytics (keep it simple for casual users)

**Pages Required:**
- Share Settings/Management Page
- QR Code Generator Page
- Share Link Preview Page

**Key Features:**
- One-click link copying
- QR code generation in seconds
- Mobile-friendly sharing (native share sheet)
- Privacy controls are simple and clear

---

### Workflow 7: Viewing Shared Collections (Consumer Experience)

**Steps:**
1. **Access via Link or QR Code**
   - Recipient clicks link or scans QR code
   - No login required to view

2. **View Collection**
   - See collection title and description
   - View creator's profile (name, avatar) if public
   - Browse items in grid or list view
   - See product images and details

3. **Interact with Items**
   - Click item for details
   - View all photos
   - See product specifications
   - Read creator's notes
   - Click purchase links (if available)

4. **Share Further (Optional)**
   - Share link with others
   - Save/bookmark for later

**Pages Required:**
- Public Collection View Page
- Item Detail View Page (modal or page)

**Key Features:**
- No login required
- Mobile-optimized
- Fast loading
- Clean, simple design
- Print-friendly option

---

## Page Specifications

### 1. User Dashboard (Main Hub)

**Purpose:** Central landing page after login - quick access to all collections

**Key Sections:**
- **Welcome Section**
  - Quick greeting
  - "Create New Collection" prominent button
  - Short tutorial link (for new users)

- **Collections Grid**
  - Visual grid of user's collections
  - Each card shows:
    - Collection cover image
    - Title
    - Item count
    - Last updated date
    - Share status indicator (public/private)
  - Filter/Sort options:
    - Sort by: Newest, Recently updated, Most items
    - Filter by: Category/type
    - Search collections

- **Quick Actions**
  - "Create New Collection" button (multiple methods)
  - "Upload Photo" quick action
  - "Recent Activity" (optional)

- **Navigation Menu**
  - Dashboard
  - My Collections
  - Profile/Settings
  - Help/Support

**Features:**
- Responsive design (mobile-first)
- Dark/light mode toggle (optional)
- Empty state: Helpful guidance for first-time users
- Recent collections highlighted

**Design Principles:**
- Clean, uncluttered
- Photo-first (show images prominently)
- Minimal navigation
- Mobile-optimized

---

### 2. Create Collection Page

**Purpose:** Starting point for creating new gear collection

**Layout:**
- **Step 1: Basic Info**
  - Collection name input (required)
  - Description (optional)
  - Category selection (optional, helps AI)
  - Cover image upload (optional, can add later)

- **Step 2: Add Items (Primary Action)**
  - Three method options, prominently displayed:
    1. **📷 Upload Photo(s)** - Primary, largest button
       - "Let AI identify your gear automatically"
       - Drag-and-drop area
       - Or click to browse
       - Mobile: Camera button + gallery button
    
    2. **💬 Tell Us About It** - Secondary
       - "Type what you have and we'll ask questions"
       - Text input area
       - Example: "Callaway driver, Titleist irons..."
    
    3. **✏️ Add Manually** - Tertiary
       - Traditional form entry
       - For users who prefer full control

- **Method-Specific Flows**
  - User selects method → proceeds to appropriate workflow
  - Can switch methods later

**Features:**
- Clear method selection
- Mobile-optimized photo upload
- Progressive disclosure (don't overwhelm)
- Help tooltips/examples

**Design Principles:**
- Photo upload method is most prominent
- Visual method selection (icons, not just text)
- Mobile-first design
- Quick start (minimal required fields)

---

### 3. Photo Upload Interface

**Purpose:** Upload and process photos for AI identification

**Key Elements:**
- **Upload Area**
  - Large drag-and-drop zone
  - "Click to upload" or "Take photo" buttons
  - Support multiple photos
  - Show upload progress
  - Preview thumbnails of uploaded photos

- **Photo Guidelines**
  - Tips for best results:
    - "Good lighting helps AI identify products"
    - "Take photos from multiple angles"
    - "Make sure products are clearly visible"
  - Collapsible help section

- **Upload Controls**
  - Add more photos button
  - Remove photos
  - Reorder photos
  - Rotate/crop (basic editing)

- **Processing Trigger**
  - "Identify Products" button (when photos uploaded)
  - Shows what will happen next

**Mobile Considerations:**
- Camera access button
- Gallery picker
- Native photo editing (if available)
- Upload progress indicator
- Offline queue (save photos, process when online)

**Features:**
- Drag-and-drop (desktop)
- Camera integration (mobile)
- Multiple photo support
- Photo preview before processing
- Upload progress tracking

---

### 4. AI Processing Status Page

**Purpose:** Show progress while AI analyzes photos

**Key Elements:**
- **Progress Indicator**
  - Animated progress bar
  - Current step displayed:
    1. "Uploading photos..." (0-10%)
    2. "Analyzing images..." (10-40%)
    3. "Identifying products..." (40-70%)
    4. "Finding matches..." (70-90%)
    5. "Almost done..." (90-100%)

- **Live Updates**
  - Show detected items as they're found
  - "Found: Callaway driver"
  - "Found: Titleist irons"
  - Real-time list building

- **Visual Feedback**
  - Animated icons/illustrations
  - Positive, encouraging messaging
  - Estimated time remaining

- **Background Processing**
  - User can navigate away (mobile consideration)
  - Notification when complete
  - Resume from dashboard if left

**Features:**
- Real-time progress updates
- Mobile-friendly (can minimize)
- Email/notification when complete
- Estimated time display
- Cancel option (if processing is slow)

**Design Principles:**
- Transparent about what's happening
- Positive, friendly tone
- Don't make user wait unnecessarily
- Show progress to reduce anxiety

---

### 5. Product Review & Confirmation Page

**Purpose:** User reviews AI-identified products and confirms/corrects them

**Layout:**
- **Photo with Annotations**
  - Original photo displayed
  - Detected items highlighted/boxed
  - Numbered or labeled overlays
  - User can click on annotation to edit item

- **Product List**
  - Scrollable list of detected items
  - Each item shows:
    - Detected name (editable)
    - Confidence indicator (visual: high/medium/low)
    - Suggested catalog match with image
    - Alternative suggestions (if multiple matches)
    - Status: ✓ Confirmed, ✏️ Editing, ❌ Rejected

- **Item Actions**
  - Click item to:
    - Confirm (accept as-is)
    - Edit details
    - Reject (incorrect detection)
    - Add manual item (if AI missed something)

- **Bulk Actions**
  - "Accept All" button
  - "Reject All" button (unlikely but available)
  - Filter by confidence level

**Features:**
- Visual annotation on photo
- Touch-friendly (mobile)
- Easy correction interface
- Batch operations
- Undo functionality

**Design Principles:**
- Visual feedback on photo is key
- Make corrections easy
- Don't penalize for rejecting items
- Show confidence but let user decide

---

### 6. Detail Completion Wizard (Question Prompts)

**Purpose:** Ask clarifying questions for incomplete product information

**Layout:**
- **Question Interface**
  - One question at a time (or max 2-3 related questions)
  - Clear question text
  - Visual answer options (when applicable)
  - Text input (when needed)
  - "I don't know" / "Skip" option always available

- **Visual Product Selection**
  - For model selection questions:
    - Grid of product images
    - Product name below each image
    - Tap/click to select
    - "None of these" option
  - Example: "Which Callaway driver?"
    - Shows: Epic Speed, Epic Max, Epic LS, Mavrik, etc.
    - Each with image
    - User selects matching one

- **Specification Input**
  - For specs (loft, size, etc.):
    - Dropdown with common options
    - Text input with autocomplete
    - Visual guides if helpful (e.g., loft angle diagram)

- **Progress Indicator**
  - "Question 2 of 4" or similar
  - Shows why question matters (brief context)
  - Can go back to previous questions

- **Navigation**
  - "Next" button
  - "Back" button
  - "Skip remaining questions" option

**Features:**
- Progressive disclosure (not overwhelming)
- Visual selection (critical!)
- Mobile-friendly touch targets
- Contextual help
- Smart defaults

**Design Principles:**
- Conversational, friendly tone
- Visual over text when possible
- Never block progress
- Explain why questions are asked
- Make it feel helpful, not interrogative

---

### 7. Collection Editor Page

**Purpose:** Edit and organize collection items

**Layout:**
- **Collection Header**
  - Title (editable)
  - Description (editable)
  - Cover image (editable)
  - Privacy settings
  - Share button/link

- **Items List/Grid**
  - All items displayed
  - Each item shows:
    - Image
    - Name
    - Key details
    - Edit/delete buttons
  - Drag-and-drop reordering
  - Filter/sort options

- **Item Detail Panel** (when item selected)
  - Full item details
  - All photos
  - Links
  - Notes
  - Edit/delete actions

- **Add More Items**
  - Button to add more items (any method)
  - Quick add option

- **Organization Tools**
  - Create categories/sections (optional)
  - Group items
  - Add section headers

**Features:**
- Drag-and-drop reordering
- Auto-save
- Undo/redo
- Mobile-friendly editing
- Live preview toggle

**Design Principles:**
- Intuitive editing
- Visual organization tools
- Fast item addition
- Don't lose work (auto-save)

---

### 8. Share Settings & Link Management Page

**Purpose:** Generate and manage share links and QR codes

**Layout:**
- **Share Link Section**
  - Generated link displayed
  - Copy button (prominent)
  - Custom slug option (optional)
  - Link preview (what viewers will see)

- **QR Code Section**
  - QR code preview
  - Download options:
    - PNG (various sizes)
    - SVG
    - PDF
  - Customization options (optional):
    - Size
    - Colors
    - Logo overlay

- **Privacy Settings**
  - Public / Unlisted / Private toggle
  - Password protection option (for private)
  - Expiration date (optional)

- **Share Directly**
  - Share buttons:
    - Email
    - Text/SMS
    - Social media (Twitter, Facebook, Reddit, etc.)
    - Copy link

- **Analytics (Simple)**
  - View count (if public/unlisted)
  - Last viewed timestamp
  - Basic stats only

**Features:**
- One-click link copying
- QR code generation
- Native mobile sharing
- Privacy controls
- Link preview

**Design Principles:**
- Sharing is primary action
- Make it dead simple
- QR codes easily accessible
- Privacy controls are clear

---

### 9. Public Collection View Page (Consumer-Facing)

**Purpose:** Display collection to viewers (friends, family, etc.)

**Layout:**
- **Header**
  - Collection title
  - Description
  - Creator profile (name, avatar) if public
  - Created/updated date

- **Cover Image** (if set)
  - Large hero image
  - Shows collection theme

- **Items Display**
  - Grid or list view (responsive)
  - Each item card shows:
    - Product image(s)
    - Product name
    - Brand
    - Key specifications
    - Creator's notes (if any)
    - Purchase links (if available)
  - Click item for full details

- **Item Detail View** (modal or page)
  - Full-size images (gallery)
  - Complete specifications
  - All creator notes
  - Purchase links
  - Additional information

- **Share Button**
  - Allow viewers to share collection
  - Copy link option

- **Footer**
  - Creator attribution
  - "Created with Teed" branding

**Features:**
- No login required
- Mobile-optimized
- Fast loading
- Clean, readable design
- Print-friendly option
- SEO-friendly (if public)

**Design Principles:**
- Focus on items (content)
- Clean, minimal design
- Fast loading
- Mobile-first
- Accessible

---

### 10. Settings/Profile Page

**Purpose:** User account and preference management

**Key Sections:**
- **Profile Settings**
  - Display name
  - Avatar/photo
  - Bio (optional)
  - Email

- **Preferences**
  - Default privacy setting for new collections
  - Notification preferences (optional)
  - Theme (light/dark, if applicable)

- **Account**
  - Password change
  - Connected accounts (social login)
  - Delete account

**Features:**
- Simple, straightforward settings
- Mobile-friendly
- Save confirmation

**Design Principles:**
- Minimal settings (don't overwhelm)
- Clear organization
- Easy to find what you need

---

### 11. Help & Support Page

**Purpose:** Resources and assistance for users

**Key Sections:**
- **Getting Started**
  - Quick start guide
  - How photo identification works
  - How to share collections

- **FAQ**
  - Common questions:
    - "How accurate is AI identification?"
    - "Can I edit items after AI identifies them?"
    - "How do I share my collection?"
    - "What if AI doesn't identify something correctly?"

- **Tutorials**
  - Video tutorials (if available)
  - Step-by-step guides
  - Example collections

- **Support**
  - Contact support form
  - Email support
  - Community forum (if available)

**Features:**
- Searchable documentation
- Video embeds
- Mobile-friendly
- Easy to navigate

---

## Features & Functionality

### Core Features

#### 1. Photo-Based Product Identification (Primary Feature)

**Capabilities:**
- **Object Detection**: Identify individual products in photos
- **Product Recognition**: Match visual features to product catalog
- **Brand/Logo Detection**: Recognize brand logos and model numbers
- **Context Understanding**: Use surrounding items for better identification
- **Multi-Photo Support**: Combine multiple photos for better accuracy

**Technical Approach:**
- Computer vision models (object detection, classification)
- Visual similarity search in product catalog
- OCR for text/model numbers in images
- Brand logo recognition
- Contextual inference (golf clubs together = golf bag context)

**User Experience:**
- Visual feedback on photos (bounding boxes, highlights)
- Confidence indicators
- Easy correction interface
- Learn from user corrections

#### 2. Conversational Item Entry

**Capabilities:**
- **Natural Language Understanding**: Parse user input
- **Ambiguity Detection**: Identify incomplete or ambiguous information
- **Smart Question Generation**: Ask relevant clarifying questions
- **Visual Product Selection**: Show product images for selection
- **Progressive Disclosure**: Ask questions one at a time

**User Experience:**
- Chat-like interface
- Visual product selection (not just text)
- Skip options always available
- Contextual help

#### 3. Detail Completion & Enrichment

**Capabilities:**
- **Automatic Enrichment**: Fetch product details from catalog
- **Smart Prompts**: Ask for missing critical information
- **Catalog Matching**: Match user items to verified products
- **Specification Extraction**: Identify and extract specifications
- **Image Fetching**: Automatically add product images

**User Experience:**
- Minimal user effort
- Only ask when necessary
- Visual guides for complex specs
- Accept partial information

#### 4. Collection Management

**Capabilities:**
- **Organization Tools**: Categories, sections, grouping
- **Drag-and-Drop**: Reorder items easily
- **Bulk Operations**: Edit multiple items
- **Search & Filter**: Find items quickly
- **Auto-Save**: Don't lose work

**User Experience:**
- Intuitive editing
- Fast operations
- Mobile-friendly
- Visual organization

#### 5. Sharing & Distribution

**Capabilities:**
- **Link Generation**: Unique, shareable URLs
- **QR Code Creation**: Generate QR codes instantly
- **Privacy Controls**: Public, unlisted, private options
- **Social Sharing**: Direct sharing to platforms
- **Analytics**: Basic view tracking (optional)

**User Experience:**
- One-click sharing
- QR codes easily accessible
- Privacy is simple and clear
- Mobile-optimized sharing

#### 6. Optional Monetization Features

**Capabilities:**
- **Link Addition**: Users can add purchase/affiliate links
- **Affiliate Code Support**: Add discount codes
- **Link Crawling**: Auto-fetch product links if user provides retailer
- **Not Required**: All monetization is optional

**User Experience:**
- Optional feature (not pushed)
- Easy to add if desired
- Transparent (marked as affiliate if applicable)

### Advanced Features

#### 7. Smart Suggestions

**Capabilities:**
- **Similar Collections**: Suggest items based on what others have
- **Common Items**: Suggest frequently included items
- **Category Suggestions**: Suggest items for category
- **Learning**: Improve suggestions based on user behavior

**User Experience:**
- Helpful, not intrusive
- Easy to dismiss
- Visual suggestions

#### 8. Collaboration (Future)

**Capabilities:**
- **Shared Collections**: Multiple users contribute
- **Comments**: Viewers can comment (optional)
- **Forking**: Copy and modify others' collections

**User Experience:**
- Simple sharing model
- Privacy controls
- Attribution

---

## AI & Image Recognition Requirements

### 1. Image Processing Pipeline

**Stages:**
1. **Image Upload & Validation**
   - Accept multiple formats (JPEG, PNG, HEIC, etc.)
   - Validate file size and dimensions
   - Optimize for processing

2. **Preprocessing**
   - Image enhancement (brightness, contrast)
   - Noise reduction
   - Resolution optimization

3. **Object Detection**
   - Identify individual products in image
   - Segmentation (separate overlapping items)
   - Bounding box generation

4. **Feature Extraction**
   - Extract visual features
   - Brand logo detection
   - Text recognition (OCR)
   - Color/shape analysis

5. **Product Recognition**
   - Match features to product catalog
   - Visual similarity search
   - Contextual filtering

6. **Confidence Scoring**
   - Calculate confidence for each detection
   - Rank alternatives
   - Flag uncertain detections

**Technology Stack:**
- Computer vision models (YOLO, Faster R-CNN, or similar)
- Deep learning for product recognition
- OCR (Tesseract, cloud OCR APIs)
- Visual search (embedding models, similarity search)
- Brand logo recognition models

### 2. Question Generation AI

**Capabilities:**
- **Input Analysis**: Parse user text input
- **Ambiguity Detection**: Identify missing or unclear information
- **Question Prioritization**: Determine which questions are most important
- **Context Awareness**: Consider collection context (golf bag → ask golf-specific questions)
- **Answer Format Selection**: Choose best input method (visual selection, dropdown, text)

**Logic:**
- Parse input: "Callaway Elyte driver"
- Detect ambiguity: "Elyte" may be typo for "Epic"
- Search catalog: Find all Callaway drivers
- Generate question: "Which Callaway driver model?"
- Format: Visual grid (best UX) with images
- Prioritize: Ask model before asking specs

**Technology:**
- NLP for text parsing
- Knowledge base for product catalogs
- Question generation models
- UI/UX logic for question formatting

### 3. Catalog Matching & Enrichment

**Capabilities:**
- **Product Search**: Search product catalog by name, brand, visual features
- **Specification Extraction**: Pull specs from catalog
- **Image Fetching**: Get product images from catalog
- **Price Information**: Include pricing if available
- **Multiple Source Support**: Amazon, manufacturer sites, etc.

**Data Sources:**
- Product catalog database
- Retailer APIs (if available)
- Web scraping (with respect to ToS)
- User-contributed data

### 4. Learning & Improvement

**Capabilities:**
- **User Feedback Loop**: Learn from corrections
- **Confidence Calibration**: Improve confidence scoring
- **Error Analysis**: Identify common misidentifications
- **Model Updates**: Retrain models with new data

**Approach:**
- Track user corrections (rejections, edits)
- Analyze patterns in errors
- Update models periodically
- A/B test improvements

---

## Integration Requirements

### 1. Image Recognition Services

**Options:**
- **Self-Hosted Models**: Train/deploy own models
- **Cloud AI Services**: 
  - Google Cloud Vision API
  - AWS Rekognition
  - Azure Computer Vision
  - OpenAI CLIP (for visual similarity)
- **Specialized Services**:
  - Product recognition APIs
  - Brand logo recognition services

**Requirements:**
- Fast processing (10-30 seconds per photo)
- Accurate identification
- Support for various product categories
- Cost-effective at scale

### 2. Product Catalog Integration

**Data Sources:**
- Internal product catalog (if Teed has one)
- Retailer APIs (Amazon Product Advertising, etc.)
- Manufacturer databases
- Third-party product data providers

**Requirements:**
- Large product database
- Regular updates
- High-quality images
- Detailed specifications
- Searchable by various attributes

### 3. Image Storage & CDN

**Services:**
- **Storage**: AWS S3, Google Cloud Storage, Supabase Storage
- **CDN**: Cloudflare, AWS CloudFront
- **Image Processing**: Cloudinary, Imgix

**Requirements:**
- Fast upload/download
- Image optimization
- Multiple format support
- Thumbnail generation
- Responsive image serving

### 4. OCR Services

**Options:**
- Google Cloud Vision API (OCR)
- AWS Textract
- Azure Computer Vision (OCR)
- Tesseract OCR (self-hosted)

**Requirements:**
- Read text from product images
- Model numbers, brand names
- High accuracy
- Fast processing

### 5. Social Sharing Integration

**Platforms:**
- Native sharing (Web Share API)
- Twitter, Facebook, Reddit
- Email, SMS
- QR code generation

**Requirements:**
- Native mobile sharing
- Link preview cards
- Easy integration

---

## Technical Considerations

### 1. Data Model Extensions

**Based on existing Teed schema, additional fields/tables needed:**

#### bags Table (extend existing)
- No major changes needed
- May add `collection_type` field to distinguish use cases
- `privacy_level` enum: 'public', 'unlisted', 'private'

#### bag_items Table (extend existing)
- `ai_confidence` (numeric) - Confidence score from AI identification
- `detection_method` (text) - 'photo', 'text', 'manual'
- `ai_suggestions` (jsonb) - Store alternative suggestions
- `needs_clarification` (boolean) - Flag for items needing questions
- `original_photo_id` (uuid) - Reference to photo item was detected in

#### New: photo_uploads Table
- `id` (uuid, PK)
- `bag_id` (uuid) → bags.id
- `user_id` (uuid) → profiles.id
- `image_url` (text)
- `processing_status` (text) - 'pending', 'processing', 'complete', 'error'
- `detected_items` (jsonb) - Store AI detection results
- `uploaded_at` (timestamptz)

#### New: item_clarifications Table
- `id` (uuid, PK)
- `bag_item_id` (uuid) → bag_items.id
- `question` (text)
- `question_type` (text) - 'model_selection', 'specification', 'other'
- `answer` (text, nullable)
- `options` (jsonb) - Possible answers/suggestions
- `answered_at` (timestamptz, nullable)
- `created_at` (timestamptz)

#### New: ai_detections Table (for learning)
- `id` (uuid, PK)
- `photo_upload_id` (uuid) → photo_uploads.id
- `detected_name` (text)
- `confidence_score` (numeric)
- `catalog_match_id` (uuid, nullable) → catalog_items.id
- `user_action` (text) - 'accepted', 'rejected', 'edited'
- `final_item_id` (uuid, nullable) → bag_items.id
- `created_at` (timestamptz)

### 2. API Endpoints Needed

#### Collection Management
- `POST /api/collections` - Create new collection
- `GET /api/collections/[id]` - Get collection
- `PUT /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection
- `GET /api/collections` - List user's collections

#### Photo Upload & Processing
- `POST /api/collections/[id]/photos` - Upload photos
- `POST /api/collections/[id]/photos/process` - Trigger AI processing
- `GET /api/collections/[id]/photos/[photo_id]/status` - Get processing status
- `GET /api/collections/[id]/photos/[photo_id]/results` - Get detection results

#### AI Processing
- `POST /api/ai/identify-products` - Process photo for product identification
- `POST /api/ai/generate-questions` - Generate clarifying questions for item
- `POST /api/ai/match-catalog` - Match item to catalog
- `POST /api/ai/enrich-item` - Enrich item with catalog data

#### Item Management
- `POST /api/collections/[id]/items` - Add item to collection
- `PUT /api/collections/items/[id]` - Update item
- `DELETE /api/collections/items/[id]` - Delete item
- `POST /api/collections/items/[id]/confirm` - Confirm AI detection
- `POST /api/collections/items/[id]/reject` - Reject AI detection
- `PUT /api/collections/items/reorder` - Reorder items

#### Clarification Questions
- `GET /api/collections/items/[id]/questions` - Get questions for item
- `POST /api/collections/items/[id]/answer` - Submit answer to question
- `POST /api/collections/items/[id]/skip-questions` - Skip remaining questions

#### Sharing
- `POST /api/collections/[id]/share-link` - Generate share link
- `POST /api/collections/[id]/qr-code` - Generate QR code
- `GET /api/public/collections/[slug]` - Get public collection view
- `POST /api/public/collections/[slug]/track-view` - Track view (analytics)

### 3. Background Jobs/Workers

#### Photo Processing Jobs
- Queue-based photo processing
- AI model inference
- Catalog matching
- Result storage

#### Scheduled Jobs
- Model retraining (periodic)
- Catalog updates
- Image optimization
- Cleanup old processing data

### 4. Performance Considerations

**Photo Processing:**
- Async processing (don't block user)
- Queue system (handle load)
- Progress updates (websockets or polling)
- Caching (cache common products)

**Image Serving:**
- CDN for fast delivery
- Responsive images (different sizes)
- Lazy loading
- Image optimization (WebP, compression)

**Mobile:**
- Offline support (queue uploads)
- Native camera integration
- Fast upload (chunking if needed)
- Background processing

---

## Consumer/Viewer Experience

### Landing on Shared Collection

**User Journey:**
1. Viewer clicks link or scans QR code
2. Lands on public collection page
3. No login required
4. Views collection with all items
5. Clicks items for details
6. Optionally clicks purchase links (if available)
7. Can share collection further

### Key Features for Viewers

**Visual Appeal:**
- High-quality product images
- Clean, readable layout
- Mobile-optimized
- Fast loading

**Information Access:**
- Product details clearly displayed
- Creator notes visible
- Specifications easy to find
- Purchase links prominent (if available)

**Ease of Use:**
- No barriers (no login)
- Intuitive navigation
- Touch-friendly (mobile)
- Print-friendly option

### Mobile Optimization

**Critical for Viewers:**
- Responsive design
- Touch-optimized interactions
- Fast image loading
- Easy sharing
- One-thumb navigation

---

## Research & Insights

### Casual User Behavior Research

**Key Findings:**
1. **Photo-First Preference**: Users prefer uploading photos over typing detailed information
2. **Minimal Effort Required**: Casual users want quick results, not complex workflows
3. **Visual Product Selection**: Users find it easier to select products from images than text lists
4. **Tolerance for Imperfection**: Users accept AI mistakes if correction is easy
5. **Privacy Concerns**: Users want control over who sees their collections
6. **Mobile Usage**: Majority of photo uploads happen on mobile devices

### Similar Applications & Tools

**Reference Applications:**
1. **Item Eyes AI**: Photo-based inventory with AI identification
2. **BoxAeye**: Visual inventory app using photos
3. **Artifcts**: Capture stories behind belongings
4. **Google Lens**: Product identification via photos
5. **Amazon Visual Search**: Identify products by image

**Key Learnings:**
- Visual recognition accuracy is improving but not perfect
- User correction interface is critical
- Mobile-first design is essential
- Simplification trumps feature richness for casual users

### Product Categories Insights

**Golf Equipment:**
- Model numbers are critical (Epic Speed vs Epic Max)
- Specifications matter (loft, shaft flex)
- Visual identification works well (brand logos, club head shapes)
- Common ambiguity: Model year variations

**Photography Gear:**
- Brand recognition is strong
- Model numbers often visible on equipment
- Lens specifications are important
- Accessories are harder to identify

**Tech/Office Setups:**
- Brand logos are prominent
- Model numbers often visible on products
- Size specifications are important
- Variations are common (screen size, generation)

**General Patterns:**
- Brand logos are most reliable for identification
- Model numbers help but may be hard to read in photos
- Context matters (golf clubs together = golf bag context)
- Multiple photos improve accuracy

---

## Comparison with Influencer Use Case

**Key Differences:**

| Aspect | Casual User | Influencer |
|--------|------------|------------|
| **Primary Entry Method** | Photo upload (AI) | Transcript/text list |
| **Monetization** | Optional | Required/primary |
| **Detail Level** | Minimal required | Comprehensive needed |
| **Affiliate Links** | Optional | Essential |
| **Analytics** | Basic (views only) | Detailed (clicks, conversions, earnings) |
| **Sharing Purpose** | Personal (friends/family) | Audience/public |
| **Effort Level** | Minimal | Higher (content creation) |
| **Question Prompts** | Critical feature | Less important |
| **AI Image Recognition** | Primary feature | Secondary feature |

**Shared Features:**
- Collection/bag creation
- Item management
- Photo upload
- Sharing links/QR codes
- Public viewing
- Privacy controls
- Catalog integration (if available)

**Implementation Considerations:**
- Can share much of the base infrastructure
- UI/UX should be tailored per user type
- Same database schema can support both (with use case flags)
- AI features benefit both but prioritized differently

---

## Priority Implementation Phases

### Phase 1: MVP (Minimum Viable Product)

**Core Features:**
- Basic account creation/login
- Create collection (name, description)
- Manual item entry
- Basic photo upload (storage only, no AI yet)
- Share link generation
- Public collection view
- Simple privacy controls

**Pages:**
- Dashboard
- Create Collection
- Manual Entry Form
- Collection Editor
- Share Settings
- Public View

**Timeline: 2-3 months**

---

### Phase 2: AI Photo Identification

**Core Features:**
- Photo upload with AI processing
- Product identification from photos
- Product review/confirmation interface
- Basic catalog matching
- Confidence scoring

**Pages:**
- Photo Upload Interface
- AI Processing Status
- Product Review & Confirmation

**Timeline: 3-4 months**

---

### Phase 3: Smart Question Generation

**Core Features:**
- Conversational item entry
- Ambiguity detection
- Question generation
- Visual product selection
- Detail completion wizard

**Pages:**
- Text Entry Interface
- Question Prompt Wizard
- Product Selection Interface

**Timeline: 2-3 months**

---

### Phase 4: Enhancement & Polish

**Core Features:**
- Advanced AI improvements
- Better catalog matching
- Collection organization tools
- Enhanced sharing features
- Mobile app (optional)

**Timeline: Ongoing**

---

## Success Metrics

### User Adoption
- Number of collections created
- Photo uploads vs manual entry ratio
- Active users per month
- Collections shared per user

### AI Performance
- Identification accuracy rate
- User acceptance rate (how often users accept AI suggestions)
- Average confidence scores
- Correction frequency

### User Satisfaction
- Time to create first collection
- User retention rate
- Feature usage analytics
- Support ticket volume

### Sharing & Engagement
- Share link clicks
- Public collection views
- Items per collection
- Collection completion rate

---

## Additional Considerations

### 1. Privacy & Security

**Data Protection:**
- Encrypt photos in transit and at rest
- Secure share links (non-guessable)
- User data privacy compliance (GDPR, CCPA)
- Option to delete data permanently

**Privacy Controls:**
- Clear privacy settings
- Easy to understand options
- Default to reasonable privacy (unlisted, not public)
- Password protection for private collections

### 2. Accessibility

**Requirements:**
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- Color contrast standards
- Alt text for images

### 3. Internationalization (Future)

**Considerations:**
- Multi-language support
- Regional product catalogs
- Currency/localization
- Right-to-left languages

### 4. Scalability

**Infrastructure:**
- Handle photo upload volume
- AI processing at scale
- CDN for image delivery
- Database optimization
- Queue system for processing

### 5. Cost Management

**Considerations:**
- AI processing costs (optimize)
- Image storage costs (compression)
- CDN costs (caching)
- Database costs (indexing, archiving)

---

## Conclusion

This document provides a comprehensive specification for implementing casual user functionality within the Teed platform. The workflows, pages, and features outlined here will enable everyday users to easily document and share their personal gear collections through intuitive, photo-based workflows.

**Key Success Factors:**
1. Photo-first approach - make AI identification the primary method
2. Minimal user effort - ask questions only when necessary
3. Visual product selection - use images, not just text
4. Easy sharing - one-click links and QR codes
5. Mobile-first design - most usage will be mobile
6. Forgiving AI - make corrections easy, don't penalize mistakes

**Priority Implementation:**
- Start with manual entry (MVP)
- Add photo upload and basic AI
- Implement smart question generation
- Enhance and polish based on user feedback

**Integration with Platform:**
- Leverage existing Teed infrastructure
- Extend existing schema where possible
- Share features with influencer use case
- Maintain consistent user experience

This specification should be reviewed alongside other user case documents (e.g., `user-haul-case.md`) to identify common features and ensure cohesive platform design.

---

**End of Document**


