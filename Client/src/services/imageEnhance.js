/**
 * Classic image processing for the Sentinel-2 view: a per-band contrast stretch and an unsharp mask.
 * It only redistributes the brightness of pixels that were measured; it adds no detail and no AI.
 */

const STRETCH_LOW = 0.01
const STRETCH_HIGH = 0.99
const SATURATION = 1.15
const SHARPEN = 0.8

function canvasFor(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const toBlob = (canvas, type = 'image/jpeg', quality = 0.92) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The image could not be processed.'))), type, quality)
})

function stretchLut(data, channel) {
  const histogram = new Uint32Array(256)
  for (let i = channel; i < data.length; i += 4) histogram[data[i]] += 1
  const total = data.length / 4
  let low = 0
  let high = 255
  for (let sum = 0, v = 0; v < 256; v += 1) { sum += histogram[v]; if (sum >= total * STRETCH_LOW) { low = v; break } }
  for (let sum = 0, v = 255; v >= 0; v -= 1) { sum += histogram[v]; if (sum >= total * (1 - STRETCH_HIGH)) { high = v; break } }
  const range = Math.max(1, high - low)
  return Uint8ClampedArray.from({ length: 256 }, (_, v) => ((v - low) * 255) / range)
}

/** Returns a sharpened, contrast-stretched JPEG of the given image blob. */
export async function enhanceBlob(blob) {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  const canvas = canvasFor(width, height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(bitmap, 0, 0)
  bitmap.close?.()
  const image = context.getImageData(0, 0, width, height)
  const data = image.data

  const luts = [0, 1, 2].map((channel) => stretchLut(data, channel))
  for (let i = 0; i < data.length; i += 4) {
    const r = luts[0][data[i]]
    const g = luts[1][data[i + 1]]
    const b = luts[2][data[i + 2]]
    const grey = 0.299 * r + 0.587 * g + 0.114 * b
    data[i] = grey + (r - grey) * SATURATION
    data[i + 1] = grey + (g - grey) * SATURATION
    data[i + 2] = grey + (b - grey) * SATURATION
  }

  // Unsharp mask: add back the difference between each pixel and its 3×3 neighbourhood mean.
  const source = new Uint8ClampedArray(data)
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4
      for (let c = 0; c < 3; c += 1) {
        let sum = 0
        for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) sum += source[i + (dy * width + dx) * 4 + c]
        data[i + c] = source[i + c] + SHARPEN * (source[i + c] - sum / 9)
      }
    }
  }
  context.putImageData(image, 0, 0)
  return toBlob(canvas)
}

const enhanced = new Map()

/** Object URL of the enhanced version of an image URL, computed once per URL. */
export function enhanceImage(src) {
  if (!enhanced.has(src)) {
    const job = fetch(src).then((response) => response.blob()).then(enhanceBlob).then((blob) => URL.createObjectURL(blob))
    job.catch(() => enhanced.delete(src))
    enhanced.set(src, job)
  }
  return enhanced.get(src)
}

/** Crops a `zoom`× window centred on (fx, fy) — fractions of the image — and returns it as a JPEG blob. */
export async function cropAround(blob, fx, fy, zoom) {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  const w = width / zoom
  const h = height / zoom
  const sx = Math.min(width - w, Math.max(0, fx * width - w / 2))
  const sy = Math.min(height - h, Math.max(0, fy * height - h / 2))
  const canvas = canvasFor(Math.round(w * 4), Math.round(h * 4))
  const context = canvas.getContext('2d')
  context.imageSmoothingEnabled = false
  context.drawImage(bitmap, sx, sy, w, h, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  // Where the point lands inside the crop, so a marker can be drawn on it.
  return { blob: await toBlob(canvas), at: { x: (fx * width - sx) / w, y: (fy * height - sy) / h } }
}
