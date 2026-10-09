const periods = [
  {
    id: '2019-2024',
    label: '2019 vs 2024',
    beforeYear: 2019,
    afterYear: 2024,
    beforeDate: '15 Mar 2019',
    afterDate: '18 Mar 2024',
    season: 'Dry season',
    coverageAdjustment: -4,
    changeFactor: 1.18,
  },
  {
    id: '2021-2024',
    label: '2021 vs 2024',
    beforeYear: 2021,
    afterYear: 2024,
    beforeDate: '21 Mar 2021',
    afterDate: '18 Mar 2024',
    season: 'Dry season',
    coverageAdjustment: 0,
    changeFactor: 1,
  },
  {
    id: '2023-2024',
    label: '2023 vs 2024',
    beforeYear: 2023,
    afterYear: 2024,
    beforeDate: '12 Mar 2023',
    afterDate: '18 Mar 2024',
    season: 'Dry season',
    coverageAdjustment: 5,
    changeFactor: 0.46,
  },
]

function round(value) {
  return Math.round(value * 10) / 10
}

export function getSiteComparisons(site) {
  const currentArea = Number.parseFloat(site.area)
  const baseCoverage = Number.parseInt(site.clearCoverage, 10)

  return periods.map((period) => {
    if (site.change === null) {
      return {
        ...period,
        previousArea: null,
        currentArea: null,
        change: null,
        coverage: Math.max(30, Math.min(98, baseCoverage + period.coverageAdjustment)),
      }
    }

    const change = round(site.change * period.changeFactor)
    const previousArea = round(currentArea / (1 + change / 100))
    return {
      ...period,
      previousArea,
      currentArea,
      change,
      coverage: Math.max(30, Math.min(98, baseCoverage + period.coverageAdjustment)),
    }
  })
}

export const analysisSources = {
  imagery: 'Sentinel-2 cloudless yearly mosaics',
  provider: 'EOX IT Services GmbH',
  resolution: '10 m source imagery',
  measurement: 'Illustrative sample calculation',
}
