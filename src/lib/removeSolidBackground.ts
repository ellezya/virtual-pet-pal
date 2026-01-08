export type RemoveSolidBackgroundOptions = {
  tolerance?: number; // color distance 0-441
  feather?: number; // soft edge width
  sampleSize?: number; // corner sampling square size
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const colorDist = (r: number, g: number, b: number, br: number, bg: number, bb: number) => {
  const dr = r - br;
  const dg = g - bg;
  const db = b - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const getAverageCornerColor = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sampleSize: number,
) => {
  const pts = [
    [0, 0],
    [width - sampleSize, 0],
    [0, height - sampleSize],
    [width - sampleSize, height - sampleSize],
  ] as const;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (const [sx, sy] of pts) {
    for (let y = sy; y < sy + sampleSize; y++) {
      for (let x = sx; x < sx + sampleSize; x++) {
        const i = (y * width + x) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
};

/**
 * Removes a mostly-solid background by flood-filling from the edges using the corner color as the background reference.
 * Returns a PNG data URL with alpha.
 */
export async function removeSolidBackgroundToDataUrl(
  src: string,
  opts: RemoveSolidBackgroundOptions = {},
): Promise<string> {
  const tolerance = opts.tolerance ?? 42;
  const feather = opts.feather ?? 30;
  const sampleSize = clamp(opts.sampleSize ?? 8, 2, 32);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load image'));
    el.src = src;
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return src;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const bg = getAverageCornerColor(data, w, h, sampleSize);

  // Flood fill from edges to find background-connected pixels.
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];

  const pushIfBg = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;

    const i = idx * 4;
    const d = colorDist(data[i], data[i + 1], data[i + 2], bg.r, bg.g, bg.b);

    // Only consider pixels close-ish to bg color as fill candidates.
    if (d <= tolerance + feather) {
      visited[idx] = 1;
      stack.push(idx);
    }
  };

  // Seed with border pixels
  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIfBg(0, y);
    pushIfBg(w - 1, y);
  }

  while (stack.length) {
    const idx = stack.pop()!;
    const x = idx % w;
    const y = Math.floor(idx / w);

    pushIfBg(x + 1, y);
    pushIfBg(x - 1, y);
    pushIfBg(x, y + 1);
    pushIfBg(x, y - 1);
  }

  // Apply alpha to visited pixels
  for (let idx = 0; idx < visited.length; idx++) {
    if (!visited[idx]) continue;

    const i = idx * 4;
    const d = colorDist(data[i], data[i + 1], data[i + 2], bg.r, bg.g, bg.b);

    if (d <= tolerance) {
      data[i + 3] = 0;
    } else {
      // feather edge
      const t = clamp((d - tolerance) / feather, 0, 1);
      data[i + 3] = Math.round(t * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
