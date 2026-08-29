// Maus, Finger und Tastatur auf der Leinwand.
//
// Die Leinwand ist 480x200 Bildpunkte groß, wird aber je nach Fenster
// beliebig skaliert dargestellt. Jeder Klick muss deshalb aus
// Bildschirmkoordinaten in Spielkoordinaten umgerechnet werden — sonst
// träfe man auf dem Handy meterweit daneben.

import { MASSE } from './masse.js';
import { muenzeAufsammeln, fundstueckNehmen } from './kampf.js';
import { blitzSetzen, klickAngriff, napalmSetzen } from './zauber.js';
import { wirkungAus } from './artefakte.js';
import { ZAUBER, werte as werteAus } from '../werkzeuge/wirtschaft.mjs';

/** Wie großzügig eine Münze getroffen wird. Fingerbedienung braucht mehr. */
const FANGWEITE = 12;
const FANGWEITE_FINGER = 18;

export function eingabeAnlegen(leinwand, welt, rueckrufe) {
  if (!leinwand) return null;
  let fingerBedienung = false;

  function ortAus(ereignis) {
    const r = leinwand.getBoundingClientRect();
    return {
      x: (ereignis.clientX - r.left) * MASSE.BREITE / r.width,
      y: (ereignis.clientY - r.top) * MASSE.HOEHE / r.height
    };
  }

  /** Die nächstgelegene Münze im Fangbereich — senkrecht großzügiger. */
  function muenzeBei(x, y) {
    const weite = fingerBedienung ? FANGWEITE_FINGER : FANGWEITE;
    let beste = null;
    let abstand = weite;
    for (const m of welt.szene.muenzen) {
      const d = Math.abs(m.x - x) + Math.abs(m.y - y) * 0.7;
      if (d < abstand) { abstand = d; beste = m; }
    }
    return beste;
  }

  leinwand.addEventListener('pointerdown', (e) => {
    fingerBedienung = e.pointerType !== 'mouse';
  });

  /** Das nächstgelegene Fundstück — großzügig, es ist selten. */
  function fundBei(x, y) {
    let bestes = null;
    let abstand = fingerBedienung ? 22 : 16;
    for (const f of welt.szene.fundstuecke) {
      const d = Math.abs(f.x - x) + Math.abs(f.y - y) * 0.6;
      if (d < abstand) { abstand = d; bestes = f; }
    }
    return bestes;
  }

  /** Der nächstgelegene laufende Recke unter dem Zeiger. */
  function reckeBei(x, y) {
    if (y < 60) return null;
    let bester = null;
    let abstand = 9;
    for (const r of welt.szene.recken) {
      if (r.zustand !== 'laeuft') continue;
      const weite = 9 * (r.groesse || 1);
      const d = Math.abs(r.x + 3 * (r.groesse || 1) - x);
      if (d < weite && d < abstand) { abstand = d; bester = r; }
    }
    return bester;
  }

  /** Kann der Klick gerade zuschlagen? */
  function angriffBereit() {
    return welt.zustand.klick.gekauft >= 1
      && welt.szene.phase === 'tag'
      && welt.szene.klickAbklingzeit <= 0;
  }

  // Die Rangfolge der Absichten: Ein scharfer Blitz geht vor allem, dann
  // das Fundstück (selten, darf nie verpasst werden), dann der **Angriff**
  // — er ist der Grund, dass man klickt. Erst wenn nicht geschlagen werden
  // kann (Abklingzeit läuft, kein Gegner unter dem Zeiger), fällt der
  // Klick auf die Münze durch. Wer schnell klickt, greift an; wer nach dem
  // Schlag klickt, sammelt.
  leinwand.addEventListener('click', (e) => {
    const { x, y } = ortAus(e);
    const werte = werteAus(welt.zustand.stufenG, welt.zustand.stufenP, wirkungAus(welt.zustand.regal));

    if (welt.szene.flammeBereit) {
      napalmSetzen(welt, x);
      rueckrufe.geaendert();
      return;
    }
    if (welt.szene.donnerBereit) {
      blitzSetzen(welt, x, werte);
      rueckrufe.geaendert();
      return;
    }

    const fund = fundBei(x, y);
    if (fund) {
      welt.szene.fundstuecke.splice(welt.szene.fundstuecke.indexOf(fund), 1);
      fundstueckNehmen(welt, fund.artefakt);
      rueckrufe.geaendert();
      return;
    }

    if (angriffBereit()) {
      const ziel = reckeBei(x, y);
      if (ziel && klickAngriff(welt, ziel, werte)) {
        rueckrufe.geaendert();
        return;
      }
    }

    const m = muenzeBei(x, y);
    if (m) muenzeAufsammeln(welt, m, true, werte);
  });

  leinwand.addEventListener('mousemove', (e) => {
    const { x, y } = ortAus(e);
    let zeiger = 'default';
    if (welt.szene.flammeBereit) welt.szene.zielX = x;
    if (welt.szene.donnerBereit || welt.szene.flammeBereit) zeiger = 'crosshair';
    else if (fundBei(x, y)) zeiger = 'pointer';
    else if (angriffBereit() && reckeBei(x, y)) zeiger = 'crosshair';
    else if (muenzeBei(x, y)) zeiger = 'pointer';
    if (leinwand.style.cursor !== zeiger) leinwand.style.cursor = zeiger;
  });

  const aufTaste = (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const z = ZAUBER.find((s) => s.taste === e.key);
    if (z) {
      e.preventDefault();
      rueckrufe.zauberAusloesen(z.k);
    }
  };
  window.addEventListener('keydown', aufTaste);

  return {
    abmelden() { window.removeEventListener('keydown', aufTaste); }
  };
}
