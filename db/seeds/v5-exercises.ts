// Migration snapshot for schema v5 — NEVER EDIT.
//
// The categorized built-in exercise catalog (openspec change
// exercise-catalog-from-db). v5 gives the 14 exercises v2 already seeded their
// category and inserts the rest. Ids follow v2's slugify rule, written out
// literally. A change to the catalog is a new migration with its own seed file,
// never an edit here.

export type V5Category = 'GYMNASTICS' | 'WEIGHTLIFTING' | 'MONOSTRUCTURAL';

/** Categories for the 14 exercises seeded in v2 (`seeds/v2-builtins.ts`). */
export const V5_EXISTING_CATEGORIES: { id: string; category: V5Category }[] = [
  { id: 'air-squats', category: 'GYMNASTICS' },
  { id: 'back-ext', category: 'GYMNASTICS' },
  { id: 'box-jumps', category: 'GYMNASTICS' },
  { id: 'burpees', category: 'GYMNASTICS' },
  { id: 'jumping-pull-ups', category: 'GYMNASTICS' },
  { id: 'knees-to-elbows', category: 'GYMNASTICS' },
  { id: 'pull-ups', category: 'GYMNASTICS' },
  { id: 'push-ups', category: 'GYMNASTICS' },
  { id: 'walking-lunges', category: 'GYMNASTICS' },
  { id: 'kb-swings', category: 'WEIGHTLIFTING' },
  { id: 'push-press', category: 'WEIGHTLIFTING' },
  { id: 'thrusters', category: 'WEIGHTLIFTING' },
  { id: 'wall-ball', category: 'WEIGHTLIFTING' },
  { id: 'double-unders', category: 'MONOSTRUCTURAL' },
];

