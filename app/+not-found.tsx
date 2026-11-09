import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Text } from '@/components/text';
import { Screen } from '@/components/screen';
import { colors, fonts } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
      <Screen style={styles.container}>
        <Text style={styles.title}>Screen not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to home</Text>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontFamily: fonts.ui, fontSize: 16, color: colors.muted, marginBottom: 20 },
  link: { paddingVertical: 12 },
  linkText: { fontFamily: fonts.display, fontSize: 14, color: colors.accent, letterSpacing: 2 },
});
