# judging Specification

## Purpose

Lets a judge count an athlete's reps live during a WOD with simple gestures, marking each one as valid or no-rep, while the clock and the workout's progress run until the WOD finishes or is aborted.

## Requirements

### Requirement: Pre-start summary
Before judging starts, the system SHALL show the workout's mode, name, duration (when it has one), who is being judged or judging, and the list of exercises with their reps. A START action begins the countdown and a ✕ action leaves without judging.

#### Scenario: Summary for FRAN
- **WHEN** the owner reaches the start of a FRAN session
- **THEN** the summary shows THRUSTERS "21 · 15 · 9" and PULL-UPS "21 · 15 · 9" and a START button

#### Scenario: Leaving before starting
- **WHEN** the owner taps ✕ on the pre-start summary
- **THEN** the session is left without anything being recorded

### Requirement: Start countdown
After START, the system SHALL count down from 10 to 0 with a sound cue on every second and a distinct cue at GO, then start judging and the session clock.

#### Scenario: Countdown completes
- **WHEN** the countdown reaches 0
- **THEN** "GO!" is shown, and judging begins about half a second later with the session clock at 0

### Requirement: Rep input gestures
During judging, a swipe right or a quick tap on the swipe band SHALL count a valid rep, and a swipe left SHALL count a no-rep. Only the swipe band SHALL accept rep input.

#### Scenario: Swipe right
- **WHEN** the judge swipes right more than the minimum distance within the time limit
- **THEN** one valid rep is counted

#### Scenario: Tap
- **WHEN** the judge taps the swipe band briefly without moving
- **THEN** one valid rep is counted

#### Scenario: Swipe left
- **WHEN** the judge swipes left more than the minimum distance within the time limit
- **THEN** one no-rep is recorded and the count does not change

#### Scenario: Gesture too slow or too short
- **WHEN** a swipe is shorter than the minimum distance or takes longer than the time limit
- **THEN** nothing is counted

### Requirement: Every input is recorded as a timestamped event
Each valid rep and each no-rep SHALL be recorded as an event with its time in milliseconds since judging started. Events SHALL be recorded even when they do not change the live count.

#### Scenario: No-rep is recorded
- **WHEN** the judge swipes left 75 seconds into the session
- **THEN** a no-rep event with time ≈ 75000 ms is added to the session's events

### Requirement: Live feedback
The system SHALL show the current exercise, the current rep count, the reps left and the target. After a no-rep, the exercise name, count and side rails SHALL switch to the accent color until the next valid rep. Each rep and no-rep SHALL give distinct haptic feedback.

#### Scenario: No-rep highlight clears
- **WHEN** a valid rep is counted after a no-rep
- **THEN** the accent highlight returns to normal

### Requirement: Timer per format
The header SHALL show elapsed time for For Time and Chipper, time remaining for AMRAP, and time left in the current minute for EMOM.

#### Scenario: AMRAP countdown
- **WHEN** CINDY has been running for 2 minutes
- **THEN** the timer shows 10:00 labelled "remaining"

#### Scenario: EMOM minute timer
- **WHEN** EVERY MINUTE has been running for 75 seconds
- **THEN** the timer shows 00:45 labelled "min left"

### Requirement: Automatic finish
Judging SHALL finish without any confirmation: For Time and Chipper on the workout's last valid rep, AMRAP when its duration reaches 0, and EMOM when its last minute ends. On finish the clock SHALL stop, further gestures SHALL be ignored and the result SHALL be shown.

#### Scenario: AMRAP time runs out
- **WHEN** CINDY's 12 minutes elapse
- **THEN** an end sound plays, judging finishes keeping the partial round's reps, and the result is shown

#### Scenario: EMOM minute change cue
- **WHEN** an EMOM minute (other than the last) ends
- **THEN** a minute sound plays and the count resets to 0 for the new interval

### Requirement: Abort in progress
While judging is in progress, tapping the timer or pressing the hardware back button SHALL ask "Abort session?" with "Data will be lost." Confirming SHALL leave the session without saving anything; cancelling SHALL continue judging.

#### Scenario: Abort confirmed
- **WHEN** the judge taps the timer and confirms Abort
- **THEN** the session is discarded and the owner returns to workout selection

#### Scenario: Abort cancelled
- **WHEN** the judge presses hardware back and chooses Cancel
- **THEN** judging continues with the clock and count unchanged

### Requirement: No pause, reset or undo
The system SHALL NOT offer pausing the clock, resetting the session or undoing an input during judging.

#### Scenario: Timer tap does not pause
- **WHEN** the judge taps the timer
- **THEN** the abort confirmation is shown and the clock keeps running
