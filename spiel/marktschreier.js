// Das Laufband unter der Szene.
//
// Drei Textfelder wandern von rechts nach links. Ist eines links aus dem
// Bild gelaufen, bekommt es die nächste Zeile und wird hinter dem
// derzeit rechtesten wieder eingesetzt. So entsteht ein endloses Band
// aus drei Elementen, ohne dass ständig neue erzeugt werden.
//
// Warum nicht mit CSS-Animation: Die Zeilen sind unterschiedlich lang,
// und es soll kein Loch und keine Überlappung geben. Das lässt sich nur
// rechnen, wenn man die tatsächliche Breite jedes Textes kennt — und die
// steht erst fest, nachdem er im Dokument steht.

import { FUELLER, ausListe } from './daten/texte.js';

/** Abstand zwischen zwei Zeilen, in Bildpunkten. */
const LUECKE = 70;

/**
 * Eine Zeile für das Laufband vormerken.
 *
 * Gedrosselt: höchstens alle 0,8 Sekunden eine, und nie mehr als 14 in
 * der Warteschlange. Bei einer großen Welle sterben sonst so viele
 * Recken gleichzeitig, dass das Band die Kommentare nie aufholen könnte
 * und Minuten hinterherliefe.
 */
export function melden(szene, zeile) {
  if (szene.zeit - szene.letzterSpruch <= 0.8) return;
  if (szene.spruchQueue.length >= 14) return;
  szene.letzterSpruch = szene.zeit;
  szene.spruchQueue.push(zeile);
}

/** Nächste Zeile — aus der Warteschlange, sonst ein Füller. */
function naechsteZeile(szene) {
  return szene.spruchQueue.length ? szene.spruchQueue.shift() : ausListe(FUELLER);
}

export function marktschreierAnlegen(rahmen, felder) {
  if (!rahmen || !felder || felder.some((f) => !f)) return null;
  let plaetze = null;

  return {
    /** Ein Bildschritt. `welle` bestimmt das Tempo. */
    schritt(szene, dt, welle) {
      if (!rahmen.isConnected) { plaetze = null; return; }
      if (!plaetze) {
        let x = rahmen.offsetWidth;
        plaetze = felder.map((el) => {
          const breite = el.offsetWidth;
          const platz = { el, x, breite };
          x += breite + LUECKE;
          return platz;
        });
      }

      const tempo = Math.min(104, 46 + welle * 2);
      for (const p of plaetze) p.x -= tempo * dt;

      let rechtester = -1e9;
      for (const p of plaetze) {
        if (p.x + p.breite >= -30) rechtester = Math.max(rechtester, p.x + p.breite);
      }
      for (const p of plaetze) {
        if (p.x + p.breite < -30) {
          p.el.firstElementChild.textContent = naechsteZeile(szene);
          p.breite = p.el.offsetWidth;
          p.x = Math.max(rechtester + LUECKE, rahmen.offsetWidth * 0.35);
          rechtester = p.x + p.breite;
        }
        p.el.style.transform = 'translate(' + Math.round(p.x) + 'px,-50%)';
      }
    },

    /** Nach einem Wechsel der Bildschirmbreite neu ausmessen. */
    neuAusmessen() { plaetze = null; }
  };
}
