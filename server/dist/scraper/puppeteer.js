import * as cheerio from 'cheerio';
import { DEFAULT_USER_AGENT } from './utils.js';
export async function launchBrowser() {
    const { default: puppeteer } = await import('puppeteer');
    return puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
}
export async function createPage(browser, url) {
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return page;
}
export async function fetchHtml(url) {
    const browser = await launchBrowser();
    try {
        const page = await browser.newPage();
        await page.setUserAgent(DEFAULT_USER_AGENT);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const html = await page.content();
        return cheerio.load(html);
    }
    finally {
        await browser.close();
    }
}
export async function fetchHtmlWithRetry(url, maxRetries = 3, delayMultiplier = 3000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const browser = await launchBrowser();
            try {
                const page = await browser.newPage();
                await page.setUserAgent(DEFAULT_USER_AGENT);
                await page.goto(url, { waitUntil: 'load', timeout: 60000 });
                const html = await page.content();
                return cheerio.load(html);
            }
            finally {
                await browser.close();
            }
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delayMultiplier * attempt));
            }
        }
    }
    throw lastError || new Error('Failed to fetch page after retries');
}
export async function fetchPageContent(url) {
    const browser = await launchBrowser();
    try {
        const page = await browser.newPage();
        await page.setUserAgent(DEFAULT_USER_AGENT);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const content = await page.content();
        return content;
    }
    finally {
        await browser.close();
    }
}
export async function scrapeWithRetry(url, maxRetries = 3, delayMs = 1000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fetchPageContent(url);
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
            }
        }
    }
    throw lastError || new Error('Failed to fetch page after retries');
}
//# sourceMappingURL=puppeteer.js.map