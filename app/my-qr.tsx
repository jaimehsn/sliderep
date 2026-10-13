import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import QRCode from 'react-native-qrcode-svg';
import {
  useFonts,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import { Screen } from '@/components/screen';
import { useProfile } from '@/hooks/use-profile';

// High-contrast by design, unlike the rest of the app: camera QR readers are
// far more reliable with dark modules on a light background.
const QR_BG = '#ffffff';
const QR_INK = '#0a0a0a';
const QR_MUTED = '#6a6a62';

export default function MyQrScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });
  const { profile, loaded } = useProfile();

  useEffect(() => {
    if (loaded && !profile) {
      router.replace('/profile');
    }
  }, [loaded, profile]);

  if (!fontsLoaded || !loaded || !profile) {
    return <View style={{ flex: 1, backgroundColor: QR_BG }} />;
  }

  const payload = { v: 1 as const, athleteId: profile.id, alias: profile.alias };

  return (
    <Screen style={styles.root}>
      <StatusBar style="dark" />

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
        <View style={styles.qrFrame}>
          <QRCode value={JSON.stringify(payload)} size={240} color={QR_INK} backgroundColor={QR_BG} />
        </View>
        <Text style={styles.alias}>{profile.alias}</Text>
        <Text style={styles.id}>id: {profile.id}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: QR_BG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  backBtnPressed: {
    opacity: 0.4,
  },
  backBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 20,
    color: QR_MUTED,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  qrFrame: {
    padding: 16,
    backgroundColor: QR_BG,
  },
  alias: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 32,
    color: QR_INK,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  id: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: QR_MUTED,
    letterSpacing: 1,
  },
});
