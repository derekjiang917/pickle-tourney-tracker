import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as cheerio from 'cheerio';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setUserAgent: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('cheerio', async () => {
  const actual = await vi.importActual<typeof cheerio>('cheerio');
  return actual;
});

describe('puppeteer utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('launchBrowser', () => {
    it('launches browser with correct args', async () => {
      const { launchBrowser } = await import('../puppeteer.js');
      await launchBrowser();
      
      const puppeteer = await import('puppeteer');
      expect(puppeteer.default.launch).toHaveBeenCalledWith({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    });
  });

  describe('fetchHtml', () => {
    it('returns cheerio loaded with HTML', async () => {
      const { fetchHtml } = await import('../puppeteer.js');
      const $ = await fetchHtml('https://example.com');
      
      expect($).toBeDefined();
      expect(typeof $).toBe('function');
      expect($('body').text()).toBe('Test');
    });
  });
});
