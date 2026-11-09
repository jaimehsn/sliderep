import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import QRCode from 'react-native-qrcode-svg';
import { Screen } from '@/components/screen';
import { useProfile } from '@/hooks/use-profile';
import { colors, fonts } from '@/constants/theme';

// High-contrast by design, unlike the rest of the app: camera QR readers are
// far more reliable with dark modules on a light background.

export default function MyQrScreen() {
  const { profile, loaded } = useProfile();

  useEffect(() => {
    if (loaded && !profile) {
      router.replace('/profile');
    }
  }, [loaded, profile]);

  if (!loaded || !profile) {
    return <View style={{ flex: 1, backgroundColor: colors.qrPaper }} />;
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
          <QRCode value={JSON.stringify(payload)} size={240} color={colors.qrInk} backgroundColor={colors.qrPaper} />
        </View>
        <Text style={styles.alias}>{profile.alias}</Text>
        <Text style={styles.id}>id: {profile.id}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.qrPaper,
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
    fontFamily: fonts.ui,
    fontSize: 20,
    color: colors.qrMuted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  qrFrame: {
    padding: 16,
    backgroundColor: colors.qrPaper,
  },
  alias: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.qrInk,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  id: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.qrMuted,
    letterSpacing: 1,
  },
});
