import { describe, expect, it } from 'vitest';
import { normalizeUrl, parseTags } from '../src/validation.js';

describe('normalizeUrl', () => {
  it('accepts http and https links and returns a cleaned URL', () => {
    expect(normalizeUrl('  https://Example.com/Docs  ').url).toBe('https://example.com/Docs');
    expect(normalizeUrl('http://localhost:5173').url).toBe('http://localhost:5173/');
  });

  it('gives the same key to links that only differ in small details', () => {
    const variants = [
      'https://example.com/docs',
      'http://example.com/docs',
      'https://www.example.com/docs/',
      'https://EXAMPLE.com:443/docs',
    ];
    const keys = variants.map((url) => normalizeUrl(url).key);
    expect(new Set(keys).size).toBe(1);
  });

  it('keeps query strings, because ?v=1 and ?v=2 are different videos', () => {
    expect(normalizeUrl('https://youtube.com/watch?v=1').key).not.toBe(normalizeUrl('https://youtube.com/watch?v=2').key);
  });

  it('rejects anything that is not a full http(s) link', () => {
    for (const bad of ['', 'example.com', 'mailto:me@example.com', 'file:///C:/secret.txt', 'javascript:alert(1)']) {
      expect(() => normalizeUrl(bad)).toThrow();
    }
  });
});

describe('parseTags', () => {
  it('trims, drops empty tags and removes duplicates ignoring case', () => {
    expect(parseTags([' Docker ', 'docker', '', 'watch later'])).toEqual(['Docker', 'watch later']);
  });

  it('rejects too many or too long tags', () => {
    expect(() => parseTags(Array.from({ length: 11 }, (_, i) => `tag${i}`))).toThrow();
    expect(() => parseTags(['x'.repeat(31)])).toThrow();
    expect(() => parseTags('docker')).toThrow();
  });
});
