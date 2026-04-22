import { StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';
import { DotTrail } from './dot-trail';
import { LogEntry } from './types';

type Props = {
  log: LogEntry[];
  repsCount: number;
  noRepsCount: number;
};

export function EventLog({ log, repsCount, noRepsCount }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tag}>event log</Text>
        <Text style={styles.tag}>
          <Text style={{ color: HF.rep }}>{repsCount}</Text>
          <Text style={{ color: HF.muted }}> · </Text>
          <Text style={{ color: HF.noRep }}>{noRepsCount}✕</Text>
        </Text>
      </View>
      <DotTrail log={log.slice(-40)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tag: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
