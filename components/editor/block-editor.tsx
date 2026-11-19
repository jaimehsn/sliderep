import { Fragment, ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/text';

import { ExercisePicker } from '@/components/editor/exercise-picker';
import {
  MAX_REPS,
  TEMPLATES,
  ContinuousDraft,
  Draft,
  DraftProblems,
  EmomDraft,
  LineFields,
  LineSet,
  PartDraft,
  RepUnit,
  RoundsPart,
  addLine,
  addLineToSlot,
  addPart,
  applyTemplate,
  endsInAmrap,
  forTimeReps,
  parseCount,
  parseInterval,
  partProblems,
  removeLine,
  removePart,
  setLineIncrement,
  setLineMax,
  setLineReps,
  setLines,
  setPartKind,
  setRepDescription,
  setSameReps,
  templateOf,
  updateLineFields,
  updatePart,
} from '@/components/editor/draft';
import { colors, fonts } from '@/constants/theme';
import type { Exercise } from '@/db/exercises';

/** A reps field takes as many digits as the limit has (change responsive-review). */
const REPS_DIGITS = String(MAX_REPS).length;

const UNITS: RepUnit[] = ['m', 'cal', 's'];

/**
 * One block of the workout editor (change multi-block-workouts): its template, its
 * parameters, and its lines with the exercise picker. A FOR TIME or AMRAP block is a
 * time setting plus parts (change shared-clock); with one part it looks as it always
 * did. `problems` are this block's own, keyed as `validateDraft` keys them.
 */
export function BlockEditor({
  draft,
  onChange,
  problems,
  exercises,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  problems: DraftProblems;
  exercises: Exercise[];
}) {
  const template = templateOf(draft);
  return (
    <>
      {/* Template: fills the block's time setting and parts (change shared-clock). */}
      <Text style={[styles.label, styles.spaced]}>TEMPLATE</Text>
      <View style={styles.segments}>
        {TEMPLATES.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onChange(applyTemplate(draft, t.id))}
            style={[styles.segment, template === t.id && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, template === t.id && styles.segmentTextOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {draft.format === 'emom' ? (
        <EmomEditor draft={draft} onChange={onChange} problems={problems} exercises={exercises} />
      ) : (
        <PartsEditor draft={draft} onChange={onChange} problems={problems} exercises={exercises} />
      )}
    </>
  );
}

// ─── FOR TIME / AMRAP: a time setting plus parts (change shared-clock) ─────

function PartsEditor({
  draft,
  onChange,
  problems,
  exercises,
}: {
  draft: ContinuousDraft;
  onChange: (draft: Draft) => void;
  problems: DraftProblems;
  exercises: Exercise[];
}) {
  const amrap = endsInAmrap(draft);
  const timeField = (
    <View style={styles.paramPair}>
      <Text style={styles.label}>{amrap ? 'DURATION (MIN)' : 'TIME CAP (MIN)'}</Text>
      <TextInput
        value={draft.minutes}
        onChangeText={(minutes) => onChange({ ...draft, minutes })}
        placeholder={amrap ? undefined : 'NONE'}
        placeholderTextColor={colors.mutedDim}
        keyboardType="number-pad"
        style={styles.numberInput}
      />
    </View>
  );
  const setPart = (index: number, part: PartDraft) => onChange(updatePart(draft, index, part));

  if (draft.parts.length === 1) {
    // One part: the FOR TIME or AMRAP editor as it always was, the time field in its row.
    const [part] = draft.parts;
    const own = partProblems(problems, 0);
    return (
      <>
        {part.kind === 'rounds' ? (
          <RoundsParams part={part} onChange={(p) => setPart(0, p)} problems={own} timeField={timeField} timeProblem={problems.minutes} />
        ) : (
          <>
            <View style={[styles.paramRow, styles.spaced]}>{timeField}</View>
            {problems.minutes && <Text style={styles.problem}>{problems.minutes}</Text>}
          </>
        )}
        <Text style={[styles.label, styles.spaced]}>EXERCISES</Text>
        <LinesEditor set={part} onChange={(p) => setPart(0, p)} problems={own} exercises={exercises} />
        <Pressable onPress={() => onChange(addPart(draft))} hitSlop={6}>
          <Text style={[styles.addSmall, styles.addPart]}>+ PART</Text>
        </Pressable>
      </>
    );
  }

  return (
    <>
      <View style={[styles.paramRow, styles.spaced]}>{timeField}</View>
      {problems.minutes && <Text style={styles.problem}>{problems.minutes}</Text>}
      {draft.parts.map((part, p) => {
        const own = partProblems(problems, p);
        return (
          <View key={p} style={styles.part}>
            <View style={styles.partHeader}>
              <Text style={styles.partTitle}>PART {p + 1}</Text>
              {(['rounds', 'amrap'] as const).map((kind) => (
                <Pressable
                  key={kind}
                  onPress={() => onChange(setPartKind(draft, p, kind))}
                  style={[styles.unit, part.kind === kind && styles.segmentOn]}
                >
                  <Text style={[styles.segmentText, part.kind === kind && styles.segmentTextOn]}>{kind === 'rounds' ? 'ROUNDS' : 'AMRAP'}</Text>
                </Pressable>
              ))}
              <View style={styles.flex} />
              <Pressable onPress={() => onChange(removePart(draft, p))} hitSlop={10}>
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            </View>
            {own.kind && <Text style={styles.problem}>{own.kind}</Text>}
            {part.kind === 'rounds' && <RoundsParams part={part} onChange={(next) => setPart(p, next)} problems={own} />}
            <LinesEditor set={part} onChange={(next) => setPart(p, next)} problems={own} exercises={exercises} />
          </View>
        );
      })}
      <Pressable
        onPress={() => onChange(addPart(draft))}
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
      >
        <Text style={styles.addBtnText}>+ PART</Text>
      </Pressable>
    </>
  );
}

/** A ROUNDS part's ROUNDS and REST (SEC), with the block's time field between them when there is one part. */
function RoundsParams({
  part,
  onChange,
  problems,
  timeField,
  timeProblem,
}: {
  part: RoundsPart;
  onChange: (part: RoundsPart) => void;
  problems: DraftProblems;
  timeField?: ReactNode;
  timeProblem?: string;
}) {
  return (
    <>
      <View style={[styles.paramRow, styles.spaced]}>
        <Text style={styles.label}>ROUNDS</Text>
        <TextInput
          value={part.rounds}
          onChangeText={(rounds) => onChange({ ...part, rounds })}
          keyboardType="number-pad"
          style={styles.numberInput}
        />
        {timeField != null && <View style={styles.paramGap}>{timeField}</View>}
        {/* Label and field kept together when the row wraps (change rest-steps). */}
        <View style={[styles.paramPair, styles.paramGap]}>
          <Text style={styles.label}>REST (SEC)</Text>
          <TextInput
            value={part.rest}
            onChangeText={(rest) => onChange({ ...part, rest })}
            placeholder="NONE"
            placeholderTextColor={colors.mutedDim}
            keyboardType="number-pad"
            style={styles.numberInput}
          />
        </View>
      </View>
      {problems.rounds && <Text style={styles.problem}>{problems.rounds}</Text>}
      {timeProblem && <Text style={styles.problem}>{timeProblem}</Text>}
      {problems.rest && <Text style={styles.problem}>{problems.rest}</Text>}
      <Pressable
        onPress={() => onChange(setSameReps(part, !part.sameReps))}
        style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
      >
        <Text style={styles.check}>{part.sameReps ? '[x]' : '[ ]'}</Text>
        <Text style={styles.checkLabel}>SAME REPS EVERY ROUND</Text>
      </Pressable>
    </>
  );
}

// ─── EMOM ───────────────────────────────────────────────────────────────────

function EmomEditor({
  draft,
  onChange,
  problems,
  exercises,
}: {
  draft: EmomDraft;
  onChange: (draft: Draft) => void;
  problems: DraftProblems;
  exercises: Exercise[];
}) {
  // The interval's name (minute only at 60 s) and the total time once both fields are valid.
  const every = parseInterval(draft.every);
  const intervals = parseCount(draft.intervals);
  const emomUnit = (every ?? 60) === 60 ? 'MINUTE' : 'INTERVAL';
  const emomTotal = every != null && intervals != null
    ? `${Math.floor((every * intervals) / 60)}:${String((every * intervals) % 60).padStart(2, '0')}`
    : null;
  return (
    <>
      <View style={[styles.paramRow, styles.spaced]}>
        <Text style={styles.label}>EVERY (SEC)</Text>
        <TextInput
          value={draft.every}
          onChangeText={(value) => onChange({ ...draft, every: value })}
          keyboardType="number-pad"
          style={styles.numberInput}
        />
        <Text style={[styles.label, styles.paramGap]}>INTERVALS</Text>
        <TextInput
          value={draft.intervals}
          onChangeText={(value) => onChange({ ...draft, intervals: value })}
          keyboardType="number-pad"
          style={styles.numberInput}
        />
        {/* Label and field kept together when the row wraps (change rest-steps). */}
        <View style={[styles.paramPair, styles.paramGap]}>
          <Text style={styles.label}>WORK (SEC)</Text>
          <TextInput
            value={draft.work}
            onChangeText={(work) => onChange({ ...draft, work })}
            placeholder="ALL"
            placeholderTextColor={colors.mutedDim}
            keyboardType="number-pad"
            style={styles.numberInput}
          />
        </View>
      </View>
      {/* On its own line: beside EVERY / INTERVALS it ran off narrow screens. */}
      {emomTotal != null && <Text style={[styles.label, styles.totalLine]}>TOTAL {emomTotal}</Text>}
      {problems.every && <Text style={styles.problem}>{problems.every}</Text>}
      {problems.intervals && <Text style={styles.problem}>{problems.intervals}</Text>}
      {problems.work && <Text style={styles.problem}>{problems.work}</Text>}
      <Pressable
        onPress={() => onChange({ ...draft, stopOnMiss: !draft.stopOnMiss })}
        style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
      >
        <Text style={styles.check}>{draft.stopOnMiss ? '[x]' : '[ ]'}</Text>
        <Text style={styles.checkLabel}>STOP AT FIRST MISSED INTERVAL</Text>
      </Pressable>
      <Text style={[styles.label, styles.spaced]}>{`${emomUnit} SEQUENCE (REPEATS)`}</Text>
      <LinesEditor set={draft} onChange={onChange} problems={problems} exercises={exercises} emomUnit={emomUnit} />
    </>
  );
}

// ─── Lines of a part or of an EMOM's sequence ───────────────────────────────

function LinesEditor<T extends LineSet>({
  set,
  onChange,
  problems,
  exercises,
  emomUnit,
}: {
  set: T;
  onChange: (set: T) => void;
  problems: DraftProblems;
  exercises: Exercise[];
  emomUnit?: 'MINUTE' | 'INTERVAL';
}) {
  // Which line the picker fills: an index, or null when closed.
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const lines = setLines(set);
  const emom = 'slots' in set ? (set as EmomDraft) : null;
  const part = emom ? null : (set as PartDraft);
  const rounds = part?.kind === 'rounds' ? (parseCount(part.rounds) ?? 1) : 1;
  const perRound = part?.kind === 'rounds' && !part.sameReps;
  const short = emomUnit === 'MINUTE' ? 'MIN' : 'INT';
  // EMOM: each flat line's interval, and whether it opens / closes that interval (change emom-multi-exercise-intervals).
  const emomPos = emom
    ? emom.slots.flatMap((slot, s) => slot.map((_, l) => ({ slot: s, first: l === 0, last: l === slot.length - 1 })))
    : [];

  const update = (index: number, patch: Partial<LineFields>) => onChange(updateLineFields(set, index, patch));
  const repsOf = (i: number): string =>
    part?.kind === 'rounds' ? forTimeReps(part, part.rows[i], 0) : part ? part.rows[i].reps : emom!.slots.flat()[i].reps;

  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          <View style={styles.line}>
            <View style={styles.lineHeader}>
              <Text style={styles.lineIndex}>
                {!emom ? `${i + 1}` : emomPos[i].first ? `${short} ${emomPos[i].slot + 1}` : '+'}
              </Text>
              <Pressable
                onPress={() => setPickerFor(i)}
                style={({ pressed }) => [styles.exerciseBtn, pressed && styles.pressed]}
              >
                <Text style={[styles.exerciseName, !line.exercise && styles.exerciseEmpty]}>
                  {line.exercise?.name ?? 'PICK EXERCISE'}
                </Text>
              </Pressable>
              <Pressable onPress={() => onChange(removeLine(set, i))} hitSlop={10}>
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            </View>

            {/* Reps */}
            {perRound && part?.kind === 'rounds' ? (
              <ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={styles.roundsRow}>
                {Array.from({ length: rounds }, (_, r) => (
                  <View key={r} style={styles.roundField}>
                    <Text style={styles.smallLabel}>R{r + 1}</Text>
                    <TextInput
                      value={forTimeReps(part, part.rows[i], r)}
                      onChangeText={(value) => onChange(setLineReps(set, i, value, r))}
                      keyboardType="number-pad"
                      maxLength={REPS_DIGITS}
                      style={styles.numberInput}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.paramRow}>
                {/* A MAX line has no reps or increment (change max-lines). */}
                {!emom?.slots.flat()[i].max && (
                  <>
                    <Text style={styles.smallLabel}>REPS</Text>
                    <TextInput
                      value={repsOf(i)}
                      onChangeText={(value) => onChange(setLineReps(set, i, value))}
                      keyboardType="number-pad"
                      maxLength={REPS_DIGITS}
                      style={styles.numberInput}
                    />
                  </>
                )}
                {emom && !emom.slots.flat()[i].max && (
                  <>
                    <Text style={[styles.smallLabel, styles.paramGap]}>+/ROUND</Text>
                    <TextInput
                      value={emom.slots.flat()[i].increment}
                      onChangeText={(value) => onChange(setLineIncrement(emom, i, value) as T)}
                      placeholder="0"
                      placeholderTextColor={colors.mutedDim}
                      keyboardType="number-pad"
                      style={styles.numberInput}
                    />
                  </>
                )}
                {/* Only an interval's last line may be MAX (change max-lines). */}
                {emom && emomPos[i].last && (
                  <Pressable
                    onPress={() => onChange(setLineMax(emom, i, !emom.slots.flat()[i].max) as T)}
                    hitSlop={6}
                    style={({ pressed }) => [styles.maxToggle, !emom.slots.flat()[i].max && styles.paramGap, pressed && styles.pressed]}
                  >
                    <Text style={styles.check}>{emom.slots.flat()[i].max ? '[x]' : '[ ]'}</Text>
                    <Text style={styles.checkLabel}>MAX</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Rep description */}
            {line.repDescription ? (
              <View style={styles.paramRow}>
                <Text style={styles.smallLabel}>EACH REP</Text>
                <TextInput
                  value={line.repDescription.amount}
                  onChangeText={(amount) => onChange(setRepDescription(set, i, { ...line.repDescription!, amount }))}
                  keyboardType="number-pad"
                  style={styles.numberInput}
                />
                {UNITS.map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => onChange(setRepDescription(set, i, { ...line.repDescription!, unit }))}
                    style={[styles.unit, line.repDescription?.unit === unit && styles.segmentOn]}
                  >
                    <Text style={[styles.segmentText, line.repDescription?.unit === unit && styles.segmentTextOn]}>{unit}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => onChange(setRepDescription(set, i, null))} hitSlop={10}>
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => onChange(setRepDescription(set, i, { amount: '', unit: 'm' }))} hitSlop={6}>
                <Text style={styles.addSmall}>+ REP DESCRIPTION (M / CAL / S)</Text>
              </Pressable>
            )}

            {/* Load */}
            <TextInput
              value={line.load}
              onChangeText={(load) => update(i, { load })}
              placeholder="LOAD (OPTIONAL), E.G. 95/65 LB"
              placeholderTextColor={colors.mutedDim}
              autoCorrect={false}
              style={styles.loadInput}
            />

            {problems[`line:${i}`] && <Text style={styles.problem}>{problems[`line:${i}`]}</Text>}
          </View>
          {emom && emomPos[i].last && (
            <Pressable
              onPress={() => {
                onChange(addLineToSlot(emom, emomPos[i].slot) as T);
                setPickerFor(i + 1);
              }}
              hitSlop={6}
            >
              <Text style={styles.addSmall}>
                + EXERCISE IN {short} {emomPos[i].slot + 1}
              </Text>
            </Pressable>
          )}
        </Fragment>
      ))}

      <Pressable
        onPress={() => {
          onChange(addLine(set));
          setPickerFor(lines.length);
        }}
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
      >
        <Text style={styles.addBtnText}>{emom ? `+ ADD ${emomUnit}` : '+ ADD EXERCISE'}</Text>
      </Pressable>
      {problems.lines && <Text style={styles.problem}>{problems.lines}</Text>}

      <ExercisePicker
        visible={pickerFor != null}
        exercises={exercises}
        onClose={() => setPickerFor(null)}
        onPick={(exercise) => {
          if (pickerFor != null) update(pickerFor, { exercise: { id: exercise.id, name: exercise.name } });
          setPickerFor(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 2,
  },
  smallLabel: {
    fontFamily: fonts.ui,
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1.5,
    marginRight: 8,
  },
  spaced: {
    marginTop: 24,
  },
  problem: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1,
    marginTop: 6,
  },
  segments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    marginTop: 8,
  },
  segment: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  segmentOn: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  segmentText: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.inkDim,
    letterSpacing: 1.5,
  },
  segmentTextOn: {
    color: colors.bg,
  },
  paramRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 8,
    marginTop: 8,
  },
  paramPair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLine: {
    marginTop: 8,
  },
  paramGap: {
    marginLeft: 16,
  },
  numberInput: {
    minWidth: 56,
    fontFamily: fonts.ui,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineStrong,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginLeft: 8,
    marginRight: 8,
    textAlign: 'center',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  maxToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  check: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.ink,
    marginRight: 8,
  },
  checkLabel: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.inkDim,
    letterSpacing: 1.5,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 12,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineIndex: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.5,
    minWidth: 44,
  },
  exerciseBtn: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: 1.5,
  },
  exerciseEmpty: {
    color: colors.muted,
  },
  remove: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.muted,
    marginLeft: 12,
  },
  roundsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  roundField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  unit: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  addSmall: {
    fontFamily: fonts.ui,
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1.5,
    marginTop: 10,
  },
  loadInput: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.inkDim,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingVertical: 4,
    marginTop: 8,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  part: {
    borderTopWidth: 1,
    borderTopColor: colors.hairlineStrong,
    marginTop: 24,
    paddingTop: 12,
  },
  partHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partTitle: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 1.5,
    marginRight: 12,
  },
  flex: {
    flex: 1,
  },
  addPart: {
    marginTop: 16,
  },
  addBtnText: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.inkDim,
    letterSpacing: 1.5,
  },
});
