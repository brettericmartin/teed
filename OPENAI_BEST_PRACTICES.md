# OpenAI Integration Best Practices

**Status**: ✅ All best practices implemented in `lib/ai.ts`

This document outlines all OpenAI best practices followed in the Teed project.

---

## 1. Security & API Key Management

### ✅ Implemented
- **Server-side only**: OpenAI client is never exposed to browser (`lib/openaiClient.ts`)
- **Environment variables**: API key stored in `.env.local`, never in code
- **Validation**: API key presence checked at startup
- **Warning comments**: Clear warnings in code about server-only usage

**Location**: `lib/openaiClient.ts:3-5`
```typescript
// WARNING: This client must NOT be imported or used in client components.
// It uses process.env.OPENAI_API_KEY which should never be exposed to the browser.
// Only use this in server components, server actions, and API routes.
```

---

## 2. Error Handling & Reliability

### ✅ Retry Logic with Exponential Backoff
- **Function**: `retryWithBackoff<T>()` - `lib/ai.ts:26-64`
- **Max retries**: 3 attempts
- **Base delay**: 1000ms (doubles each retry: 1s, 2s, 4s)
- **Smart retry logic**:
  - Don't retry 400/401 errors (client errors)
  - Detect rate limits (429 status, 'rate_limit_exceeded' code)
  - Exponential backoff for transient errors

**Example**:
```typescript
const response = await retryWithBackoff(async () => {
  return await openai.chat.completions.create({...});
});
```

### ✅ User-Friendly Error Messages
- **Location**: `lib/ai.ts:231-251`
- **Error translation**: Technical errors → User-friendly messages
- **Specific handling**:
  - 401: "OpenAI API key is invalid"
  - 429: "Rate limit exceeded. Please try again in a moment."
  - 400: "Invalid image format or size"
  - Generic: "Failed to identify products: {message}"

**Example**:
```typescript
if (error?.status === 429) {
  throw new Error('Rate limit exceeded. Please try again in a moment.');
}
```

### ✅ Detailed Error Logging
- **Location**: `lib/ai.ts:232-238`
- **Logged information**:
  - Error message
  - HTTP status code
  - OpenAI error code
  - Error type
- **Purpose**: Debugging without exposing details to users

---

## 3. Cost Optimization

### ✅ Image Validation & Compression
- **Function**: `validateAndCompressImage()` - `lib/ai.ts:69-99`
- **Size limit**: 2MB (2048 KB) - well under OpenAI's 20MB limit
- **Rationale**: Balance quality vs. cost/performance
- **Validation**:
  - Check valid base64 format
  - Calculate size in KB
  - Reject oversized images with clear error message

**Example**:
```typescript
const validation = validateAndCompressImage(base64Image);
if (!validation.valid) {
  throw new Error(validation.error || 'Invalid image');
}
```

### ✅ Model Selection Strategy
- **Vision tasks** (`identifyProductsInImage`): `gpt-4o` - Latest vision model
- **Text categorization** (`identifyBagCategory`): `gpt-4o-mini` - Cost-effective
- **Item recommendations** (`recommendItemsForBag`): `gpt-4o-mini` - Cost-effective
- **Simple descriptions**: `gpt-4o-mini` - Most economical

**Rationale**: Use powerful models only when necessary

### ✅ Token Limits
- **Vision**: 1500 tokens - Sufficient for detailed product lists
- **Categorization**: 300 tokens - Simple JSON response
- **Recommendations**: 1500 tokens - Multiple item details
- **Descriptions**: 200 tokens - Brief text

**Purpose**: Prevent runaway costs from overly long responses

---

## 4. Response Quality & Consistency

### ✅ Structured Outputs (JSON Mode)
- **All AI functions**: Use `response_format: { type: 'json_object' }`
- **Location**: `lib/ai.ts:173, 370, 462`
- **Benefit**: Guaranteed valid JSON, no parsing errors

**Example**:
```typescript
response_format: { type: 'json_object' }, // Force JSON output
```

### ✅ System Prompts for Consistency
- **All functions**: Separate system message for role/behavior
- **Content**:
  - Define AI's role ("expert product identifier")
  - Specify exact JSON structure
  - List allowed values (categories, priorities)
  - Set constraints (confidence 0-100)

**Example** (`lib/ai.ts:118-134`):
```typescript
const systemPrompt = `You are an expert product identifier.
Return your response as valid JSON with this exact structure:
{
  "products": [...],
  "category": "One of: camping, golf, hiking, ..."
}`;
```

### ✅ Temperature Control
- **Vision identification**: `0.3` - More deterministic results
- **Categorization**: `0.3` - Consistent categories
- **Recommendations**: `0.5` - Slightly creative, but controlled
- **Rationale**: Lower = consistent, Higher = creative

---

## 5. Input Validation

### ✅ Pre-API Validation
- **Always validate BEFORE expensive API calls**
- **Checks**:
  - Image format (base64, starts with 'data:image/')
  - Image size (under 2MB)
  - Required fields present

