import { Fragment, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import { useSQLiteContext } from 'expo-sqlite';

import { BlockEditor } from '@/components/editor/block-editor';
import {
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
import { HF } from '@/constants/hf';
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
  const [fontsLoaded] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, IBMPlexMono_400Regular });

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
      setWorkout(workoutDraftFromConfig(config, `${config.name} COPY`));
    });
  }, [db, from]);

  if (!fontsLoaded || !profileLoaded || !profile || !workout) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
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
          placeholderTextColor={HF.mutedDim}
          autoCapitalize="characters"
          autoCorrect={false}
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
                    placeholderTextColor={HF.mutedDim}
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
    backgroundColor: HF.bg,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 2,
  },
  closeBtn: {
    marginLeft: 16,
  },
  closeBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 18,
    color: HF.muted,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: HF.hairline,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 2,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: HF.hairlineStrong,
    paddingTop: 16,
  },
  blockTitle: {
    flex: 1,
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 18,
    color: HF.ink,
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
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 28,
    color: HF.ink,
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairlineStrong,
    paddingVertical: 6,
  },
  problem: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.accent,
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
  remove: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 14,
    color: HF.muted,
    marginLeft: 12,
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
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  saveBtn: {
    backgroundColor: HF.ink,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 20,
    color: HF.bg,
    letterSpacing: 3,
  },
});
