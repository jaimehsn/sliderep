import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { colors, fonts } from '@/constants/theme';
import { Screen } from '@/components/screen';
import { useProfile } from '@/hooks/use-profile';
import { MAX_ALIAS_LENGTH, createProfile, deleteProfile, isValidAlias, updateAlias } from '@/db/profile';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const { profile, loaded, refresh } = useProfile();
  const [aliasInput, setAliasInput] = useState('');
  const [editedAlias, setEditedAlias] = useState<string | null>(null);

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const handleCreate = async () => {
    const trimmed = aliasInput.trim();
    if (!isValidAlias(trimmed)) return;
    await createProfile(db, trimmed);
    setAliasInput('');
    await refresh();
  };

  const handleSave = async () => {
    if (!profile) return;
    const trimmed = (editedAlias ?? '').trim();
    if (!isValidAlias(trimmed) || trimmed === profile.alias) return;
    await updateAlias(db, profile.id, trimmed);
    setEditedAlias(null);
    await refresh();
  };

  const handleDelete = () => {
    if (!profile) return;
    Alert.alert(
      'Delete profile?',
      'Your own sessions and workouts will be deleted. Sessions you judged for others stay on this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProfile(db, profile.id);
            await refresh();
          },
        },
      ],
    );
  };

  const aliasValue = editedAlias ?? profile?.alias ?? '';
  const canSave = profile != null && editedAlias != null && isValidAlias(editedAlias) && editedAlias.trim() !== profile.alias;
  const canCreate = isValidAlias(aliasInput);
  // Android's maxLength also cuts text set from code, so an alias saved before the limit gets no maxLength
  // and shows in full; it only changes if the owner edits and saves it (change responsive-review).
  const editMaxLength = profile != null && profile.alias.length <= MAX_ALIAS_LENGTH ? MAX_ALIAS_LENGTH : undefined;

  return (
    <Screen style={styles.root} minBottomPadding={24}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => pressed && styles.backBtnPressed}
          hitSlop={12}
        >
          <Text style={styles.backBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
        {profile == null ? (
          <>
            <Text style={styles.title}>CREATE PROFILE</Text>
            <TextInput
              style={styles.input}
              value={aliasInput}
              onChangeText={setAliasInput}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              maxLength={MAX_ALIAS_LENGTH}
            />
            <Pressable
              onPress={handleCreate}
              disabled={!canCreate}
              style={({ pressed }) => [
                styles.primaryBtn,
                !canCreate && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>CREATE</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>PROFILE</Text>
            <TextInput
              style={styles.input}
              value={aliasValue}
              onChangeText={setEditedAlias}
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              maxLength={editMaxLength}
            />
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={({ pressed }) => [
                styles.primaryBtn,
                !canSave && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>SAVE</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/my-qr')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.secondaryBtnText}>VIEW MY QR</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.deleteBtnText}>DELETE PROFILE</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backBtnPressed: {
    opacity: 0.4,
  },
  backBtnText: {
    fontFamily: fonts.ui,
    fontSize: 20,
    color: colors.muted,
  },
  // Scrolls only when its content doesn't fit, e.g. with the keyboard open (change responsive-review);
  // otherwise centered as before.
  scroll: {
    flex: 1,
  },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    fontFamily: fonts.ui,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineStrong,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 220,
    textAlign: 'center',
  },
  primaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
    marginTop: 8,
  },
  primaryBtnText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.accent,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.inkDim,
    letterSpacing: 1.5,
  },
  deleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  deleteBtnText: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 1.5,
  },
  btnDisabled: {
    opacity: 0.3,
  },
  btnPressed: {
    opacity: 0.55,
  },
});
