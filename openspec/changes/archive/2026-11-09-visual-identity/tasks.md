# Tasks

## 1. Theme and font loading

- [x] 1.1 Install Outfit with `pnpm exec expo install @expo-google-fonts/outfit` and verify it's in `package.json` and `Outfit_300Light` / `Outfit_400Regular` resolve from it
- [x] 1.2 Create `constants/theme.ts` with a private `palette` and exported `colors`, `fonts` and `fontAssets` (design decisions 1 and 2), and verify every color is 6-digit hex and `pnpm exec tsc --noEmit` passes
- [x] 1.3 In `app/_layout.tsx`, hold the splash, load `fontAssets` once and hide the splash when fonts are loaded or failed (design decision 3), and verify the app opens on the hub with `pnpm start`

## 2. Move every screen to the theme

- [x] 2.1 Replace `HF.x` with `colors.x` in `app/`, `components/` and `hooks/`, move My QR's three colors into the theme, delete `constants/hf.ts`, and verify `pnpm exec tsc --noEmit` passes
- [x] 2.2 Replace font-name literals with roles (`BarlowCondensed_*` → `fonts.display`, `IBMPlexMono_*` → `fonts.ui`), and verify a search for `Barlow` and `IBMPlex` in `app/`, `components/` and `hooks/` finds nothing
- [x] 2.3 Remove the screens' `useFonts` calls and the `fontsLoaded` part of their guards, keeping the other conditions, and verify a search for `useFonts|fontsLoaded` finds only `app/_layout.tsx`
- [x] 2.4 Verify a search for hex colors, `rgb(`, `'white'` and `'black'` in `app/`, `components/` and `hooks/` finds no color outside the theme
- [x] 2.5 Add `fontVariant: ['tabular-nums']` to times and rep numbers that relied on Plex being monospaced (judging header KPI, result and adjust lists), and verify every numeric style named in the *Steady numbers* requirement has it
- [x] 2.6 Remove `@expo-google-fonts/barlow-condensed` and `@expo-google-fonts/ibm-plex-mono`, and verify `pnpm lint` and `pnpm exec tsc --noEmit` pass
- [x] 2.7 Update `CLAUDE.md` (`constants/hf.ts` entry → the theme module; root layout loads the fonts) and `docs/ROADMAP.md`'s two references to `constants/hf.ts`, and verify a search for `constants/hf` in both finds only period-accurate history, if any

## 3. Judging count and wordmark

- [x] 3.1 In `components/judge/count-size.ts`, set `DIGIT_EM` to 0.59 and rename `MONO_EM` to `LABEL_EM` (design decision 4), update `tests/count-size.test.ts`'s expectations where they depend on the digit width, and verify `pnpm test` passes
- [x] 3.2 Update `CLAUDE.md`'s `count-size.ts` entry with Outfit's measures and verify it no longer mentions Barlow
- [x] 3.3 Render the hub's app name as the wordmark (`sliderep`, `fonts.wordmark`, letter spacing 0.04 × its size, no `textTransform`), and verify it on the hub with `pnpm start`

## 4. Icon and splash

- [x] 4.1 Generate `icon.png`, `android-icon-foreground.png`, `android-icon-monochrome.png`, `splash-icon.png` and `favicon.png` from the identity bundle (design decision 5), and verify their sizes with `file` and by viewing each one
- [x] 4.2 Update `app.json` (adaptive icon background color without image, one splash background color) and delete `assets/images/android-icon-background.png`, and verify with `pnpm exec expo config --type public` that the values resolve and no reference to the deleted file remains
- [x] 4.3 Document the icon and splash composition in `CLAUDE.md` and verify the entry names the 58 % placement and that a new native build is needed

## 5. Integration

- [x] 5.1 Run `pnpm lint` and `pnpm test` and verify both pass with no golden changed (`git status` shows nothing under `tests/__goldens__/`)
- [x] 5.2 Run `pnpm exec expo prebuild --clean` and make a new Android build, and verify on the device that the launcher icon is whole with a circular mask, the themed icon shows the one-ink symbol, and the splash is Tinta in light and dark mode
- [x] 5.3 Device review of every touched view with extreme content, against the `phone-layout` spec (long names, 3-digit targets, 1.3× system font, 360 × 640): nothing cut off, digits not clipped, layout as before
- [x] 5.4 Device check of a full session: rep vs no-rep colors are told apart at a glance, the Regular count reads well at arm's length, and My QR is still scanned correctly by another phone

## Workflow follow-up

- Archive the change once the device review is done.
