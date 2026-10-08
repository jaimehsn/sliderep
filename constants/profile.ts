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
