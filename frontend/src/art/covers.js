// The collection cover gallery. Every cover is a tiny 64 × 32 pixel scene:
// a background colour, an optional ground strip and a few sprites placed at
// [spriteName, x, y]. The backend stores only the cover's key (e.g. "hills"),
// so these keys must match COVERS in backend/src/routes/collections.js.

const STARS = [
  ['twinkle', 5, 5],
  ['star', 52, 3],
  ['twinkle', 58, 22],
  ['twinkle', 9, 24],
];

export const COVERS = [
  {
    key: 'saturn',
    label: 'Saturn',
    background: '#DCE1D2',
    items: [...STARS, ['saturn', 20, 10]],
  },
  {
    key: 'moon',
    label: 'Night moon',
    background: '#5E5246',
    items: [...STARS, ['star', 44, 18], ['moon', 26, 10]],
  },
  {
    key: 'satellite',
    label: 'Satellite',
    background: '#E7DFD3',
    items: [...STARS, ['planet', 46, 6], ['satellite', 22, 13]],
  },
  {
    key: 'notebook',
    label: 'Notebook',
    background: '#C9D0BD',
    items: [['twinkle', 8, 6], ['twinkle', 52, 22], ['star', 47, 6], ['notebook', 26, 8]],
  },
  {
    key: 'library',
    label: 'Library',
    background: '#EFE7DA',
    ground: { y: 26, color: '#B8AA99' },
    items: [['twinkle', 8, 6], ['star', 50, 5], ['books', 24, 16]],
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    background: '#ECDCCB',
    ground: { y: 27, color: '#D9C6B2' },
    items: [['twinkle', 9, 7], ['twinkle', 53, 9], ['bowl', 24, 16]],
  },
  {
    key: 'hills',
    label: 'Faraway hills',
    background: '#EDE5D8',
    items: [['twinkle', 8, 5], ['twinkle', 30, 3], ['sun', 46, 5], ['hills', 16, 20]],
  },
  {
    key: 'sprout',
    label: 'Sprout',
    background: '#E1E5D7',
    ground: { y: 23, color: '#C8BBA9' },
    items: [['twinkle', 8, 6], ['star', 50, 5], ['sprout', 26, 12]],
  },
  {
    key: 'screen',
    label: 'Little screen',
    background: '#D9CDBF',
    items: [['twinkle', 7, 6], ['star', 50, 4], ['twinkle', 55, 23], ['screen', 24, 10]],
  },
  {
    key: 'comet',
    label: 'Comet',
    background: '#6E7863',
    items: [...STARS, ['planet', 8, 16], ['comet', 24, 9]],
  },
];

export const DEFAULT_COVER = 'saturn';

export function findCover(key) {
  return COVERS.find((cover) => cover.key === key) ?? COVERS[0];
}
