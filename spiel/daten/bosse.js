// Namen und Sprüche für die Bosse.
//
// Ein Boss ist mechanisch nur ein sehr zäher Recke — was ihn zum Ereignis
// macht, ist der Name. Rang plus Vorname plus Beiname, alles gewürfelt:
// „Fürst Adelbrecht der Unverdauliche".

const RANG = ['Fürst', 'Graf', 'Ritterhauptmann', 'Hochmeister', 'Komtur', 'Marschall', 'Vogt'];

const RUFNAME = [
  'Adelbrecht', 'Reinmar', 'Gundolf', 'Eberwin', 'Siegfried', 'Hartmut',
  'Balduin', 'Wolfram', 'Dietrich', 'Godehard', 'Amalrich', 'Kunibert'
];

const BEINAME = [
  'der Unverdauliche', 'der Zähe', 'der Letzte seines Namens',
  'der Unbeugsame', 'der Sattmacher', 'mit dem eisernen Magen',
  'der Zweimal Gekaute', 'der Breitschultrige', 'der Wohlgenährte',
  'der Standhafte', 'die Schwerste Mahlzeit'
];

function ausListe(liste) {
  return liste[(Math.random() * liste.length) | 0];
}

/** Ein vollständiger Bossname. */
export function bossName() {
  return ausListe(RANG) + ' ' + ausListe(RUFNAME) + ' ' + ausListe(BEINAME);
}

/** Der Marktschreier kündigt ihn an. */
export const BOSS_ANKUNFT = [
  'Ein Großer kommt! {n} führt die Welle — der passt kaum durchs Tor!',
  'Achtung, Herrschaften: {n} hat sich angemeldet. Zweimal kauen!',
  '{n} im Anmarsch — heute wird es eng in der Halle!',
  'Der Hof putzt das Besteck: {n} ist unterwegs!'
];

/** Und meldet seinen Tod. */
export const BOSS_TOD = [
  '{n} ist Geschichte! Und was für eine sättigende.',
  'Runter mit {n} — das war eine ganze Mahlzeit auf einmal!',
  '{n} hat seinen Rang verloren, sein Gewicht und alles andere.',
  'Es hat gedauert, aber {n} ist durch. Buchstäblich.'
];
