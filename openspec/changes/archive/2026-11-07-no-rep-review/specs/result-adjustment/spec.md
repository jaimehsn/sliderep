# Spec Delta

## MODIFIED Requirements

### Requirement: Who can adjust and when
The ADJUST RESULT action SHALL be offered only on the result shown right after judging, only when the owner was the judge, has a profile and the session was saved, only while the session has fewer than 3 adjustment packages, and only while at least one no-rep is left to accept (recorded while its block was running, not accepted yet and not surplus). It SHALL NOT be offered from History or to the judged athlete.

#### Scenario: Registered owner judged an identified athlete
- **WHEN** the owner, with a profile, finishes judging an athlete identified by QR, and gave at least one no-rep
- **THEN** the result shows ADJUST RESULT

#### Scenario: No no-reps to review
- **WHEN** the owner, with a profile, finishes judging an athlete identified by QR without giving any no-rep
- **THEN** ADJUST RESULT is not shown

#### Scenario: Every no-rep accepted
- **WHEN** a saved package accepts the session's only no-rep and the owner returns to the result
- **THEN** ADJUST RESULT is no longer shown

#### Scenario: Owner was judged
- **WHEN** the owner finishes a session in which they were judged
- **THEN** ADJUST RESULT is not shown

#### Scenario: Viewing from History
- **WHEN** the owner opens a saved session from History
- **THEN** ADJUST RESULT is not shown

