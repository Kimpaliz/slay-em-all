// Die Brücke zwischen Spielzustand und Bedienoberfläche.
//
// Zwei getrennte Aufgaben, mit Absicht getrennt gehalten:
//
//   `aufbauen()`  erzeugt die Knöpfe einmal aus den Datentabellen. Wer
//                 eine Ware ergänzt, ergänzt sie in `wirtschaft.mjs` —
//                 im HTML steht nur die leere Liste.
//   `auffrischen()` schreibt Zahlen und Zustände in die vorhandenen
//                 Elemente. Es erzeugt nichts und wirft nichts weg,
//                 sonst verlöre ein gerade gedrückter Knopf den Fokus.
//
// Geschrieben wird nur, was sich geändert hat. Bei 60 Bildern je Sekunde
// wäre blindes Setzen von `textContent` messbar teuer — und der Browser
// würde jedes Mal neu umbrechen.

import {
  WAREN_GROMMSCH, WAREN_PIPS, ZAUBER, RITUAL_PREIS, KLICK, SCHADENSARTEN,
  werte as werteAus, wellenStaerke, zauberWerte, ausbauPreis,
  klickWerte, klickAusbauPreis, istBosswelle, zahl
} from '../werkzeuge/wirtschaft.mjs';
import { ACHSEN, KLICK_ACHSEN, wareZustand } from './handel.js';
import { symbolZeichnen, waehrungZeichnen } from './portraets.js';
import { artefaktSymbolZeichnen } from './artefakt-bild.js';
import {
  wirkungAus, seltenheitNach, affixZeilen, verkaufswert, tagsVon,
  REGAL_PLAETZE, INVENTAR_PLAETZE, TAG_NAMEN, TAG_FARBEN
} from './artefakte.js';
import { RECKEN } from './daten/recken.js';
import { RITUAL_WARTEZEIT } from './wellen.js';

/** Ab dieser Breite gilt die Seite als schmal. */
const SCHMAL_BREITE = 820;
const SCHMAL_HOEHE = 640;

