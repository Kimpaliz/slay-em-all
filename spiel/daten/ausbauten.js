// Die Ausbauten der Burg — und alle Stellschrauben dazu an einer Stelle.
//
// Hier darfst du Zahlen drehen. Was sie bedeuten:
//
//   waehrung        womit bezahlt wird: 'blut', 'schrott'
//   grundpreis      was die erste Stufe kostet
//   preiswachstum   Faktor je Stufe. 1,16 heißt: jede Stufe kostet 16 %
//                   mehr als die vorige.
//   wirkung         Faktor je Stufe auf die zugehörige Kennzahl.
//
// Faustregel fürs Gleichgewicht: `preiswachstum` muss größer sein als
// `wirkung`. Sonst bringt jede Stufe mehr ein, als die nächste kostet —
// dann rast das Spiel davon und ist nach zwanzig Minuten vorbei. Genau
// das war der Fehler der ersten Fassung, wo Ausbauten gar nichts kosteten.

export const AUSBAUTEN = [
  {
    id: 'lockruf',
    name: 'Lockrufe im Tal',
    beschreibung: 'Barden singen von unserem Schatz. Es kommen mehr.',
    waehrung: 'blut',
    grundpreis: 10,
    preiswachstum: 1.16,
    wirkung: 1.12,
    einheit: 'Zulauf'
  },
  {
    id: 'tor',
    name: 'Breiteres Tor',
    beschreibung: 'Ein Platz mehr im Dunkeln. Warteschlangen schaden dem Ruf.',
    waehrung: 'blut',
    grundpreis: 60,
    preiswachstum: 1.30,
    wirkung: 1,          // wirkt nicht multiplikativ, sondern +1 Platz je Stufe
    einheit: 'Torplätze'
  },
  {
    id: 'klinge',
    name: 'Scharfe Klingen',
    beschreibung: 'Kürzer drin, schneller raus.',
    waehrung: 'schrott',
    grundpreis: 8,
    preiswachstum: 1.19,
    wirkung: 1.11,
    einheit: 'Verweildauer'
  },
  {
    id: 'presse',
    name: 'Fettere Beute',
    beschreibung: 'Gründlicheres Auswringen. Nichts geht verloren.',
    waehrung: 'schrott',
    grundpreis: 30,
    preiswachstum: 1.21,
    wirkung: 1.13,
    einheit: 'Beute'
  },
  {
    id: 'kobold',
    name: 'Kobold-Diener',
    beschreibung: 'Tragen den Haufen nachts schneller ab — und stapeln ordentlicher, sodass mehr draufpasst.',
    waehrung: 'schrott',
    grundpreis: 90,
    preiswachstum: 1.28,
    wirkung: 1.22,
    einheit: 'Ernte und Lager'
  }
];

export const AUSBAU_IDS = AUSBAUTEN.map((a) => a.id);
export const AUSBAU_NACH_ID = Object.fromEntries(AUSBAUTEN.map((a) => [a.id, a]));

/* ---------------- Dauerhaftes, bezahlt mit Schädeln ---------------- */

// Schädel bekommt man nur beim Neuanfang. Was hier gekauft wird, bleibt
// über alle Neuanfänge hinweg bestehen.

export const DAUERHAFT = [
  {
    id: 'blutzoll',
    name: 'Blutzoll',
    beschreibung: 'Alle Beute steigt dauerhaft um 15 % je Stufe.',
    grundpreis: 1,
    preiswachstum: 2,
    wirkung: 1.15
  },
  {
    id: 'ruf',
    name: 'Ruf im Tal',
    beschreibung: 'Der Zulauf beginnt jede Runde 20 % höher je Stufe.',
    grundpreis: 1,
    preiswachstum: 2.2,
    wirkung: 1.2
  },
  {
    id: 'erbe',
    name: 'Erbe des Hauses',
    beschreibung: 'Jede Runde startet mit Blut und Schrott auf der Hand.',
    grundpreis: 2,
    preiswachstum: 2.5,
    wirkung: 1
  },
  {
    id: 'verwalter',
    name: 'Verwalter',
    beschreibung: 'Das Haus kauft wieder selbst ein. Zusehen genügt.',
    grundpreis: 6,
    preiswachstum: 4,
    wirkung: 1,
    hoechstStufe: 3
  }
];

export const DAUERHAFT_NACH_ID = Object.fromEntries(DAUERHAFT.map((d) => [d.id, d]));

/* ---------------- Was der Marktschreier beim Kauf ruft ---------------- */

export const KAUFSPRUCH = {
  lockruf: [
    'Neue Lockrufe bestellt — das Tal weiß jetzt von unserem Schatz.',
    'Ein Barde wurde bezahlt. Er singt von Gold. Er lügt hervorragend.'
  ],
  klinge: [
    'Klingen nachgeschliffen. Die Verweildauer sinkt.',
    'Neue Klingen eingesetzt — kürzer drin, schneller raus.'
  ],
  tor: [
    'Torbogen verbreitert. Mehr Recken gleichzeitig im Dunkeln.',
    'Türrahmen erweitert — Warteschlangen schaden dem Ruf.'
  ],
  presse: [
    'Presse justiert. Aus jedem Recken kommt mehr heraus.',
    'Gründlicheres Auswringen beschlossen. Nichts geht verloren.'
  ],
  kobold: [
    'Zwei Kobolde angestellt. Sie wischen, sie sortieren, sie murren.',
    'Kobold Grutz erhält einen zweiten Eimer.'
  ]
};
