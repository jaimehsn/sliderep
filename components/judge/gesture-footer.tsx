import { StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';

export function GestureFooter() {
  return (
    <View style={styles.container}>
      <Text style={[styles.hint, { color: HF.noRep }]}>← ✕ no rep</Text>
      <Text style={[styles.hint, { color: HF.mutedDim }]}>tap = rep</Text>
      <Text style={[styles.hint, { color: HF.rep }]}>rep ■ →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
  hint: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
  },
});
