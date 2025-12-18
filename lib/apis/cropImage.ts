/**
 * Image cropping utilities for tap-to-identify
 *
 * Handles cropping images based on selection regions (tap or rectangle).
 */

import type { SelectionRegion } from './types';

/**
 * Crop an image to a specific region
 *
 * @param imageSource - Base64 data URL or URL of the image
 * @param region - The selection region to crop to
 * @returns Promise<string> - Base64 data URL of the cropped image
 */
export async function cropImageToRegion(
  imageSource: string,
  region: SelectionRegion
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use pixel bounds for cropping
        const { x, y, width, height } = region.pixelBounds;

        // Ensure we don't exceed image bounds
        const cropX = Math.max(0, Math.min(x, img.width - 1));
        const cropY = Math.max(0, Math.min(y, img.height - 1));
        const cropWidth = Math.min(width, img.width - cropX);
        const cropHeight = Math.min(height, img.height - cropY);

        // Set canvas size to cropped dimensions
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw cropped region
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,  // Source rectangle
          0, 0, cropWidth, cropHeight            // Destination rectangle
        );

        // Convert to base64
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(croppedBase64);

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSource;
  });
}

/**
 * Calculate a tap region (auto-crop around tap point)
 *
 * Creates a region approximately 25% of image size centered on the tap point,
 * clamped to image bounds.
 *
 * @param tapX - X coordinate of tap (in display pixels)
 * @param tapY - Y coordinate of tap (in display pixels)
 * @param displayWidth - Width of displayed image
 * @param displayHeight - Height of displayed image
 * @param naturalWidth - Natural width of image
 * @param naturalHeight - Natural height of image
 * @returns SelectionRegion
 */
export function calculateTapRegion(
  tapX: number,
  tapY: number,
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number
): SelectionRegion {
  // Scale tap coordinates to natural image size
  const scaleX = naturalWidth / displayWidth;
  const scaleY = naturalHeight / displayHeight;

  const naturalTapX = tapX * scaleX;
  const naturalTapY = tapY * scaleY;

  // Create a region ~25% of image size centered on tap
  const regionSize = Math.min(naturalWidth, naturalHeight) * 0.3;
  const halfSize = regionSize / 2;

  // Clamp to image bounds
  let cropX = naturalTapX - halfSize;
  let cropY = naturalTapY - halfSize;
  let cropWidth = regionSize;
  let cropHeight = regionSize;

  // Adjust if outside bounds
  if (cropX < 0) {
    cropWidth += cropX;
    cropX = 0;
  }
  if (cropY < 0) {
    cropHeight += cropY;
    cropY = 0;
  }
  if (cropX + cropWidth > naturalWidth) {
    cropWidth = naturalWidth - cropX;
  }
  if (cropY + cropHeight > naturalHeight) {
    cropHeight = naturalHeight - cropY;
  }

  // Ensure minimum size
  const minSize = Math.min(naturalWidth, naturalHeight) * 0.1;
  cropWidth = Math.max(cropWidth, minSize);
  cropHeight = Math.max(cropHeight, minSize);

  return {
    id: `region_${Date.now()}`,
    type: 'tap',
    // Normalized coordinates (0-1)
    centerX: naturalTapX / naturalWidth,
    centerY: naturalTapY / naturalHeight,
    x: cropX / naturalWidth,
    y: cropY / naturalHeight,
    width: cropWidth / naturalWidth,
    height: cropHeight / naturalHeight,
    // Pixel coordinates
    pixelBounds: {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight)
    }
  };
}

/**
 * Calculate a rectangle region from drag coordinates
 *
 * @param startX - Start X of drag (in display pixels)
 * @param startY - Start Y of drag (in display pixels)
 * @param endX - End X of drag (in display pixels)
 * @param endY - End Y of drag (in display pixels)
 * @param displayWidth - Width of displayed image
 * @param displayHeight - Height of displayed image
 * @param naturalWidth - Natural width of image
 * @param naturalHeight - Natural height of image
 * @returns SelectionRegion
 */
export function calculateRectangleRegion(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number
): SelectionRegion {
  // Scale to natural image size
  const scaleX = naturalWidth / displayWidth;
  const scaleY = naturalHeight / displayHeight;

  // Normalize rectangle (handle dragging in any direction)
  const left = Math.min(startX, endX) * scaleX;
  const top = Math.min(startY, endY) * scaleY;
  const right = Math.max(startX, endX) * scaleX;
  const bottom = Math.max(startY, endY) * scaleY;

  // Clamp to image bounds
  const cropX = Math.max(0, Math.min(left, naturalWidth));
  const cropY = Math.max(0, Math.min(top, naturalHeight));
  const cropWidth = Math.min(right - left, naturalWidth - cropX);
  const cropHeight = Math.min(bottom - top, naturalHeight - cropY);

  // Calculate center
  const centerX = (cropX + cropWidth / 2) / naturalWidth;
  const centerY = (cropY + cropHeight / 2) / naturalHeight;

  return {
    id: `region_${Date.now()}`,
    type: 'rectangle',
    // Normalized coordinates (0-1)
    centerX,
    centerY,
    x: cropX / naturalWidth,
    y: cropY / naturalHeight,
    width: cropWidth / naturalWidth,
    height: cropHeight / naturalHeight,
    // Pixel coordinates
    pixelBounds: {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight)
    }
  };
}

/**
 * Get image dimensions from a base64 data URL or URL
 *
 * @param imageSource - Base64 data URL or URL
 * @returns Promise<{ width: number; height: number }>
 */
export function getImageDimensions(imageSource: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSource;
  });
}
