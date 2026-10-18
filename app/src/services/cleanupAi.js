/**
 * AI cleanup check: OpenAI's CLIP vision model (ViT-B/32), run on this device with Transformers.js.
 * Each photo is turned into an image embedding and compared with descriptions of waste and of clean water bodies
 * (zero-shot classification). The description embeddings were computed once from CLIP's text model and saved in
 * clipLabels.json, so the browser only downloads the vision half (about 89 MB, cached after the first run).
 */
import clip from '../data/clipLabels.json'

export const CLEANUP_MODEL = 'CLIP ViT-B/32 (OpenAI), running on this device'

const LABEL_TEXT = {
  garbage_pile: 'garbage pile',
  litter: 'scattered litter',
  dirty_bank: 'polluted bank with trash',
  floating_plastic: 'floating plastic',
  clean_shore: 'clean shoreline',
  clean_water: 'clear water',
  park: 'clean green area',
  clean_street: 'clean street',
}

// Waste probability in the after-photo above which the spot is still dirty, and the band that counts as partly cleared.
export const NOT_CLEARED = 0.55
const PARTLY_CLEARED = 0.3

let modelJob = null
const listeners = new Set()

/** Loads the vision model once. `onProgress({ loaded, total })` reports the download in bytes. */
export function loadCleanupModel(onProgress) {
  if (onProgress) listeners.add(onProgress)
  if (!modelJob) {
    const files = new Map()
    const progress_callback = (event) => {
      if (event.status !== 'progress' || !event.total) return
      files.set(event.file, { loaded: event.loaded, total: event.total })
      const loaded = [...files.values()].reduce((sum, file) => sum + file.loaded, 0)
      const total = [...files.values()].reduce((sum, file) => sum + file.total, 0)
      listeners.forEach((listener) => listener({ loaded, total }))
    }
    modelJob = import('@huggingface/transformers').then(async ({ AutoProcessor, CLIPVisionModelWithProjection, RawImage }) => {
      const [processor, model] = await Promise.all([
        AutoProcessor.from_pretrained(clip.model, { progress_callback }),
        CLIPVisionModelWithProjection.from_pretrained(clip.model, { dtype: 'q8', progress_callback }),
      ])
      return { processor, model, RawImage }
    })
    modelJob.catch(() => { modelJob = null })
  }
  return modelJob.finally(() => { if (onProgress) listeners.delete(onProgress) })
}

const unit = (vector) => {
  const norm = Math.hypot(...vector)
  return vector.map((value) => value / norm)
}

/** What the model sees in one photo: the probability of waste and its three strongest descriptions. */
export async function analyzePhoto(blob) {
  const { processor, model, RawImage } = await loadCleanupModel()
  const image = await RawImage.fromBlob(blob)
  const { image_embeds: embeds } = await model(await processor(image))
  const vector = unit(Array.from(embeds.data))
  // CLIP scores image–text similarity with a learned temperature of 100.
  const logits = clip.labels.map((label) => 100 * label.embedding.reduce((sum, value, index) => sum + value * vector[index], 0))
  const max = Math.max(...logits)
  const weights = logits.map((value) => Math.exp(value - max))
  const total = weights.reduce((sum, value) => sum + value, 0)
  const scored = clip.labels.map((label, index) => ({ id: label.id, group: label.group, text: LABEL_TEXT[label.id], probability: weights[index] / total }))
  return {
    waste: scored.filter((label) => label.group === 'waste').reduce((sum, label) => sum + label.probability, 0),
    top: [...scored].sort((a, b) => b.probability - a.probability).slice(0, 3),
  }
}

export const CLEANUP_VERDICT = {
  cleared: { label: 'Cleared', tone: 'green' },
  partly_cleared: { label: 'Partly cleared', tone: 'amber' },
  not_cleared: { label: 'Not cleared', tone: 'rose' },
}

/** Turns the per-photo results into a verdict a manager can read. `before` may be empty when the report had no photo. */
export function decideCleanup(before, after) {
  const beforeWaste = before.length ? Math.max(...before.map((item) => item.waste)) : null
  // The cleanest after-photo is not enough: any after-photo that still shows waste means the job is not done.
  const afterWaste = Math.max(...after.map((item) => item.waste))
  const verdict = afterWaste >= NOT_CLEARED ? 'not_cleared' : afterWaste >= PARTLY_CLEARED ? 'partly_cleared' : 'cleared'
  const reduction = beforeWaste ? Math.max(0, Math.round(((beforeWaste - afterWaste) / beforeWaste) * 100)) : null
  const percent = (value) => `${Math.round(value * 100)}%`
  const sentences = [
    beforeWaste !== null ? `Waste likelihood fell from ${percent(beforeWaste)} in the report photo to ${percent(afterWaste)} in the after-photo${reduction !== null ? ` (${reduction}% lower)` : ''}.` : `Waste likelihood in the after-photo is ${percent(afterWaste)}; the report had no photo to compare with.`,
    verdict === 'cleared' ? 'The after-photo looks clean.' : verdict === 'partly_cleared' ? 'Some waste may remain; check the after-photo closely.' : 'The after-photo still shows waste.',
    beforeWaste !== null && beforeWaste < 0.45 ? 'Note: the report photo itself did not clearly show waste.' : '',
  ].filter(Boolean)
  return {
    model: CLEANUP_MODEL,
    checkedAt: new Date().toISOString(),
    verdict,
    confidence: verdict === 'cleared' ? 1 - afterWaste : verdict === 'not_cleared' ? afterWaste : 0.5 + Math.abs(afterWaste - 0.42),
    beforeWaste,
    afterWaste,
    reduction,
    summary: sentences.join(' '),
  }
}
