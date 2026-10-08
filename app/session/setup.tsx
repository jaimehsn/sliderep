import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { WodId, WOD_IDS, getWodConfig } from '@/constants/wods';
import { ScanPerson, ScannedPerson } from '@/components/session/scan-person';

type Role = 'judge' | 'judged';
type Phase = 'role' | 'scan' | 'banner';

export default function SessionSetupScreen() {
  const { wodId } = useLocalSearchParams<{ wodId: string }>();
  const resolvedWodId: WodId = WOD_IDS.includes(wodId as WodId) ? (wodId as WodId) : 'fran';
  const config = getWodConfig(resolvedWodId);

  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });

  const [phase, setPhase] = useState<Phase>('role');
  const [role, setRole] = useState<Role | null>(null);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  function navigateToJudge(person: ScannedPerson | null) {
    router.replace({
      pathname: '/judge/[id]',
      params: {
        id: resolvedWodId,
        role: role as Role,
        otherAlias: person?.alias ?? '',
      },
    });
  }

  function handleScanDone(person: ScannedPerson | null) {
    if (role === 'judge' && person === null) {
      setPhase('banner');
      return;
    }
    navigateToJudge(person);
  }

  const showBack = phase !== 'role';

  return (
    <Screen style={styles.root} minBottomPadding={24}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.mode}>{config.mode}</Text>
            <Text style={styles.name}>{config.name}</Text>
          </View>
          {showBack ? (
            <Pressable
              onPress={() => setPhase('role')}
              style={({ pressed }) => [styles.backLink, pressed && styles.btnPressed]}
            >
              <Text style={styles.backLinkText}>‹ ROLE</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
              hitSlop={12}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {phase === 'role' && (
        <View style={styles.center}>
          <Text style={styles.title}>CHOOSE YOUR ROLE</Text>
          <Pressable
            style={({ pressed }) => [styles.roleBtn, pressed && styles.btnPressed]}
            onPress={() => { setRole('judge'); setPhase('scan'); }}
          >
            <Text style={styles.roleBtnText}>I&rsquo;LL JUDGE</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.roleBtn, pressed && styles.btnPressed]}
            onPress={() => { setRole('judged'); setPhase('scan'); }}
          >
            <Text style={styles.roleBtnText}>I&rsquo;LL BE JUDGED</Text>
          </Pressable>
        </View>
      )}

      {phase === 'scan' && (
        <ScanPerson
          title={role === 'judged' ? 'WHO IS JUDGING YOU?' : 'WHO ARE YOU JUDGING?'}
          onDone={handleScanDone}
        />
      )}

      {phase === 'banner' && (
        <View style={styles.center}>
          <Text style={styles.title}>THIS SESSION WON&rsquo;T BE SAVED</Text>
          <Text style={styles.subtext}>Judging anonymously — nothing is kept after you finish.</Text>
          <Pressable
            style={({ pressed }) => [styles.roleBtn, pressed && styles.btnPressed]}
            onPress={() => navigateToJudge(null)}
          >
            <Text style={styles.roleBtnText}>CONTINUE</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
            onPress={() => setPhase('scan')}
          >
            <Text style={styles.skipBtnText}>GO BACK</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  mode: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  name: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 32,
    color: HF.ink,
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 32,
  },
  closeBtn: {
    marginLeft: 16,
    marginTop: 2,
  },
  closeBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 18,
    color: HF.muted,
    lineHeight: 22,
  },
  backLink: {
    marginLeft: 16,
    marginTop: 4,
    paddingVertical: 4,
  },
  backLinkText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1,
  },
  btnPressed: {
    opacity: 0.55,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 24,
    color: HF.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  roleBtn: {
    borderWidth: 1.5,
    borderColor: HF.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
  },
  roleBtnText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 18,
    color: HF.accent,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  skipBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.muted,
    letterSpacing: 1.5,
  },
});
