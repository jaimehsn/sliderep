// Presentation snapshot recorded before the window-model refactor (design.md
// of change window-model, decision 7): every workout's mode, description,
// exercise rows, duration line, timer and first live view. Like the goldens,
// never re-record it with `-u`: a different file means a visible change.
import { describe, expect, it } from 'vitest';
import { WodConfig, durationLine, initial, isSequence, view } from '@/constants/wod-engine';
import { V2_WORKOUTS } from '@/db/seeds/v2-builtins';
import { MAX_DISTANCE_WORKOUTS, MAX_LINE_WORKOUTS, SHARED_CLOCK_WORKOUTS, SYNTHETIC_WORKOUTS, workout } from './fixtures';

function presentation(config: WodConfig) {
  return {
    mode: config.mode,
    description: config.description,
    exercises: config.exercises,
    // Change shared-clock: only windows of several parts have sections.
    ...(config.sections ? { sections: config.sections } : {}),
    durationLine: durationLine(config),
    timerMode: config.timerMode,
    totalSeconds: config.totalSeconds,
    advanceMode: config.advanceMode,
    engineVersion: config.engineVersion,
    view: view(config, initial(config)),
  };
}

describe('presentation', () => {
  for (const id of [...V2_WORKOUTS.map((w) => w.id), ...SYNTHETIC_WORKOUTS.map((w) => w.id), ...SHARED_CLOCK_WORKOUTS.map((w) => w.id), ...MAX_LINE_WORKOUTS.map((w) => w.id), ...MAX_DISTANCE_WORKOUTS.map((w) => w.id)]) {
    it(id, async () => {
      const config = workout(id);
      const snapshot = {
        ...presentation(config),
        ...(isSequence(config) ? { parts: config.parts.map(presentation) } : {}),
      };
      await expect(JSON.stringify(snapshot, null, 2) + '\n').toMatchFileSnapshot(`__presentation__/${id}.json`);
    });
  }
});
