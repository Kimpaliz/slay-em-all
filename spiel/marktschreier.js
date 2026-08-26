// Das Laufband unter dem Bild. Drei Textfelder wandern nach links; sobald
// eines links hinausgeschoben ist, bekommt es den nächsten Spruch und setzt
// sich rechts wieder an. Dadurch reichen drei Elemente für endlosen Text.

import { FUELLSPRUECHE } from './daten/texte.js';

const ABSTAND = 70;

export function marktschreierAnlegen(rahmen, felder) {
  let bahnen = null;

  function naechsterSpruch(szene) {
    if (szene.spruchSchlange.length) return szene.spruchSchlange.shift();
    return FUELLSPRUECHE[(Math.random() * FUELLSPRUECHE.length) | 0];
  }

  function schritt(welt, dt) {
    if (!rahmen || felder.some((f) => !f)) return;

    if (!bahnen) {
      let x = rahmen.offsetWidth;
      bahnen = felder.map((el) => {
        const breite = el.offsetWidth;
        const bahn = { el, x, breite };
        x += breite + ABSTAND;
        return bahn;
      });
    }

    // Je weiter das Haus ist, desto hektischer der Ausrufer.
    const tempo = Math.min(104, 46 + welt.zustand.kaeufe * 1.8);
    for (const bahn of bahnen) bahn.x -= tempo * dt;

    let rechtester = -1e9;
    for (const bahn of bahnen) {
      if (bahn.x + bahn.breite >= -30) rechtester = Math.max(rechtester, bahn.x + bahn.breite);
    }

    for (const bahn of bahnen) {
      if (bahn.x + bahn.breite < -30) {
        bahn.el.firstElementChild.textContent = naechsterSpruch(welt.szene);
        bahn.breite = bahn.el.offsetWidth;
        bahn.x = Math.max(rechtester + ABSTAND, rahmen.offsetWidth * 0.35);
        rechtester = bahn.x + bahn.breite;
      }
      bahn.el.style.transform = 'translate(' + Math.round(bahn.x) + 'px,-50%)';
    }
  }

  /** Nach einer Größenänderung neu einmessen. */
  function neuEinmessen() { bahnen = null; }

  return { schritt, neuEinmessen };
}
