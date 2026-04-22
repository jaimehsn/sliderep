import { StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';
import { LogEntry } from './types';

export function DotTrail({ log }: { log: LogEntry[] }) {
  return (
    <View style={styles.container}>
      {log.map((entry) =>
        entry.ok ? (
          <View key={entry.id} style={styles.dotRep} />
        ) : (
          <Text key={entry.id} style={styles.dotNoRep}>✕</Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: HF.hairline,
    backgroundColor: HF.surface,
    minHeight: 30,
  },
  dotRep: {
    width: 8,
    height: 8,
    backgroundColor: HF.rep,
  },
  dotNoRep: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.noRep,
    fontWeight: '700',
    lineHeight: 12,
    width: 10,
    height: 10,
    textAlign: 'center',
  },
});