**Example** (`lib/ai.ts:111-115`):
```typescript
const validation = validateAndCompressImage(imageBase64);
if (!validation.valid) {
  throw new Error(validation.error || 'Invalid image');
}
```

---

## 6. Response Validation & Sanitization

### ✅ JSON Parsing with Error Handling
- **Location**: `lib/ai.ts:183-195`
- **Process**:
  1. Try to parse JSON
  2. Catch parse errors with helpful message
  3. Log raw content for debugging
  4. Return user-friendly error

**Example**:
```typescript
try {
  parsed = JSON.parse(content);
} catch (parseError) {
  console.error('Failed to parse AI response:', content);
  throw new Error('AI returned invalid JSON. Please try again.');
}
```

### ✅ Response Structure Validation
- **Location**: `lib/ai.ts:192-195`
- **Checks**:
  - Expected fields present
  - Array fields are actually arrays
  - Nested objects have correct structure

**Example**:
```typescript
if (!parsed.products || !Array.isArray(parsed.products)) {
  throw new Error('Invalid response structure from AI');
}
```

### ✅ Data Sanitization
- **Location**: `lib/ai.ts:197-206, 473-483`
- **Sanitize every field**:
  - Fallback values for missing data
  - Clamp numbers to valid ranges (confidence: 0-100)
  - Validate enums (priority: essential/recommended/optional)
  - Remove undefined/null values

**Example**:
```typescript
const products: IdentifiedProduct[] = parsed.products.map((p) => ({
  name: p.name || 'Unknown Product',
  category: p.category || 'other',
  confidence: Math.min(100, Math.max(0, p.confidence || 50)),
  // ... sanitize all fields
}));
```

---

## 7. TypeScript Type Safety

### ✅ Comprehensive Interfaces
- **All AI responses have TypeScript interfaces**
- **Location**: `lib/ai.ts:4-21, 310-329`
- **Interfaces**:
  - `IdentifiedProduct` - Vision identification results
  - `VisionAnalysisResult` - Complete vision response
  - `BagCategoryResult` - Category identification
  - `ItemRecommendation` - Single item recommendation
  - `BagRecommendationsResult` - Complete recommendations

**Benefits**:
- Compile-time type checking
- Autocomplete in IDEs
- Self-documenting code
- Prevents runtime type errors

---

## 8. Performance Monitoring

### ✅ Processing Time Tracking
- **All functions**: Track execution time
- **Location**: `lib/ai.ts:109, 208`
- **Usage**:
  - Start timer before API call
  - Calculate duration after response
  - Include in result object

**Example**:
```typescript
const startTime = Date.now();
// ... API call ...
const processingTime = Date.now() - startTime;
return { ..., processingTime };
```

**Purpose**: Monitor API latency, identify slow requests

### ✅ Confidence Scoring
- **Location**: `lib/ai.ts:209-212`
- **Calculate average confidence** across all identified products
- **Thresholds**:
  - < 50%: Warning for low confidence
  - 0 products: Warning for no results

**Usage**:
```typescript
const totalConfidence = products.length > 0
  ? Math.round(products.reduce((sum, p) => sum + p.confidence, 0) / products.length)
  : 0;
```

### ✅ Warning System
- **Location**: `lib/ai.ts:214-223`
- **Warnings for**:
  - No products found
  - Low overall confidence
  - Large image size (>1MB)

**Purpose**: Alert users to potential issues without throwing errors

---

## 9. Prompt Engineering Best Practices

### ✅ Clear, Specific Instructions
- **Every prompt**:
  - States exact task
  - Defines output format
  - Lists constraints
  - Provides examples (in system message)

**Example** (`lib/ai.ts:118-134`):
```typescript
const systemPrompt = `You are an expert product identifier.
Return your response as valid JSON with this exact structure:
{
  "products": [...]
}
Only include products you can clearly identify.
Confidence should be 0-100.`;
```

### ✅ Context Awareness
- **Vision function**: Accepts optional context
- **Context includes**:
  - Bag type (camping, golf, etc.)
  - Expected categories
- **Location**: `lib/ai.ts:136-142`

**Example**:
```typescript
const contextResult = await identifyProductsInImage(image, {
  bagType: 'camping',
  expectedCategories: ['camping', 'hiking', 'outdoor'],
});
```

**Benefit**: More accurate, contextually relevant results

### ✅ Image Detail Level
- **Setting**: `detail: 'high'` - `lib/ai.ts:165`
- **Rationale**: Product identification needs high-resolution analysis
- **Trade-off**: Higher cost, better accuracy

---

## 10. Modular, Reusable Functions

### ✅ Single Responsibility
- Each function has one clear purpose:
  - `identifyProductsInImage()` - Vision analysis only
  - `identifyBagCategory()` - Categorization only
  - `recommendItemsForBag()` - Recommendations only
  - `retryWithBackoff()` - Retry logic only

### ✅ Composable Functions
- **Example**: `recommendItemsForBag()` calls `identifyBagCategory()` if needed
- **Location**: `lib/ai.ts:413-419`
- **Benefit**: Avoid code duplication, easier testing

