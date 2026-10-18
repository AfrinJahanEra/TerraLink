/**
 * Sample community reports. They carry no photo because no field photo exists for them;
 * submitted reports always include real uploaded evidence.
 */
export const initialCommunityReports = [
  {
    id: 'RPT-003',
    siteId: 'dhanmondi-lake',
    category: 'waste_dumping',
    description: 'Plastic bags and food waste have collected along the walkway edge near the footbridge.',
    latitude: 23.74505,
    longitude: 90.37734,
    observedAt: '2026-10-11',
    createdAt: '2026-10-11T09:20:00.000Z',
    status: 'pending',
    photos: [],
    reporter: { name: 'Karim Hossain', email: 'user@terralink.demo', contact: '' },
    sample: true,
    history: [{ id: 'h-003-1', status: 'pending', by: 'Karim Hossain', at: '2026-10-11T09:20:00.000Z', note: 'Report submitted' }],
  },
  {
    id: 'RPT-002',
    siteId: 'gulshan-baridhara-lake',
    category: 'water_pollution',
    description: 'Dark, foul-smelling water is entering the lake near the outlet on the eastern bank.',
    latitude: 23.79942,
    longitude: 90.41708,
    observedAt: '2026-10-09',
    createdAt: '2026-10-09T15:05:00.000Z',
    status: 'under_review',
    photos: [],
    reporter: { name: 'Karim Hossain', email: 'user@terralink.demo', contact: '' },
    sample: true,
    history: [
      { id: 'h-002-1', status: 'pending', by: 'Karim Hossain', at: '2026-10-09T15:05:00.000Z', note: 'Report submitted' },
      { id: 'h-002-2', status: 'under_review', by: 'Nusrat Jahan', at: '2026-10-10T08:40:00.000Z', note: 'Review started' },
    ],
  },
  {
    id: 'RPT-001',
    siteId: 'hatirjheel',
    category: 'encroachment',
    description: 'Fill material has been dumped on the bank and a temporary fence is being put up.',
    latitude: 23.759513,
    longitude: 90.4102,
    observedAt: '2026-10-05',
    createdAt: '2026-10-05T11:30:00.000Z',
    status: 'verified',
    photos: [],
    reporter: { name: 'Another resident', email: 'resident@example.org', contact: '' },
    sample: true,
    history: [
      { id: 'h-001-1', status: 'pending', by: 'Another resident', at: '2026-10-05T11:30:00.000Z', note: 'Report submitted' },
      { id: 'h-001-2', status: 'verified', by: 'Nusrat Jahan', at: '2026-10-06T10:15:00.000Z', note: 'Confirmed against a site visit photo set; follow-up task needed' },
    ],
  },
]
