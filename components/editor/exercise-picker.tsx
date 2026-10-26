import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { EXERCISE_CATEGORIES, Exercise } from '@/db/exercises';

type Props = {
  visible: boolean;
  /** The catalog (non-archived, from `useExercises()`). */
  exercises: Exercise[];
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
};

/**
 * Full-screen catalog picker for an editor line (change wod-editor, design
 * decision 7): a case-insensitive substring search over the names, results
 * grouped by category in the Library's order. Hardware back closes it.
 */
export function ExercisePicker({ visible, exercises, onPick, onClose }: Props) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toUpperCase();
  const matches = needle === '' ? exercises : exercises.filter((e) => e.name.toUpperCase().includes(needle));

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <Screen style={styles.root} minBottomPadding={24}>
        <View style={styles.header}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="SEARCH EXERCISE"
            placeholderTextColor={HF.mutedDim}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.search}
          />
          <Pressable
            onPress={close}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            hitSlop={12}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {matches.length === 0 && <Text style={styles.empty}>No exercise matches “{query.trim()}”</Text>}
          {EXERCISE_CATEGORIES.map((category) => {
            const group = matches.filter((e) => e.category === category);
            if (group.length === 0) return null;
            return (
              <View key={category}>
                <Text style={styles.categoryLabel}>{category}</Text>
                {group.map((exercise, i) => (
                  <View key={exercise.id}>
                    <Pressable
                      onPress={() => {
                        setQuery('');
                        onPick(exercise);
                      }}
                      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                    >
                      <Text style={styles.rowName}>{exercise.name}</Text>
                    </Pressable>
                    {i < group.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </Screen>
    </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  search: {
    flex: 1,
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 14,
    color: HF.ink,
    letterSpacing: 1,
    paddingVertical: 8,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  empty: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1,
    marginTop: 20,
  },
  categoryLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 2,
  },
  row: {
    paddingVertical: 14,
  },
  rowName: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 18,
    color: HF.ink,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: HF.hairline,
  },
});
