// Small text helpers used by the forms and cards.

// The same rule as the backend: only full http:// or https:// links.
// Checking in the browser gives instant feedback; the backend still checks
// again, because a request can be sent without using this interface.
export function isValidHttpUrl(value) {
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

// "https://www.youtube.com/watch?v=1" -> "youtube.com"
export function siteName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Adds a tag to a list unless it is empty or already there (ignoring case).
export function addTag(tags, value) {
  const tag = value.trim().replace(/,+$/, '').trim();
  if (!tag || tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return tags;
  return [...tags, tag];
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
