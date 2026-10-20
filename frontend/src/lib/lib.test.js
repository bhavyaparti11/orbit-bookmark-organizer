import { describe, expect, it } from 'vitest';
import { toQueryString } from './api.js';
import { addTag, greeting, isValidHttpUrl, plural, siteName } from './text.js';
import { versionLabel } from './version.js';

describe('isValidHttpUrl', () => {
  it('accepts full http and https links', () => {
    expect(isValidHttpUrl('https://github.com')).toBe(true);
    expect(isValidHttpUrl('  http://localhost:3000/api ')).toBe(true);
  });

  it('rejects incomplete links and other protocols', () => {
    for (const value of ['', 'github.com', 'ftp://files.example.com', 'javascript:alert(1)', 'https://']) {
      expect(isValidHttpUrl(value), value).toBe(false);
    }
  });
});

describe('addTag', () => {
  it('adds trimmed tags and ignores empty or repeated ones', () => {
    let tags = addTag([], ' Docker, ');
    tags = addTag(tags, 'docker');
    tags = addTag(tags, '   ');
    tags = addTag(tags, 'watch later');
    expect(tags).toEqual(['Docker', 'watch later']);
  });
});

describe('toQueryString', () => {
  it('builds a query string and skips empty filters', () => {
    expect(toQueryString({ q: 'docker basics', collectionId: 3, subgroupId: '', tag: null })).toBe(
      '?q=docker+basics&collectionId=3',
    );
    expect(toQueryString({})).toBe('');
  });
});

describe('display helpers', () => {
  it('shows the site name without www', () => {
    expect(siteName('https://www.youtube.com/watch?v=1')).toBe('youtube.com');
  });

  it('greets according to the time of day', () => {
    expect(greeting(new Date(2026, 0, 1, 9))).toBe('Good morning');
    expect(greeting(new Date(2026, 0, 1, 20))).toBe('Good evening');
  });

  it('pluralises counts', () => {
    expect(plural(1, 'link')).toBe('1 link');
    expect(plural(3, 'link')).toBe('3 links');
  });
});

describe('versionLabel', () => {
  it('shows the version and the build day', () => {
    expect(versionLabel('sha-1a2b3c4', '2026-10-20T14:05Z')).toBe('sha-1a2b3c4 · 20 Oct 2026');
  });

  it('shows only the version when there is no valid build date', () => {
    expect(versionLabel('dev', '')).toBe('dev');
    expect(versionLabel('local', 'not a date')).toBe('local');
  });
});
