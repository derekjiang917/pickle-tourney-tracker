import { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { DEFAULT_USER_AGENT } from './utils.js';

export async function launchBrowser(): Promise<Browser> {
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

export async function createPage(browser: Browser, url: string): Promise<Page> {
  const page = await browser.newPage();
  await page.setUserAgent(DEFAULT_USER_AGENT);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return page;
}

export async function fetchHtml(url: string): Promise<cheerio.Root> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const html = await page.content();
    return cheerio.load(html);
  } finally {
    await browser.close();
  }
}

export async function fetchHtmlWithRetry(
  url: string,
  maxRetries: number = 3,
  delayMultiplier: number = 3000
): Promise<cheerio.Root> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const browser = await launchBrowser();
      try {
        const page = await browser.newPage();
        await page.setUserAgent(DEFAULT_USER_AGENT);
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        const html = await page.content();
        return cheerio.load(html);
      } finally {
        await browser.close();
      }
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMultiplier * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to fetch page after retries');
}

export async function fetchPageContent(url: string): Promise<string> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const content = await page.content();
    return content;
  } finally {
    await browser.close();
  }
}

export async function scrapeWithRetry(
  url: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchPageContent(url);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to fetch page after retries');
}
