import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
      <View style={styles.container}>
        <Text style={styles.title}>Pantalla no encontrada</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Volver al juez</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: HF.bg },
  title: { fontFamily: 'IBMPlexMono_400Regular', fontSize: 16, color: HF.muted, marginBottom: 20 },
  link: { paddingVertical: 12 },
  linkText: { fontFamily: 'BarlowCondensed_600SemiBold', fontSize: 14, color: HF.accent, letterSpacing: 2 },
});
