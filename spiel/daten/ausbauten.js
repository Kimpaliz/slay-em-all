// Die fünf Ausbauten der Burg und was der Marktschreier beim Kauf sagt.
//
// `wirkung` beschreibt in Worten, was die Stufe tut — die Zahlen dazu stehen
// gebündelt in werkzeuge/wirtschaft.mjs, damit man sie an einer Stelle dreht.

export const AUSBAUTEN = [
  {
    id: 'lockruf', name: 'Lockrufe im Tal',
    wirkung: 'Mehr Recken machen sich auf den Weg.'
  },
  {
    id: 'klinge', name: 'Scharfe Klingen',
    wirkung: 'Jeder Recke ist kürzer im Tor.'
  },
  {
    id: 'tor', name: 'Breiteres Tor',
    wirkung: 'Mehr Recken werden gleichzeitig bedient.'
  },
  {
    id: 'presse', name: 'Fettere Beute',
    wirkung: 'Aus jedem Recken kommt mehr heraus.'
  },
  {
    id: 'kobold', name: 'Kobold-Diener',
    wirkung: 'Wischen die Planken und bringen von selbst Blut ein.'
  }
];

export const AUSBAU_IDS = AUSBAUTEN.map((a) => a.id);

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
