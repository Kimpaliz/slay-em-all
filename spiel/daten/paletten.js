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
