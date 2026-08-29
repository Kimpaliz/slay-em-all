/**
 * Prüft die Artefakt-Logik — ohne Browser, ohne echten Zufall.
 *
 * `spiel/artefakte.js` ist genau dafür gebaut: Jede Funktion, die würfelt,
 * nimmt den Zufall als Argument entgegen. Mit einem gesetzten Startwert
 * ergibt derselbe Wurf also immer dasselbe Artefakt — und damit lässt sich
 * prüfen, was sonst nur „fühlt sich richtig an" wäre.
 *
 * Aufruf:  node werkzeuge/pruefe-artefakte.mjs
 */

import {
  REGAL_PLAETZE, INVENTAR_PLAETZE, FUNDCHANCE, LEGENDAER_AB_WELLE,
  SELTENHEITEN, TAG_NAMEN, TAG_FARBEN, AFFIXE, EINZIGARTIGE,
  seltenheitNach, affixNach, istEinzig, guete, namenBauen,
  seltenheitAuslosen, artefaktErzeugen, fundWurf, verkaufswert,
  tagsVon, affixZeilen, leereWirkung, wirkungAus, artefaktBereinigen
} from '../spiel/artefakte.js';

/* ---------------- Prüfgerüst ---------------- */

let geprueft = 0;
const fehler = [];

function pruefe(name, bedingung, zusatz) {
  geprueft += 1;
  if (!bedingung) fehler.push(name + (zusatz ? ' — ' + zusatz : ''));
}

function gleich(name, ist, soll) {
  pruefe(name, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));
}

function zwischen(name, wert, min, max) {
  pruefe(name, wert >= min && wert <= max, wert + ' liegt nicht in [' + min + ', ' + max + ']');
}

/**
 * Vorhersagbarer Zufall. Kein Math.random — sonst wäre ein Fehlschlag
 * nicht nachstellbar, und genau darum geht es hier.
 * (Mulberry32: klein, gleichverteilt genug, überall gleich.)
 */
