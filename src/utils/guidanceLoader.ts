import type { GuidanceEntry, GuidanceMap } from '../types/guidance';

function splitList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(s => s.trim());
  return value
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);
}

function normalizeZone(zone: string | undefined): string {
  if (!zone) return 'Neutral';
  const z = zone.trim().toLowerCase();
  if (z === 'very bad') return 'Very Bad';
  if (z === 'bad') return 'Bad';
  if (z === 'good') return 'Good';
  if (z === 'best') return 'Best';
  return zone;
}

export async function loadGuidanceFromOutputCsv(csvUrl: string): Promise<GuidanceMap> {
  const res = await fetch(csvUrl, { cache: 'no-store' });
  const text = await res.text();

  // Very simple CSV parse: first line headers, second line big JSON strings per column
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length < 2) return {};
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const row = lines[1];

  // Split respecting quotes (basic)
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current);

  const map: GuidanceMap = {};
  for (let i = 0; i < headers.length && i < cols.length; i++) {
    const roomType = headers[i].trim();
    if (!roomType) continue;
    const cell = cols[i].trim();
    if (!cell) continue;
    try {
      const jsonStr = cell.replace(/^\[/, '[').replace(/\]$/, ']');
      const arr = JSON.parse(jsonStr);
      if (!Array.isArray(arr)) continue;
      const dirToEntry: Record<string, GuidanceEntry> = {};
      for (const item of arr) {
        const dir: string = (item.compass_direction || item.direction || '').toString().trim();
        if (!dir) continue;
        dirToEntry[dir] = {
          zone: normalizeZone(item.zone),
          element: (item.element || '').toString(),
          remedies_primary: splitList(item.remedies_primary),
          remedies_secondary: splitList(item.remedies_secondary),
          effect: splitList(item.effect),
        };
      }
      map[roomType] = dirToEntry;
    } catch {}
  }
  return map;
}

export async function loadGuidanceFromLocal(): Promise<GuidanceMap> {
  const modules = import.meta.glob('../data/*.json', { eager: true }) as Record<string, any>;
  const map: GuidanceMap = {};
  const normalizeDirKey = (raw: string): string => {
    if (!raw) return '';
    let s = raw.trim();
    // if contains parentheses like "Northeast (NE)", prefer the abbreviation inside
    const paren = s.match(/\(([^)]+)\)/);
    if (paren && paren[1]) {
      return paren[1].trim().toUpperCase();
    }
    // remove any commas
    s = s.replace(/,/g, '');
    // standardize dashes
    s = s.replace(/\s*-\s*/g, '-');
    // collapse spaces
    s = s.replace(/\s+/g, ' ').trim().toUpperCase();
    const mapNames: Record<string, string> = {
      'NORTH': 'N',
      'NORTH-NORTHEAST': 'NNE',
      'NORTHEAST': 'NE',
      'EAST-NORTHEAST': 'ENE',
      'EAST': 'E',
      'EAST-SOUTHEAST': 'ESE',
      'SOUTHEAST': 'SE',
      'SOUTH-SOUTHEAST': 'SSE',
      'SOUTH': 'S',
      'SOUTH-SOUTHWEST': 'SSW',
      'SOUTHWEST': 'SW',
      'WEST-SOUTHWEST': 'WSW',
      'WEST': 'W',
      'WEST-NORTHWEST': 'WNW',
      'NORTHWEST': 'NW',
      'NORTH-NORTHWEST': 'NNW',
    };
    return mapNames[s] || s.toUpperCase();
  };
  for (const [path, mod] of Object.entries(modules)) {
    try {
      const fileName = path.split('/').pop()!.replace('.json', '');
      const obj = mod.default || mod;
      // Support both object keyed by compass codes and array rows
      const entries: Record<string, GuidanceEntry> = {};
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const rawDir = (item.compass_direction || item.direction || '').toString();
          const key = normalizeDirKey(rawDir);
          if (!key) continue;
          entries[key] = {
            zone: normalizeZone(item.zone),
            element: (item.element || '').toString(),
            remedies_primary: splitList(item.remedies_primary),
            remedies_secondary: splitList(item.remedies_secondary),
            effect: splitList(item.effect),
          };
        }
      } else {
        for (const [dir, val] of Object.entries(obj || {})) {
          const key = normalizeDirKey(String(dir));
          entries[key] = {
            zone: normalizeZone((val as any).zone),
            element: (val as any).element || '',
            remedies_primary: splitList((val as any).remedies_primary),
            remedies_secondary: splitList((val as any).remedies_secondary),
            effect: splitList((val as any).effect),
          };
        }
      }
      map[fileName] = entries;
    } catch {}
  }
  return map;
}


