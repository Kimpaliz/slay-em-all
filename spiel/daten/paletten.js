// Die Farbwelten der Szene. `himmelOben`/`himmelUnten` sind der Verlauf,
// `stein` sind drei Abstufungen für Fels und Mauer, `warm` das Torfeuer.
// `dunst` und `licht` stehen als "R,G,B"-Text da, weil sie in rgba() wandern.

export const PALETTEN = {
  Nacht: {
    himmelOben: '#0c0e18', himmelUnten: '#1c1e30',
    huegelFern: '#141621', huegelNah: '#1b1d2b',
    stern: '#d4d0fb', mond: '#e9e7fe',
    schlucht: '#06070c', dunst: '56,58,74',
    stein: ['#20222c', '#292b35', '#343742'],
    warm: ['#ffd08a', '#ff7a2a', '#b32a12'],
    licht: '145,132,217'
  },
  Blutmond: {
    himmelOben: '#150e14', himmelUnten: '#2c1a1e',
    huegelFern: '#1a1116', huegelNah: '#22161c',
    stern: '#e3bcb6', mond: '#e2764c',
    schlucht: '#0a0608', dunst: '70,44,48',
    stein: ['#251f26', '#31282d', '#3e3337'],
    warm: ['#ffbe7a', '#ff5e1e', '#a51f10'],
    licht: '217,85,47'
  },
  Nebel: {
    himmelOben: '#101219', himmelUnten: '#23252e',
    huegelFern: '#181a21', huegelNah: '#20222a',
    stern: null, mond: null,
    schlucht: '#090a0f', dunst: '104,110,124',
    stein: ['#212329', '#2b2d34', '#373a41'],
    warm: ['#ffd7a4', '#ff8a45', '#9e3a1c'],
    licht: '150,150,165'
  }
};

export const PALETTE_STANDARD = 'Nacht';

/**
 * Wohin sich die Farben bei Tageslicht verschieben.
 *
 * Bewusst kein blauer Sommerhimmel: ein trüber, kalter Tag. Die Szene lebt
 * davon, dass die Torglut und die Fackeln das einzige warme Licht sind —
 * ein heller Mittag würde beides erschlagen. Man soll den Wechsel sehen,
 * ohne dass die Stimmung kippt.
 */
export const TAGLICHT = {
  himmelOben: '#46506a',
  himmelUnten: '#8c8f9b',
  huegelFern: '#3c4351',
  huegelNah: '#4b5263',
  schlucht: '#0d0f16',
  dunst: '132,138,152',
  stein: ['#3b3e48', '#484b56', '#575b67']
};

/** Farbe der Sonne und ihres Hofs. */
export const SONNE = { scheibe: '#f2e8d4', hof: '236,226,198' };

/* ---------------- Farben mischen ---------------- */

function zahlenAusHex(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function hexAusZahlen([r, g, b]) {
  const teil = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return '#' + teil(r) + teil(g) + teil(b);
}

/** Mischt zwei Hexfarben. `anteil` 0 gibt die erste, 1 die zweite. */
export function mischen(a, b, anteil) {
  if (anteil <= 0) return a;
  if (anteil >= 1) return b;
  const x = zahlenAusHex(a);
  const y = zahlenAusHex(b);
  return hexAusZahlen([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * anteil));
}

/** Dasselbe für die "R,G,B"-Textwerte, die in rgba() wandern. */
export function mischenRgb(a, b, anteil) {
  if (anteil <= 0) return a;
  if (anteil >= 1) return b;
  const x = a.split(',').map(Number);
  const y = b.split(',').map(Number);
  return [0, 1, 2].map((i) => Math.round(x[i] + (y[i] - x[i]) * anteil)).join(',');
}

/**
 * Die Palette für einen bestimmten Helligkeitsstand.
 * `helligkeit` 0 ist tiefste Nacht, 1 heller Tag.
 */
export function paletteFuer(name, helligkeit) {
  const nacht = PALETTEN[name] || PALETTEN[PALETTE_STANDARD];
  if (helligkeit <= 0) return nacht;
  const t = TAGLICHT;
  return {
    ...nacht,
    himmelOben: mischen(nacht.himmelOben, t.himmelOben, helligkeit),
    himmelUnten: mischen(nacht.himmelUnten, t.himmelUnten, helligkeit),
    huegelFern: mischen(nacht.huegelFern, t.huegelFern, helligkeit),
    huegelNah: mischen(nacht.huegelNah, t.huegelNah, helligkeit),
    schlucht: mischen(nacht.schlucht, t.schlucht, helligkeit),
    dunst: mischenRgb(nacht.dunst, t.dunst, helligkeit),
    stein: nacht.stein.map((farbe, i) => mischen(farbe, t.stein[i], helligkeit))
  };
}
