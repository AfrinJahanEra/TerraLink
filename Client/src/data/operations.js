export const initialTeamMembers = [
  {
    id: 'member-nusrat',
    name: 'Nusrat Jahan',
    initials: 'NJ',
    role: 'Project Manager',
    email: 'manager@terralink.demo',
    whatsapp: '+880 1711 204 580',
    availability: 'available',
    capacity: 6,
  },
  {
    id: 'member-rahim',
    name: 'Rahim Uddin',
    initials: 'RU',
    role: 'Field Coordinator',
    email: 'rahim@terralink.demo',
    whatsapp: '+880 1812 335 472',
    availability: 'limited',
    capacity: 4,
  },
  {
    id: 'member-sadia',
    name: 'Sadia Akter',
    initials: 'SA',
    role: 'Office Operator',
    email: 'sadia@terralink.demo',
    whatsapp: '+880 1914 826 310',
    availability: 'available',
    capacity: 5,
  },
  {
    id: 'member-tanvir',
    name: 'Tanvir Hasan',
    initials: 'TH',
    role: 'GIS Analyst',
    email: 'tanvir@terralink.demo',
    whatsapp: '+880 1675 490 228',
    availability: 'available',
    capacity: 4,
  },
  {
    id: 'member-farzana',
    name: 'Farzana Islam',
    initials: 'FI',
    role: 'Finance Officer',
    email: 'farzana@terralink.demo',
    whatsapp: '+880 1755 608 941',
    availability: 'leave',
    capacity: 3,
  },
]

export const initialSiteBudgets = {
  'pond-a': 10000,
  'pond-b': 7000,
  'wetland-c': 8000,
  'lake-d': 7000,
  'beel-e': 13000,
}

export const initialExpenses = [
  { id: 'EXP-006', date: '2026-10-08', amount: 1800, description: 'Field evidence processing', taskId: 'TL-103', siteId: 'beel-e', receiptNote: 'Photograph labelling and local transport note', createdBy: 'Sadia Akter', createdAt: '2026-10-08T14:10:00.000Z' },
  { id: 'EXP-005', date: '2026-10-05', amount: 2600, description: 'Routine Pond B inspection', taskId: 'TL-100', siteId: 'pond-b', receiptNote: 'Field travel receipt verified', createdBy: 'Rahim Uddin', createdAt: '2026-10-05T16:30:00.000Z' },
  { id: 'EXP-004', date: '2026-10-03', amount: 4200, description: 'Preliminary community survey', taskId: null, siteId: 'pond-a', receiptNote: 'Survey logistics summary on file', createdBy: 'Sadia Akter', createdAt: '2026-10-03T11:20:00.000Z' },
  { id: 'EXP-003', date: '2026-09-29', amount: 3100, description: 'Cloud-free imagery review support', taskId: null, siteId: 'wetland-c', receiptNote: 'Technical review note attached', createdBy: 'Nusrat Jahan', createdAt: '2026-09-29T10:00:00.000Z' },
  { id: 'EXP-002', date: '2026-09-25', amount: 2500, description: 'Seasonal reference verification', taskId: null, siteId: 'lake-d', receiptNote: 'Local travel and field supplies', createdBy: 'Rahim Uddin', createdAt: '2026-09-25T15:40:00.000Z' },
  { id: 'EXP-001', date: '2026-09-20', amount: 4000, description: 'Boundary consultation and access', taskId: null, siteId: 'beel-e', receiptNote: 'Community meeting expense note', createdBy: 'Sadia Akter', createdAt: '2026-09-20T09:25:00.000Z' },
]
