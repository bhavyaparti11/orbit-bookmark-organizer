// Small helpers that check and clean the data sent by the browser.
// Every helper either returns a clean value or throws an HttpError,
// which the error handler in app.js turns into a JSON error response.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function requiredText(value, label, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new HttpError(400, `${label} is required.`);
  if (text.length > maxLength) {
    throw new HttpError(400, `${label} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

export function optionalText(value, label, maxLength) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new HttpError(400, `${label} must be text.`);
  const text = value.trim();
  if (text.length > maxLength) {
    throw new HttpError(400, `${label} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

// Turns "12" or 12 into the number 12. Empty values become null when allowed.
export function parseId(value, label, { optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === '')) return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, `${label} is not valid.`);
  return id;
}

// Checks a URL and returns two versions of it:
//   url — the cleaned link we store and open, e.g. "https://www.example.com/docs/"
//   key — a normalised form used only to detect duplicates, e.g. "example.com/docs"
//
// Two links count as the same if they differ only in http/https, a leading
// "www.", upper/lower case in the domain, a default port or a trailing slash.
export function normalizeUrl(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new HttpError(400, 'URL is required.');
  if (text.length > 2048) throw new HttpError(400, 'URL is too long.');

  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new HttpError(400, 'Please enter a full link starting with http:// or https://');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new HttpError(400, 'Only http:// and https:// links can be saved.');
  }
  if (!parsed.hostname) throw new HttpError(400, 'The link needs a website address.');

  const host = parsed.hostname.replace(/^www\./, '');
  const port = parsed.port ? `:${parsed.port}` : '';
  const pathname = parsed.pathname.replace(/\/+$/, '');

  return {
    url: parsed.href,
    key: `${host}${port}${pathname}${parsed.search}${parsed.hash}`,
  };
}

export const MAX_TAGS = 10;

// Accepts ["Docker", "beginner"], trims each tag and removes duplicates
// (ignoring upper/lower case, so "docker" and "Docker" are the same tag).
export function parseTags(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new HttpError(400, 'Tags must be a list.');

  const tags = [];
  for (const item of value) {
    const tag = typeof item === 'string' ? item.trim() : '';
    if (!tag) continue;
    if (tag.length > 30) throw new HttpError(400, 'Each tag must be 30 characters or fewer.');
    if (!tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) tags.push(tag);
  }
  if (tags.length > MAX_TAGS) throw new HttpError(400, `A bookmark can have up to ${MAX_TAGS} tags.`);
  return tags;
}
