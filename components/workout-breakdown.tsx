import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { colors, fonts } from '@/constants/theme';
import { WodConfig, WodExercise, durationLine, isSequence } from '@/constants/wod-engine';

/**
 * A workout's exercises, as the Library detail and the pre-start summary list
 * them. A workout of several blocks (change multi-block-workouts) lists each
 * block under a "BLOCK n · mode" header (SCORES on the scoring one) with its
 * duration line, and the rest between blocks. A block of several parts (change
 * shared-clock) lists each part under its "PART n · kind" title.
 */
export function WorkoutBreakdown({ config }: { config: WodConfig }) {
  if (!isSequence(config)) return <BlockRows config={config} />;
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
            <BlockRows config={part} />
            {rest > 0 && <Text style={styles.rest}>REST {rest} s</Text>}
          </Fragment>
        );
      })}
    </>
  );
}

// One block's rows: per part when it has several (change shared-clock).
function BlockRows({ config }: { config: WodConfig }) {
  if (!config.sections) return <ExerciseRows exercises={config.exercises} />;
  return config.sections.map((section, i) => (
    <Fragment key={i}>
      <Text style={styles.partTitle}>{section.title}</Text>
      <ExerciseRows exercises={section.exercises} />
    </Fragment>
  ));
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
  partTitle: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.5,
    paddingTop: 14,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 10,
    paddingTop: 18,
  },
  blockTitle: {
    flexShrink: 1,
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 1.5,
  },
  scores: {
    fontFamily: fonts.ui,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  blockDuration: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  rest: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
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
    borderBottomColor: colors.hairline,
  },
  exerciseText: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  exerciseNote: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1,
    marginTop: 2,
  },
  exerciseDetail: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1,
  },
});
