export type QrPayload = { v: 1; athleteId: string; alias: string };

/**
 * Stub, not persisted. The real local profile (create/edit alias, saved on
 * device) is B19; this placeholder exists only so "My QR" (B10) has something
 * to render. Replace this whole file when B19 lands.
 */
export const STUB_PROFILE: QrPayload = {
  v: 1,
  athleteId: '5f1b6e0a-0c2e-4b1a-8e3d-2a7c9f4d6b10',
  alias: 'Jaime',
};

/** Decodes a scanned QR's raw text as a SlideRep athlete payload, or `null` if it isn't one. */
export function parseQrPayload(raw: string): QrPayload | null {
  try {
    const data = JSON.parse(raw);
    if (data?.v === 1 && typeof data.athleteId === 'string' && typeof data.alias === 'string') {
      return { v: 1, athleteId: data.athleteId, alias: data.alias };
    }
  } catch {
    // not JSON, or not ours — ignore
  }
  return null;
}
