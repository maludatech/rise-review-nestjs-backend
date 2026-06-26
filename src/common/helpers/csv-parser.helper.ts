import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import type { Options as CsvOptions } from 'csv-parse/sync';

const CANDIDATE_DELIMS = [',', ';', '\t', '|'] as const;

function sniffDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/)[0] ?? '';

  let best = ',';
  let bestCount = -1;

  for (const d of CANDIDATE_DELIMS) {
    const regex = new RegExp(`\\${d}`, 'g');
    const count = (firstLine.match(regex) || []).length;

    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }

  return best;
}

export async function parseCSV<
  T extends Record<string, unknown> = Record<string, unknown>,
>(filePath: string): Promise<T[]> {
  const raw = await fs.readFile(filePath, 'utf8');

  const options: CsvOptions = {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
    relax_column_count: true,
    delimiter: sniffDelimiter(raw),
  };

  const result: unknown = parse(raw, options);
  return result as T[];
}
