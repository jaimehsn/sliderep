export type QrPayload = { v: 1; athleteId: string; alias: string };

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
