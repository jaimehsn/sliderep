import { Fragment, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { BlockEditor } from '@/components/editor/block-editor';
import {
  MAX_NAME_LENGTH,
  copyName,
  DraftProblems,
  WorkoutDraft,
  addBlock,
  blockProblems,
  emptyWorkoutDraft,
  removeBlock,
  savedWorkoutName,
  updateBlock,
  validateWorkoutDraft,
  workoutDraftFromConfig,
  workoutToStoredBlocks,
} from '@/components/editor/draft';
import { Screen } from '@/components/screen';
import { colors, fonts } from '@/constants/theme';
import { createWorkout, getWorkout } from '@/db/workouts';
import { useExercises } from '@/hooks/use-exercises';
import { useProfile } from '@/hooks/use-profile';

/**
 * The workout editor (change wod-editor). Creates a new workout, empty or —
 * with `?from=<id>` — prefilled from an existing one (DUPLICATE). Saving always
 * inserts a new row and replaces this screen with the new workout's detail;
 * nothing here ever changes an existing workout.
 */
export default function NewWorkoutScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const db = useSQLiteContext();
  const { profile, loaded: profileLoaded } = useProfile();
  const { exercises } = useExercises();
  const [workout, setWorkout] = useState<WorkoutDraft | null>(from ? null : emptyWorkoutDraft());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Creating needs a profile; the Library gates this already, this covers deep links.
  useEffect(() => {
    if (profileLoaded && !profile) router.replace('/profile');
  }, [profileLoaded, profile]);

  useEffect(() => {
    if (!from) return;
    getWorkout(db, from).then((source) => {
      if (!source) {
        router.replace('/library');
        return;
      }
      const { config } = source;
      setWorkout(workoutDraftFromConfig(config, copyName(config.name)));
    });
  }, [db, from]);

  if (!profileLoaded || !profile || !workout) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const problems: DraftProblems = submitted ? validateWorkoutDraft(workout) : {};
  const multi = workout.blocks.length > 1;

  const save = async () => {
    setSubmitted(true);
    if (saving || Object.keys(validateWorkoutDraft(workout)).length > 0) return;
    setSaving(true);
    try {
      const id = await createWorkout(db, {
        name: savedWorkoutName(workout),
        blocks: workoutToStoredBlocks(workout),
        scoringBlock: workout.scoringBlock,
        ownerId: profile.id,
        derivedFrom: from ?? null,
      });
      router.replace({ pathname: '/library/[id]', params: { id } });
    } catch {
      setSaving(false);
      Alert.alert("Couldn't save this workout", 'Nothing was saved. Try again.');
    }
  };

  return (
    <Screen style={styles.root} minBottomPadding={16}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{from ? 'DUPLICATE WORKOUT' : 'NEW WORKOUT'}</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">

        {/* Name */}
        <Text style={styles.label}>NAME</Text>
        <TextInput
          value={workout.name}
          onChangeText={(name) => setWorkout({ ...workout, name })}
          placeholder="WORKOUT NAME"
          placeholderTextColor={colors.mutedDim}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={MAX_NAME_LENGTH}
          style={styles.nameInput}
        />
        {problems.name && <Text style={styles.problem}>{problems.name}</Text>}

        {/* Blocks (change multi-block-workouts): one looks as before; several get a header, SCORES and ✕. */}
        {workout.blocks.map((block, i) => (
          <Fragment key={i}>
            {multi && (
              <View style={[styles.blockHeader, styles.spaced]}>
                <Text style={styles.blockTitle}>BLOCK {i + 1}</Text>
                <Pressable
                  onPress={() => setWorkout({ ...workout, scoringBlock: i })}
                  style={({ pressed }) => [styles.scoresToggle, pressed && styles.pressed]}
                  hitSlop={6}
                >
                  <Text style={styles.check}>{workout.scoringBlock === i ? '[x]' : '[ ]'}</Text>
                  <Text style={styles.checkLabel}>SCORES</Text>
                </Pressable>
                <Pressable onPress={() => setWorkout(removeBlock(workout, i))} hitSlop={10}>
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </View>
            )}
            <BlockEditor
              draft={block.draft}
              onChange={(draft) => setWorkout(updateBlock(workout, i, { draft }))}
              problems={blockProblems(problems, i)}
              exercises={exercises}
            />
            {i < workout.blocks.length - 1 && (
              <>
                <View style={[styles.paramRow, styles.spaced]}>
                  <Text style={styles.label}>REST AFTER (SEC)</Text>
                  <TextInput
                    value={block.restAfter}
                    onChangeText={(restAfter) => setWorkout(updateBlock(workout, i, { restAfter }))}
                    placeholder="NONE"
                    placeholderTextColor={colors.mutedDim}
                    keyboardType="number-pad"
                    style={styles.numberInput}
                  />
                </View>
                {problems[`block:${i}:restAfter`] && <Text style={styles.problem}>{problems[`block:${i}:restAfter`]}</Text>}
              </>
            )}
          </Fragment>
        ))}

        <Pressable
          onPress={() => setWorkout(addBlock(workout))}
          style={({ pressed }) => [styles.addBtn, styles.spaced, pressed && styles.pressed]}
        >
          <Text style={styles.addBtnText}>+ BLOCK</Text>
        </Pressable>
      </ScrollView>

      {/* Save */}
      <View style={styles.footer}>
        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [styles.saveBtn, (pressed || saving) && styles.pressed]}
        >
          <Text style={styles.saveBtnText}>{saving ? 'SAVING…' : 'SAVE'}</Text>
        </Pressable>
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
  },
  closeBtn: {
    marginLeft: 16,
  },
  closeBtnText: {
    fontFamily: fonts.ui,
    fontSize: 18,
    color: colors.muted,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: 24,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 2,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.hairlineStrong,
    paddingTop: 16,
  },
  blockTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 2,
  },
  scoresToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  spaced: {
    marginTop: 24,
  },
  nameInput: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineStrong,
    paddingVertical: 6,
  },
  problem: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1,
    marginTop: 6,
  },
  paramRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 8,
    marginTop: 8,
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
  remove: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.muted,
    marginLeft: 12,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  addBtnText: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.inkDim,
    letterSpacing: 1.5,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  saveBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.bg,
    letterSpacing: 3,
  },
});
