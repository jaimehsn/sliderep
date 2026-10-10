import { WOD_IDS, getWodDefinition } from '@/constants/wods';

export type FormatRow = {
  id: string;
  version: number;
  definition: string;
  engineVersion: number;
  origin: string;
};

export type ExerciseRow = {
  id: string;
  name: string;
  origin: string;
  createdAt: number;
};

export type WorkoutRow = {
  id: string;
  name: string;
  blocks: string;
  scoringBlock: number;
  origin: string;
  createdAt: number;
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
}

/**
 * Derives the built-in `formats`/`exercises`/`workouts` rows from
 * `constants/wods.ts` + `constants/wod-engine.ts` — the single source of
 * truth the app already runs on — instead of transcribing the content a
 * second time, which would drift.
 */
export function buildBuiltinSeed(createdAt: number): {
  formats: FormatRow[];
  exercises: ExerciseRow[];
  workouts: WorkoutRow[];
} {
  const formats = new Map<string, FormatRow>();
  const exercises = new Map<string, ExerciseRow>();
  const workouts: WorkoutRow[] = [];

  for (const id of WOD_IDS) {
    const { definition, format } = getWodDefinition(id);

    if (!formats.has(format.id)) {
      formats.set(format.id, {
        id: format.id,
        version: format.version,
        definition: JSON.stringify(format),
        // No separate "interpreter version" concept exists yet — same value as `version`.
        engineVersion: format.version,
        origin: 'builtin',
      });
    }

    const blockLines = definition.block.lines.map((round) =>
      round.map((line) => {
        const exerciseId = slugify(line.exercise);
        if (!exercises.has(exerciseId)) {
          exercises.set(exerciseId, { id: exerciseId, name: line.exercise, origin: 'builtin', createdAt });
        }
        return {
          exerciseId,
          target: line.target,
          ...(line.repDescription ? { repDescription: line.repDescription } : {}),
        };
      }),
    );

    workouts.push({
      id, // reused as-is: `sessions.wodId` already stores these ids (B15)
      name: definition.name,
      blocks: JSON.stringify([
        {
          formatId: format.id,
          lines: blockLines,
          ...(definition.block.rounds != null ? { rounds: definition.block.rounds } : {}),
          ...(definition.block.durationSeconds != null ? { durationSeconds: definition.block.durationSeconds } : {}),
        },
      ]),
      scoringBlock: 0, // single block for all 4 built-ins today
      origin: 'builtin',
      createdAt,
    });
  }

  return { formats: [...formats.values()], exercises: [...exercises.values()], workouts };
}
