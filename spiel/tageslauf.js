// Tag und Nacht — der Herzschlag des Spiels.
//
//   TAG    Recken kommen in Wellen über die Brücke und sterben im Tor.
//          Blut fließt sofort. Knochen und Schrott bleiben als Haufen an
//          der Mauer liegen. Gekauft wird nicht: das Haus handelt nicht
//          bei Tageslicht.
//
//   NACHT  Niemand kommt mehr. Die Kobolde tragen den Haufen ab, daraus
//          entstehen Knochen und Schrott. Jetzt wird eingekauft.
//
// Diese Datei rechnet nur — sie kennt weder Bildschirm noch Weltzustand.

export const TAG_DAUER = 100;   // Sekunden
export const NACHT_DAUER = 50;
export const VOLLER_TAG = TAG_DAUER + NACHT_DAUER;

/** Anteil des Tages, in dem es dämmert. */
const MORGEN = 0.14;
const ABEND = 0.20;

/**
 * Wo im Tageslauf wir gerade sind.
 *
 *   tag           der wievielte Tag (ab 1)
 *   istTag        wird gerade angegriffen?
 *   fortschritt   0 bis 1 innerhalb der aktuellen Phase
 *   restSekunden  bis zum Phasenwechsel
 *   helligkeit    0 = tiefste Nacht, 1 = heller Tag; weicher Übergang
 */
export function tagesStand(zeit) {
  const imZyklus = ((zeit % VOLLER_TAG) + VOLLER_TAG) % VOLLER_TAG;
  const istTag = imZyklus < TAG_DAUER;
  const fortschritt = istTag
    ? imZyklus / TAG_DAUER
    : (imZyklus - TAG_DAUER) / NACHT_DAUER;

  return {
    tag: Math.floor(zeit / VOLLER_TAG) + 1,
    istTag,
    phase: istTag ? 'tag' : 'nacht',
    fortschritt,
    restSekunden: istTag ? TAG_DAUER - imZyklus : VOLLER_TAG - imZyklus,
    helligkeit: istTag ? tagesHelligkeit(fortschritt) : 0
  };
}

function tagesHelligkeit(f) {
  if (f < MORGEN) return f / MORGEN;
  if (f > 1 - ABEND) return (1 - f) / ABEND;
  return 1;
}

/* ---------------- Wellen ---------------- */

/** Wie viele Wellen an einem Tag kommen. Mehr Tage, mehr Wellen. */
export function wellenZahl(tag) {
  return Math.min(6, 3 + Math.floor((tag - 1) / 3));
}

/**
 * Wie stark der Zulauf an dieser Stelle des Tages ist.
 *
 * Mehrere Glockenkurven nebeneinander ergeben Wellen mit Pausen dazwischen.
 * Der Mittelwert über den ganzen Tag ist auf 1 normiert — dadurch kommen
 * insgesamt genauso viele Recken wie bei gleichmäßigem Strom, sie kommen
 * nur gebündelt. Ohne diese Normierung würde jede Änderung an der
 * Wellenform unbemerkt die ganze Balance verschieben.
 */
export function wellenStaerke(fortschritt, anzahl) {
  return roheWelle(fortschritt, anzahl) / wellenMittel(anzahl);
}

function roheWelle(f, anzahl) {
  let summe = 0;
  const breite = 0.34 / anzahl;
  for (let i = 0; i < anzahl; i++) {
    const mitte = (i + 0.5) / anzahl;
    const d = (f - mitte) / breite;
    summe += Math.exp(-d * d);
  }
  return summe;
}

// Der Mittelwert hängt nur von der Wellenzahl ab, also einmal ausrechnen
// und merken.
const mittelwerte = new Map();
function wellenMittel(anzahl) {
  if (mittelwerte.has(anzahl)) return mittelwerte.get(anzahl);
  const schritte = 2000;
  let summe = 0;
  for (let i = 0; i < schritte; i++) summe += roheWelle((i + 0.5) / schritte, anzahl);
  const mittel = summe / schritte;
  mittelwerte.set(anzahl, mittel);
  return mittel;
}

/**
 * Der Zulauffaktor für einen Zeitpunkt. Nachts null.
 * Der Faktor VOLLER_TAG / TAG_DAUER gleicht aus, dass nachts niemand kommt:
 * über einen ganzen Zyklus kommen dadurch genauso viele Recken wie früher
 * bei durchgehendem Strom.
 */
export function zulaufFaktor(zeit) {
  const stand = tagesStand(zeit);
  if (!stand.istTag) return 0;
  return wellenStaerke(stand.fortschritt, wellenZahl(stand.tag)) * (VOLLER_TAG / TAG_DAUER);
}
