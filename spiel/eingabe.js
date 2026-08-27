// Maus, Finger und Tastatur auf der Leinwand.
//
// Die Leinwand ist 480x200 Bildpunkte groß, wird aber je nach Fenster
// beliebig skaliert dargestellt. Jeder Klick muss deshalb aus
// Bildschirmkoordinaten in Spielkoordinaten umgerechnet werden — sonst
// träfe man auf dem Handy meterweit daneben.
//
// Zwei Dinge sind anklickbar: liegende Münzen und, wenn der
// Donnerschlag scharf ist, jede Stelle der Brücke.

import { MASSE } from './masse.js';
import { muenzeAufsammeln, statueEinsammeln } from './kampf.js';
import { blitzSetzen, klickAngriff } from './zauber.js';
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

  /** Die nächstgelegene Goldstatue — großzügiger Fang, sie ist ja groß. */
  function statueBei(x, y) {
    void y;
    let beste = null;
    let abstand = 11;
    for (const st of welt.szene.statuen) {
      const d = Math.abs(st.x + 3 - x);
      if (d < abstand) { abstand = d; beste = st; }
    }
    return beste;
  }

  /** Der nächstgelegene laufende Recke unter dem Zeiger. */
  function reckeBei(x, y) {
    if (y < 60) return null;
    let bester = null;
    let abstand = 9;
    for (const r of welt.szene.recken) {
      if (r.zustand !== 'laeuft') continue;
      const d = Math.abs(r.x + 3 - x);
      if (d < abstand) { abstand = d; bester = r; }
    }
    return bester;
  }

  // Die Reihenfolge ist die Rangfolge der Absichten: Ein scharfer Blitz
  // geht vor allem; Beute (Statue, Münze) geht vor dem Angriff, damit
  // Aufsammeln nie versehentlich die Klick-Abklingzeit anwirft.
  leinwand.addEventListener('click', (e) => {
    const { x, y } = ortAus(e);
    const werte = werteAus(welt.zustand.stufenG, welt.zustand.stufenP);

    if (welt.szene.donnerBereit) {
      blitzSetzen(welt, x, werte);
      rueckrufe.geaendert();
      return;
    }
    const st = statueBei(x, y);
    if (st) { statueEinsammeln(welt, st); return; }
    const m = muenzeBei(x, y);
    if (m) { muenzeAufsammeln(welt, m, true, werte.stolzFaktor); return; }

    const klick = welt.zustand.klick;
    if (klick.gekauft >= 1) {
      const ziel = klick.aktiv === 'titan' ? null : reckeBei(x, y);
      if (klickAngriff(welt, ziel, x, werte)) rueckrufe.geaendert();
    }
  });

  leinwand.addEventListener('mousemove', (e) => {
    const { x, y } = ortAus(e);
    let zeiger = 'default';
    if (welt.szene.donnerBereit) zeiger = 'crosshair';
    else if (welt.zustand.klick.aktiv === 'titan' && welt.zustand.klick.gekauft >= 1
      && welt.szene.phase === 'tag' && welt.szene.klickAbklingzeit <= 0) zeiger = 'crosshair';
    else if (statueBei(x, y) || muenzeBei(x, y)) zeiger = 'pointer';
    else if (welt.zustand.klick.gekauft >= 1 && welt.szene.klickAbklingzeit <= 0 && reckeBei(x, y)) zeiger = 'pointer';
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
