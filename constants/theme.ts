import { Outfit_300Light } from '@expo-google-fonts/outfit/300Light';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';

/**
 * The app's look, in one place (change visual-identity): every color and typeface a screen uses
 * comes from here. Sizes and letter spacing stay in each screen's styles, they're its layout.
 */

/** The identity's own values. */
const palette = {
  tinta: '#1B1B19',
  hueso: '#ECE9E2',
  ambar: '#C27A2E',
} as const;

/**
 * Keep these 6-digit hex: `side-rails.tsx` makes a translucent color by appending an alpha.
 * The greys are Hueso over Tinta at the percentage noted, written out flat so they don't blend
 * with whatever is behind them.
 */
export const colors = {
  bg: palette.tinta,
  ink: palette.hueso,
  inkDim: '#ADABA6', // 70 %
  muted: '#8E8C88', // 55 %, a segment of the symbol
  mutedDim: '#4F4E4B', // 25 %, a segment of the symbol: only placeholders and decorative marks
  hairline: '#30302D', // 10 %
  hairlineStrong: '#3C3C39', // 16 %
  accent: palette.ambar,
  rep: palette.hueso,
  noRep: palette.ambar,
  // My QR is dark-on-light whatever the theme, for the camera's sake.
  qrPaper: '#ffffff',
  qrInk: '#0a0a0a',
  qrMuted: '#6a6a62',
} as const;

const OUTFIT_LIGHT = 'Outfit_300Light';
const OUTFIT_REGULAR = 'Outfit_400Regular';

/** Font roles. Using another weight takes its value here and its entry in `fontAssets`. */
export const fonts = {
  /** Titles and big numbers. */
  display: OUTFIT_REGULAR,
  /** Labels, notes and body text. */
  ui: OUTFIT_REGULAR,
  /** The `sliderep` wordmark, and nothing else. */
  wordmark: OUTFIT_LIGHT,
} as const;

/** What `app/_layout.tsx` loads, once, before the first screen shows. */
export const fontAssets = {
  [OUTFIT_LIGHT]: Outfit_300Light,
  [OUTFIT_REGULAR]: Outfit_400Regular,
};
