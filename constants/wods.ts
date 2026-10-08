import {
  AMRAP_FORMAT,
  EMOM_FORMAT,
  FOR_TIME_FORMAT,
  Format,
  WodDefinition,
  buildWodConfig,
} from './wod-engine';

export type { WodSession, WodKpi, WodExercise, WodConfig } from './wod-engine';

export type WodType = 'forTime' | 'amrap' | 'emom' | 'chipper';

// ─── For Time: FRAN 21-15-9 ──────────────────────────────────────────────────

const FRAN: WodDefinition = {
  id: 'fran',
  name: 'FRAN',
  mode: 'FOR TIME',
  block: {
    rounds: 3,
    lines: [
      [{ exercise: 'THRUSTERS', target: 21 }, { exercise: 'PULL-UPS', target: 21 }],
      [{ exercise: 'THRUSTERS', target: 15 }, { exercise: 'PULL-UPS', target: 15 }],
      [{ exercise: 'THRUSTERS', target: 9 }, { exercise: 'PULL-UPS', target: 9 }],
    ],
  },
};

// ─── AMRAP: CINDY 12-min ─────────────────────────────────────────────────────

const CINDY: WodDefinition = {
  id: 'cindy',
  name: 'CINDY',
  mode: '12-MIN AMRAP',
  block: {
    durationSeconds: 12 * 60,
    lines: [
      [
        { exercise: 'PULL-UPS', target: 5 },
        { exercise: 'PUSH-UPS', target: 10 },
        { exercise: 'AIR SQUATS', target: 15 },
      ],
    ],
  },
};

// ─── EMOM: 10-min alternating ────────────────────────────────────────────────

const EMOM_WORKOUT: WodDefinition = {
  id: 'everyMinute',
  name: 'EVERY MINUTE',
  mode: 'EMOM · 10',
  block: {
    rounds: 10,
    durationSeconds: 10 * 60,
    lines: [
      [{ exercise: 'BURPEES', target: 10 }],
      [{ exercise: 'KB SWINGS', target: 15 }],
    ],
  },
};

// ─── Chipper: Filthy Fifty — unified with For Time (1 round of 10 stations) ──

const FILTHY_FIFTY: WodDefinition = {
  id: 'filthyFifty',
  name: 'FILTHY FIFTY',
  mode: 'CHIPPER',
  block: {
    rounds: 1,
    lines: [
      [
        { exercise: 'BOX JUMPS', target: 50 },
        { exercise: 'JUMPING PULL-UPS', target: 50 },
        { exercise: 'KB SWINGS', target: 50 },
        { exercise: 'WALKING LUNGES', target: 50 },
        { exercise: 'KNEES-TO-ELBOWS', target: 50 },
        { exercise: 'PUSH PRESS', target: 50 },
        { exercise: 'BACK EXT.', target: 50 },
        { exercise: 'WALL BALL', target: 50 },
        { exercise: 'BURPEES', target: 50 },
        { exercise: 'DOUBLE UNDERS', target: 50 },
      ],
    ],
  },
};

// ─── Registry ────────────────────────────────────────────────────────────────

const REGISTRY: Record<WodType, { definition: WodDefinition; format: Format }> = {
  forTime: { definition: FRAN, format: FOR_TIME_FORMAT },
  amrap: { definition: CINDY, format: AMRAP_FORMAT },
  emom: { definition: EMOM_WORKOUT, format: EMOM_FORMAT },
  chipper: { definition: FILTHY_FIFTY, format: FOR_TIME_FORMAT },
};

export function getWodConfig(type: WodType) {
  const { definition, format } = REGISTRY[type];
  return buildWodConfig(definition, format);
}
