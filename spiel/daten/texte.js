// Namen der Recken und die Sprüche der Händler.
//
// Getrennt vom Rest, damit sich am Ton etwas ändern lässt, ohne die
// Spiellogik anzufassen.
//
// **Der Marktschreier ist mit 0.11.0 entfallen** — das Laufband kostete
// Platz, den die breitere Bühne besser gebrauchen kann. Mit ihm sind
// seine Reimzeilen gegangen; was hier steht, wird noch benutzt.

export const NAMEN = [
  'Ansgar', 'Brunhild', 'Cuno', 'Dietwald', 'Egbert', 'Fridolin', 'Gerlinde',
  'Hartmut', 'Ingobert', 'Jorik', 'Kunibert', 'Lambrecht', 'Mechthild',
  'Norbert', 'Odilo', 'Prangert', 'Rüdiger', 'Siegwart', 'Thankmar',
  'Ulfhart', 'Volkmar', 'Wendelin', 'Bertram', 'Adelgunde'
];

export const BEINAMEN = [
  'der Kühne', 'der Auserwählte', 'die Unbeugsame', 'der Letzte seiner Art',
  'der Gesalbte', 'ohne Furcht', 'der Prophezeite', 'die Klinge des Lichts',
  'der Rechtschaffene', 'mit dem Plan'
];

/** Die Händler kommentieren jeden Kauf. */
export const SPRUCH_GROMMSCH = [
  'Frisch geschärft, hehe.',
  'Der Vorbesitzer braucht es nimmer.',
  'Gute Wahl, Chef!'
];
export const SPRUCH_PIPS = [
  'Glitzer! Mehr Glitzer!',
  'Kluges Köpfchen!',
  'Das lockt sie an, versprochen!'
];
export const SPRUCH_MALVINA = [
  'Entzückende Wahl, Schätzchen.',
  'Vorsicht — heiß.',
  'Das Blut war es wert, hm?'
];

/** Steht am Stand, solange nichts gekauft wurde. */
export const RUHESPRUCH = {
  grommsch: 'Gold her, dann reden wir.',
  pips: 'Wirf mit Gold, ich fange es auf!',
  malvina: 'Gold für Wunder. Faires Geschäft.'
};

/** Zufälliger Eintrag aus einer Liste. */
export function ausListe(liste) {
  return liste[(Math.random() * liste.length) | 0];
}

/** Name mit Beinamen — in gut jedem dritten Fall. */
export function reckenName() {
  const name = ausListe(NAMEN);
  return Math.random() < 0.4 ? name + ' ' + ausListe(BEINAMEN) : name;
}

/** Setzt den Namen in eine Zeile mit {n} ein. */
export function mitNamen(zeile, name) {
  return zeile.split('{n}').join(name);
}
