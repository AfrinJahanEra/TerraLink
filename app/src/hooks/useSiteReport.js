import { useCallback, useMemo, useState } from 'react'
import { REFERENCE_PHOTOS } from '../data/referencePhotos'
import { createSitePdf, sitePdfFilename } from '../services/sitePdf'
import { downloadBlob } from '../utils/download'
import { buildSiteSummary, wasteReportsFor } from '../utils/siteSummary'
import { useApp } from './useApp'

/** Ground evidence, the plain-language summary and the site PDF for one comparison. `result` is null until both dates are measured. */
export function useSiteReport({ site, earlier, later, result }) {
  const { communityReports } = useApp()
  const [pdf, setPdf] = useState({ busy: false, error: '' })
  const wasteReports = useMemo(() => (site ? wasteReportsFor(communityReports, site.id) : []), [communityReports, site])
  const wasteReport = wasteReports[0] ?? null
  // A pilot lake has a credited baseline photo; a site added later may have one uploaded with it.
  const reference = useMemo(() => {
    if (!site) return null
    if (REFERENCE_PHOTOS[site.id]) return REFERENCE_PHOTOS[site.id]
    return site.baselinePhotoId ? { photoId: site.baselinePhotoId, uploadedBy: site.createdBy } : null
  }, [site])
  const summary = useMemo(() => (result ? buildSiteSummary({ earlier, later, result, wasteReport }) : null), [earlier, later, result, wasteReport])

  const downloadPdf = useCallback(async () => {
    if (!summary) return
    setPdf({ busy: true, error: '' })
    try {
      const blob = await createSitePdf({ site, earlier, later, result, wasteReport, wasteReports, reference, summary })
      downloadBlob(blob, sitePdfFilename(site, later))
      setPdf({ busy: false, error: '' })
    } catch {
      setPdf({ busy: false, error: 'The PDF could not be created. Please try again.' })
    }
  }, [site, earlier, later, result, wasteReport, wasteReports, reference, summary])

  return { wasteReports, wasteReport, reference, summary, pdf, downloadPdf }
}
