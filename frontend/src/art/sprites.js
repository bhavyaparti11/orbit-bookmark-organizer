// Orbit's pixel art, drawn as text. Each character is one pixel and maps to a
// colour in PALETTE below. A dot (.) is a transparent pixel.
// <PixelSprite> (components/PixelArt.jsx) turns these into crisp SVG.

export const PALETTE = {
  c: '#514438', // cocoa
  m: '#817568', // muted brown
  t: '#B8AA99', // mushroom taupe
  b: '#EAE2D6', // soft beige
  w: '#FFFDF8', // cream
  s: '#A3AD96', // sage
  g: '#89977C', // deeper sage
  l: '#CDD4C2', // light sage
  k: '#C29C82', // muted clay (used sparingly)
};

export const SPRITES = {
  saturn: [
    '..........cccc..........',
    '........ccbbbtcc........',
    '.......cbbtttttmc.......',
    '......cbtttttttmmc......',
    '......cbttttttttmc......',
    '..ssssctttttttttmcssss..',
    'sggggggggggggggggggggggs',
    '.ssssssssssssssssssssss.',
    '......cttttttttmmc......',
    '.......cttttttmmc.......',
    '........ccttmmcc........',
    '..........cccc..........',
  ],

  planet: [
    '..cccc..',
    '.cllsgc.',
    'cllsssgc',
    'clsssggc',
    'csssgggc',
    'cssggggc',
    '.cggggc.',
    '..cccc..',
  ],

  star: [
    '..t..',
    '..t..',
    'ttbtt',
    '..t..',
    '..t..',
  ],

  twinkle: [
    '.t.',
    'tbt',
    '.t.',
  ],

  moon: [
    '....wwww....',
    '..wwwbb.....',
    '.wwwb.......',
    '.wwb........',
    'wwwb........',
    'wwwb........',
    'wwwb........',
    'wwwb........',
    '.wwb........',
    '.wwwb.......',
    '..wwwbb.....',
    '....wwww....',
  ],

  satellite: [
    '.......m........',
    '.......m........',
    'gggg.cccccc.gggg',
    'gsgs.cttbbc.gsgs',
    'ggggmcttttcmgggg',
    'gsgs.ctttmc.gsgs',
    'gggg.cccccc.gggg',
  ],

  notebook: [
    'cccccccccccc',
    'cgsssssssssc',
    'cgsssssssssc',
    'cgsbbbbbbssc',
    'cgsbmmmmbssc',
    'cgsbbbbbbssc',
    'cgsssssssssc',
    'cgsssssssssc',
    'cgsssssssssc',
    'cgsssssssssc',
    'cgsssssssssc',
    'cgsssssssssc',
    'cccccccccccc',
    '.........k..',
    '.........k..',
  ],

  books: [
    '..cccccccccccc..',
    '..cssssssssslc..',
    '..cgggggggggsc..',
    '.cccccccccccccc.',
    '.ckkkkkkkkkkkbc.',
    '.cmkkkkkkkkkkkc.',
    'cccccccccccccccc',
    'ctttbbtttttttttc',
    'cttttttttttttttc',
    'cccccccccccccccc',
  ],

  bowl: [
    '.....t....t.....',
    '......t....t....',
    '.....t....t.....',
    '......t....t....',
    '.cccccccccccccc.',
    'cwwwkwwwgwwwkwwc',
    'ckkkkkkkkkkkkkkc',
    '.ckkkkkkkkkkkkc.',
    '..ckkkkkkkkkkc..',
    '...cccccccccc...',
    '.....cccccc.....',
  ],

  hills: [
    '............w...................',
    '...........www..................',
    '..........gwwwg.................',
    '.........ggwgwgg................',
    '........ggggggggg.......t.......',
    '.......ggggggggggg.....ttt......',
    '......ggggggggggggg...ttttt.....',
    '.....ggggggggggggggg.ttttttt....',
    '....gggggggggggggggggtttttttt...',
    '...gggggggggggggggggggtttttttt..',
    '..gggggggggggggggggggggtttttttt.',
    '.gggggggggggggggggggggggtttttttt',
  ],

  sun: [
    '.kkkk.',
    'kkkkkk',
    'kkkkkk',
    'kkkkkk',
    'kkkkkk',
    '.kkkk.',
  ],

  sprout: [
    '..ll....ll..',
    '.lsss..sssl.',
    '.sssgg.gsss.',
    '..sssgggss..',
    '.....gg.....',
    '.....gg.....',
    '.cccccccccc.',
    '.ckkkkkkkkc.',
    '..ckkkkkkc..',
    '..ckkkkkkc..',
    '...cccccc...',
  ],

  screen: [
    '.....c....c.....',
    '......c..c......',
    '.......cc.......',
    'cccccccccccccccc',
    'cllllllllllctttc',
    'cllllwlllllctctc',
    'cllllwwllllctttc',
    'cllllwwwlllctctc',
    'cllllwwllllctttc',
    'cllllwlllllctctc',
    'cllllllllllctttc',
    'cccccccccccccccc',
    '.cc..........cc.',
  ],

  comet: [
    '................ww..',
    '..............bwwww.',
    '............tbbwwwww',
    '..........ttbbbwwww.',
    '........sttbbb.ww...',
    '......sstttb........',
    '....ssstt...........',
    '..sss...............',
    'ss..................',
  ],
};
