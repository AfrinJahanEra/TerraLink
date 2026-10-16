/** Shared definitions for satellite observations. Kept free of heavy libraries so any page can import them. */

export const METHOD = {
  id: 'ndwi-b03-b08-v1',
  label: 'NDWI = (Green − NIR) / (Green + NIR), Sentinel-2 L2A bands B03 and B08 at 10 m',
  threshold: 0,
  bufferMeters: 10,
  source: 'Copernicus Sentinel-2 L2A, via Earth Search (Element 84) on AWS',
}

export const QUALITY = {
  suitable: { label: 'Suitable', minValid: 90 },
  limited: { label: 'Limited', minValid: 60 },
  unavailable: { label: 'Unavailable', minValid: 0 },
}

export const VERDICT = {
  decrease: { label: 'Measured decrease', detail: 'The water area fell by more than the measurement uncertainty.' },
  increase: { label: 'Measured increase', detail: 'The water area grew by more than the measurement uncertainty.' },
  within_uncertainty: { label: 'No measurable change', detail: 'The difference is smaller than the pixel-size uncertainty, so it cannot be told apart from noise.' },
  not_reliable: { label: 'Not reliable', detail: 'The imagery or the size of the water body does not support a measurement.' },
}

/** Below about a hectare a water body is only a few 10 m pixels wide. */
export const MIN_RELIABLE_AREA_HA = 1
export const MAX_SEASON_GAP_DAYS = 45

export const hectares = (squareMeters) => squareMeters / 10000
