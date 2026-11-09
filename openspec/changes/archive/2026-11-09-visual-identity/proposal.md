# Proposal

## Why

The app still wears its prototype look (near-black, orange and green, Barlow Condensed + IBM Plex Mono) and the default Expo icon and splash, while SlideRep now has a designed visual identity. Styling is also scattered: font names are written out about 150 times and fonts are loaded separately by 15 screens, so changing the look means touching most of the app.

## What Changes

- The app keeps its dark theme but takes the identity's palette: Tinta background, Hueso text, Ámbar as the only accent, and greys derived from Hueso.
- Judging feedback loses its green: a rep shows in Hueso and a no-rep in Ámbar.
- All text uses the identity's typeface, Outfit: Regular 400 for the interface and the counters. IBM Plex Mono and Barlow Condensed are removed.
- The hub shows the app name as the identity's wordmark: lowercase `sliderep`, Outfit Light, +4 % tracking.
- Colors and font roles are defined in one theme module, and fonts are loaded once at the root of the app.
- New app icon (including Android's adaptive and themed monochrome icons) and new splash screen, built from the identity's resources.
- The layout stays: positions, sizes, letter spacing and text copy don't change, except where a wider typeface forces the rep count to be sized differently. My QR stays black on white.

## Capabilities

### New Capabilities
- `visual-identity`: how the app looks and presents itself: palette, rep / no-rep colors, typeface, wordmark, app icon and splash screen.

### Modified Capabilities

None. `judging`'s "accent color" highlight after a no-rep and `athlete-profile`'s black-on-white QR hold as written, and `phone-layout` is a constraint this change must keep meeting.

## Impact

- **Code**: every screen and component with styles (29 files import the current tokens), `app/_layout.tsx`, `constants/hf.ts` (replaced), `components/judge/count-size.ts` and its tests.
- **Dependencies**: adds `@expo-google-fonts/outfit`; removes `@expo-google-fonts/barlow-condensed` and `@expo-google-fonts/ibm-plex-mono`.
- **Native config**: `app.json` and `assets/images/`. Icon and splash need a new native build (`expo prebuild --clean`).
- **Not affected**: the engine, stored data and the goldens.
- **Docs**: `CLAUDE.md`, `docs/ROADMAP.md`.
