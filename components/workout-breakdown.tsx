import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HF } from '@/constants/hf';
import { WodConfig, WodExercise, durationLine, isSequence } from '@/constants/wod-engine';

/**
 * A workout's exercises, as the Library detail and the pre-start summary list
 * them. A workout of several blocks (change multi-block-workouts) lists each
 * block under a "BLOCK n · mode" header (SCORES on the scoring one) with its
 * duration line, and the rest between blocks.
 */
export function WorkoutBreakdown({ config }: { config: WodConfig }) {
  if (!isSequence(config)) return <ExerciseRows exercises={config.exercises} />;
  return (
    <>
      {config.parts.map((part, i) => {
        const duration = durationLine(part);
        const rest = config.restAfter[i];
        return (
          <Fragment key={i}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockTitle}>
                BLOCK {i + 1} · {part.mode}
              </Text>
              {i === config.scoringBlock && <Text style={styles.scores}>SCORES</Text>}
            </View>
            {duration != null && <Text style={styles.blockDuration}>{duration}</Text>}
            <ExerciseRows exercises={part.exercises} />
            {rest > 0 && <Text style={styles.rest}>REST {rest} s</Text>}
          </Fragment>
        );
      })}
    </>
  );
}

function ExerciseRows({ exercises }: { exercises: WodExercise[] }) {
  return exercises.map((ex, i) => (
    <View key={i} style={styles.exerciseRow}>
      <View style={styles.exerciseText}>
        <Text style={styles.exerciseName}>{ex.name}</Text>
        {ex.note != null && <Text style={styles.exerciseNote}>{ex.note}</Text>}
      </View>
      <Text style={styles.exerciseDetail}>{ex.detail}</Text>
    </View>
  ));
}

const styles = StyleSheet.create({
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 10,
    paddingTop: 18,
  },
  blockTitle: {
    flexShrink: 1,
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 11,
    color: HF.ink,
    letterSpacing: 1.5,
  },
  scores: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 9,
    color: HF.accent,
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: HF.accent,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  blockDuration: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  rest: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingTop: 14,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairline,
  },
  exerciseText: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 20,
    color: HF.ink,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  exerciseNote: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1,
    marginTop: 2,
  },
  exerciseDetail: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.muted,
    letterSpacing: 1,
  },
});
