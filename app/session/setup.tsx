import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { router } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { ScanPerson, ScannedPerson } from '@/components/session/scan-person';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';

type Role = 'judge' | 'judged';
type Phase = 'role' | 'scan' | 'skipBanner' | 'noProfileBanner';

export default function SessionSetupScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });

  const [phase, setPhase] = useState<Phase>('role');
  const [role, setRole] = useState<Role | null>(null);
  const { profile, loaded: profileLoaded } = useProfile();
  const { workout, setSetup } = useSession();

  // Only reachable from the picker, which writes `workout` first; never fall
  // back to some other workout.
  useEffect(() => {
    if (!workout) {
      router.replace('/session/wod');
    }
  }, [workout]);

  // Wait for the profile too: the no-profile warning must not fire on a fast
  // tap before the query resolves.
  if (!fontsLoaded || !profileLoaded || !workout) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  const { config } = workout;

  function navigateToRun(person: ScannedPerson | null) {
    setSetup({
      role: role as Role,
      otherId: person?.id ?? null,
      otherAlias: person?.alias ?? null,
    });
    router.replace('/session/run');
  }

  function handleScanDone(person: ScannedPerson | null) {
    if (role === 'judge' && person === null) {
      setPhase('skipBanner');
      return;
    }
    navigateToRun(person);
  }

  const showBack = phase !== 'role';

  return (
    <Screen style={styles.root} minBottomPadding={24}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>CHOOSE YOUR ROLE</Text>
          <Pressable
            style={({ pressed }) => [styles.roleBtn, pressed && styles.btnPressed]}
            onPress={() => { setRole('judge'); setPhase('scan'); }}
          >
            <Text style={styles.roleBtnText}>I&rsquo;LL JUDGE</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.roleBtn, pressed && styles.btnPressed]}
            onPress={() => { setRole('judged'); setPhase(profile == null ? 'noProfileBanner' : 'scan'); }}
          >
            <Text style={styles.roleBtnText}>I&rsquo;LL BE JUDGED</Text>
          </Pressable>
        </ScrollView>
      )}

      {phase === 'scan' && (
        <ScanPerson
          title={role === 'judged' ? 'WHO IS JUDGING YOU?' : 'WHO ARE YOU JUDGING?'}
          onDone={handleScanDone}
          selfId={profile?.id ?? null}
        />
      )}

      {/* Two "won't be saved" warnings: judge + skip (anonymous athlete), and
          judged without a local profile (no registered athlete to save for). */}
      {(phase === 'skipBanner' || phase === 'noProfileBanner') && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>THIS SESSION WON&rsquo;T BE SAVED</Text>
          <Text style={styles.subtext}>
            {phase === 'skipBanner'
              ? 'Judging anonymously — nothing is kept after you finish.'
              : 'You have no profile — nothing is kept after you finish.'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.roleBtn, pressed && styles.btnPressed]}
            onPress={() => (phase === 'skipBanner' ? navigateToRun(null) : setPhase('scan'))}
          >
            <Text style={styles.roleBtnText}>CONTINUE</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
            onPress={() => setPhase(phase === 'skipBanner' ? 'scan' : 'role')}
          >
            <Text style={styles.skipBtnText}>GO BACK</Text>
          </Pressable>
        </ScrollView>
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
  // Takes the row's free width so a long name wraps instead of pushing the exit off screen.
  headerText: {
    flex: 1,
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
