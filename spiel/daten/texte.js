// Alles, was der Marktschreier und die Händler sagen.
//
// Getrennt vom Rest, damit sich am Ton etwas ändern lässt, ohne die
// Spiellogik anzufassen. `{n}` wird überall durch den Namen des gerade
// gefallenen Recken ersetzt.

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

/** Läuft, wenn gerade nichts Besonderes passiert ist. */
export const FUELLER = [
  'Hereinspaziert, ihr Recken! Das Tor steht offen, der Hausherr hat Hunger!',
  'Ruhm, Gold und ewige Ehre — hinten links, einfach reingehen!',
  'Frisches Blut gesucht — Erfahrung nicht erforderlich!',
  'Gold liegt auf der Brücke! Zugreifen, bevor die Raben rechnen lernen!',
  'Zu viele Gäste im Saal, und das Monster liegt flach — passt gut auf!'
];

export const NACHTS = [
  'Feierabend! Der Hof zählt Münzen, die Raben zählen Reste.',
  'Nachtlager: einkaufen, aufrüsten, Blutflecken bewundern.',
  'Der Zeugmeister hat geöffnet. Zahlung in Schrott, Beschwerden in Schweigen.'
];

/** Ein Recke ist im Tor verschwunden. */
export const IM_TOR_GESTORBEN = [
  '{n} zog aus, das Böse zu bezwingen — nun hört man nur die Knochen springen!',
  'Herbei, herbei, schaut alle her: {n} war ein tapfrer Recke. War!',
  'Rein ging ein Held mit Schild und Speer — raus kam ein Arm, und der war schwer!',
  '{n} klopfte, {n} trat ein, {n} ist nun Kleingebein!',
  'Der Helm rollt heim, der Held bleibt hier — so rechnet man im Burgrevier!',
  'Zwei Beine rein, ein Bein heraus — der Rest bleibt gern im Gästehaus!',
  '{n} sang noch von Ruhm und Sieg — das Lied brach mitten ab und schwieg.',
  'Ein Schild kehrt heim, verbeult und leer — nach dem Träger fragt keiner mehr!',
  '{n} suchte Ehr und fand ein Maul. Das Maul war schneller. Sehr. Genau.',
  'Was plumpst denn da in unsern Graben? Ein Schädel, den wir zu vergraben haben!',
  '{n} hat sich sehr bemüht — man sieht es dort, wo es rötlich sprüht.',
  'Ein Recke rein, ein Beutel raus — so macht das Haus den Abend draus!',
  '{n} war der Auserwählte — erwählt zum Abendbrot, vermelde!',
  'Die Rüstung war aus feinstem Stahl. Der Inhalt war es nicht. Egal!'
];

/** Flammenstoß oder Meteorit — der Recke verbrennt zu Asche. */
export const VERBRANNT = [
  'Knusprig! {n} hielt sich für helle — nun glimmt er leise vor der Schwelle.',
  'Feuer frei! {n} ist jetzt Asche — passt bequem in jede Tasche!',
  'Gut durch! {n} wollte Ruhm erwerben — jetzt hilft er höchstens noch beim Färben.'
];

/** Die Drachenpranke hat zugeschlagen. */
export const ZERMALMT = [
  'DIE PRANKE! Platt wie Flunder — {n} und Kollegen, welch Wunder!',
  'Zermalmt und eingeschleift — {n} hat den Ausgang nie erreicht!',
  'Ein Streich, ein Matsch, ein Schleifgeräusch — vom Stolz der Recken blieb kein Geräusch.'
];

/** Ein Bogenschütze hat getroffen. */
export const ERSCHOSSEN = [
  'Getroffen! {n} fing Pfeile — mit dem Gesicht, in aller Eile!',
  'Die Zinnen zwinkern, {n} fällt — so spart das Monster Haushaltsgeld!'
];

export const WELLE_GESCHAFFT = [
  'Welle überstanden! Der Hof zählt Münzen, die Raben zählen Reste.',
  'Sieg fürs Gemäuer! Aufsammeln, aufrüsten, weiterschlachten!'
];

export const WELLE_VERLOREN = [
  'Buuh! Überfüllung im Saal — das Monster liegt flach, fünf Wellen Strafe!',
  'Zu viele Gäste, zu wenig Maul — die Burg ist gefallen. Peinlich. Faul.'
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
  grommsch: 'Schrott her, dann reden wir.',
  pips: 'Wirf mit Gold, ich fange es auf!',
  malvina: 'Blut für Wunder. Faires Geschäft.'
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
