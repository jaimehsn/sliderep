import { StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';
import { SegItem } from '@/constants/wods';

export function SegBar({ items }: { items: SegItem[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {items.map((item, i) => {
        const pct = Math.min(100, (item.filled / item.target) * 100);
        return (
          <View key={i} style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <Text numberOfLines={1} style={[styles.name, { color: item.isCurrent ? HF.ink : HF.muted }]}>
                {item.name}
              </Text>
              <Text style={[styles.count, { color: item.isCurrent ? HF.ink : HF.muted }]}>
                {item.filled}/{item.target}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, {
                width: `${pct}%` as `${number}%`,
                backgroundColor: item.isCurrent ? HF.accent : HF.inkDim,
              }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  name: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  count: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    marginLeft: 4,
  },
  track: {
    height: 3,
    backgroundColor: HF.hairlineStrong,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
