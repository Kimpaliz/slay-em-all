// Schreibt den Weltzustand in die Seite. Das ist der Teil, den vorher React
// erledigt hat — hier reichen ein paar gezielte Textzuweisungen.
//
// Die Seite markiert ihre Stellen mit `data-feld="..."`. Diese Datei kennt
// keine Rechnung und keine Simulation; sie liest nur ab und schreibt hin.

import { RECKEN } from './daten/recken.js';
import { AUSBAUTEN } from './daten/ausbauten.js';
import { raten, durchsatz, blutProSekunde, zahl } from '../werkzeuge/wirtschaft.mjs';

export function anzeigeAnlegen(wurzel = document) {
  const felder = new Map();
  for (const el of wurzel.querySelectorAll('[data-feld]')) felder.set(el.dataset.feld, el);

  const bestiarium = wurzel.querySelector('[data-liste="bestiarium"]');
  const ausbauliste = wurzel.querySelector('[data-liste="ausbauten"]');

  const bestiarZeilen = bestiarium ? zeilenAnlegen(bestiarium) : [];
  const ausbauZeilen = ausbauliste ? ausbautenAnlegen(ausbauliste) : [];

  /** Setzt Text nur, wenn er sich geändert hat — spart Layoutarbeit. */
  function setze(name, text) {
    const el = felder.get(name);
    if (el && el.textContent !== text) el.textContent = text;
  }

  function zeichnen(welt) {
    const z = welt.zustand;
    const r = raten(z.stufen);

    setze('blut', zahl(z.blut));
    setze('knochen', zahl(z.knochen));
    setze('schrott', zahl(z.schrott));

    setze('erledigte', zahl(z.erledigte));
    setze('reckenProMinute', zahl(r.zulauf * 60));
    setze('blutProSekunde', zahl(blutProSekunde(z.erledigte, z.stufen)));
    setze('verweildauer', (Math.round(r.verweildauer * 100) / 100).toFixed(2).replace('.', ',') + ' s');
    setze('imTor', welt.szene.imTor.length + ' / ' + r.torplaetze);
    setze('aufBruecke', String(welt.szene.recken.length));
    setze('durchsatz', zahl(durchsatz(z.stufen) * 60));
    setze('stufe', 'Stufe ' + (1 + Math.floor(z.kaeufe / 3)));
    setze('letzterKauf', z.letzterKauf);

    for (const zeile of bestiarZeilen) {
      const frei = z.erledigte >= zeile.klasse.ab;
      zeile.wurzel.style.opacity = frei ? '1' : '0.45';
      zeile.name.textContent = frei ? zeile.klasse.name : '???';
      zeile.punkt.style.background = frei ? zeile.klasse.farbe : '#2b2d38';
      zeile.erledigt.textContent = frei ? zahl(z.proKlasse[zeile.klasse.id] || 0) : '—';
      zeile.blut.textContent = frei ? zahl(Math.round(zeile.klasse.blut * r.beute)) : '—';
    }

    for (const zeile of ausbauZeilen) {
      zeile.stufe.textContent = 'Stufe ' + (z.stufen[zeile.ausbau.id] || 0);
    }
  }

  return { zeichnen };
}

/** Baut die Bestiariumszeilen einmalig auf und merkt sich die Stellen. */
function zeilenAnlegen(koerper) {
  koerper.textContent = '';
  return RECKEN.map((klasse) => {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.className = 'zelle-name';
    const punkt = document.createElement('span');
    punkt.className = 'klassenpunkt';
    const name = document.createElement('span');
    tdName.append(punkt, name);

    const tdErledigt = document.createElement('td');
    tdErledigt.className = 'zelle-zahl';
    const tdBlut = document.createElement('td');
    tdBlut.className = 'zelle-zahl zelle-blut';

    tr.append(tdName, tdErledigt, tdBlut);
    koerper.append(tr);
    return { klasse, wurzel: tr, punkt, name, erledigt: tdErledigt, blut: tdBlut };
  });
}

function ausbautenAnlegen(liste) {
  liste.textContent = '';
  return AUSBAUTEN.map((ausbau) => {
    const zeile = document.createElement('div');
    zeile.className = 'ausbau';

    const text = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'ausbau-name';
    name.textContent = ausbau.name;
    const wirkung = document.createElement('div');
    wirkung.className = 'ausbau-wirkung';
    wirkung.textContent = ausbau.wirkung;
    text.append(name, wirkung);

    const stufe = document.createElement('div');
    stufe.className = 'ausbau-stufe';

    zeile.append(text, stufe);
    liste.append(zeile);
    return { ausbau, stufe };
  });
}
