# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator
npm run web            # Run in browser
npm run lint           # Run ESLint
npm run reset-project  # Reset to blank Expo template
```

## Architecture

**Stack**: Expo 54 + React Native 0.81 + TypeScript + Expo Router 6

### Routing

File-based routing via Expo Router. All routes live in `app/`:
- `app/_layout.tsx` — root layout wrapping the full app with theme provider and navigation stack
- `app/(tabs)/_layout.tsx` — bottom tab navigator (Home, Explore)
- `app/modal.tsx` — modal pushed from the root stack

### Theme System

Light/dark mode support throughout:
- `constants/theme.ts` — centralized color and font definitions for both modes
- `hooks/use-theme-color.ts` — resolves a color key to the correct light/dark value
- `hooks/use-color-scheme.ts` (+ `.web.ts`) — platform-specific color scheme detection; web variant adds a `useEffect` listener instead of relying on the native hook
- `ThemedText` and `ThemedView` components wrap native primitives and consume the theme automatically

### Cross-Platform Conventions

Platform-specific files use filename suffixes:
- `.ios.tsx` — iOS-only implementation (e.g., `icon-symbol.ios.tsx` uses SF Symbols)
- `.web.ts` — web-specific implementation (e.g., `use-color-scheme.web.ts`)

The default file (no suffix) is the Android/fallback implementation.

### Path Alias

`@/*` resolves to the project root (configured in `tsconfig.json`). Use this for all imports instead of relative paths across directories.
