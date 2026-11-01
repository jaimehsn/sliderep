import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExercisePicker } from '@/components/editor/exercise-picker';
import {
  DRAFT_FORMATS,
  Draft,
  DraftProblems,
  LineFields,
  RepUnit,
  addLine,
  addLineToSlot,
  draftLines,
  forTimeReps,
  parseCount,
  parseInterval,
  removeLine,
  setLineIncrement,
  setLineReps,
  setRepDescription,
  setSameReps,
  switchFormat,
  updateLineFields,
} from '@/components/editor/draft';
import { HF } from '@/constants/hf';
import type { Exercise } from '@/db/exercises';

const UNITS: RepUnit[] = ['m', 'cal', 's'];

/**
 * One block of the workout editor (change multi-block-workouts, moved unchanged
 * from `app/library/new.tsx`): format, its parameters, the lines and the
 * exercise picker. `problems` are this block's own, keyed as `validateDraft` keys them.
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
  // Which line the picker fills: an index, or null when closed.
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const lines = draftLines(draft);
  const rounds = draft.format === 'forTime' ? (parseCount(draft.rounds) ?? 1) : 1;
  const perRound = draft.format === 'forTime' && !draft.sameReps;
  // EMOM: the interval's name (minute only at 60 s) and the total time once both fields are valid.
  const every = draft.format === 'emom' ? parseInterval(draft.every) : null;
  const intervals = draft.format === 'emom' ? parseCount(draft.intervals) : null;
  const emomUnit = (every ?? 60) === 60 ? 'MINUTE' : 'INTERVAL';
  // EMOM: each flat line's interval, and whether it opens / closes that interval (change emom-multi-exercise-intervals).
  const emomPos = draft.format === 'emom'
    ? draft.slots.flatMap((slot, s) => slot.map((_, l) => ({ slot: s, first: l === 0, last: l === slot.length - 1 })))
    : [];
  const emomTotal = every != null && intervals != null
    ? `${Math.floor((every * intervals) / 60)}:${String((every * intervals) % 60).padStart(2, '0')}`
    : null;

  const update = (index: number, patch: Partial<LineFields>) => onChange(updateLineFields(draft, index, patch));

  return (
    <>
      {/* Format */}
      <Text style={[styles.label, styles.spaced]}>FORMAT</Text>
      <View style={styles.segments}>
        {DRAFT_FORMATS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => onChange(switchFormat(draft, f.id))}
            style={[styles.segment, draft.format === f.id && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, draft.format === f.id && styles.segmentTextOn]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Format parameters */}
      {draft.format === 'forTime' ? (
        <>
          <View style={[styles.paramRow, styles.spaced]}>
            <Text style={styles.label}>ROUNDS</Text>
            <TextInput
              value={draft.rounds}
              onChangeText={(value) => onChange({ ...draft, rounds: value })}
              keyboardType="number-pad"
              style={styles.numberInput}
            />
            <Text style={[styles.label, styles.paramGap]}>TIME CAP (MIN)</Text>
            <TextInput
              value={draft.cap}
              onChangeText={(cap) => onChange({ ...draft, cap })}
              placeholder="NONE"
              placeholderTextColor={HF.mutedDim}
              keyboardType="number-pad"
              style={styles.numberInput}
            />
            {/* Label and field kept together when the row wraps (change rest-steps). */}
            <View style={[styles.paramPair, styles.paramGap]}>
              <Text style={styles.label}>REST (SEC)</Text>
              <TextInput
                value={draft.rest}
                onChangeText={(rest) => onChange({ ...draft, rest })}
                placeholder="NONE"
                placeholderTextColor={HF.mutedDim}
                keyboardType="number-pad"
                style={styles.numberInput}
              />
            </View>
          </View>
          {problems.rounds && <Text style={styles.problem}>{problems.rounds}</Text>}
          {problems.cap && <Text style={styles.problem}>{problems.cap}</Text>}
          {problems.rest && <Text style={styles.problem}>{problems.rest}</Text>}
          <Pressable
            onPress={() => onChange(setSameReps(draft, !draft.sameReps))}
            style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
          >
            <Text style={styles.check}>{draft.sameReps ? '[x]' : '[ ]'}</Text>
            <Text style={styles.checkLabel}>SAME REPS EVERY ROUND</Text>
          </Pressable>
        </>
      ) : draft.format === 'amrap' ? (
        <>
          <View style={[styles.paramRow, styles.spaced]}>
            <Text style={styles.label}>DURATION (MIN)</Text>
            <TextInput
              value={draft.minutes}
              onChangeText={(value) => onChange({ ...draft, minutes: value })}
              keyboardType="number-pad"
              style={styles.numberInput}
            />
          </View>
          {problems.minutes && <Text style={styles.problem}>{problems.minutes}</Text>}
        </>
      ) : (
        <>
          <View style={[styles.paramRow, styles.spaced]}>
            <Text style={styles.label}>EVERY (SEC)</Text>
            <TextInput
              value={draft.every}
              onChangeText={(every) => onChange({ ...draft, every })}
              keyboardType="number-pad"
              style={styles.numberInput}
            />
            <Text style={[styles.label, styles.paramGap]}>INTERVALS</Text>
            <TextInput
              value={draft.intervals}
              onChangeText={(intervals) => onChange({ ...draft, intervals })}
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
                placeholderTextColor={HF.mutedDim}
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
        </>
      )}

      {/* Lines */}
      <Text style={[styles.label, styles.spaced]}>
        {draft.format === 'emom' ? `${emomUnit} SEQUENCE (REPEATS)` : 'EXERCISES'}
      </Text>
      {lines.map((line, i) => (
        <Fragment key={i}>
          <View style={styles.line}>
            <View style={styles.lineHeader}>
              <Text style={styles.lineIndex}>
                {draft.format !== 'emom'
                  ? `${i + 1}`
                  : emomPos[i].first ? `${emomUnit === 'MINUTE' ? 'MIN' : 'INT'} ${emomPos[i].slot + 1}` : '+'}
              </Text>
              <Pressable
                onPress={() => setPickerFor(i)}
                style={({ pressed }) => [styles.exerciseBtn, pressed && styles.pressed]}
              >
                <Text style={[styles.exerciseName, !line.exercise && styles.exerciseEmpty]}>
                  {line.exercise?.name ?? 'PICK EXERCISE'}
                </Text>
              </Pressable>
              <Pressable onPress={() => onChange(removeLine(draft, i))} hitSlop={10}>
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            </View>

            {/* Reps */}
            {perRound && draft.format === 'forTime' ? (
              <ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={styles.roundsRow}>
                {Array.from({ length: rounds }, (_, r) => (
                  <View key={r} style={styles.roundField}>
                    <Text style={styles.smallLabel}>R{r + 1}</Text>
                    <TextInput
                      value={forTimeReps(draft, draft.rows[i], r)}
                      onChangeText={(value) => onChange(setLineReps(draft, i, value, r))}
                      keyboardType="number-pad"
                      style={styles.numberInput}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.paramRow}>
                <Text style={styles.smallLabel}>REPS</Text>
                <TextInput
                  value={draft.format === 'forTime' ? forTimeReps(draft, draft.rows[i], 0) : draft.format === 'amrap' ? draft.rows[i].reps : draft.slots.flat()[i].reps}
                  onChangeText={(value) => onChange(setLineReps(draft, i, value))}
                  keyboardType="number-pad"
                  style={styles.numberInput}
                />
                {draft.format === 'emom' && (
                  <>
                    <Text style={[styles.smallLabel, styles.paramGap]}>+/ROUND</Text>
                    <TextInput
                      value={draft.slots.flat()[i].increment}
                      onChangeText={(value) => onChange(setLineIncrement(draft, i, value))}
                      placeholder="0"
                      placeholderTextColor={HF.mutedDim}
                      keyboardType="number-pad"
                      style={styles.numberInput}
                    />
                  </>
                )}
              </View>
            )}

            {/* Rep description */}
            {line.repDescription ? (
              <View style={styles.paramRow}>
                <Text style={styles.smallLabel}>EACH REP</Text>
                <TextInput
                  value={line.repDescription.amount}
                  onChangeText={(amount) => onChange(setRepDescription(draft, i, { ...line.repDescription!, amount }))}
                  keyboardType="number-pad"
                  style={styles.numberInput}
                />
                {UNITS.map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => onChange(setRepDescription(draft, i, { ...line.repDescription!, unit }))}
                    style={[styles.unit, line.repDescription?.unit === unit && styles.segmentOn]}
                  >
                    <Text style={[styles.segmentText, line.repDescription?.unit === unit && styles.segmentTextOn]}>{unit}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => onChange(setRepDescription(draft, i, null))} hitSlop={10}>
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => onChange(setRepDescription(draft, i, { amount: '', unit: 'm' }))} hitSlop={6}>
                <Text style={styles.addSmall}>+ REP DESCRIPTION (M / CAL / S)</Text>
              </Pressable>
            )}

            {/* Load */}
            <TextInput
              value={line.load}
              onChangeText={(load) => update(i, { load })}
              placeholder="LOAD (OPTIONAL), E.G. 95/65 LB"
              placeholderTextColor={HF.mutedDim}
              autoCorrect={false}
              style={styles.loadInput}
            />

            {problems[`line:${i}`] && <Text style={styles.problem}>{problems[`line:${i}`]}</Text>}
          </View>
          {draft.format === 'emom' && emomPos[i].last && (
            <Pressable
              onPress={() => {
                onChange(addLineToSlot(draft, emomPos[i].slot));
                setPickerFor(i + 1);
              }}
              hitSlop={6}
            >
              <Text style={styles.addSmall}>
                + EXERCISE IN {emomUnit === 'MINUTE' ? 'MIN' : 'INT'} {emomPos[i].slot + 1}
              </Text>
            </Pressable>
          )}
        </Fragment>
      ))}

      <Pressable
        onPress={() => {
          onChange(addLine(draft));
          setPickerFor(lines.length);
        }}
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
      >
        <Text style={styles.addBtnText}>{draft.format === 'emom' ? `+ ADD ${emomUnit}` : '+ ADD EXERCISE'}</Text>
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 2,
  },
  smallLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.muted,
    letterSpacing: 1.5,
    marginRight: 8,
  },
  spaced: {
    marginTop: 24,
  },
  problem: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.accent,
    letterSpacing: 1,
    marginTop: 6,
  },
  segments: {
    flexDirection: 'row',
    marginTop: 8,
  },
  segment: {
    borderWidth: 1,
    borderColor: HF.hairlineStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  segmentOn: {
    borderColor: HF.ink,
    backgroundColor: HF.ink,
  },
  segmentText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.inkDim,
    letterSpacing: 1.5,
  },
  segmentTextOn: {
    color: HF.bg,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 16,
    color: HF.ink,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairlineStrong,
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
  check: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.ink,
    marginRight: 8,
  },
  checkLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.inkDim,
    letterSpacing: 1.5,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: HF.hairline,
    paddingVertical: 12,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineIndex: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.accent,
    letterSpacing: 1.5,
    minWidth: 44,
  },
  exerciseBtn: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 20,
    color: HF.ink,
    letterSpacing: 1.5,
  },
  exerciseEmpty: {
    color: HF.muted,
  },
  remove: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 14,
    color: HF.muted,
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
    borderColor: HF.hairlineStrong,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  addSmall: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.muted,
    letterSpacing: 1.5,
    marginTop: 10,
  },
  loadInput: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.inkDim,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairline,
    paddingVertical: 4,
    marginTop: 8,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: HF.hairlineStrong,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  addBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.inkDim,
    letterSpacing: 1.5,
  },
});
