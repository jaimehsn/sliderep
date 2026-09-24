import { useCallback } from 'react';
import { useAudioPlayer, type AudioSource } from 'expo-audio';

/**
 * Wraps a short local sound effect (e.g. `require('@/assets/sounds/tick.wav')`) in a
 * fire-and-forget `play()` callback, rewinding first so rapid re-triggers replay from
 * the start instead of doing nothing once the previous playback finished.
 *
 * `useAudioPlayer` keeps the same player instance across renders for a given source, so
 * the returned callback has a stable identity and can be listed safely in effect deps.
 */
export function useSoundCue(source: AudioSource) {
  const player = useAudioPlayer(source);
  return useCallback(() => {
    void (async () => {
      try {
        await player.seekTo(0);
      } catch {
        // ignore; still attempt to play
      }
      player.play();
    })();
  }, [player]);
}