function wuerfel(startwert) {
  let a = startwert >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- 1. Stammdaten ---------------- */

gleich('Regal hat fünf Fassungen', REGAL_PLAETZE, 5);
gleich('Lager hat zwanzig Plätze', INVENTAR_PLAETZE, 20);
gleich('Grundfundchance ist 0,05 %', FUNDCHANCE, 0.05);
gleich('Legendär erst ab Welle 15', LEGENDAER_AB_WELLE, 15);
gleich('Vier Seltenheiten', SELTENHEITEN.length, 4);

// Die Seltenheiten müssen aufsteigend geordnet sein — seltenheitAuslosen()
// und artefaktErzeugen() rechnen beide mit dem Index als Rang.
for (let i = 1; i < SELTENHEITEN.length; i++) {
  pruefe(
    'Verkaufswert steigt: ' + SELTENHEITEN[i].name,
    SELTENHEITEN[i].verkauf > SELTENHEITEN[i - 1].verkauf
  );
}
gleich('Verkaufswerte 100/400/1600/6400',
  SELTENHEITEN.map((s) => s.verkauf).join('/'), '100/400/1600/6400');
gleich('Nur Legendär ist einzigartig',
  SELTENHEITEN.filter((s) => s.einzig).map((s) => s.k).join(','), 'legendaer');

gleich('Sechs Tags', Object.keys(TAG_NAMEN).length, 6);
for (const tag of Object.keys(TAG_NAMEN)) {
  pruefe('Tag ' + tag + ' hat eine Farbe', typeof TAG_FARBEN[tag] === 'string');
}

gleich('15 gewöhnliche Affixe', AFFIXE.length, 15);
gleich('5 legendäre Affixe', EINZIGARTIGE.length, 5);

// Kein Affix darf doppelt vorkommen — sonst könnte artefaktErzeugen()
// denselben Effekt zweimal auf ein Stück legen.
const alleSchluessel = [...AFFIXE, ...EINZIGARTIGE].map((a) => a.k);
gleich('Alle Affix-Schlüssel sind eindeutig',
  new Set(alleSchluessel).size, alleSchluessel.length);

for (const a of AFFIXE) {
  pruefe('Affix ' + a.k + ' hat bekannten Tag', Boolean(TAG_NAMEN[a.tag]));
  pruefe('Affix ' + a.k + ' hat Spanne', typeof a.min === 'number' && a.max >= a.min);
  pruefe('Affix ' + a.k + ' ist auffindbar', affixNach(a.k) === a);
  pruefe('Affix ' + a.k + ' ist nicht einzigartig', istEinzig(a.k) === false);
}
for (const e of EINZIGARTIGE) {
  pruefe('Legendär ' + e.k + ' ist als einzigartig erkannt', istEinzig(e.k) === true);
  pruefe('Legendär ' + e.k + ' ist auffindbar', affixNach(e.k) === e);
}
pruefe('Unbekannter Affix ergibt null', affixNach('gibtEsNicht') === null);
pruefe('Unbekannte Seltenheit fällt auf die erste zurück',
  seltenheitNach('gibtEsNicht') === SELTENHEITEN[0]);

/* ---------------- 2. Güte wächst mit der Fundwelle ---------------- */

gleich('Güte auf Welle 1', guete(1), 1);
gleich('Güte auf Welle 4', guete(4), 1);
gleich('Güte auf Welle 5', guete(5), 1.35);
gleich('Güte auf Welle 40', guete(40), 1 + 0.35 * 8);
gleich('Güte kennt keine Welle 0', guete(0), 1);
pruefe('Güte steigt niemals', (() => {
  for (let w = 1; w < 200; w++) if (guete(w + 1) < guete(w)) return false;
  return true;
})());

/* ---------------- 3. Seltenheiten auslosen ---------------- */

// Verteilung über viele Würfe. Nicht auf die Nachkommastelle festgenagelt —
// geprüft wird die Richtung, nicht der Zufall.
function verteilung(welle, wuerfe, mindestens) {
  const rnd = wuerfe;
  const z = { gewoehnlich: 0, selten: 0, episch: 0, legendaer: 0 };
  for (let i = 0; i < 20000; i++) z[seltenheitAuslosen(welle, rnd, mindestens)] += 1;
  return z;
}

const frueh = verteilung(1, wuerfel(1));
const spaet = verteilung(41, wuerfel(2));

gleich('Welle 1 wirft nie Legendäres', frueh.legendaer, 0);
pruefe('Welle 1 ist überwiegend gewöhnlich', frueh.gewoehnlich > 20000 * 0.6,
  frueh.gewoehnlich + ' von 20000');
pruefe('Späte Wellen werfen Legendäres', spaet.legendaer > 0);
pruefe('Späte Wellen sind seltener gewöhnlich', spaet.gewoehnlich < frueh.gewoehnlich,
  spaet.gewoehnlich + ' gegen ' + frueh.gewoehnlich);
pruefe('Späte Wellen sind häufiger episch', spaet.episch > frueh.episch);

const vor15 = verteilung(14, wuerfel(3));
gleich('Vor Welle 15 fällt nichts Legendäres', vor15.legendaer, 0);

// Bossgarantie: mindestens Selten, nie darunter.
const mitGarantie = verteilung(7, wuerfel(4), 'selten');
gleich('Bossgarantie schließt Gewöhnlich aus', mitGarantie.gewoehnlich, 0);
pruefe('Bossgarantie hebt nur an, deckelt nicht',
  mitGarantie.episch > 0, 'Episch muss trotz Garantie möglich bleiben');

/* ---------------- 4. Artefakte erzeugen ---------------- */

for (const s of SELTENHEITEN) {
  const rnd = wuerfel(100 + SELTENHEITEN.indexOf(s));
  for (let i = 0; i < 400; i++) {
    const welle = 1 + (i % 60);
    const a = artefaktErzeugen(welle, s.k, rnd);

    gleich('Seltenheit bleibt erhalten (' + s.k + ')', a.seltenheit, s.k);
    gleich('Fundwelle wird gemerkt (' + s.k + ')', a.fundwelle, welle);
    pruefe('Name ist nicht leer (' + s.k + ')', typeof a.name === 'string' && a.name.length > 3);

    const sollAffixe = s.affixe + (s.einzig ? 1 : 0);
    gleich('Affixzahl (' + s.k + ')', a.affixe.length, sollAffixe);

    const schluessel = a.affixe.map((e) => e.k);
    gleich('Kein Affix doppelt (' + s.k + ')', new Set(schluessel).size, schluessel.length);

    const einzige = schluessel.filter(istEinzig);
    gleich('Genau ein legendärer Affix, nur bei Legendär (' + s.k + ')',
      einzige.length, s.einzig ? 1 : 0);

    // Kein Affix darf über seiner Seltenheitsschranke liegen.
    const rang = SELTENHEITEN.findIndex((x) => x.k === s.k);
    for (const e of a.affixe) {
      const def = affixNach(e.k);
      if (def && def.abSeltenheit) {
        const noetig = SELTENHEITEN.findIndex((x) => x.k === def.abSeltenheit);
        pruefe('Affix ' + e.k + ' respektiert abSeltenheit (' + s.k + ')', rang >= noetig);
      }
      pruefe('Wert ist eine endliche Zahl (' + e.k + ')',
        typeof e.wert === 'number' && isFinite(e.wert));
    }
  }
}

// Derselbe Startwert muss dasselbe Artefakt ergeben. Ohne diese Zusicherung
// wäre ein fehlgeschlagener Prüflauf nicht nachstellbar.
const a1 = artefaktErzeugen(20, 'episch', wuerfel(4242));
const a2 = artefaktErzeugen(20, 'episch', wuerfel(4242));
gleich('Gleicher Startwert, gleiches Artefakt', JSON.stringify(a1), JSON.stringify(a2));

const a3 = artefaktErzeugen(20, 'episch', wuerfel(4243));
pruefe('Anderer Startwert, anderes Artefakt', JSON.stringify(a1) !== JSON.stringify(a3));

// Güte wirkt: dieselbe Seltenheit, späte Welle, im Schnitt stärkere Werte.
function schnittWert(welle, startwert) {
  const rnd = wuerfel(startwert);
  let summe = 0, anzahl = 0;
  for (let i = 0; i < 3000; i++) {
    for (const e of artefaktErzeugen(welle, 'selten', rnd).affixe) {
      const def = affixNach(e.k);
      if (def && !def.ganz) { summe += e.wert; anzahl += 1; }
    }
  }
  return anzahl ? summe / anzahl : 0;
}
const frueheWerte = schnittWert(1, 7);
const spaeteWerte = schnittWert(40, 7);
pruefe('Späte Funde sind im Schnitt stärker',
  spaeteWerte > frueheWerte * 1.5,
  'Welle 1: ' + frueheWerte.toFixed(2) + ', Welle 40: ' + spaeteWerte.toFixed(2));

/* ---------------- 5. Fundwurf ---------------- */

function trefferQuote(chance, startwert, versuche = 200000) {
  const rnd = wuerfel(startwert);
  let treffer = 0;
  for (let i = 0; i < versuche; i++) if (fundWurf(chance, rnd)) treffer += 1;
  return (treffer / versuche) * 100;
}

zwischen('Grundchance trifft rund 0,05 %', trefferQuote(FUNDCHANCE, 11), 0.03, 0.08);
zwischen('Schatzjäger Stufe 10 trifft rund 1,05 %', trefferQuote(0.05 + 0.1 * 10, 12), 0.9, 1.2);
gleich('Chance 0 trifft nie', trefferQuote(0, 13, 5000), 0);
gleich('Chance 100 trifft immer', trefferQuote(100, 14, 5000), 100);

/* ---------------- 6. Tags werden abgeleitet, nie gespeichert ---------------- */

const feuerStueck = {
  name: 'Prüfstück', seltenheit: 'selten', fundwelle: 10,
  affixe: [{ k: 'brennendeBeruehrung', wert: 1 }, { k: 'glutpfeile', wert: 12 }]
};
gleich('Tags kommen aus den Affixen', tagsVon(feuerStueck).join(','), 'feuer');
pruefe('Tags stehen nicht im Datensatz',
  !Object.prototype.hasOwnProperty.call(feuerStueck, 'tags'));
gleich('Jeder Tag nur einmal, auch bei zwei Feueraffixen', tagsVon(feuerStueck).length, 1);
gleich('Ohne Affixe keine Tags', tagsVon({ affixe: [] }).length, 0);
gleich('Unbekannte Affixe ergeben keinen Tag',
  tagsVon({ affixe: [{ k: 'gibtEsNicht', wert: 1 }] }).length, 0);

gleich('Eine Zeile je Affix', affixZeilen(feuerStueck).length, 2);
pruefe('Zeilen tragen lesbaren Text',
  affixZeilen(feuerStueck).every((z) => typeof z.text === 'string' && z.text.length > 0));

/* ---------------- 7. Verkaufswert ---------------- */

for (const s of SELTENHEITEN) {
  gleich('Verkaufswert ' + s.k,
    verkaufswert({ seltenheit: s.k }), s.verkauf);
}

/* ---------------- 8. Wirkung des Regals ---------------- */

const leer = leereWirkung();
gleich('Leeres Regal: kein Brandschaden', leer.brandDps === undefined ? 0 : leer.brandDps, 0);
gleich('Leeres Regal: keine Kapazität', leer.kapazitaet, 0);
gleich('Leeres Regal: kein Schlund', leer.schlund, 0);

const nichts = wirkungAus([]);
gleich('wirkungAus([]) gibt Nullwerte', nichts.fressBonus, 0);
gleich('wirkungAus(null) stürzt nicht ab', wirkungAus(null).kapazitaet, 0);
gleich('Leere Plätze werden übersprungen',
  wirkungAus([null, undefined, null]).kapazitaet, 0);

// Der Kern des Systems: Brennende Berührung skaliert mit der Zahl der
// ausgerüsteten FEUER-Artefakte, nicht mit der Zahl der Brand-Affixe.
const brand1 = wirkungAus([feuerStueck]);
gleich('Ein Feuerstück: 10 Schaden je Sekunde', brand1.brandDps, 10);
gleich('Ein Feuerstück zählt als ein Feuer-Tag', brand1.tags.feuer, 1);

const nurGlut = { seltenheit: 'gewoehnlich', fundwelle: 5, affixe: [{ k: 'glutpfeile', wert: 9 }] };
const brand2 = wirkungAus([feuerStueck, nurGlut]);
gleich('Zwei Feuerstücke: 20 Schaden je Sekunde', brand2.brandDps, 20);
gleich('Zwei Feuer-Tags gezählt', brand2.tags.feuer, 2);

const ohneBrand = wirkungAus([nurGlut]);
gleich('Feuer-Tag ohne Brennende Berührung macht keinen Brand', ohneBrand.brandDps, 0);

// Frost stapelt NICHT — der stärkste gewinnt. Gift dagegen summiert sich.
const frostA = { seltenheit: 'selten', fundwelle: 5, affixe: [{ k: 'frostgriff', wert: 20 }] };
const frostB = { seltenheit: 'selten', fundwelle: 5, affixe: [{ k: 'frostgriff', wert: 35 }] };
gleich('Frostgriff: der stärkere gewinnt', wirkungAus([frostA, frostB]).frostgriff, 35);
gleich('Frostgriff: Reihenfolge egal', wirkungAus([frostB, frostA]).frostgriff, 35);

const giftA = { seltenheit: 'selten', fundwelle: 5, affixe: [{ k: 'giftpfeile', wert: 6 }] };
const giftB = { seltenheit: 'selten', fundwelle: 5, affixe: [{ k: 'giftpfeile', wert: 4 }] };
gleich('Giftpfeile summieren sich', wirkungAus([giftA, giftB]).giftpfeilDps, 10);

// Zählende Affixe: je Stück +1, unabhängig vom Wert.
const schlundStueck = { seltenheit: 'legendaer', fundwelle: 20, affixe: [{ k: 'zweiterSchlund', wert: 1 }] };
gleich('Zweiter Schlund zählt Stücke', wirkungAus([schlundStueck, schlundStueck]).schlund, 2);

const hallenStueck = { seltenheit: 'selten', fundwelle: 9, affixe: [{ k: 'weiteHallen', wert: 1 }] };
gleich('Weite Hallen zählt Stücke', wirkungAus([hallenStueck, hallenStueck, hallenStueck]).kapazitaet, 3);

// Schalter-Affixe: an oder aus, nicht summierbar.
const blutzoll = { seltenheit: 'legendaer', fundwelle: 30, affixe: [{ k: 'blutzoll', wert: 1 }] };
gleich('Blutzoll ist ein Schalter', wirkungAus([blutzoll, blutzoll]).blutzoll, true);
gleich('Ohne Blutzoll bleibt er aus', wirkungAus([hallenStueck]).blutzoll, false);

// Die Regalsumme muss der Summe der Einzelstücke entsprechen.
const regal = [feuerStueck, giftA, hallenStueck, frostA, schlundStueck];
const summe = wirkungAus(regal);
gleich('Regalsumme Kapazität', summe.kapazitaet, 1);
gleich('Regalsumme Schlund', summe.schlund, 1);
gleich('Regalsumme Giftschaden', summe.giftpfeilDps, 6);
gleich('Regalsumme Frostgriff', summe.frostgriff, 20);
pruefe('Regal zählt nicht mehr Plätze als erlaubt', regal.length <= REGAL_PLAETZE);

const tagSumme = Object.values(summe.tags).reduce((a, b) => a + b, 0);
pruefe('Tags gezählt, mindestens einer je Stück', tagSumme >= regal.length,
  tagSumme + ' Tags bei ' + regal.length + ' Stücken');

/* ---------------- 9. Spielstand bereinigen ---------------- */

pruefe('null ergibt null', artefaktBereinigen(null) === null);
pruefe('Zeichenkette ergibt null', artefaktBereinigen('kaputt') === null);
pruefe('Unbekannte Seltenheit ergibt null',
  artefaktBereinigen({ seltenheit: 'goettlich', affixe: [{ k: 'weiteHallen', wert: 1 }] }) === null);
pruefe('Ohne gültige Affixe ergibt null',
  artefaktBereinigen({ seltenheit: 'selten', affixe: [{ k: 'gibtEsNicht', wert: 1 }] }) === null);
pruefe('Leere Affixliste ergibt null',
  artefaktBereinigen({ seltenheit: 'selten', affixe: [] }) === null);

const geflickt = artefaktBereinigen({
  name: 'x'.repeat(200),
  seltenheit: 'selten',
  fundwelle: -5,
  affixe: [
    { k: 'weiteHallen', wert: 1 },
    { k: 'gibtEsNicht', wert: 99 },
    { k: 'giftpfeile', wert: NaN },
    { k: 'gierschimmer', wert: 12 }
  ]
});
pruefe('Beschädigter Stand wird gerettet, nicht verworfen', geflickt !== null);
gleich('Name wird gekürzt', geflickt.name.length, 60);
gleich('Fundwelle mindestens 1', geflickt.fundwelle, 1);
gleich('Nur echte Affixe bleiben', geflickt.affixe.length, 2);
pruefe('NaN-Werte fliegen raus', geflickt.affixe.every((e) => isFinite(e.wert)));

// Ein erzeugtes Artefakt muss die Bereinigung unverändert überstehen —
// sonst verlöre jeder Spielstand beim Laden etwas.
for (let i = 0; i < 500; i++) {
  const rnd = wuerfel(900 + i);
  const s = SELTENHEITEN[i % SELTENHEITEN.length];
  const echt = artefaktErzeugen(1 + (i % 50), s.k, rnd);
  const nachher = artefaktBereinigen(JSON.parse(JSON.stringify(echt)));
  if (JSON.stringify(nachher) !== JSON.stringify(echt)) {
    pruefe('Speichern und Laden verändert nichts (' + s.k + ')', false,
      JSON.stringify(echt) + ' wurde zu ' + JSON.stringify(nachher));
    break;
  }
  geprueft += 1;
}

/* ---------------- 10. Namen ---------------- */

const namen = new Set();
const nameRnd = wuerfel(555);
for (let i = 0; i < 2000; i++) namen.add(namenBauen(nameRnd));
pruefe('Namen sind vielfältig', namen.size > 300, 'nur ' + namen.size + ' verschiedene');
pruefe('Kein Name ist leer', [...namen].every((n) => n.trim().length > 3));

/* ---------------- Ergebnis ---------------- */

console.log('');
if (fehler.length === 0) {
  console.log('  ' + geprueft + ' Prüfungen, alle bestanden.');
} else {
  console.log('  ' + geprueft + ' Prüfungen, ' + fehler.length + ' Fehler:');
  for (const f of fehler) console.log('    - ' + f);
}
console.log('');
process.exit(fehler.length ? 1 : 0);
