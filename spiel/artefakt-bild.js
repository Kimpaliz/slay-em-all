// Das Bild eines Artefakts.
//
// Es gibt keine Bilddateien: Die Symbole werden aus Rechtecken gesetzt,
// wie alles andere im Spiel. Die **Grundform** kommt vom vorherrschenden
// Tag (Flamme, Tropfen, Kristall, Blitz, Münze, Turm), die **Rahmenfarbe**
// von der Seltenheit. Beides zusammen macht ein Artefakt schon im
// Inventargitter lesbar, ohne dass man es antippen muss.
//
// Eine Funktion, zwei Verwendungen: `artefaktMalen` zeichnet in ein
// beliebiges Feld (Szene: 8 px, Inventar: 16 px), `artefaktSymbolZeichnen`
// füllt eine Leinwand damit.

import { tagsVon, seltenheitNach, TAG_FARBEN } from './artefakte.js';

/** Der Tag, der das Symbol bestimmt: der erste — Affixe stehen in Wurfreihenfolge. */
export function hauptTag(artefakt) {
  const tags = tagsVon(artefakt);
  return tags[0] || 'burg';
}

/**
 * Malt das Symbol in ein Quadrat der Kantenlänge `feld`.
 *
 * Gerechnet wird auf einem 8×8-Raster und dann mit `e` (Einheit)
 * hochskaliert — so sieht dasselbe Symbol bei 8 px und bei 16 px gleich
 * aus, nur gröber oder feiner.
 */
export function artefaktMalen(ctx, x0, y0, feld, artefakt) {
  const tag = hauptTag(artefakt);
  const s = seltenheitNach(artefakt.seltenheit);
  const e = feld / 8;
  const p = (fx, fy, fw, fh, farbe) => {
    ctx.fillStyle = farbe;
    ctx.fillRect(
      Math.round(x0 + fx * e), Math.round(y0 + fy * e),
      Math.max(1, Math.round(fw * e)), Math.max(1, Math.round(fh * e))
    );
  };

  const farbe = TAG_FARBEN[tag] || '#b4bac9';
  const dunkel = 'rgba(6,7,12,0.55)';

  // Rahmen in der Seltenheitsfarbe
  p(0, 0, 8, 1, s.farbe);
  p(0, 7, 8, 1, s.farbe);
  p(0, 0, 1, 8, s.farbe);
  p(7, 0, 1, 8, s.farbe);
  p(1, 1, 6, 6, '#14151f');

  if (tag === 'feuer') {
    p(3, 2, 2, 4, farbe);
    p(2, 4, 1, 2, farbe);
    p(5, 3, 1, 3, farbe);
    p(3, 2, 1, 1, '#ffd08a');
  } else if (tag === 'gift') {
    p(3, 2, 2, 1, farbe);
    p(2, 3, 4, 2, farbe);
    p(3, 5, 2, 1, farbe);
    p(3, 3, 1, 1, '#d8f5dc');
  } else if (tag === 'eis') {
    p(3, 1, 2, 6, farbe);
    p(2, 3, 4, 2, farbe);
    p(3, 3, 1, 1, '#eaf5ff');
  } else if (tag === 'blitz') {
    p(4, 1, 2, 3, farbe);
    p(2, 4, 2, 3, farbe);
    p(3, 3, 2, 1, farbe);
    p(4, 1, 1, 1, '#f5f2ff');
  } else if (tag === 'gold') {
    p(2, 2, 4, 4, farbe);
    p(3, 3, 2, 2, '#a5761f');
    p(2, 2, 1, 1, '#fff6c8');
  } else {
    // Burg: ein Turm mit Zinnen
    p(2, 2, 4, 5, farbe);
    p(2, 1, 1, 1, farbe);
    p(4, 1, 1, 1, farbe);
    p(3, 4, 2, 3, dunkel);
  }

  // Legendäres funkelt in der Ecke
  if (s.einzig) p(6, 1, 1, 1, '#fff6c8');
}

/** Füllt eine Leinwand mit dem Symbol. */
export function artefaktSymbolZeichnen(leinwand, artefakt) {
  if (!leinwand) return;
  const ctx = leinwand.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, leinwand.width, leinwand.height);
  if (artefakt) artefaktMalen(ctx, 0, 0, Math.min(leinwand.width, leinwand.height), artefakt);
}
