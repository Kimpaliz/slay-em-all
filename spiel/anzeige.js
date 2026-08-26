// Schreibt den Weltzustand in die Seite und nimmt Klicks entgegen.
//
// Die Seite markiert ihre Stellen mit `data-feld="..."`. Diese Datei kennt
// keine Rechnung und keine Simulation; sie liest ab, schreibt hin und
// meldet Klicks nach oben weiter.

import { RECKEN } from './daten/recken.js';
import { AUSBAUTEN, DAUERHAFT } from './daten/ausbauten.js';
import { tagesStand } from './tageslauf.js';
import {
  raten, torLeistung, einnahmen, engpass, preis, dauerhaftPreis,
  kannKaufen, kannDauerhaftKaufen, schaedelFuer, knochenBisSchaedel,
  darfNeuAnfangen, zahl, dauer, blutVergleich
} from '../werkzeuge/wirtschaft.mjs';

const WAEHRUNGSNAME = { blut: 'L', schrott: 'Schrott', knochen: 'Knochen' };

export function anzeigeAnlegen(wurzel = document, taten = {}) {
  const felder = new Map();
  for (const el of wurzel.querySelectorAll('[data-feld]')) felder.set(el.dataset.feld, el);

  const bestiarZeilen = zeilenAnlegen(wurzel.querySelector('[data-liste="bestiarium"]'));
  // Blut kauft man am Tor, Schrott in der Schatzkammer — zwei Listen,
  // aber dieselben Zeilen, damit das Aktualisieren einfach bleibt.
  const ausbauZeilen = [
    ...ausbautenAnlegen(wurzel.querySelector('[data-liste="blut-ausbauten"]'), taten.kaufen, 'blut'),
    ...ausbautenAnlegen(wurzel.querySelector('[data-liste="schrott-ausbauten"]'), taten.kaufen, 'schrott')
  ];
  const dauerZeilen = dauerhaftAnlegen(wurzel.querySelector('[data-liste="dauerhaft"]'), taten.dauerhaftKaufen);

  const tagesleiste = wurzel.querySelector('.tagesleiste');
  const phasenBalken = wurzel.querySelector('[data-balken="phase"]');
  const neuanfangKnopf = wurzel.querySelector('[data-tat="neuanfang"]');
  if (neuanfangKnopf && taten.neuanfang) {
    neuanfangKnopf.addEventListener('click', () => taten.neuanfang());
  }

  /** Setzt Text nur, wenn er sich geändert hat — spart Layoutarbeit. */
  function setze(name, text) {
    const el = felder.get(name);
    if (el && el.textContent !== text) el.textContent = text;
  }

  function zeichnen(welt) {
    const z = welt.zustand;
    const r = raten(z.stufen, z.dauerhaft);
    const stand = tagesStand(welt.szene.zeit);
    const proSekunde = einnahmen(z.erledigte, z.stufen, z.dauerhaft, stand.tag);

    waehrungen(z, proSekunde);
    tagUndNacht(welt, stand, r);
    torbetrieb(welt, z, r, stand, proSekunde);
    bestiarium(z, r);
    ausbauten(z, stand);
    neuanfang(z);
  }

  /* ---------------- Kopfzeile ---------------- */

  function waehrungen(z, proSekunde) {
    setze('blut', zahl(z.blut));
    setze('blutVergleich', blutVergleich(z.blut));
    setze('knochen', zahl(z.knochen));
    setze('schrott', zahl(z.schrott));
    setze('schrottKammer', zahl(z.schrott));
    setze('knochenKammer', zahl(z.knochen));

    const bis = knochenBisSchaedel(z.knochen);
    setze('knochenHinweis', `noch ${zahl(bis)} bis zum nächsten Schädel`);
    setze('schrottHinweis', proSekunde.schrott > 0
      ? `${zahl(proSekunde.schrott)} je Sekunde im Mittel`
      : 'kommt von Söldnern aufwärts');
  }

  /* ---------------- Tagesleiste ---------------- */

  function tagUndNacht(welt, stand, r) {
    setze('tagZahl', 'Tag ' + stand.tag);
    setze('phase', stand.istTag
      ? 'Tag — die Wellen kommen'
      : 'Nacht — abtragen und einkaufen');
    setze('phaseRest', 'noch ' + dauer(stand.restSekunden));
    if (tagesleiste) tagesleiste.dataset.phase = stand.phase;
    if (phasenBalken) phasenBalken.style.width = (stand.fortschritt * 100).toFixed(1) + '%';

    const haufen = welt.szene.haufen;
    setze('haufenStand', `Beutehaufen: ${zahl(haufen.stueck)} / ${zahl(r.lagerplatz)} Stück`);

    const verloren = Math.round(welt.szene.verlorenHeute);
    setze('haufenWarnung', verloren > 0
      ? `${zahl(verloren)} in den Graben gefallen — mehr Kobolde!`
      : (stand.istTag ? '' : `wird abgetragen: ${zahl(r.ernteTempo)} Stück je Sekunde`));
  }

  /* ---------------- Torbetrieb ---------------- */

  function torbetrieb(welt, z, r, stand, proSekunde) {
    setze('reckenProMinute', zahl(proSekunde.erledigte * 60));
    setze('blutProSekunde', zahl(proSekunde.blut));
    setze('verweildauer', (Math.round(r.verweildauer * 100) / 100).toFixed(2).replace('.', ',') + ' s');
    setze('erledigte', zahl(z.erledigte));
    setze('imTor', welt.szene.imTor.length + ' / ' + r.torplaetze);
    setze('aufBruecke', String(welt.szene.recken.length));

    const eng = engpass(z.stufen, z.dauerhaft);
    setze('engpass', eng === 'tor'
      ? `Das Tor bremst: es schafft ${zahl(torLeistung(z.stufen, z.dauerhaft))} Recken je Sekunde. Mehr Plätze oder schärfere Klingen helfen.`
      : 'Es kommen zu wenige. Lockrufe helfen.');
  }

  /* ---------------- Bestiarium ---------------- */

  function bestiarium(z, r) {
    for (const zeile of bestiarZeilen) {
      const frei = z.erledigte >= zeile.klasse.ab;
      zeile.wurzel.style.opacity = frei ? '1' : '0.45';
      zeile.name.textContent = frei ? zeile.klasse.name : '???';
      zeile.punkt.style.background = frei ? zeile.klasse.farbe : '#2b2d38';
      zeile.erledigt.textContent = frei ? zahl(z.proKlasse[zeile.klasse.id] || 0) : '—';
      zeile.blut.textContent = frei ? zahl(zeile.klasse.blut * r.beute) : '—';
    }
  }

  /* ---------------- Ausbauten ---------------- */

  function ausbauten(z, stand) {
    const offen = !stand.istTag;
    const zu = 'Das Haus handelt nur bei Dunkelheit. Noch ' + dauer(stand.restSekunden) + '.';
    setze('kaufHinweis', offen ? 'Es ist Nacht. Das Haus handelt.' : zu);
    setze('schrottHinweisKammer', offen
      ? 'Grutz ist wach und handelt.'
      : 'Grutz schläft bei Tageslicht. Noch ' + dauer(stand.restSekunden) + '.');
    setze('grutzRede', grutzSagt(z, offen));
    setze('letzterKauf', z.letzterKauf);

    for (const zeile of ausbauZeilen) {
      const stufe = z.stufen[zeile.ausbau.id] || 0;
      const kosten = preis(zeile.ausbau.id, stufe);
      const bezahlbar = kannKaufen(z, zeile.ausbau.id);

      zeile.stufe.textContent = 'Stufe ' + stufe;
      zeile.preis.textContent = zahl(kosten) + ' ' + WAEHRUNGSNAME[zeile.ausbau.waehrung];
      zeile.knopf.disabled = !offen || !bezahlbar;
      zeile.knopf.classList.toggle('bezahlbar', offen && bezahlbar);
    }
  }

  /* ---------------- Neuanfang ---------------- */

  function neuanfang(z) {
    const gewinn = schaedelFuer(z.knochen);
    const moeglich = darfNeuAnfangen(z);
    setze('neuanfangSchaedel', zahl(gewinn));
    setze('schaedel', zahl(z.schaedel));
    setze('neuanfangText', moeglich
      ? `Der Haufen gibt ${zahl(gewinn)} Schädel her. Abtragen setzt Blut, Schrott und alle Ausbauten zurück — Schädel und alles darunter Gekaufte bleiben.`
      : `Noch ${zahl(knochenBisSchaedel(z.knochen))} Knochen bis zum ersten Schädel dieser Runde.`);
    if (neuanfangKnopf) {
      neuanfangKnopf.disabled = !moeglich;
      neuanfangKnopf.classList.toggle('bezahlbar', moeglich);
    }

    for (const zeile of dauerZeilen) {
      const stufe = z.dauerhaft[zeile.eintrag.id] || 0;
      const kosten = dauerhaftPreis(zeile.eintrag.id, stufe);
      const voll = !isFinite(kosten);
      zeile.stufe.textContent = 'Stufe ' + stufe;
      zeile.preis.textContent = voll ? 'ausgebaut' : zahl(kosten) + ' Schädel';
      zeile.knopf.disabled = voll || !kannDauerhaftKaufen(z, zeile.eintrag.id);
      zeile.knopf.classList.toggle('bezahlbar', !zeile.knopf.disabled);
    }
  }

  return { zeichnen };
}

