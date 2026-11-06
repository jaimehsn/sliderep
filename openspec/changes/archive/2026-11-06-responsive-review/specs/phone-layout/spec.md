# Spec Delta

## Purpose

Defines which phones the app's layouts support and what holds on them: how text follows the system font size, and that content stays inside the screen and reachable with long or extreme content.

## ADDED Requirements

### Requirement: Supported phones
The layouts SHALL support phones in portrait from 360 × 640 dp up. The other requirements of this capability SHALL hold across that range. Tablets, open foldables, screens narrower than 360 dp, landscape and iOS are not supported.

#### Scenario: Smallest supported phone
- **WHEN** any screen is shown on a 360 × 640 dp phone with its system bars
- **THEN** that screen meets the requirements of this capability

#### Scenario: Large phone
- **WHEN** any screen is shown on a 412 × 915 dp phone
- **THEN** that screen meets the requirements of this capability, with no element stretched out of proportion

### Requirement: Text follows the system font size up to a limit
Text SHALL follow the system font size up to 1.3 times its base size and SHALL NOT grow further. The large numbers of the next requirement are the only exception.

#### Scenario: Larger system font
- **WHEN** the system font size is 1.3× and a screen is shown
- **THEN** its text is larger and stays inside the screen

#### Scenario: Largest system font
- **WHEN** the system font size is 2× and a list screen is shown
- **THEN** its text is the same size as at 1.3×

### Requirement: Large numbers ignore the system font size
The judging timer, the rep count, the reps left, and the score on the result and adjust screens SHALL keep the same base size at any system font size.

#### Scenario: Judging with a larger system font
- **WHEN** the system font size is 2× during judging
- **THEN** the timer, the rep count and the reps left are the same size as at 1×

### Requirement: Content stays inside the screen
With supported input, no text or control SHALL be cut off by, or run past, the edges of the screen. Long text SHALL wrap, shrink or truncate.

#### Scenario: Longest name and alias
- **WHEN** a screen shows a 40-character workout name and a 24-character alias
- **THEN** all of its text and controls stay inside the screen

### Requirement: Screen exits stay reachable
A screen's ✕ or back control SHALL stay on screen and tappable with any workout name, whether its other content is long or short.

#### Scenario: Long name in session setup
- **WHEN** the setup screen shows a 40-character workout name
- **THEN** the name wraps, and ✕ or "‹ ROLE" stays on screen and works

### Requirement: Content that does not fit can be scrolled
When a screen's content does not fit in the available height, including with the on-screen keyboard open, every control on it SHALL be reachable by scrolling. The judging screen SHALL NOT scroll, and SHALL fit instead.

#### Scenario: Profile with the keyboard open
- **WHEN** the alias field has focus on a 360 × 640 dp phone
- **THEN** every button on the profile screen can be reached by scrolling

#### Scenario: Long result
- **WHEN** the result screen shows a long name, the longest saved banner and many splits
- **THEN** the name, the score and every split can be reached by scrolling

### Requirement: The rep count fits while judging
The rep count, the reps left and the target SHALL be fully visible for any target, at a size that depends on the target and the space available. The size SHALL NOT change as reps are counted toward the same target.

#### Scenario: Three-digit target
- **WHEN** the current target is 150 on a 360 × 640 dp phone
- **THEN** the count, the reps left and the target are fully visible

#### Scenario: Stable size while counting
- **WHEN** the current target is 100 and the count goes from 99 to 100
- **THEN** the count's size does not change

#### Scenario: Usual target keeps its size
- **WHEN** the current target has two digits on a 412 × 915 dp phone
- **THEN** the count has its full design size

### Requirement: Scores fit on one line
The score on the result and adjust screens SHALL be shown on one line, shrinking as needed to fit the screen's width.

#### Scenario: Long score
- **WHEN** the score is "10/10 · 123 reps" on a 360 dp wide phone
- **THEN** it shows complete on one line

#### Scenario: Short score
- **WHEN** the score is "02:10"
- **THEN** it has its full design size
