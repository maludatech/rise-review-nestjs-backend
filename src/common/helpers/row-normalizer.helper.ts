export function normalizeRow<T extends Record<string, unknown>>(row: T) {
  const out: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(row)) {
    const nk = k.trim().toLowerCase().replace(/\s+/g, '_');
    out[nk] = typeof v === 'string' ? v.trim() : v;
  }

  return out;
}
