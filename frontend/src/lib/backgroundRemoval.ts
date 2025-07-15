import axios from "axios";

// Background removal service using Remove.bg API
// You'll need to get an API key from https://www.remove.bg/api
const REMOVE_BG_API_KEY = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY || "";

export interface ProcessedImage {
  originalUrl: string;
  processedUrl: string;
  isProcessed: boolean;
}

class BackgroundRemovalService {
  private cache = new Map<string, ProcessedImage>();

  async removeBackground(imageUrl: string): Promise<ProcessedImage> {
    // Check cache first
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    // If no API key, return original image
    if (!REMOVE_BG_API_KEY) {
      const result: ProcessedImage = {
        originalUrl: imageUrl,
        processedUrl: imageUrl,
        isProcessed: false,
      };
      this.cache.set(imageUrl, result);
      return result;
    }

    try {
      // Call Remove.bg API
      const response = await axios.post(
        "https://api.remove.bg/v1.0/removebg",
        {
          image_url: imageUrl,
          size: "auto",
          format: "png",
        },
        {
          headers: {
            "X-Api-Key": REMOVE_BG_API_KEY,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );

      // Convert blob to data URL
      const blob = response.data;
      const processedUrl = URL.createObjectURL(blob);

      const result: ProcessedImage = {
        originalUrl: imageUrl,
        processedUrl,
        isProcessed: true,
      };

      this.cache.set(imageUrl, result);
      return result;
    } catch (error) {
      console.error("Background removal failed:", error);

      // Fallback to original image
      const result: ProcessedImage = {
        originalUrl: imageUrl,
        processedUrl: imageUrl,
        isProcessed: false,
      };

      this.cache.set(imageUrl, result);
      return result;
    }
  }

  // Alternative: Client-side background removal using Canvas API
  async removeBackgroundCanvas(imageUrl: string): Promise<ProcessedImage> {
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the image
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const width = canvas.width;
          const height = canvas.height;

          // Enhanced background removal algorithm

          // Step 1: Detect background color from corners
          const cornerColors = this.getCornerColors(data, width, height);
          const bgColor = this.getMostCommonColor(cornerColors);

          // Step 2: Create alpha mask based on color similarity
          const alphaMask = new Uint8ClampedArray(width * height);

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];

              // Calculate color distance from background
              const distance = this.colorDistance({ r, g, b }, bgColor);

              // Apply threshold with smooth transition
              if (distance < 30) {
                alphaMask[y * width + x] = 0; // Fully transparent
              } else if (distance < 50) {
                // Smooth transition for edges
                alphaMask[y * width + x] = Math.floor((distance - 30) * 12.75);
              } else {
                alphaMask[y * width + x] = 255; // Fully opaque
              }
            }
          }

          // Step 3: Apply edge detection to refine mask
          const edgeMask = this.detectEdges(data, width, height);

          // Step 4: Combine masks and apply to alpha channel
          for (let i = 0; i < alphaMask.length; i++) {
            const idx = i * 4;

            // Preserve edges
            if (edgeMask[i] > 128) {
              data[idx + 3] = 255; // Keep edge pixels
            } else {
              data[idx + 3] = alphaMask[i];
            }

            // Additional cleanup for very light colors
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Remove near-white pixels
            if (r > 245 && g > 245 && b > 245) {
              data[idx + 3] = 0;
            }
          }

          // Step 5: Apply morphological operations to clean up
          this.applyMorphologicalCleanup(data, width, height);

          // Put the modified image data back
          ctx.putImageData(imageData, 0, 0);

          // Convert to data URL
          const processedUrl = canvas.toDataURL("image/png");

          const result: ProcessedImage = {
            originalUrl: imageUrl,
            processedUrl,
            isProcessed: true,
          };