/**
 * Was Grutz gerade zu sagen hat.
 * Er kommentiert die Lage, statt immer dasselbe zu sagen — das ist der
 * billigste Weg, einer stehenden Figur Leben einzuhauchen.
 */
function grutzSagt(z, offen) {
  if (!offen) {
    return '„Bei Tageslicht wird nicht gehandelt. Komm wieder, wenn die ' +
      'Fackeln brennen — dann sortiere ich, was oben heruntergefallen ist."';
  }
  if (z.schrott < 8) {
    return '„Nichts da. Gar nichts. Bauern tragen kein Eisen, und Zähne ' +
      'nehme ich nicht in Zahlung. Warte auf die mit den Rüstungen."';
  }
  if (z.schaedel > 0) {
    return `„${Math.round(z.schaedel)} Schädel im Keller, und du stehst hier ` +
      'herum. Die werden nicht mehr wert, weißt du."';
  }
  if (z.knochen > 60) {
    return '„Der Haufen an der Mauer wird hoch. Irgendwann trägt der ' +
      'Hausherr ihn ab, und dann bleibt etwas davon übrig. Etwas Dauerhaftes."';
  }
  return '„Runter die Treppe, Vorsicht, Kopf. Was der Hausherr auswringt, ' +
    'sortiere ich. Eisen bleibt Eisen. Sag an, was du brauchst."';
}

