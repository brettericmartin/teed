import sharp from 'sharp';
import type { EnumeratedItem, CroppedItem } from './types';

/** Padding factor added around each bounding box (15%) */
const BBOX_PADDING = 0.15;

/** Maximum dimension for crop output */
const MAX_CROP_DIMENSION = 512;

/** JPEG quality for crops */
const CROP_QUALITY = 85;

/**
 * Stage 2: Crop each enumerated item's bounding box from the source image.
 *
 * - Converts normalized 0-1000 coordinates to pixel coordinates
 * - Adds 15% padding around each bbox (clamped to image bounds)
 * - Outputs JPEG crops at quality 85, max 512px longest side
 */
export async function cropItems(
  imageBase64: string,
  items: EnumeratedItem[]
): Promise<CroppedItem[]> {
  // Strip data URL prefix if present
  const rawBase64 = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const imageBuffer = Buffer.from(rawBase64, 'base64');

  // Get actual image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width!;
  const imgHeight = metadata.height!;

  // Process all crops in parallel
  const crops = await Promise.all(
    items.map(async (item) => {
      try {
        return await cropSingleItem(imageBuffer, item, imgWidth, imgHeight);
      } catch (error) {
        console.warn(`[crop] Failed to crop item ${item.id} (${item.label}):`, error);
        return null;
      }
    })
  );

  return crops.filter((c): c is CroppedItem => c !== null);
}

async function cropSingleItem(
  imageBuffer: Buffer,
  item: EnumeratedItem,
  imgWidth: number,
  imgHeight: number
): Promise<CroppedItem> {
  const { yMin, xMin, yMax, xMax } = item.bbox;

  // Convert normalized coords (0-1000) to pixel coords
  let left = Math.round((xMin / 1000) * imgWidth);
  let top = Math.round((yMin / 1000) * imgHeight);
  let right = Math.round((xMax / 1000) * imgWidth);
  let bottom = Math.round((yMax / 1000) * imgHeight);

  // Calculate padding in pixels
  const bboxWidth = right - left;
  const bboxHeight = bottom - top;
  const padX = Math.round(bboxWidth * BBOX_PADDING);
  const padY = Math.round(bboxHeight * BBOX_PADDING);

  // Apply padding, clamped to image bounds
  left = Math.max(0, left - padX);
  top = Math.max(0, top - padY);
  right = Math.min(imgWidth, right + padX);
  bottom = Math.min(imgHeight, bottom + padY);

  const cropWidth = right - left;
  const cropHeight = bottom - top;

  if (cropWidth <= 0 || cropHeight <= 0) {
    throw new Error(`Invalid crop dimensions: ${cropWidth}x${cropHeight}`);
  }

  // Crop and resize
  let pipeline = sharp(imageBuffer)
    .extract({
      left,
      top,
      width: cropWidth,
      height: cropHeight,
    });

  // Resize if larger than max dimension
  if (cropWidth > MAX_CROP_DIMENSION || cropHeight > MAX_CROP_DIMENSION) {
    pipeline = pipeline.resize({
      width: MAX_CROP_DIMENSION,
      height: MAX_CROP_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const cropBuffer = await pipeline
    .jpeg({ quality: CROP_QUALITY })
    .toBuffer();

  const cropMeta = await sharp(cropBuffer).metadata();

  return {
    ...item,
    cropBase64: `data:image/jpeg;base64,${cropBuffer.toString('base64')}`,
    cropWidth: cropMeta.width!,
    cropHeight: cropMeta.height!,
  };
}
