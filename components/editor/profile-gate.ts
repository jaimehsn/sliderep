import { Alert } from 'react-native';
import { router } from 'expo-router';
import type { AthleteProfile } from '@/db/profile';

/**
 * Creating or duplicating a workout needs a profile (anonymous athletes can't
 * own content). Runs `go` when there is one; otherwise explains and offers to
 * create it.
 */
export function withProfile(profile: AthleteProfile | null, go: () => void): void {
  if (profile) {
    go();
    return;
  }
  Alert.alert('Profile needed', 'Create a profile to create workouts.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Create profile', onPress: () => router.push('/profile') },
  ]);
}
