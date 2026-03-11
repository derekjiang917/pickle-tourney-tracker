import { ScrapedTournament } from './types.js';

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

export function extractCityState(locationStr: string): { city: string; state: string } {
  const parts = locationStr.split(',').map((p) => p.trim());

  if (parts.length >= 2) {
    const state = parts[parts.length - 1].trim();
    const city = parts[parts.length - 2].trim();
    return { city, state };
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
