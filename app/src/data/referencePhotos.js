import dhanmondi from '../assets/reference/dhanmondi-lake.jpg'
import golTalab from '../assets/reference/gol-talab.jpg'
import gulshan from '../assets/reference/gulshan-baridhara-lake.jpg'
import hatirjheel from '../assets/reference/hatirjheel.jpg'
import ramna from '../assets/reference/ramna-lake.jpg'

/**
 * Ground-level baseline photo of each water body in a clean state, shown as "before" next to the latest
 * AI-marked report photo. Photos from Wikimedia Commons; the credit must stay with the photo wherever it is shown.
 */
export const REFERENCE_PHOTOS = {
  'gulshan-baridhara-lake': { url: gulshan, credit: 'Jubair Bin Iqbal', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Gulshan_Lake_Dhaka.jpg' },
  hatirjheel: { url: hatirjheel, credit: 'Tawkir.ahmad', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:View_of_Hatirjheel_near_Moghbazar.jpg' },
  'dhanmondi-lake': { url: dhanmondi, credit: 'BeardoSWAT', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Dhanmondi_Lake_Feb_20,_2026.jpg' },
  'ramna-lake': { url: ramna, credit: 'S.M.M. Musabbir Uddin', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Lake_of_Ramna_Park_2023.jpg' },
  'gol-talab': { url: golTalab, credit: 'Tazin22', license: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Gol_talab_dhaka.jpg' },
}

export const referenceCredit = (photo) => `Photo: ${photo.credit}, ${photo.license}, Wikimedia Commons`