/** New built-in exercises, grouped by category, alphabetical within each. */
export const V5_NEW_EXERCISES: { id: string; name: string; category: V5Category }[] = [
  // GYMNASTICS
  { id: 'bar-muscle-ups', name: 'BAR MUSCLE-UPS', category: 'GYMNASTICS' },
  { id: 'bar-facing-burpees', name: 'BAR-FACING BURPEES', category: 'GYMNASTICS' },
  { id: 'box-jump-overs', name: 'BOX JUMP-OVERS', category: 'GYMNASTICS' },
  { id: 'burpee-box-jump-overs', name: 'BURPEE BOX JUMP-OVERS', category: 'GYMNASTICS' },
  { id: 'burpee-pull-ups', name: 'BURPEE PULL-UPS', category: 'GYMNASTICS' },
  { id: 'chest-to-bar-pull-ups', name: 'CHEST-TO-BAR PULL-UPS', category: 'GYMNASTICS' },
  { id: 'ghd-sit-ups', name: 'GHD SIT-UPS', category: 'GYMNASTICS' },
  { id: 'hand-release-push-ups', name: 'HAND-RELEASE PUSH-UPS', category: 'GYMNASTICS' },
  { id: 'handstand-push-ups', name: 'HANDSTAND PUSH-UPS', category: 'GYMNASTICS' },
  { id: 'handstand-walk', name: 'HANDSTAND WALK', category: 'GYMNASTICS' },
  { id: 'hanging-knee-raises', name: 'HANGING KNEE RAISES', category: 'GYMNASTICS' },
  { id: 'hollow-rocks', name: 'HOLLOW ROCKS', category: 'GYMNASTICS' },
  { id: 'jumping-lunges', name: 'JUMPING LUNGES', category: 'GYMNASTICS' },
  { id: 'legless-rope-climbs', name: 'LEGLESS ROPE CLIMBS', category: 'GYMNASTICS' },
  { id: 'lunges', name: 'LUNGES', category: 'GYMNASTICS' },
  { id: 'mountain-climbers', name: 'MOUNTAIN CLIMBERS', category: 'GYMNASTICS' },
  { id: 'pistols', name: 'PISTOLS', category: 'GYMNASTICS' },
  { id: 'ring-dips', name: 'RING DIPS', category: 'GYMNASTICS' },
  { id: 'ring-muscle-ups', name: 'RING MUSCLE-UPS', category: 'GYMNASTICS' },
  { id: 'ring-rows', name: 'RING ROWS', category: 'GYMNASTICS' },
  { id: 'rope-climbs', name: 'ROPE CLIMBS', category: 'GYMNASTICS' },
  { id: 'sit-ups', name: 'SIT-UPS', category: 'GYMNASTICS' },
  { id: 'step-ups', name: 'STEP-UPS', category: 'GYMNASTICS' },
  { id: 'strict-handstand-push-ups', name: 'STRICT HANDSTAND PUSH-UPS', category: 'GYMNASTICS' },
  { id: 'strict-pull-ups', name: 'STRICT PULL-UPS', category: 'GYMNASTICS' },
  { id: 'toes-to-bar', name: 'TOES-TO-BAR', category: 'GYMNASTICS' },
  { id: 'tuck-jumps', name: 'TUCK JUMPS', category: 'GYMNASTICS' },
  { id: 'v-ups', name: 'V-UPS', category: 'GYMNASTICS' },
  { id: 'wall-walks', name: 'WALL WALKS', category: 'GYMNASTICS' },

  // WEIGHTLIFTING
  { id: 'american-kb-swings', name: 'AMERICAN KB SWINGS', category: 'WEIGHTLIFTING' },
  { id: 'back-squats', name: 'BACK SQUATS', category: 'WEIGHTLIFTING' },
  { id: 'clean-jerks', name: 'CLEAN & JERKS', category: 'WEIGHTLIFTING' },
  { id: 'cleans', name: 'CLEANS', category: 'WEIGHTLIFTING' },
  { id: 'db-box-step-overs', name: 'DB BOX STEP-OVERS', category: 'WEIGHTLIFTING' },
  { id: 'db-cleans', name: 'DB CLEANS', category: 'WEIGHTLIFTING' },
  { id: 'db-snatches', name: 'DB SNATCHES', category: 'WEIGHTLIFTING' },
  { id: 'db-thrusters', name: 'DB THRUSTERS', category: 'WEIGHTLIFTING' },
  { id: 'deadlifts', name: 'DEADLIFTS', category: 'WEIGHTLIFTING' },
  { id: 'devil-press', name: 'DEVIL PRESS', category: 'WEIGHTLIFTING' },
  { id: 'farmer-carry', name: 'FARMER CARRY', category: 'WEIGHTLIFTING' },
  { id: 'front-squats', name: 'FRONT SQUATS', category: 'WEIGHTLIFTING' },
  { id: 'ground-to-overhead', name: 'GROUND-TO-OVERHEAD', category: 'WEIGHTLIFTING' },
  { id: 'hang-power-cleans', name: 'HANG POWER CLEANS', category: 'WEIGHTLIFTING' },
  { id: 'hang-power-snatches', name: 'HANG POWER SNATCHES', category: 'WEIGHTLIFTING' },
  { id: 'kb-goblet-squats', name: 'KB GOBLET SQUATS', category: 'WEIGHTLIFTING' },
  { id: 'overhead-squats', name: 'OVERHEAD SQUATS', category: 'WEIGHTLIFTING' },
  { id: 'overhead-walking-lunges', name: 'OVERHEAD WALKING LUNGES', category: 'WEIGHTLIFTING' },
  { id: 'power-cleans', name: 'POWER CLEANS', category: 'WEIGHTLIFTING' },
  { id: 'power-snatches', name: 'POWER SNATCHES', category: 'WEIGHTLIFTING' },
  { id: 'push-jerks', name: 'PUSH JERKS', category: 'WEIGHTLIFTING' },
  { id: 'sandbag-cleans', name: 'SANDBAG CLEANS', category: 'WEIGHTLIFTING' },
  { id: 'shoulder-press', name: 'SHOULDER PRESS', category: 'WEIGHTLIFTING' },
  { id: 'shoulder-to-overhead', name: 'SHOULDER-TO-OVERHEAD', category: 'WEIGHTLIFTING' },
  { id: 'slam-balls', name: 'SLAM BALLS', category: 'WEIGHTLIFTING' },
  { id: 'snatches', name: 'SNATCHES', category: 'WEIGHTLIFTING' },
  { id: 'split-jerks', name: 'SPLIT JERKS', category: 'WEIGHTLIFTING' },
  { id: 'squat-cleans', name: 'SQUAT CLEANS', category: 'WEIGHTLIFTING' },
  { id: 'squat-snatches', name: 'SQUAT SNATCHES', category: 'WEIGHTLIFTING' },
  { id: 'sumo-deadlift-high-pulls', name: 'SUMO DEADLIFT HIGH PULLS', category: 'WEIGHTLIFTING' },
  { id: 'turkish-get-ups', name: 'TURKISH GET-UPS', category: 'WEIGHTLIFTING' },

  // MONOSTRUCTURAL
  { id: 'bike', name: 'BIKE', category: 'MONOSTRUCTURAL' },
  { id: 'bike-erg', name: 'BIKE ERG', category: 'MONOSTRUCTURAL' },
  { id: 'row', name: 'ROW', category: 'MONOSTRUCTURAL' },
  { id: 'run', name: 'RUN', category: 'MONOSTRUCTURAL' },
  { id: 'shuttle-runs', name: 'SHUTTLE RUNS', category: 'MONOSTRUCTURAL' },
  { id: 'single-unders', name: 'SINGLE UNDERS', category: 'MONOSTRUCTURAL' },
  { id: 'ski-erg', name: 'SKI ERG', category: 'MONOSTRUCTURAL' },
  { id: 'sled-push', name: 'SLED PUSH', category: 'MONOSTRUCTURAL' },
  { id: 'swim', name: 'SWIM', category: 'MONOSTRUCTURAL' },
];