---

## 11. User-Centric Features

### ✅ Bag Category Auto-Detection
- **Function**: `identifyBagCategory()` - `lib/ai.ts:335-397`
- **Purpose**: Auto-categorize bags from title/description
- **Returns**:
  - Primary category
  - Confidence score
  - Alternative categories
  - Reasoning

**Use Case**: User creates "Weekend Camping Trip" bag → Auto-tagged as "camping"

### ✅ Smart Item Recommendations
- **Function**: `recommendItemsForBag()` - `lib/ai.ts:403-499`
- **Purpose**: Suggest items based on bag type
- **Features**:
  - Auto-detect category if not provided
  - Prioritize essential items first
  - Include reasons for each recommendation
  - Estimated price ranges

**Use Case**: Golf bag → Recommends clubs, balls, tees, glove, etc.

---

## 12. Summary: All Best Practices Implemented

| Best Practice | Status | Location |
|---------------|--------|----------|
| ✅ Server-side only API calls | Implemented | `lib/openaiClient.ts:3-15` |
| ✅ Environment variable protection | Implemented | `lib/openaiClient.ts:7-11` |
| ✅ Retry with exponential backoff | Implemented | `lib/ai.ts:26-64` |
| ✅ User-friendly error messages | Implemented | `lib/ai.ts:231-251` |
| ✅ Detailed error logging | Implemented | `lib/ai.ts:232-238` |
| ✅ Image validation & size limits | Implemented | `lib/ai.ts:69-99` |
| ✅ Optimized model selection | Implemented | Throughout `lib/ai.ts` |
| ✅ Token limits | Implemented | All API calls |
| ✅ Structured JSON outputs | Implemented | `response_format` everywhere |
| ✅ System prompts | Implemented | All functions |
| ✅ Temperature control | Implemented | All API calls |
| ✅ Pre-API input validation | Implemented | `lib/ai.ts:111-115` |
| ✅ JSON parsing error handling | Implemented | `lib/ai.ts:183-195` |
| ✅ Response structure validation | Implemented | `lib/ai.ts:192-195` |
| ✅ Data sanitization | Implemented | `lib/ai.ts:197-206, 473-483` |
| ✅ TypeScript interfaces | Implemented | `lib/ai.ts:4-21, 310-329` |
| ✅ Processing time tracking | Implemented | `lib/ai.ts:109, 208` |
| ✅ Confidence scoring | Implemented | `lib/ai.ts:209-212` |
| ✅ Warning system | Implemented | `lib/ai.ts:214-223` |
| ✅ Clear, specific prompts | Implemented | All functions |
| ✅ Context awareness | Implemented | `lib/ai.ts:136-142` |
| ✅ High-detail image analysis | Implemented | `lib/ai.ts:165` |
| ✅ Modular, composable functions | Implemented | Throughout `lib/ai.ts` |
| ✅ Category auto-detection | Implemented | `lib/ai.ts:335-397` |
| ✅ Smart recommendations | Implemented | `lib/ai.ts:403-499` |

---

## Cost Estimates (as of 2025)

**GPT-4o (Vision):**
- Input: ~$2.50 / 1M tokens
- Output: ~$10.00 / 1M tokens
- **Per image** (with 1500 max tokens): ~$0.015-0.025

**GPT-4o-mini (Text):**
- Input: ~$0.15 / 1M tokens
- Output: ~$0.60 / 1M tokens
- **Per categorization** (300 tokens): ~$0.0003
- **Per recommendation** (1500 tokens): ~$0.001

**Expected Usage:**
- 100 image identifications/day: ~$2/day
- 1000 categorizations/day: ~$0.30/day
- 100 recommendations/day: ~$0.10/day

**Total estimated cost**: ~$70/month for moderate usage

---

## Testing

### Vision API Test
**File**: `scripts/test-gpt-vision.mjs`
**Run**: `npx tsx scripts/test-gpt-vision.mjs`

**Tests**:
1. Basic product identification
2. Context-aware identification
3. Error handling
4. Response validation
5. Performance monitoring

**Status**: ✅ All tests passing

---

## Next Steps (Phase 5 Continuation)

1. ✅ **Step 25**: GPT-4 Vision tested
2. ⏭️ **Step 26**: Build photo upload component
3. ⏭️ **Step 27**: Create `/api/ai/identify-products` endpoint
4. ⏭️ **Step 28**: Build product review UI
5. ⏭️ **Step 29**: Batch item creation

**Additional features**:
- ⏭️ Add `category` field to bags table (database migration)
- ⏭️ Update NewBagModal to include category dropdown
- ⏭️ Create `/api/ai/suggest-category` endpoint
- ⏭️ Create `/api/ai/recommend-items` endpoint
- ⏭️ Build recommendations UI in bag editor

---

## References

- [OpenAI Best Practices](https://platform.openai.com/docs/guides/best-practices)
- [Vision API Guide](https://platform.openai.com/docs/guides/vision)
- [Error Handling](https://platform.openai.com/docs/guides/error-codes)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)
