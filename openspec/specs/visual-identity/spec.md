# visual-identity Specification

## Purpose

Defines how SlideRep looks and presents itself on a phone: its dark palette, the colors of judging feedback, its typeface and wordmark, and its app icon and splash screen.

## Requirements

### Requirement: Dark identity palette
The app's screens SHALL use a Tinta (#1B1B19) background, Hueso (#ECE9E2) primary text and greys derived from Hueso over Tinta. Ámbar (#C27A2E) SHALL be the only accent color, and no other hue SHALL appear. The My QR screen, which is dark-on-light by its own requirement, is the only exception.

#### Scenario: Any regular screen
- **WHEN** the hub, Library, History, Settings or any session screen is shown
- **THEN** its background is Tinta, its primary text is Hueso and its only non-neutral color is Ámbar

#### Scenario: My QR stays dark-on-light
- **WHEN** My QR is shown
- **THEN** the QR is black on white, as before

### Requirement: Legible secondary text
Secondary text on the dark background SHALL have a contrast ratio of at least 4.5:1 against it. Only input placeholders and decorative marks MAY be lower.

#### Scenario: Labels and notes
- **WHEN** a screen shows a small label or note in the secondary color
- **THEN** its contrast against the background is at least 4.5:1

### Requirement: Rep and no-rep colors
During judging, marks of a valid rep SHALL be Hueso and marks of a no-rep SHALL be Ámbar, on the swipe band's edges, on the line that follows a gesture and on the strip that sweeps the side rails. Green SHALL NOT be used.

#### Scenario: Valid rep
- **WHEN** the judge swipes right
- **THEN** the gesture's line and side-rail strip are Hueso

#### Scenario: No-rep
- **WHEN** the judge swipes left
- **THEN** the gesture's line and side-rail strip are Ámbar, and the exercise name, count and side rails turn Ámbar until the next valid rep

### Requirement: One typeface
All text in the app SHALL be set in Outfit Regular 400, including the judging timer, the rep count and the scores. The wordmark is the only text in another weight.

#### Scenario: Judging screen
- **WHEN** the judging screen is shown
- **THEN** the timer, exercise name, count and labels are all Outfit Regular

### Requirement: Steady numbers
The judging timer, the rep count, the reps left and the times and reps in result lists SHALL use tabular digits, so numbers don't shift sideways as they change.

#### Scenario: Timer ticking
- **WHEN** the timer goes from 10:11 to 10:12
- **THEN** the colon and the other digits stay in place

### Requirement: Wordmark
The hub SHALL show the app name as the wordmark: lowercase `sliderep`, in Outfit Light 300, with 0.04 em letter spacing.

#### Scenario: Hub header
- **WHEN** the hub is shown
- **THEN** its app name reads `sliderep` in lowercase, in the Light weight

### Requirement: App icon
The app icon SHALL be the identity's symbol in its negative version on Tinta. On Android's adaptive icon, the whole symbol SHALL stay inside the area visible under any launcher mask. Android's themed icon SHALL use the one-ink version of the symbol.

#### Scenario: Circular launcher mask
- **WHEN** a launcher shows the icon with a circular mask
- **THEN** the whole symbol is visible and nothing is cut off

#### Scenario: Themed icons
- **WHEN** Android's themed icons are turned on
- **THEN** the icon shows the one-ink symbol

### Requirement: Splash screen
While the app starts, the system SHALL show the symbol centered on a Tinta background, whether the phone is in light or dark mode, and SHALL keep it until the app's typeface is ready to be shown.

#### Scenario: Phone in light mode
- **WHEN** the app is launched on a phone in light mode
- **THEN** the splash background is Tinta, not white

#### Scenario: First screen after the splash
- **WHEN** the splash goes away
- **THEN** the first screen is already set in Outfit
