import { describe, it, expect } from 'vitest';
import {
  parseDate,
  toPacificTime,
  parseSkillLevels,
  extractCityState,
  sanitizeString,
  extractDomain,
} from '../utils.js';

describe('parseDate', () => {
  it('parses MM/DD/YYYY format', () => {
    const result = parseDate('01/15/2024');
    expect(result?.toISOString().split('T')[0]).toBe('2024-01-15');
  });

  it('parses MM-DD-YYYY format', () => {
    const result = parseDate('01-15-2024');
    expect(result?.toISOString().split('T')[0]).toBe('2024-01-15');
  });

  it('parses M/D/YYYY format', () => {
    const result = parseDate('1/5/2024');
    expect(result?.toISOString().split('T')[0]).toBe('2024-01-05');
  });

  it('parses Month DD, YYYY format', () => {
    const result = parseDate('January 15, 2024');
    expect(result?.toISOString().split('T')[0]).toBe('2024-01-15');
  });

  it('parses Mon DD YYYY format', () => {
    const result = parseDate('Jan 15 2024');
    expect(result?.toISOString().split('T')[0]).toBe('2024-01-15');
  });

  it('returns null for invalid date', () => {
    expect(parseDate('not-a-date')).toBeNull();
    expect(parseDate('')).toBeNull();
  });

  it('handles whitespace', () => {
    const result = parseDate('  01/15/2024  ');
    expect(result?.toISOString().split('T')[0]).toBe('2024-01-15');
  });
});

describe('toPacificTime', () => {
  it('returns a Date object with modified hours', () => {
    const inputDate = new Date();
    const pacificDate = toPacificTime(inputDate);
    expect(pacificDate).toBeInstanceOf(Date);
    expect(pacificDate).not.toBe(inputDate);
  });

  it('returns a new Date object', () => {
    const original = new Date('2024-01-15T12:00:00Z');
    const pacific = toPacificTime(original);
    expect(pacific).not.toBe(original);
  });
});

describe('parseSkillLevels', () => {
  it('parses numeric levels', () => {
    expect(parseSkillLevels('3.0')).toContain('3.0');
    expect(parseSkillLevels('4.5')).toContain('4.5');
  });

  it('parses multiple numeric levels', () => {
    const result = parseSkillLevels('3.0, 4.0, 5.0');
    expect(result).toContain('3.0');
    expect(result).toContain('4.0');
    expect(result).toContain('5.0');
  });

  it('parses text levels', () => {
    const result = parseSkillLevels('Beginner');
    expect(result).toContain('BEGINNER');
  });

  it('parses mixed levels', () => {
    const result = parseSkillLevels('3.0 Beginner Advanced');
    expect(result).toContain('3.0');
    expect(result).toContain('BEGINNER');
    expect(result).toContain('ADVANCED');
  });

  it('removes duplicates', () => {
    const result = parseSkillLevels('3.0 3.0 4.0');
    expect(result.filter((l) => l === '3.0').length).toBe(1);
  });

  it('handles empty string', () => {
    expect(parseSkillLevels('')).toEqual([]);
  });
});

describe('extractCityState', () => {
  it('extracts city and state from "City, State"', () => {
    const result = extractCityState('San Diego, CA');
    expect(result.city).toBe('San Diego');
    expect(result.state).toBe('CA');
  });

  it('extracts city and state from "City, State ZIP"', () => {
    const result = extractCityState('San Diego, CA 92101');
    expect(result.city).toBe('San Diego');
    expect(result.state).toBe('CA 92101');
  });

  it('returns empty strings for invalid input', () => {
    expect(extractCityState('')).toEqual({ city: '', state: '' });
    expect(extractCityState('SingleWord')).toEqual({ city: '', state: '' });
  });

  it('handles multi-word city names', () => {
    const result = extractCityState('New York, NY');
    expect(result.city).toBe('New York');
    expect(result.state).toBe('NY');
  });
});

describe('sanitizeString', () => {
  it('normalizes whitespace', () => {
    expect(sanitizeString('hello    world')).toBe('hello world');
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('handles null and undefined', () => {
    expect(sanitizeString(null as unknown as string)).toBe('');
    expect(sanitizeString(undefined as unknown as string)).toBe('');
  });

  it('returns normal strings unchanged', () => {
    expect(sanitizeString('hello')).toBe('hello');
    expect(sanitizeString('')).toBe('');
  });
});

describe('extractDomain', () => {
  it('extracts domain from URL', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
    expect(extractDomain('http://test.com/page')).toBe('test.com');
  });

  it('removes www prefix', () => {
    expect(extractDomain('https://www.example.com')).toBe('example.com');
  });

  it('returns empty string for invalid URL', () => {
    expect(extractDomain('not-a-url')).toBe('');
    expect(extractDomain('')).toBe('');
    expect(extractDomain('www.example.com')).toBe('');
  });
});
