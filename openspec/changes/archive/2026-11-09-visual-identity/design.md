# Design

## Context

See `proposal.md` for the motivation and `specs/visual-identity/spec.md` for the required behavior. The source of the identity is the handoff bundle `sliderep-identidad/` (README, `tokens.json`, SVGs, PNGs), which lives outside the repo.

Current state:

- `constants/hf.ts` holds 12 color tokens (`surface` and `accentDim` have no users); 29 files import it. Three more colors are constants in `app/my-qr.tsx`.
- Font names are string literals in the styles (about 150), and 15 screens call `useFonts` and render nothing until their fonts load.
- `components/judge/count-size.ts` hardcodes font metrics (Barlow's widest digit 0.484 em, Plex's advance 0.6 em).
- `side-rails.tsx` builds a translucent color by appending hex alpha to a token (`${color}55`), so color tokens must stay 6-digit hex.
- `android/` is generated and git-ignored.

The identity is designed light-first. It defines no dark surfaces, and its secondary text color (#5E5B55) has only 2.55:1 on Tinta.

## Goals / Non-Goals

**Goals:**

- Changing a color or a typeface is an edit in one file.
- The look matches the identity on every screen with no layout change.

**Non-Goals:**

- A light theme or theme switching.
- A type scale: `fontSize` and `letterSpacing` stay in each screen's styles, because they are the layout.
- Changing copy or its uppercase, apart from the wordmark. "WELCOME TO SLIDEREP" is a sentence and stays.
- Showing the logo image inside the app.

## Decisions

### 1. One theme module with semantic colors and font roles

`constants/theme.ts` replaces `constants/hf.ts`, and `HF.x` becomes `colors.x`. It holds:

- `palette`: the identity's raw values, not exported; the tokens below are defined from it.
- `colors`: the semantic tokens the screens use.
- `fonts`: the roles the screens use (`display`, `ui`, `wordmark`).
- `fontAssets`: the map passed to the font loader.

Colors (contrast on Tinta):

| Token | Value | Source | Contrast |
|---|---|---|---|
| `bg` | `#1B1B19` | Tinta | n/a |
| `ink` | `#ECE9E2` | Hueso | 14.2 |
| `inkDim` | `#ADABA6` | Hueso 70 % | 7.5 |
| `muted` | `#8E8C88` | Hueso 55 % | 5.1 |
| `mutedDim` | `#4F4E4B` | Hueso 25 % (placeholders, list arrows) | 2.1 |
| `hairline` | `#30302D` | Hueso 10 % | 1.3 |
| `hairlineStrong` | `#3C3C39` | Hueso 16 % | 1.6 |
| `accent` | `#C27A2E` | Ámbar | 5.0 |
| `rep` | `#ECE9E2` | Hueso | 14.2 |
| `noRep` | `#C27A2E` | Ámbar | 5.0 |

The greys are written flattened as hex, because they're used where opacity would blend with whatever is behind them. 55 % and 25 % are the symbol's own segment opacities. `surface` and `accentDim` are dropped. My QR's colors move in unchanged as `qrPaper` (`#ffffff`), `qrInk` (`#0a0a0a`) and `qrMuted` (`#6a6a62`).

Alternative: keep `HF` and only change its values. Rejected because it leaves the font literals and the 15 loaders, which are the actual maintenance problem. A lint rule against literals was also left out to keep the change small; task 2.4 checks it once with a search.

### 2. Font roles map from the old families

Every `BarlowCondensed_*` becomes `fonts.display` and every `IBMPlexMono_*` becomes `fonts.ui`. Both resolve to `Outfit_400Regular`, and `fonts.wordmark` to `Outfit_300Light`. Two roles with the same value look redundant, but they keep the option of raising the weight of titles and counters without touching any screen (the role's value plus its entry in `fontAssets`).

Fonts come from `@expo-google-fonts/outfit`'s static files, like the current ones, rather than the bundle's variable TTF: React Native selects custom fonts by name and doesn't drive a variable font's weight axis reliably.

### 3. Fonts load once, behind the splash

`app/_layout.tsx` calls `SplashScreen.preventAutoHideAsync()` at module scope and `useFonts(fontAssets)`, renders nothing until the fonts are loaded or failed, and then hides the splash. On failure the app still opens, with the system font. Screens drop their own `useFonts` and the `fontsLoaded` part of their guards, keeping the other conditions (profile loaded, workout present and so on).

### 4. Rep count sizing is re-measured, the rest keeps its sizes

On typical strings Outfit is 32–39 % wider than Barlow Condensed and between 15 % narrower and 4 % wider than Plex Mono, so small labels keep their fit and display text gets wider. Most display text already shrinks to fit (exercise name, timer, scores).

The count doesn't: it's computed. `DIGIT_EM` becomes 0.59, Outfit's tabular digit measured from the font file (the count uses `tabular-nums`). `MONO_EM` becomes `LABEL_EM`, kept at 0.6 as an upper bound: the labels hold lowercase letters and tabular digits, none wider than 0.59 em. At 360 dp wide, a 2-digit target goes from 190 to about 178, and a 3-digit one from 147 to about 119. Proportions at the 190 maximum don't change.

Letter spacing stays as is, including the exercise name's 6 and the count's −7/190: no change unless the device check shows a defect.

Times and rep numbers that relied on Plex being monospaced need `fontVariant: ['tabular-nums']`; the ones that already have it stay.

### 5. Adaptive icon and splash use a generated composition, not the bundle's icon

`icono-app-1024.png` draws the symbol at 90 % of the side, full-bleed, which is right for `icon` but gets cut by an adaptive mask: only the central 66 of 108 dp (61 %) is guaranteed visible. A 184:64 symbol fits that circle at about 58 % of the layer's width.

| File in `assets/images/` | Content |
|---|---|
| `icon.png` | `icono-app-1024.png`, copied |
| `android-icon-foreground.png` | 1024², transparent, `simbolo-negativo.svg` centered at 58 % width |
| `android-icon-monochrome.png` | 1024², transparent, `simbolo-una-tinta-negativo.svg`, same placement (the one-ink version: Android keeps only the alpha, which the regular symbol's 25 % segment would lose) |
| `splash-icon.png` | same image as the foreground |
| `favicon.png` | `icono-app.svg` at 48² |

Generated once with `rsvg-convert` from small wrapper SVGs in the scratchpad; only the PNGs are committed, as the sources live in the identity bundle and nothing regenerates them per build.

`app.json`: `adaptiveIcon.backgroundColor` becomes `#1B1B19` and `backgroundImage` goes away (with its file, a solid color needs no image). The splash has one `backgroundColor`, `#1B1B19`, and no `dark` block. The app is always dark, so a light-mode variant would only flash white.

A square, centered canvas keeps the symbol whole and undistorted however Android scales the image; the circle-safe placement is why the splash reuses the foreground.

## Risks / Trade-offs

- [Regular weight loses the emphasis the bold condensed type gave] → The count stays very large. If it reads poorly at arm's length on the device, raise `fonts.display` (Decision 2).
- [Ámbar vs Hueso is a weaker difference than orange vs green (2.8:1)] → Haptics and the gesture's direction also tell them apart; check it in the device review.
- [Wider display text may wrap or crowd where it doesn't shrink: buttons, card titles, the KPI beside the timer] → Device review with extreme content against `phone-layout`; fix only what breaks.
- [Outfit's line box is slightly taller than Barlow's (1.26 vs 1.2 em), with tight fixed `lineHeight`s on large numbers] → Check for clipped digits on Android in the same review.
- [Splash scaling on Android 12+ depends on the system and on `imageWidth`] → Square, circle-safe image; adjust `imageWidth` from 200 on the device if the symbol looks too small.

## Migration Plan

No data involved. Icon and splash need `pnpm exec expo prebuild --clean` and a new build (`android/` is git-ignored, so nothing tracked is lost). Old fonts are removed only after no style references them. Rollback is a revert plus a rebuild.
