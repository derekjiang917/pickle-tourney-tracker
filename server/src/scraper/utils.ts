import { ScrapedTournament } from './types.js';

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const ALL_SKILL_LEVELS = [
  '3.0',
  '3.5',
  '4.0',
  '4.5',
  '5.0',
  '5.5',
  '6.0',
] as const;

export const TEXT_SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Open', 'Pro'] as const;

export type NumericSkillLevel = (typeof ALL_SKILL_LEVELS)[number];
export type TextSkillLevel = (typeof TEXT_SKILL_LEVELS)[number];
export type SkillLevel = NumericSkillLevel | TextSkillLevel;

export function parseDate(dateStr: string): string | null {
  const cleaned = dateStr.trim();
  const match = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    const [, month, day, year] = match;
    const fullYear = year.length === 2 ? (parseInt(year) > 50 ? '19' + year : '20' + year) : year;
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${fullYear}-${paddedMonth}-${paddedDay}`;
  }
  const parsed = new Date(cleaned);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
}

export function parseSkillLevels(skillLevelsText: string): string[] {
  const levels: string[] = [];
  const patterns = [
    /\b(1\.0|2\.0|3\.0|3\.5|4\.0|4\.5|5\.0|5\.5|6\.0)\b/gi,
    /\b(Beginner|Intermediate|Advanced|Expert|Open|Pro)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = skillLevelsText.match(pattern);
    if (matches) {
      levels.push(...matches.map((m) => m.toUpperCase()));
    }
  }

  return [...new Set(levels)];
}

export function parseSkillInterval(intervalText: string): string[] {
  const match = intervalText.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (!match) return [];

  const minLevel = parseFloat(match[1]);
  const maxLevel = parseFloat(match[2]);

  const levels: string[] = [];
  for (const level of ALL_SKILL_LEVELS) {
    const levelNum = parseFloat(level);
    if (levelNum >= minLevel && levelNum <= maxLevel) {
      levels.push(level);
    }
  }

  return levels;
}

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

export function extractCityState(locationStr: string): { city: string; state: string } {
  const parts = locationStr.split(',').map((p) => p.trim()).filter(Boolean);

  // Scan parts from right to left for a valid state abbreviation (optionally with zip)
  for (let i = parts.length - 1; i >= 1; i--) {
    const stateCode = parts[i].replace(/\s+\d{5}(-\d{4})?$/, '').trim().toUpperCase();
    if (US_STATES.has(stateCode)) {
      return { city: parts[i - 1], state: stateCode };
    }
  }

  return { city: '', state: '' };
}

export function sanitizeString(str: string | undefined | null, preserveNewlines = false): string {
  if (!str) return '';
  if (preserveNewlines) {
    return str.replace(/[ \t]+/g, ' ').trim();
  }
  return str.replace(/\s+/g, ' ').trim();
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function createTournament(
  sourceName: string,
  data: Partial<ScrapedTournament>
): ScrapedTournament {
  const today = new Date().toISOString().split('T')[0];
  return {
    name: data.name || '',
    sourceUrl: data.sourceUrl || '',
    source: sourceName,
    location: data.location || '',
    city: data.city || '',
    state: data.state || '',
    startDate: data.startDate || today,
    endDate: data.endDate || today,
    skillLevels: data.skillLevels || [],
    description: data.description,
    imageUrl: data.imageUrl,
    registrationUrl: data.registrationUrl,
  };
}