/* ---------------- Listen einmalig aufbauen ---------------- */

function zeilenAnlegen(koerper) {
  if (!koerper) return [];
  koerper.textContent = '';
  return RECKEN.map((klasse) => {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    const huelle = document.createElement('span');
    huelle.className = 'zelle-name';
    const punkt = document.createElement('span');
    punkt.className = 'klassenpunkt';
    const name = document.createElement('span');
    huelle.append(punkt, name);
    tdName.append(huelle);

    const tdErledigt = document.createElement('td');
    tdErledigt.className = 'zelle-zahl';
    const tdBlut = document.createElement('td');
    tdBlut.className = 'zelle-zahl zelle-blut';

    tr.append(tdName, tdErledigt, tdBlut);
    koerper.append(tr);
    return { klasse, wurzel: tr, punkt, name, erledigt: tdErledigt, blut: tdBlut };
  });
}

function ausbautenAnlegen(liste, beiKauf, waehrung) {
  if (!liste) return [];
  liste.textContent = '';
  return AUSBAUTEN.filter((a) => !waehrung || a.waehrung === waehrung).map((ausbau) => {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'knopf ausbau';
    knopf.dataset.waehrung = ausbau.waehrung;

    const text = document.createElement('span');
    text.className = 'ausbau-text';
    const name = document.createElement('span');
    name.className = 'ausbau-name';
    name.textContent = ausbau.name;
    const beschreibung = document.createElement('span');
    beschreibung.className = 'ausbau-wirkung';
    beschreibung.textContent = ausbau.beschreibung;
    text.append(name, beschreibung);

    const rechts = document.createElement('span');
    rechts.className = 'ausbau-rechts';
    const preisEl = document.createElement('span');
    preisEl.className = 'ausbau-preis';
    const stufe = document.createElement('span');
    stufe.className = 'ausbau-stufe';
    rechts.append(preisEl, stufe);

    knopf.append(text, rechts);
    if (beiKauf) knopf.addEventListener('click', () => beiKauf(ausbau.id));
    liste.append(knopf);
    return { ausbau, knopf, preis: preisEl, stufe };
  });
}

function dauerhaftAnlegen(liste, beiKauf) {
  if (!liste) return [];
  liste.textContent = '';
  return DAUERHAFT.map((eintrag) => {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'knopf ausbau ausbau-dauerhaft';

    const text = document.createElement('span');
    text.className = 'ausbau-text';
    const name = document.createElement('span');
    name.className = 'ausbau-name';
    name.textContent = eintrag.name;
    const beschreibung = document.createElement('span');
    beschreibung.className = 'ausbau-wirkung';
    beschreibung.textContent = eintrag.beschreibung;
    text.append(name, beschreibung);

    const rechts = document.createElement('span');
    rechts.className = 'ausbau-rechts';
    const preisEl = document.createElement('span');
    preisEl.className = 'ausbau-preis';
    const stufe = document.createElement('span');
    stufe.className = 'ausbau-stufe';
    rechts.append(preisEl, stufe);

    knopf.append(text, rechts);
    if (beiKauf) knopf.addEventListener('click', () => beiKauf(eintrag.id));
    liste.append(knopf);
    return { eintrag, knopf, preis: preisEl, stufe };
  });
}
