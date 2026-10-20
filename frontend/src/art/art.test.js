import { describe, expect, it } from 'vitest';
import { COVERS, findCover } from './covers.js';
import { PALETTE, SPRITES } from './sprites.js';

describe('pixel sprites', () => {
  it.each(Object.entries(SPRITES))('"%s" is a rectangle that only uses palette colours', (name, rows) => {
    const width = rows[0].length;
    for (const row of rows) {
      expect(row.length, `a row of "${name}" has the wrong width`).toBe(width);
      for (const char of row) {
        expect(char === '.' || char in PALETTE, `unknown colour "${char}" in "${name}"`).toBe(true);
      }
    }
  });
});

describe('collection covers', () => {
  it('has between 8 and 12 covers with unique keys', () => {
    expect(COVERS.length).toBeGreaterThanOrEqual(8);
    expect(COVERS.length).toBeLessThanOrEqual(12);
    expect(new Set(COVERS.map((c) => c.key)).size).toBe(COVERS.length);
  });

  it('only uses sprites that exist and keeps them inside the 64 × 32 scene', () => {
    for (const cover of COVERS) {
      for (const [name, x, y] of cover.items) {
        const rows = SPRITES[name];
        expect(rows, `cover "${cover.key}" uses unknown sprite "${name}"`).toBeDefined();
        expect(x + rows[0].length).toBeLessThanOrEqual(64);
        expect(y + rows.length).toBeLessThanOrEqual(32);
      }
    }
  });

  it('falls back to the default cover for an unknown key', () => {
    expect(findCover('nope').key).toBe('saturn');
  });
});