          this.cache.set(imageUrl, result);
          resolve(result);
        };

        img.onerror = () => {
          const result: ProcessedImage = {
            originalUrl: imageUrl,
            processedUrl: imageUrl,
            isProcessed: false,
          };

          this.cache.set(imageUrl, result);
          resolve(result);
        };

        // Use proxy for Rebrickable images to avoid CORS
        if (imageUrl.includes("cdn.rebrickable.com")) {
          img.src = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        } else {
          img.src = imageUrl;
        }
      });
    } catch (error) {
      console.error("Canvas background removal failed:", error);

      const result: ProcessedImage = {
        originalUrl: imageUrl,
        processedUrl: imageUrl,
        isProcessed: false,
      };

      this.cache.set(imageUrl, result);
      return result;
    }
  }

  // Helper method to get colors from image corners
  private getCornerColors(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): Array<{ r: number; g: number; b: number }> {
    const corners = [];
    const sampleSize = 10; // Sample 10x10 pixel area from each corner

    // Top-left
    for (let y = 0; y < Math.min(sampleSize, height); y++) {
      for (let x = 0; x < Math.min(sampleSize, width); x++) {
        const idx = (y * width + x) * 4;
        corners.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }

    // Top-right
    for (let y = 0; y < Math.min(sampleSize, height); y++) {
      for (let x = Math.max(0, width - sampleSize); x < width; x++) {
        const idx = (y * width + x) * 4;
        corners.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }

    // Bottom-left
    for (let y = Math.max(0, height - sampleSize); y < height; y++) {
      for (let x = 0; x < Math.min(sampleSize, width); x++) {
        const idx = (y * width + x) * 4;
        corners.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }

    // Bottom-right
    for (let y = Math.max(0, height - sampleSize); y < height; y++) {
      for (let x = Math.max(0, width - sampleSize); x < width; x++) {
        const idx = (y * width + x) * 4;
        corners.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }

    return corners;
  }

  // Get most common color from array
  private getMostCommonColor(
    colors: Array<{ r: number; g: number; b: number }>
  ): { r: number; g: number; b: number } {
    // Simple averaging for now - could be improved with clustering
    const sum = colors.reduce(
      (acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b,
      }),
      { r: 0, g: 0, b: 0 }
    );

    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length),
    };
  }

  // Calculate color distance
  private colorDistance(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number }
  ): number {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // Simple edge detection
  private detectEdges(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray {
    const edges = new Uint8ClampedArray(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Sobel operator for edge detection
        const gx =
          -1 * data[((y - 1) * width + (x - 1)) * 4] +
          -2 * data[(y * width + (x - 1)) * 4] +
          -1 * data[((y + 1) * width + (x - 1)) * 4] +
          1 * data[((y - 1) * width + (x + 1)) * 4] +
          2 * data[(y * width + (x + 1)) * 4] +
          1 * data[((y + 1) * width + (x + 1)) * 4];

        const gy =
          -1 * data[((y - 1) * width + (x - 1)) * 4] +
          -2 * data[((y - 1) * width + x) * 4] +
          -1 * data[((y - 1) * width + (x + 1)) * 4] +
          1 * data[((y + 1) * width + (x - 1)) * 4] +
          2 * data[((y + 1) * width + x) * 4] +
          1 * data[((y + 1) * width + (x + 1)) * 4];

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = magnitude > 30 ? 255 : 0;
      }
    }

    return edges;
  }

  // Apply morphological operations to clean up the mask
  private applyMorphologicalCleanup(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    // Simple erosion followed by dilation to remove small artifacts
    const alpha = new Uint8ClampedArray(width * height);

    // Extract alpha channel
    for (let i = 0; i < width * height; i++) {
      alpha[i] = data[i * 4 + 3];
    }

    // Erosion
    const eroded = new Uint8ClampedArray(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        let min = 255;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nidx = (y + dy) * width + (x + dx);
            min = Math.min(min, alpha[nidx]);
          }
        }

        eroded[idx] = min;
      }
    }

    // Dilation
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        let max = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nidx = (y + dy) * width + (x + dx);
            max = Math.max(max, eroded[nidx]);
          }
        }

        data[idx * 4 + 3] = max;
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export const backgroundRemovalService = new BackgroundRemovalService();
