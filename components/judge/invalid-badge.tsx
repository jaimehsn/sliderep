import { StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';

export function InvalidBadge() {
  return (
    <View style={styles.container}>
      <Text style={styles.x}>✕</Text>
      <Text style={styles.label}>invalid · retry</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: HF.accent,
    backgroundColor: '#1a0d08',
    marginBottom: 6,
  },
  x: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 11,
    color: HF.accent,
  },
  label: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
