// Golden results recorded on engineVersion 1 *before* the unified-engine refactor.
// They pin v1 as shipped, quirks included. Never re-record them with `-u`: a
// different result means a new engine version, not an updated golden.
import { describe, expect, it } from 'vitest';
import { deriveAdjustedResult } from '@/components/result/adjust';
import { deriveResult } from '@/components/result/replay';
import { CASES, builtin } from './fixtures';

describe('v1 goldens', () => {
  for (const c of CASES) {
    it(c.name, async () => {
      const config = builtin(c.wodId);
      const golden = {
        result: deriveResult(config, c.log),
        ...(c.changes ? { adjusted: deriveAdjustedResult(config, c.log, c.changes) } : {}),
      };
      await expect(JSON.stringify(golden, null, 2) + '\n').toMatchFileSnapshot(`__goldens__/${c.name}.json`);
    });
  }
});
