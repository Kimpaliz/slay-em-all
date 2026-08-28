// Farbstimmungen der Szene.
//
// Nachts gibt es drei wählbare Paletten, tagsüber genau eine. Der Wechsel
// zwischen Tag und Nacht läuft nicht hart, sondern über eine kurze
// Dämmerung — siehe `daemmerung` in der Simulation.
//
// `dunst` und `licht` stehen als "r,g,b" da, weil sie nur in
// rgba()-Ausdrücken mit wechselnder Deckkraft gebraucht werden.

export const NACHT_PALETTEN = {
  Nacht: {
    himmelOben: '#0c0e18', himmelUnten: '#1c1e30',
    huegelFern: '#141621', huegelNah: '#1b1d2b',
    stern: '#d4d0fb', mond: '#e9e7fe',
    abgrund: '#06070c', dunst: '56,58,74',
    stein: ['#20222c', '#292b35', '#343742'],
    licht: '145,132,217'
  },
  Blutmond: {
    himmelOben: '#150e14', himmelUnten: '#2c1a1e',
    huegelFern: '#1a1116', huegelNah: '#22161c',
    stern: '#e3bcb6', mond: '#e2764c',
    abgrund: '#0a0608', dunst: '70,44,48',
    stein: ['#251f26', '#31282d', '#3e3337'],
    licht: '217,85,47'
  },
  Nebel: {
    himmelOben: '#101219', himmelUnten: '#23252e',
    huegelFern: '#181a21', huegelNah: '#20222a',
    stern: null, mond: null,
    abgrund: '#090a0f', dunst: '104,110,124',
    stein: ['#212329', '#2b2d34', '#373a41'],
    licht: '150,150,165'
  }
};

export const TAG_PALETTE = {
  himmelOben: '#3d4763', himmelUnten: '#7a839f',
  huegelFern: '#2e3448', huegelNah: '#3c4258',
  stern: null, mond: null, sonne: true,
  abgrund: '#0d0e15', dunst: '96,102,120',
  stein: ['#2b2d38', '#383b47', '#484c5a'],
  licht: '220,205,160'
};

/**
 * Die Sterne stehen fest — sie flackern nur, sie wandern nicht.
 * Ihre Zahl richtet sich nach der Bühnenbreite, damit der Himmel über
 * dem neuen Land links nicht leer bleibt.
 */
export function sterneAnlegen(breite = 800) {
  const sterne = [];
  const anzahl = Math.round(breite / 8);
  for (let i = 0; i < anzahl; i++) {
    sterne.push({
      x: (i * 61 + 13) % breite,
      y: 4 + ((i * 37) % 74),
      helligkeit: 0.14 + ((i * 17) % 55) / 100,
      phase: (i * 1.7) % 6.28
    });
  }
  return sterne;
}
