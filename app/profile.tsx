import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  useFonts,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { HF } from '@/constants/hf';
import { Screen } from '@/components/screen';
import { useProfile } from '@/hooks/use-profile';
import { createProfile, deleteProfile, updateAlias } from '@/db/profile';

export default function ProfileScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });

  const db = useSQLiteContext();
  const { profile, loaded, refresh } = useProfile();
  const [aliasInput, setAliasInput] = useState('');
  const [editedAlias, setEditedAlias] = useState<string | null>(null);

  if (!fontsLoaded || !loaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  const handleCreate = async () => {
    const trimmed = aliasInput.trim();
    if (!trimmed) return;
    await createProfile(db, trimmed);
    setAliasInput('');
    await refresh();
  };

  const handleSave = async () => {
    if (!profile) return;
    const trimmed = (editedAlias ?? '').trim();
    if (!trimmed || trimmed === profile.alias) return;
    await updateAlias(db, profile.id, trimmed);
    setEditedAlias(null);
    await refresh();
  };

  const handleDelete = () => {
    if (!profile) return;
    Alert.alert(
      'Delete profile?',
      'Your own sessions will be deleted. Sessions you judged for others stay on this phone.',
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
  const canSave = profile != null && editedAlias != null && editedAlias.trim() !== '' && editedAlias.trim() !== profile.alias;

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

      <View style={styles.center}>
        {profile == null ? (
          <>
            <Text style={styles.title}>CREATE PROFILE</Text>
            <TextInput
              style={styles.input}
              value={aliasInput}
              onChangeText={setAliasInput}
              placeholder="Your name"
              placeholderTextColor={HF.muted}
              autoCapitalize="words"
            />
            <Pressable
              onPress={handleCreate}
              disabled={!aliasInput.trim()}
              style={({ pressed }) => [
                styles.primaryBtn,
                !aliasInput.trim() && styles.btnDisabled,
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
              placeholderTextColor={HF.muted}
              autoCapitalize="words"
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
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backBtnPressed: {
    opacity: 0.4,
  },
  backBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 20,
    color: HF.muted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 24,
    color: HF.ink,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 16,
    color: HF.ink,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairlineStrong,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 220,
    textAlign: 'center',
  },
  primaryBtn: {
    borderWidth: 1.5,
    borderColor: HF.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
    marginTop: 8,
  },
  primaryBtnText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 18,
    color: HF.accent,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.inkDim,
    letterSpacing: 1.5,
  },
  deleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  deleteBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.accent,
    letterSpacing: 1.5,
  },
  btnDisabled: {
    opacity: 0.3,
  },
  btnPressed: {
    opacity: 0.55,
  },
});