### Requirement: Adjustment packages are capped and append-only
A session SHALL accept at most 3 adjustment packages. Each saved package SHALL record the no-reps it accepts, who approved it (the owner's id) and when. Saved packages SHALL NOT be edited or removed, a no-rep accepted in a saved package SHALL stay accepted, and the recorded events SHALL never change.

#### Scenario: Third package saved
- **WHEN** the third package is saved for a session
- **THEN** the adjust screen reads "3 of 3 packages used", SAVE PACKAGE is disabled, and ADJUST RESULT disappears from the result

#### Scenario: Accepted no-rep in a later package
- **WHEN** the owner opens the adjust screen again after saving a package that accepted the no-rep at 00:38
- **THEN** that no-rep shows as accepted and cannot be set back to KEEP

### Requirement: Live preview and saving
The adjust screen SHALL show the score and splits with the saved packages plus the pending acceptances applied, and, when that score differs from the score without any adjustment, the latter as well. SAVE PACKAGE SHALL store the pending acceptances as one package and SHALL be disabled when there is nothing pending. Leaving with ✕ SHALL discard pending acceptances.

#### Scenario: Previewing an acceptance
- **WHEN** the owner sets a no-rep of FRAN's last position to REP and the time moves from 04:49 to 04:46
- **THEN** the screen shows TIME 04:46 together with the unadjusted 04:49

#### Scenario: Returning to the result
- **WHEN** the owner saves a package and returns to the result
- **THEN** the result shows the adjusted score and splits

#### Scenario: Leaving without saving
- **WHEN** the owner sets no-reps to REP and taps ✕ without saving
- **THEN** no package is stored and the result is unchanged

## ADDED Requirements

### Requirement: Accepted no-reps stay in their position
Every valid rep and no-rep SHALL stay in the position it was applied at during judging. An accepted no-rep SHALL count as a valid rep of its own position. When a position then reaches its target before its last event, the events after its new completing rep in that position SHALL be surplus and SHALL NOT count, except in a position that takes reps beyond its target (an EMOM interval's last exercise). No rep SHALL move to another position.

#### Scenario: Accepted no-rep in the last position
- **WHEN** FRAN's "Round 3 — PULL-UPS" was judged with its 7th valid rep at 04:40, a no-rep at 04:43, the 8th at 04:46 and the 9th at 04:49, and that no-rep is accepted
- **THEN** the position completes on the 04:46 rep, the 04:49 rep is surplus, and the score reads TIME 04:46

#### Scenario: A later no-rep becomes surplus
- **WHEN** a position of 21 was judged with a no-rep at 00:30, its 20th valid rep at 00:41, a no-rep at 00:42 and its 21st valid rep at 00:44, and only the 00:30 no-rep is accepted
- **THEN** the position completes on the 00:41 rep, and both the 00:42 no-rep and the 00:44 rep are surplus, the no-rep shown as surplus on the adjust screen

#### Scenario: EMOM first exercise
- **WHEN** a minute of 5 PULL-UPS + 10 PUSH-UPS was judged as 4 valid PULL-UPS, a no-rep, a 5th valid PULL-UP and 10 PUSH-UPS, and the no-rep is accepted
- **THEN** "Minute 1 — PULL-UPS" shows 5/5, the 5th valid PULL-UP is surplus, and PUSH-UPS still shows 10/10


### Requirement: Accepted no-reps on a stopping EMOM
For an EMOM that stops at its first missed interval, the adjusted result SHALL stop at the first interval not completed with the accepted no-reps counted. Valid reps after that interval SHALL NOT count, and the score SHALL keep the "<completed intervals> + <reps in the missed interval>" form. Each interval SHALL keep the target it asked for.

#### Scenario: Accepting a no-rep in the missed interval
- **WHEN** a stopping Death by that scored 12 + 12, with minute 13 judged at 12 valid reps and 1 no-rep, has that no-rep accepted
- **THEN** minute 13 is completed, and the adjusted score reads 13 + 0 with minute 14 listed at 0 reps


### Requirement: Accepted no-reps on several blocks
An accepted no-rep SHALL apply to its own block only. It SHALL NOT move any block's start or any rep into another block, and the time it gives back SHALL stay inside its block. The adjusted score SHALL be the scoring block's, recomputed with that block's own rules.

#### Scenario: No-rep in a block that doesn't score
- **WHEN** the owner accepts a no-rep in a For Time buy-in, which gives back 2 seconds, ahead of a scoring AMRAP
- **THEN** the buy-in's group shows its time 2 seconds earlier, and the AMRAP's group and the score are unchanged


### Requirement: Reviewable no-reps
The adjust screen SHALL list every no-rep recorded while its block was running, under its split, grouped by block, with its time on its block's clock. Each SHALL show KEEP (the default) or REP, and tapping it SHALL switch between them. A no-rep accepted in a saved package SHALL show as accepted and SHALL NOT be tappable. A no-rep that is surplus SHALL show as surplus and SHALL NOT be tappable. The screen SHALL NOT offer target or duration changes.

#### Scenario: Marking a no-rep
- **WHEN** the owner taps KEEP on the no-rep at 00:38 under "Round 1 — THRUSTERS"
- **THEN** it shows REP and a pending acceptance of that no-rep is added

#### Scenario: Unmarking a pending no-rep
- **WHEN** the owner taps a pending REP before saving
- **THEN** it shows KEEP again and the pending acceptance is dropped

#### Scenario: Surplus no-rep
- **WHEN** a pending acceptance makes a later no-rep of the same position surplus
- **THEN** that no-rep shows as surplus and cannot be tapped

#### Scenario: Position with only no-reps
- **WHEN** the last position reached was judged with no-reps only
- **THEN** those no-reps are listed under that position's label, after the block's last split

### Requirement: Time given back on For Time
On a For Time or Chipper block, when a position has surplus events, the time between its original completing rep and its new completing rep SHALL be taken off every later event of that block. Its later splits, its rests and its TIME SHALL move earlier by that amount. A position that was not complete before the acceptance SHALL give back no time.

#### Scenario: Accepted no-rep in an earlier position
- **WHEN** FRAN's "Round 1 — THRUSTERS" completes on its 00:42 rep instead of its 00:44 one after an acceptance
- **THEN** every later split and the TIME are 2 seconds earlier, and every later position keeps its own reps

#### Scenario: Rest between rounds
- **WHEN** a For Time with 60 s of rest between rounds gives back 2 seconds in round 1
- **THEN** the rest after round 1 starts and ends 2 seconds earlier, and round 2's splits and the TIME are 2 seconds earlier

### Requirement: Accepted no-reps on a capped For Time
On a capped For Time or Chipper that reached its cap unfinished, an accepted no-rep SHALL add a valid rep only to a position that was short of its target. When that completes the block's last position, the block SHALL be complete and scored as TIME of its new completing rep. Otherwise the score SHALL stay "CAP · <N> reps", N being every valid rep each position keeps.

#### Scenario: The missing rep was a no-rep
- **WHEN** a For Time with a 10 min cap reached it with its last position at 8/9 and a no-rep at 09:47 after its 8th valid rep, and that no-rep is accepted
- **THEN** the block is complete and the score reads TIME 09:47

#### Scenario: No-rep in a completed position
- **WHEN** a For Time that reached its cap at CAP · 51 reps has a no-rep of a completed position accepted
- **THEN** the score still reads CAP · 51 reps

### Requirement: Accepted no-reps on AMRAP
On an AMRAP, an accepted no-rep SHALL add a valid rep only to a position that was short of its target. In a completed position, it SHALL make that position's surplus rep stop counting, leaving the score unchanged. The AMRAP's end SHALL NOT move.

#### Scenario: No-rep in a completed position
- **WHEN** CINDY scored 14 + 7 and a no-rep in one of its completed positions is accepted
- **THEN** the score still reads 14 + 7

#### Scenario: No-rep in the unfinished round's last position
- **WHEN** CINDY scored 14 + 7, with its position in progress at 2/10 PUSH-UPS and 1 no-rep, and that no-rep is accepted
- **THEN** the score reads 14 + 8

### Requirement: Accepted no-reps on EMOM
On an EMOM, an accepted no-rep SHALL count as a valid rep of its interval's exercise, with no time given back. It SHALL count toward that exercise's completion, its interval's completion and the total of valid reps. An accepted no-rep in an interval's last exercise SHALL add to the total even beyond that exercise's target.

#### Scenario: Missed minute completed
- **WHEN** an EVERY MINUTE BURPEES minute of 10 was judged at 9 valid reps and 1 no-rep, and that no-rep is accepted
- **THEN** the minute is completed, and both the completed minutes and the total valid reps go up by 1

#### Scenario: Beyond the target
- **WHEN** an EMOM minute of BURPEES 10 was judged at 10 valid reps and 1 no-rep, and that no-rep is accepted
- **THEN** the minute stays completed, and the total valid reps goes up by 1

### Requirement: Packages saved before no-rep review
Adjustment packages saved before this change SHALL be deleted when the app is updated, and their sessions SHALL show their unadjusted result.

#### Scenario: Updating with an adjusted session
- **WHEN** the app is updated on a phone with a session whose package changed a target
- **THEN** that session has no adjustment packages and shows its unadjusted result

## REMOVED Requirements

### Requirement: Editable values
**Reason**: Targets and durations are no longer adjustable. The only correction left is accepting a no-rep the judge gave.
**Migration**: The owner accepts no-reps on the adjust screen (see "Reviewable no-reps"). Old packages are deleted (see "Packages saved before no-rep review").

### Requirement: Later changes override earlier ones
**Reason**: An accepted no-rep is final and every package only adds acceptances, so no change can override another.
**Migration**: None. Acceptances from every package apply together.

### Requirement: Duration cutoff
**Reason**: The duration is no longer adjustable.
**Migration**: None. The workout's own duration always applies.

### Requirement: EMOM target change affects completion only
**Reason**: Targets are no longer adjustable.
**Migration**: See "Accepted no-reps on EMOM".

### Requirement: Adjusted time cap
**Reason**: The time cap is no longer adjustable.
**Migration**: See "Accepted no-reps on a capped For Time".

### Requirement: Adjusted target limit
**Reason**: There is no target field anymore.
**Migration**: None.

### Requirement: Reps are not re-flowed between positions
**Reason**: Its rules and scenarios were about target and duration changes, which no longer exist.
**Migration**: See "Accepted no-reps stay in their position".

### Requirement: Adjusting a stopping EMOM
**Reason**: Its rules and scenarios were about target and duration changes, which no longer exist.
**Migration**: See "Accepted no-reps on a stopping EMOM".

### Requirement: Adjusting several blocks
**Reason**: Its rules and scenarios were about target and duration changes, which no longer exist.
**Migration**: See "Accepted no-reps on several blocks".
