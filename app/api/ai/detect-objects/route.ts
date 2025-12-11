import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';
import { validateAndCompressImage } from '@/lib/ai';
import type {
  DetectObjectsRequest,
  DetectObjectsResponse,
  ObjectDetectionResult,
  DetectedObject
} from '@/lib/apis/types';

/**
 * APIS Stage 1: Object Detection
 *
 * Fast scan to identify WHAT types of objects exist in the image.
 * Does NOT identify specific products - that's Stage 2.
 *
 * Uses gpt-4o-mini for speed and cost efficiency (~$0.001/image)
 */
export async function POST(request: NextRequest): Promise<NextResponse<DetectObjectsResponse>> {
  const startTime = Date.now();

  try {
    const body: DetectObjectsRequest = await request.json();
    const { imageBase64, imageUrl, textHint } = body;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Either imageBase64 or imageUrl is required' },
        { status: 400 }
      );
    }

    // Validate image if base64
    let imageSource = imageUrl;
    if (imageBase64) {
      const validation = validateAndCompressImage(imageBase64);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error || 'Invalid image' },
          { status: 400 }
        );
      }
      imageSource = imageBase64;
    }

    const systemPrompt = `You are an expert object detector. Your job is to identify WHAT TYPES of objects are in an image - NOT specific products or brands.

CRITICAL: You are identifying OBJECT TYPES, not products. For example:
- "putter headcover" NOT "Scotty Cameron Newport headcover"
- "driver" NOT "TaylorMade Qi10 Max Driver"
- "golf ball" NOT "Titleist Pro V1"
- "camera" NOT "Sony A7IV"
- "watch" NOT "Rolex Submariner"

This is a FAST categorization step. Be thorough but quick.

Return JSON with this exact structure:
{
  "objects": [
    {
      "id": "obj_1",
      "objectType": "putter headcover",
      "productCategory": "golf",
      "boundingDescription": "center of image",
      "visualCues": ["black leather", "magnetic closure", "mallet shape"],
      "certainty": "definite"
    }
  ],
  "imageAnalysis": {
    "quality": "good",
    "lighting": "good",
    "suggestions": []
  }
}

Object type examples by category:
- GOLF: driver, fairway wood, hybrid, iron, wedge, putter, driver headcover, fairway headcover, hybrid headcover, putter headcover, golf ball, golf bag, golf glove, golf towel, rangefinder, golf shoes, golf hat, golf shirt
- TECH: camera, lens, laptop, phone, tablet, headphones, earbuds, smartwatch, monitor, keyboard, mouse, drone, tripod, microphone
- FASHION: watch, sunglasses, wallet, belt, bag, shoes, hat, jacket, shirt, pants
- OUTDOOR: backpack, tent, sleeping bag, hiking boots, water bottle, flashlight, knife, multi-tool

Rules:
1. List EVERY distinct object visible - if there are 10 items, list all 10
2. Be specific about object TYPE (e.g., "mallet putter headcover" not just "headcover")
3. Include visual cues that will help with identification later
4. certainty: "definite" (clearly visible), "likely" (partially visible), "uncertain" (hard to tell)
5. boundingDescription: describe WHERE in the image ("top-left", "center", "bottom-right", etc.)
6. imageAnalysis.quality: "good" (clear, focused), "fair" (somewhat blurry), "poor" (very unclear)
7. imageAnalysis.lighting: "good" (well-lit), "dim" (too dark), "bright" (overexposed)`;

    let userPrompt = 'Scan this image and identify all distinct objects/items visible. List each object TYPE (not specific brands/models).';
    if (textHint) {
      userPrompt += `\n\nUser hint: "${textHint}" - use this context but still identify ALL objects you see.`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap for object detection
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageSource!,
                detail: 'low' // Low detail for speed - we just need object types
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1, // Very low for consistency
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'No response from AI' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    const processingTimeMs = Date.now() - startTime;

    // Process and validate objects
    const objects: DetectedObject[] = (parsed.objects || []).map((obj: any, index: number) => ({
      id: obj.id || `obj_${index + 1}`,
      objectType: obj.objectType || 'unknown object',
      productCategory: obj.productCategory || 'other',
      boundingDescription: obj.boundingDescription || 'unknown location',
      visualCues: obj.visualCues || [],
      certainty: ['definite', 'likely', 'uncertain'].includes(obj.certainty)
        ? obj.certainty
        : 'uncertain',
      selected: true // Default all to selected
    }));

    const result: ObjectDetectionResult = {
      objects,
      totalDetected: objects.length,
      processingTimeMs,
      imageAnalysis: {
        quality: ['good', 'fair', 'poor'].includes(parsed.imageAnalysis?.quality)
          ? parsed.imageAnalysis.quality
          : 'fair',
        lighting: ['good', 'dim', 'bright'].includes(parsed.imageAnalysis?.lighting)
          ? parsed.imageAnalysis.lighting
          : 'good',
        suggestions: parsed.imageAnalysis?.suggestions || []
      }
    };

    console.log(`[APIS Stage 1] Detected ${objects.length} objects in ${processingTimeMs}ms`);

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('[APIS Stage 1] Object detection error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to detect objects' },
      { status: 500 }
    );
  }
}
