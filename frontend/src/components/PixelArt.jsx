import { findCover } from '../art/covers.js';
import { PALETTE, SPRITES } from '../art/sprites.js';

// Draws one sprite as SVG rectangles. Neighbouring pixels of the same colour
// in a row are merged into one wider rectangle to keep the SVG small.
function SpriteRects({ rows }) {
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const char = row[x];
      let width = 1;
      while (row[x + width] === char) width++;
      if (char !== '.') {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={width} height={1} fill={PALETTE[char]} />);
      }
      x += width;
    }
  });
  return rects;
}

// A single sprite, e.g. <PixelSprite name="saturn" scale={3} />.
// Without a label the sprite is decorative and hidden from screen readers.
export function PixelSprite({ name, scale = 3, label, className }) {
  const rows = SPRITES[name];
  const width = rows[0].length;
  const height = rows.length;
  return (
    <svg
      className={className}
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <SpriteRects rows={rows} />
    </svg>
  );
}

// Extra stars for the wide banner, which shows more sky on both sides.
const WIDE_STARS = [
  ['twinkle', -58, 8],
  ['star', -30, 18],
  ['twinkle', -12, 4],
  ['twinkle', 80, 14],
  ['star', 104, 5],
  ['twinkle', 126, 21],
];

// A collection cover (see art/covers.js). It stretches to fill its container.
// `wide` shows a 208 × 32 strip (the normal scene plus extra sky on each side)
// so the cover still looks right as a long banner.
export function CoverArt({ cover, className, wide = false }) {
  const scene = findCover(cover);
  const items = wide ? [...WIDE_STARS, ...scene.items] : scene.items;
  return (
    <svg
      className={className}
      viewBox={wide ? '-72 0 208 32' : '0 0 64 32'}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="-72" width="208" height="32" fill={scene.background} />
      {scene.ground && (
        <rect x="-72" y={scene.ground.y} width="208" height={32 - scene.ground.y} fill={scene.ground.color} />
      )}
      {items.map(([name, x, y], index) => (
        <g key={index} transform={`translate(${x} ${y})`}>
          <SpriteRects rows={SPRITES[name]} />
        </g>
      ))}
    </svg>
  );
}