export function anzeigeAnlegen(wurzel, rueckrufe) {
  const feld = {};
  for (const el of wurzel.querySelectorAll('[data-feld]')) feld[el.dataset.feld] = el;

  const listen = {};
  for (const el of wurzel.querySelectorAll('[data-liste]')) listen[el.dataset.liste] = el;

  const knoepfe = {};
  for (const el of wurzel.querySelectorAll('[data-knopf]')) knoepfe[el.dataset.knopf] = el;

  const seiten = wurzel.querySelector('[data-seiten]');
  const reiterKnoepfe = [...wurzel.querySelectorAll('[data-reiterknopf]')];

  const letzte = {};
  let zauberLeisteStand = '';
  let vorschauStand = '';
  let artefaktStand = '';
  let gewaehlt = null;       // { ort: 'regal' | 'inventar', index }
  let neustartScharf = false;
  let neustartUhr = null;

  /* ---------- Der Tooltip ---------- */

  // Ein einziges Popup für alle Knöpfe: Aktionsleiste und Ladenknöpfe.
  // Es wird beim Überfahren gefüllt und über dem Knopf ausgerichtet.
  const tipp = document.createElement('div');
  tipp.className = 'zaubertipp';
  tipp.hidden = true;
  wurzel.appendChild(tipp);

  function tippZeile(zeichen, name, basis, bonus, einheit, farbe, bonusGut) {
    const zeile = document.createElement('div');
    zeile.className = 'tipp-zeile';
    const links = document.createElement('span');
    links.className = 'tipp-name';
    links.textContent = zeichen + ' ' + name;
    const rechts = document.createElement('span');
    rechts.className = 'tipp-wert';
    rechts.style.color = farbe;
    rechts.textContent = basis + (einheit || '');
    if (bonus) {
      const plus = document.createElement('span');
      plus.className = 'tipp-bonus' + (bonusGut === false ? ' schlecht' : '');
      plus.textContent = ' ' + bonus;
      rechts.appendChild(plus);
    }
    zeile.append(links, rechts);
    return zeile;
  }

  function tippKopf(text, unterText) {
    tipp.textContent = '';
    const kopf = document.createElement('div');
    kopf.className = 'tipp-kopf';
    kopf.textContent = text;
    tipp.appendChild(kopf);
    if (unterText) {
      const beschr = document.createElement('div');
      beschr.className = 'tipp-text';
      beschr.textContent = unterText;
      tipp.appendChild(beschr);
    }
  }

  /**
   * Füllt den Tooltip für einen Zauber oder den Klick.
   *
   * Basiswert und Bonus stehen getrennt: "100 +150" heißt Grundwert 100,
   * dazugekauft 150. So sieht man auf einen Blick, was die Stufen bringen.
   */
  function tippFuellen(k, zustand) {
    if (k === 'klick') {
      const w = klickWerte(zustand.klick, wirkungAus(zustand.regal));
      tippKopf(KLICK.name, KLICK.lang);
      tipp.appendChild(tippZeile('⚔', 'Schaden', KLICK.schaden,
        w.schaden > KLICK.schaden ? '+' + (w.schaden - KLICK.schaden) : '', '', '#ff8a6a'));
      tipp.appendChild(tippZeile('⏱', 'Abklingzeit', KLICK.abklingzeit.toFixed(1).replace('.', ','),
        w.abklingzeit < KLICK.abklingzeit - 0.01
          ? '−' + (KLICK.abklingzeit - w.abklingzeit).toFixed(1).replace('.', ',') + ' s' : '',
        ' s', '#9ecbff'));
      tipp.appendChild(tippZeile('✛', 'Kritisch', Math.round(KLICK.krit * 100) + ' %',
        w.krit > KLICK.krit + 0.001 ? '+' + Math.round((w.krit - KLICK.krit) * 100) + ' %' : '', '', '#ffd08a'));
      tipp.appendChild(artZeile(KLICK.art));
      return;
    }

    const z = ZAUBER.find((e) => e.k === k);
    const stufe = zustand.zauber[k];
    const w = zauberWerte(z, stufe);
    tippKopf(z.name + '  ·  Taste ' + z.taste, z.lang);
    tipp.appendChild(tippZeile('⚔', 'Schaden', z.schaden,
      stufe.schaden > 0 ? '+' + (w.schaden - z.schaden) : '', '', '#ff8a6a'));
    tipp.appendChild(tippZeile('⏱', 'Abklingzeit', z.abklingzeit.toFixed(0),
      stufe.abklingzeit > 0 ? '−' + (z.abklingzeit - w.abklingzeit).toFixed(1).replace('.', ',') + ' s' : '',
      ' s', '#9ecbff'));
    tipp.appendChild(tippZeile('◎', 'Wirkbereich', z.wirkbereich,
      stufe.wirkbereich > 0 ? '+' + (w.wirkbereich - z.wirkbereich) : '', ' px', '#d2cefd'));
    tipp.appendChild(artZeile(z.art));
  }

  /** Die Schadensart als eigene Zeile, in ihrer Farbe. */
  function artZeile(art) {
    const a = SCHADENSARTEN[art] || SCHADENSARTEN.physisch;
    return tippZeile('❖', 'Schadensart', a.name, '', '', a.farbe);
  }

  /**
   * Tooltip einer Ladenware: was sie jetzt tut, und was die nächste
   * Stufe drauflegt. Dieselbe Mechanik wie der Tooltip der Aktionsleiste.
   */
  function tippWareFuellen(ware, z, welle) {
    tippKopf(ware.name + (z.stufe > 0 ? '  ·  Stufe ' + z.stufe : ''), ware.text);
    if (ware.wertJetzt) {
      tipp.appendChild(tippZeile('▸', 'Jetzt', ware.wertJetzt(z.stufe), '', '', '#8fd39a'));
    }
    if (z.gesperrt) {
      tipp.appendChild(tippZeile('✕', 'Gesperrt', ware.gesperrtText || 'noch nicht verfügbar',
        '', '', '#c1444f'));
    } else if (z.voll) {
      tipp.appendChild(tippZeile('✓', 'Ausgereizt', 'Höchststufe ' + ware.max, '', '', '#9ecbff'));
    } else {
      if (ware.wertNaechste) {
        tipp.appendChild(tippZeile('▲', 'Nächste Stufe', ware.wertNaechste(z.stufe), '', '', '#d2cefd'));
      }
      tipp.appendChild(tippZeile('◆', 'Preis', zahl(z.preis), '', ' Gold', '#e0b64f'));
    }
    void welle;
  }

  function tippAusrichten(knopf) {
    tipp.hidden = false;
    const wr = wurzel.getBoundingClientRect();
    const kr = knopf.getBoundingClientRect();
    const breite = tipp.offsetWidth;
    let links = kr.left - wr.left + kr.width / 2 - breite / 2;
    links = Math.max(6, Math.min(links, wr.width - breite - 6));
    tipp.style.left = links + 'px';
    let oben = kr.top - wr.top - tipp.offsetHeight - 8;
    // Kein Platz darüber? Dann darunter.
    if (oben < 4) oben = kr.bottom - wr.top + 8;
    tipp.style.top = oben + 'px';
  }

  function tippZeigen(knopf, k, zustand) {
    tippFuellen(k, zustand);
    tippAusrichten(knopf);
  }

  /* ---------- Aufbau der Läden ---------- */

  /** Ein Ladenknopf: Goldzeichen plus Preis. */
  function preisKnopf() {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'ware-knopf';
    const zeichen = document.createElement('canvas');
    zeichen.width = 10;
    zeichen.height = 10;
    zeichen.className = 'waehrung';
    waehrungZeichnen(zeichen, 'gold');
    const preis = document.createElement('span');
    knopf.append(zeichen, preis);
    return { knopf, zeichen, preis };
  }

  const warenZeilen = { grommsch: [], pips: [] };

  function warenAufbauen(name, waren, kaufen) {
    const liste = listen[name];
    if (!liste) return;
    liste.textContent = '';
    for (const ware of waren) {
      const li = document.createElement('li');
      li.className = 'ware';

      const text = document.createElement('div');
      text.className = 'ware-text';
      const titel = document.createElement('div');
      titel.className = 'ware-name';
      titel.textContent = ware.name;
      const unter = document.createElement('div');
      unter.className = 'ware-beschreibung';
      unter.textContent = ware.text;
      text.append(titel, unter);

      const { knopf, zeichen, preis } = preisKnopf();
      knopf.addEventListener('click', () => kaufen(ware.k));
      const zeile = { ware, titel, unter, knopf, zeichen, preis, li, stufen: name };
      knopf.addEventListener('mouseenter', () => {
        const zustand = rueckrufe.zustand();
        const stufen = name === 'grommsch' ? zustand.stufenG : zustand.stufenP;
        tippWareFuellen(ware, wareZustand(ware, stufen, zustand.welle), zustand.welle);
        tippAusrichten(knopf);
      });
      knopf.addEventListener('mouseleave', () => { tipp.hidden = true; });

      li.append(text, knopf);
      liste.append(li);
      warenZeilen[name].push(zeile);
    }
  }

  const zauberZeilen = [];
  const klickTeile = { achsen: [] };

  /** Eine Zeile im Stil der Zauberwaren, mit Kopf und Achsenreihe. */
  function zauberZeile(liste, titelText, beschrText) {
    const li = document.createElement('li');
    li.className = 'ware ware-zauber';
    const kopf = document.createElement('div');
    kopf.className = 'ware-kopf';
    const text = document.createElement('div');
    text.className = 'ware-text';
    const titel = document.createElement('div');
    titel.className = 'ware-name';
    titel.textContent = titelText;
    const unter = document.createElement('div');
    unter.className = 'ware-beschreibung';
    unter.textContent = beschrText;
    text.append(titel, unter);
    const { knopf, zeichen, preis } = preisKnopf();
    kopf.append(text, knopf);
    li.append(kopf);
    liste.append(li);
    return { li, kopf, titel, unter, knopf, zeichen, preis };
  }

  function malvinaAufbauen() {
    const liste = listen.malvina;
    if (!liste) return;
    liste.textContent = '';

    // --- Der Klick: erst lernen, dann auf drei Achsen ausbauen ---
    const klick = zauberZeile(liste, KLICK.name, KLICK.kurz);
    klick.knopf.addEventListener('click', () => rueckrufe.klickKaufen());
    klick.knopf.addEventListener('mouseenter', () => tippZeigen(klick.knopf, 'klick', rueckrufe.zustand()));
    klick.knopf.addEventListener('mouseleave', () => { tipp.hidden = true; });
    const klickAchsen = document.createElement('div');
    klickAchsen.className = 'achsen';
    for (const achse of KLICK_ACHSEN) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'achse';
      b.addEventListener('click', () => rueckrufe.klickVerbessern(achse.k));
      klickAchsen.append(b);
      klickTeile.achsen.push({ achse, knopf: b });
    }
    klick.li.append(klickAchsen);
    klickTeile.zeile = klick;
    klickTeile.achsenLeiste = klickAchsen;

    // --- Die vier Zauber ---
    for (const z of ZAUBER) {
      const zeile = zauberZeile(liste, z.name, z.kurz);
      zeile.knopf.addEventListener('click', () => rueckrufe.zauberLernen(z.k));
      zeile.knopf.addEventListener('mouseenter', () => tippZeigen(zeile.knopf, z.k, rueckrufe.zustand()));
      zeile.knopf.addEventListener('mouseleave', () => { tipp.hidden = true; });
      const achsen = document.createElement('div');
      achsen.className = 'achsen';
      const achsKnoepfe = ACHSEN.map((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'achse';
        b.addEventListener('click', () => rueckrufe.zauberVerbessern(z.k, a.k));
        achsen.append(b);
        return { achse: a, knopf: b };
      });
      zeile.li.append(achsen);
      zauberZeilen.push({ zauber: z, ...zeile, achsen, achsKnoepfe });
    }

    // --- Das Morgenritual ---
    const ritual = zauberZeile(liste, 'Morgenritual',
      'Nächste Welle startet nachts von selbst');
    ritual.knopf.addEventListener('click', () => rueckrufe.ritual());
    zauberZeilen.ritual = ritual;
  }

  warenAufbauen('grommsch', WAREN_GROMMSCH, (k) => rueckrufe.kaufGrommsch(k));
  warenAufbauen('pips', WAREN_PIPS, (k) => rueckrufe.kaufPips(k));
  malvinaAufbauen();

  /* ---------- Knöpfe ---------- */

  if (knoepfe.welle) knoepfe.welle.addEventListener('click', () => rueckrufe.welleStarten());
  if (knoepfe.neustart) {
    knoepfe.neustart.addEventListener('click', () => {
      if (neustartScharf) {
        clearTimeout(neustartUhr);
        neustartScharf = false;
        knoepfe.neustart.textContent = 'Neustart';
        knoepfe.neustart.classList.remove('scharf');
        rueckrufe.neustart();
        return;
      }
      // Zweistufig, weil ein versehentlicher Klick alles kostet.
      neustartScharf = true;
      knoepfe.neustart.textContent = 'Wirklich?';
      knoepfe.neustart.classList.add('scharf');
      neustartUhr = setTimeout(() => {
        neustartScharf = false;
        knoepfe.neustart.textContent = 'Neustart';
        knoepfe.neustart.classList.remove('scharf');
      }, 3000);
    });
  }

  reiterKnoepfe.forEach((b) => {
    b.addEventListener('click', () => seiteZeigen(Number(b.dataset.reiterknopf)));
  });

  function seiteZeigen(i) {
    if (!seiten) return;
    seiten.scrollTo({ left: i * seiten.clientWidth, behavior: 'smooth' });
    reiterKnoepfe.forEach((b, j) => b.classList.toggle('aktiv', i === j));
  }

  if (seiten) {
    seiten.addEventListener('scroll', () => {
      const i = Math.round(seiten.scrollLeft / Math.max(1, seiten.clientWidth));
      reiterKnoepfe.forEach((b, j) => b.classList.toggle('aktiv', i === j));
    }, { passive: true });
  }

  /* ---------- Artefakte ---------- */

  // Die Detailkarte liegt über allem und wird nur beim Antippen gefüllt.
  // Kein Ziehen und Fallenlassen: Antippen geht am Handy genauso gut wie
  // mit der Maus, und es gibt nichts zu üben.
  const karteHuelle = document.createElement('div');
  karteHuelle.className = 'artefaktkarte';
  karteHuelle.hidden = true;
  karteHuelle.addEventListener('click', (e) => {
    if (e.target === karteHuelle) karteSchliessen();
  });
  wurzel.appendChild(karteHuelle);

  function karteSchliessen() {
    gewaehlt = null;
    karteHuelle.hidden = true;
    karteHuelle.textContent = '';
    artefaktStand = '';
  }

  function artefaktBei(ort, index, zustand) {
    const liste = ort === 'regal' ? zustand.regal : zustand.inventar;
    return liste ? liste[index] : null;
  }

  function karteZeigen(ort, index) {
    const zustand = rueckrufe.zustand();
    const artefakt = artefaktBei(ort, index, zustand);
    if (!artefakt) { karteSchliessen(); return; }
    gewaehlt = { ort, index };

    const s = seltenheitNach(artefakt.seltenheit);
    karteHuelle.textContent = '';
    const karte = document.createElement('div');
    karte.className = 'karte';
    karte.style.boxShadow = '0 0 0 1px ' + s.farbe + ', 0 18px 40px rgba(0,0,0,0.7)';

    const kopf = document.createElement('div');
    kopf.className = 'karte-kopf';
    const bild = document.createElement('canvas');
    bild.width = 32;
    bild.height = 32;
    artefaktSymbolZeichnen(bild, artefakt);
    const kopfText = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'karte-name';
    name.textContent = artefakt.name;
    const marke = document.createElement('div');
    marke.className = 'karte-marke';
    marke.style.color = s.farbe;
    const tags = tagsVon(artefakt).map((t) => TAG_NAMEN[t] || t).join(' · ');
    marke.textContent = s.name + '  ·  Welle ' + artefakt.fundwelle + (tags ? '  ·  ' + tags : '');
    kopfText.append(name, marke);
    kopf.append(bild, kopfText);
    karte.append(kopf);

    const liste = document.createElement('ul');
    liste.className = 'karte-affixe';
    for (const zeile of affixZeilen(artefakt)) {
      const li = document.createElement('li');
      li.className = 'karte-affix' + (zeile.einzig ? ' einzig' : '');
      li.style.borderLeftColor = zeile.einzig ? '#e0b64f' : (TAG_FARBEN[zeile.tag] || '#3f424d');
      const n = document.createElement('span');
      n.className = 'karte-affix-name';
      n.style.color = TAG_FARBEN[zeile.tag] || '#e9e9ed';
      n.textContent = zeile.name;
      const t = document.createElement('span');
      t.className = 'karte-affix-text';
      t.textContent = zeile.text;
      li.append(n, t);
      liste.append(li);
    }
    karte.append(liste);

    const knoepfe2 = document.createElement('div');
    knoepfe2.className = 'karte-knoepfe';

    if (ort === 'inventar') {
      const frei = zustand.regal.some((a) => !a);
      const anlegen = document.createElement('button');
      anlegen.type = 'button';
      anlegen.className = 'karte-knopf';
      anlegen.textContent = frei ? 'Anlegen' : 'Regal voll';
      anlegen.disabled = !frei;
      anlegen.addEventListener('click', () => { rueckrufe.artefaktAnlegen(index); karteSchliessen(); });
      knoepfe2.append(anlegen);
    } else {
      const platz = zustand.inventar.length < INVENTAR_PLAETZE;
      const ablegen = document.createElement('button');
      ablegen.type = 'button';
      ablegen.className = 'karte-knopf';
      ablegen.textContent = platz ? 'Ablegen' : 'Lager voll';
      ablegen.disabled = !platz;
      ablegen.addEventListener('click', () => { rueckrufe.artefaktAblegen(index); karteSchliessen(); });
      knoepfe2.append(ablegen);
    }

    const verkaufen = document.createElement('button');
    verkaufen.type = 'button';
    verkaufen.className = 'karte-knopf verkauf';
    verkaufen.textContent = (ort === 'regal' ? 'Ablegen & verkaufen: ' : 'Verkaufen: ')
      + zahl(verkaufswert(artefakt));
    verkaufen.addEventListener('click', () => {
      rueckrufe.artefaktVerkaufen(ort, index);
      karteSchliessen();
    });
    knoepfe2.append(verkaufen);

    const zurueck = document.createElement('button');
    zurueck.type = 'button';
    zurueck.className = 'karte-knopf zurueck';
    zurueck.textContent = 'Zurück';
    zurueck.addEventListener('click', karteSchliessen);
    knoepfe2.append(zurueck);

    karte.append(knoepfe2);
    karteHuelle.append(karte);
    karteHuelle.hidden = false;
  }

  /** Eine Fassung im Regal oder im Lager. */
  function fassungBauen(artefakt, ort, index) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'fassung' + (artefakt ? '' : ' leer');
    if (!artefakt) {
      knopf.disabled = true;
      knopf.textContent = ort === 'regal' ? '◎' : '';
      return knopf;
    }
    const s = seltenheitNach(artefakt.seltenheit);
    knopf.title = artefakt.name + ' — ' + s.name;
    const bild = document.createElement('canvas');
    bild.width = 16;
    bild.height = 16;
    artefaktSymbolZeichnen(bild, artefakt);
    const punkt = document.createElement('span');
    punkt.className = 'fassung-punkt';
    punkt.style.background = s.farbe;
    knopf.append(bild, punkt);
    knopf.addEventListener('click', () => karteZeigen(ort, index));
    return knopf;
  }

  /**
   * Regal, Lager und Wirkungsliste neu setzen.
   *
   * Nur wenn sich tatsächlich etwas geändert hat — sonst verlöre ein
   * gerade gedrückter Knopf bei 60 Bildern je Sekunde seinen Fokus.
   */
  function artefakteAuffrischen(zustand) {
    const regalEl = listen.regal;
    const invEl = listen.inventar;
    if (!regalEl || !invEl) return;

    const stand = zustand.regal.map((a) => a ? a.name + a.seltenheit : '-').join('|')
      + '#' + zustand.inventar.map((a) => a.name + a.seltenheit).join('|');
    if (stand === artefaktStand) return;
    artefaktStand = stand;

    regalEl.textContent = '';
    for (let i = 0; i < REGAL_PLAETZE; i++) {
      regalEl.append(fassungBauen(zustand.regal[i], 'regal', i));
    }

    invEl.textContent = '';
    for (let i = 0; i < INVENTAR_PLAETZE; i++) {
      invEl.append(fassungBauen(zustand.inventar[i] || null, 'inventar', i));
    }

    if (feld.inventarZahl) {
      feld.inventarZahl.textContent = zustand.inventar.length + ' / ' + INVENTAR_PLAETZE;
    }

    if (feld.artefaktHinweis) {
      const hat = zustand.regal.some(Boolean) || zustand.inventar.length;
      feld.artefaktHinweis.textContent = hat
        ? 'Antippen öffnet die Karte. Affixe mit demselben Tag verstärken sich — drei Feuer-Artefakte machen aus jedem Klick einen Flammenwerfer.'
        : 'Noch nichts gefunden. Recken lassen selten etwas fallen, Bosse immer. Der Schatzjäger bei Pips erhöht die Chance.';
    }

    wirkungAuffrischen(zustand);
  }

  /** Die Summe des Regals als Reihe von Chips. */
  function wirkungAuffrischen(zustand) {
    const el = listen.wirkung;
    if (!el) return;
    el.textContent = '';
    const w = wirkungAus(zustand.regal);

    const chips = [];
    for (const tag in w.tags) {
      if (w.tags[tag] > 0) chips.push({ text: w.tags[tag] + '× ' + TAG_NAMEN[tag], farbe: TAG_FARBEN[tag] });
    }
    if (w.fressBonus) chips.push({ text: 'Fressen +' + rund(w.fressBonus) + ' %', farbe: '#b4bac9' });
    if (w.kapazitaet) chips.push({ text: '+' + w.kapazitaet + ' Platz', farbe: '#b4bac9' });
    if (w.schlund) chips.push({ text: '+' + w.schlund + ' Schlund', farbe: '#b4bac9' });
    if (w.muenzWert) chips.push({ text: 'Münzen +' + rund(w.muenzWert) + ' %', farbe: '#e0b64f' });
    if (w.fundchance) chips.push({ text: 'Fund +' + rund(w.fundchance) + ' %', farbe: '#e0b64f' });
    if (w.krit) chips.push({ text: 'Krit +' + rund(w.krit) + ' %', farbe: '#ffd08a' });
    if (w.klickAbkling) chips.push({ text: 'Klick −' + rund(w.klickAbkling) + ' %', farbe: '#9ecbff' });
    if (w.brandDps) chips.push({ text: 'Klick zündet: ' + w.brandDps + '/s', farbe: '#ff7a2a' });

    for (const chip of chips) {
      const li = document.createElement('li');
      const punkt = document.createElement('span');
      punkt.className = 'vorschau-punkt';
      punkt.style.background = chip.farbe;
      li.append(punkt, document.createTextNode(chip.text));
      el.append(li);
    }
  }

  function rund(n) {
    return (Math.round(n * 100) / 100).toString().replace('.', ',');
  }

  /* ---------- Auffrischen ---------- */

  function setzen(name, wert) {
    if (letzte[name] === wert) return;
    letzte[name] = wert;
    if (feld[name]) feld[name].textContent = wert;
  }

  /** Preisknopf beschriften: Zeichen + Zahl, oder reiner Text (MAX, ✓, Aus). */
  function preisSetzen(teil, text, ohneZeichen) {
    if (teil.preis.textContent !== text) teil.preis.textContent = text;
    const zeigen = !ohneZeichen;
    if (teil.zeichen.hidden === zeigen) teil.zeichen.hidden = !zeigen;
  }

  function zauberLeisteAufbauen(zustand) {
    const leiste = listen.zauber;
    if (!leiste) return;
    leiste.textContent = '';

    const eintraege = [];
    if (zustand.klick.gekauft >= 1) eintraege.push({ k: 'klick', taste: '', name: KLICK.name });
    for (const z of ZAUBER) {
      if (zustand.zauber[z.k].gelernt >= 1) eintraege.push({ k: z.k, taste: z.taste, name: z.name });
    }

    for (const e of eintraege) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'zauberknopf';
      knopf.dataset.zauber = e.k;

      const symbol = document.createElement('canvas');
      symbol.width = 16;
      symbol.height = 16;
      symbol.className = 'zaubersymbol';
      symbolZeichnen(symbol, e.k);

      const decke = document.createElement('span');
      decke.className = 'zauberdecke';
      const taste = document.createElement('span');
      taste.className = 'zaubertaste';
      taste.textContent = e.taste;

      knopf.append(symbol, decke, taste);
      if (e.k !== 'klick') {
        knopf.addEventListener('click', () => rueckrufe.zauberAusloesen(e.k));
      }
      knopf.addEventListener('mouseenter', () => tippZeigen(knopf, e.k, rueckrufe.zustand()));
      knopf.addEventListener('mouseleave', () => { tipp.hidden = true; });
      leiste.append(knopf);
    }
  }

  return {
    /** Wird jeden Bildschritt aufgerufen, schreibt aber nur Geändertes. */
    auffrischen(welt) {
      const { zustand, szene } = welt;
      const wirkung = wirkungAus(zustand.regal);
      const w = werteAus(zustand.stufenG, zustand.stufenP, wirkung);

      setzen('gold', zahl(zustand.gold));
      setzen('blut', zahl(zustand.blut) + ' l');
      setzen('welle', 'Welle ' + zustand.welle + (istBosswelle(zustand.welle) ? ' · BOSS' : ''));

      // Phase und Lagebericht
      let phase;
      let lage;
      let wellenText;
      let wellenAus = true;
      const uebrig = Math.max(0, szene.wellenGroesse - szene.erschienen)
        + szene.recken.filter((r) => r.zustand !== 'flieht').length;

      if (szene.phase === 'tag') {
        phase = (istBosswelle(zustand.welle) ? 'Bosswelle ' : 'Tag — Welle ') + zustand.welle;
        lage = 'Noch ' + uebrig + ' Recken · Burg ' + szene.imTor.length + '/' + w.kapazitaet
          + ' · frisst ' + Math.min(w.schlund, szene.imTor.length) + '/' + w.schlund;
        wellenText = 'Welle läuft…';
      } else if (szene.phase === 'niederlage') {
        phase = 'Die Burg fällt';
        lage = 'Rückzug der Recken …';
        wellenText = 'Welle läuft…';
      } else {
        phase = 'Nacht — Lager';
        lage = 'Bereit: ' + (zustand.anstehend.length || wellenStaerke(zustand.welle))
          + ' · Burg ' + w.kapazitaet + ' · Schlund ' + w.schlund;
        const ritualLaeuft = zustand.ritual >= 1 && zustand.ritualAn;
        const rest = Math.max(0, Math.ceil(RITUAL_WARTEZEIT - szene.nachtzeit));
        wellenText = 'Welle ' + zustand.welle + ' starten' + (ritualLaeuft ? ' (' + rest + ' s)' : '');
        wellenAus = false;
      }
      setzen('phase', phase);
      setzen('lage', lage);
      if (knoepfe.welle) {
        if (knoepfe.welle.textContent !== wellenText) knoepfe.welle.textContent = wellenText;
        knoepfe.welle.disabled = wellenAus;
        knoepfe.welle.classList.toggle('boss', szene.phase === 'nacht' && !!zustand.anstehenderBoss);
      }

      vorschauAuffrischen(zustand, szene);

      setzen('spruchGrommsch', '»' + welt.sprueche.grommsch + '«');
      setzen('spruchPips', '»' + welt.sprueche.pips + '«');
      setzen('spruchMalvina', '»' + welt.sprueche.malvina + '«');

      warenAuffrischen('grommsch', zustand.stufenG, zustand.gold, zustand.welle);
      warenAuffrischen('pips', zustand.stufenP, zustand.gold, zustand.welle);
      malvinaAuffrischen(zustand, wirkung);
      artefakteAuffrischen(zustand);

      // Die Aktionsleiste wird nur neu gebaut, wenn sich ihr Besatz ändert.
      const stand = zustand.klick.gekauft + '|' + ZAUBER.map((z) => zustand.zauber[z.k].gelernt).join('');
      if (stand !== zauberLeisteStand) {
        zauberLeisteStand = stand;
        zauberLeisteAufbauen(zustand);
      }
      zauberLeisteAuffrischen(welt);

      if (feld.zauberHinweis) {
        const zeigen = zauberLeisteStand === '0|0000';
        feld.zauberHinweis.hidden = !zeigen;
      }
    },

    /** Schmale Bildschirme bekommen zwei Wischseiten. */
    breiteMessen() {
      const breite = window.innerWidth || 1200;
      const hoehe = window.innerHeight || 800;
      const schmal = breite < SCHMAL_BREITE || (hoehe < SCHMAL_HOEHE && breite < 1180);
      wurzel.classList.toggle('schmal', schmal);
      return schmal;
    }
  };

  /**
   * Die Nachtvorschau: Welche Recken die nächste Welle bringt.
   * Ein Farbkästchen je Klasse, dazu Name und Anzahl — gebaut nur, wenn
   * sich die Auslosung tatsächlich geändert hat. Ein angekündigter Boss
   * bekommt einen eigenen, goldenen Chip.
   */
  function vorschauAuffrischen(zustand, szene) {
    const el = feld.vorschau;
    if (!el) return;
    const nachts = szene.phase === 'nacht';
    const stand = nachts ? zustand.anstehend.join(',') + '|' + (zustand.anstehenderBoss || '') : '';
    if (stand === vorschauStand) return;
    vorschauStand = stand;

    el.textContent = '';
    if (!nachts || !zustand.anstehend.length) { el.hidden = true; return; }
    el.hidden = false;

    const marke = document.createElement('span');
    marke.className = 'vorschau-marke';
    marke.textContent = 'Kommt:';
    el.appendChild(marke);

    const anzahl = {};
    for (const id of zustand.anstehend) anzahl[id] = (anzahl[id] || 0) + 1;
    for (const klasse of RECKEN) {
      if (!anzahl[klasse.id]) continue;
      const chip = document.createElement('span');
      chip.className = 'vorschau-chip';
      const punkt = document.createElement('span');
      punkt.className = 'vorschau-punkt';
      punkt.style.background = klasse.metall && klasse.helm ? klasse.metall : klasse.rumpf;
      chip.append(punkt, document.createTextNode(anzahl[klasse.id] + '× ' + klasse.name));
      el.appendChild(chip);
    }

    if (zustand.anstehenderBoss) {
      const chip = document.createElement('span');
      chip.className = 'vorschau-chip vorschau-boss';
      // Nur "1× BOSS" — der Name würde die Zeile sprengen und steht beim
      // Wellenstart ohnehin im Spruchband und beim Marktschreier.
      chip.title = zustand.anstehenderBoss;
      const punkt = document.createElement('span');
      punkt.className = 'vorschau-punkt';
      punkt.style.background = '#e0b64f';
      chip.append(punkt, document.createTextNode('1× BOSS'));
      el.appendChild(chip);
    }
  }

  function warenAuffrischen(name, stufen, gold, welle) {
    for (const zeile of warenZeilen[name]) {
      const z = wareZustand(zeile.ware, stufen, welle);
      const text = z.gesperrt
        ? (zeile.ware.gesperrtText || 'noch nicht verfügbar')
        : z.voll ? 'MAX' : zahl(z.preis);
      preisSetzen(zeile, text, z.voll || z.gesperrt);
      const aus = z.voll || z.gesperrt || gold < z.preis;
      if (zeile.knopf.disabled !== aus) zeile.knopf.disabled = aus;

      const stufenText = z.voll ? 'MAX' : z.stufe > 0 ? 'St. ' + z.stufe : '';
      const titel = zeile.ware.name + (stufenText ? ' · ' + stufenText : '');
      if (zeile.titel.textContent !== titel) zeile.titel.textContent = titel;

      // Die Beschreibung zeigt den aktuellen Gesamtwert, nicht die Werbung.
      const beschreibung = zeile.ware.wertJetzt ? zeile.ware.wertJetzt(z.stufe) : zeile.ware.text;
      if (zeile.unter.textContent !== beschreibung) zeile.unter.textContent = beschreibung;
      zeile.li.classList.toggle('gesperrt', z.gesperrt);
    }
  }

  function malvinaAuffrischen(zustand, wirkung) {
    const gold = zustand.gold;

    // --- Der Klick ---
    const klick = klickTeile.zeile;
    if (klick) {
      const gekauft = zustand.klick.gekauft >= 1;
      const w = klickWerte(zustand.klick, wirkung);
      const text = gekauft
        ? Math.round(w.schaden) + ' Schaden · ' + w.abklingzeit.toFixed(1).replace('.', ',')
          + ' s · ' + Math.round(w.krit * 100) + ' % kritisch'
        : KLICK.kurz;
      if (klick.unter.textContent !== text) klick.unter.textContent = text;
      preisSetzen(klick, gekauft ? '✓' : zahl(KLICK.preis), gekauft);
      klick.knopf.disabled = gekauft || gold < KLICK.preis;
      klick.knopf.classList.toggle('gelernt', gekauft);

      klickTeile.achsenLeiste.hidden = !gekauft;
      for (const { achse, knopf } of klickTeile.achsen) {
        const preis = klickAusbauPreis(zustand.klick[achse.k]);
        const beschriftet = achse.zeichen + ' ' + zahl(preis);
        if (knopf.textContent !== beschriftet) knopf.textContent = beschriftet;
        knopf.disabled = gold < preis;
        knopf.title = achse.name + ' — ' + zahl(preis) + ' Gold (Stufe ' + zustand.klick[achse.k] + ')';
      }
    }

    // --- Die Zauber ---
    for (const zeile of zauberZeilen) {
      const stufe = zustand.zauber[zeile.zauber.k];
      const wert = zauberWerte(zeile.zauber, stufe);
      const gelernt = wert.gelernt;

      const text = gelernt
        ? Math.round(wert.schaden) + ' Schaden · ' + wert.abklingzeit.toFixed(0) + ' s · ' + wert.wirkbereich + ' px'
        : zeile.zauber.kurz;
      if (zeile.unter.textContent !== text) zeile.unter.textContent = text;

      preisSetzen(zeile, gelernt ? '✓' : zahl(zeile.zauber.preis), gelernt);
      zeile.knopf.disabled = gelernt || gold < zeile.zauber.preis;
      zeile.knopf.classList.toggle('gelernt', gelernt);

      zeile.achsen.hidden = !gelernt;
      for (const { achse, knopf } of zeile.achsKnoepfe) {
        const preis = ausbauPreis(zeile.zauber, stufe[achse.k]);
        const beschriftet = achse.zeichen + ' ' + zahl(preis);
        if (knopf.textContent !== beschriftet) knopf.textContent = beschriftet;
        knopf.disabled = gold < preis;
        knopf.title = achse.name + ' — ' + zahl(preis) + ' Gold (Stufe ' + stufe[achse.k] + ')';
      }
    }

    // --- Das Ritual ---
    const r = zauberZeilen.ritual;
    if (!r) return;
    const hat = zustand.ritual >= 1;
    const text = hat
      ? (zustand.ritualAn ? 'Aktiv — Welle startet nachts von selbst' : 'Ruht — Wellen startest du selbst')
      : 'Nächste Welle startet nachts von selbst';
    if (r.unter.textContent !== text) r.unter.textContent = text;
    preisSetzen(r, hat ? (zustand.ritualAn ? 'Aus' : 'An') : zahl(RITUAL_PREIS), hat);
    r.knopf.disabled = !hat && gold < RITUAL_PREIS;
  }

  /**
   * Abklingzeit als Kreisausschnitt über dem Symbol.
   * Er läuft im Uhrzeigersinn ab, wie man es aus anderen Spielen kennt.
   */
  function zauberLeisteAuffrischen(welt) {
    const { zustand, szene } = welt;
    const leiste = listen.zauber;
    if (!leiste) return;

    for (const knopf of leiste.children) {
      const k = knopf.dataset.zauber;
      let rest;
      let gesamt;
      let laeuft = false;
      let scharf = false;

      if (k === 'klick') {
        const w = klickWerte(zustand.klick, wirkungAus(zustand.regal));
        rest = szene.klickAbklingzeit;
        gesamt = w.abklingzeit;
      } else {
        const z = ZAUBER.find((e) => e.k === k);
        const wert = zauberWerte(z, zustand.zauber[k]);
        rest = szene.abklingzeit[k];
        gesamt = wert.abklingzeit;
        laeuft = (k === 'pranke' && szene.pranke)
          || (k === 'flamme' && szene.flamme)
          || (k === 'meteor' && szene.meteorZeit > 0);
        scharf = k === 'donner' && szene.donnerBereit;
      }
      const bereit = rest <= 0 && !laeuft && szene.phase === 'tag';

      knopf.classList.toggle('bereit', bereit && !scharf);
      knopf.classList.toggle('scharf', !!scharf);
      knopf.classList.toggle('laeuft', !!laeuft);

      const decke = knopf.querySelector('.zauberdecke');
      if (!decke) continue;
      const anteil = rest > 0 ? Math.min(1, rest / gesamt) : 0;
      const grad = Math.round(anteil * 360);
      const bild = anteil > 0
        ? 'conic-gradient(rgba(6,7,12,0.78) 0deg ' + grad + 'deg, rgba(0,0,0,0) ' + grad + 'deg 360deg)'
        : 'none';
      if (decke.style.backgroundImage !== bild) decke.style.backgroundImage = bild;
      const beschriftung = rest > 0 ? String(Math.ceil(rest)) : scharf ? '◎' : '';
      if (decke.textContent !== beschriftung) decke.textContent = beschriftung;
    }
  }
}
