const PACIFIC_TIMEZONE_OFFSET = -8;
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
export function parseDate(dateStr) {
    const cleaned = dateStr.trim();
    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? null : parsed;
}
export function toPacificTime(date) {
    const pacificDate = new Date(date);
    pacificDate.setHours(pacificDate.getHours() + PACIFIC_TIMEZONE_OFFSET);
    return pacificDate;
}
export function parseSkillLevels(skillLevelsText) {
    const levels = [];
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
export function extractCityState(locationStr) {
    const parts = locationStr.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
        const state = parts[parts.length - 1].trim();
        const city = parts[parts.length - 2].trim();
        return { city, state };
    }
    return { city: '', state: '' };
}
export function sanitizeString(str, preserveNewlines = false) {
    if (!str)
        return '';
    if (preserveNewlines) {
        return str.replace(/[ \t]+/g, ' ').trim();
    }
    return str.replace(/\s+/g, ' ').trim();
}
export function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    }
    catch {
        return '';
    }
}
export function createTournament(sourceName, data) {
    return {
        name: data.name || '',
        sourceUrl: data.sourceUrl || '',
        source: sourceName,
        location: data.location || '',
        city: data.city || '',
        state: data.state || '',
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(),
        skillLevels: data.skillLevels || [],
        description: data.description,
        imageUrl: data.imageUrl,
        registrationUrl: data.registrationUrl,
    };
}
//# sourceMappingURL=utils.js.map