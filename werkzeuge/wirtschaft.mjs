// Die gesamte Rechnerei des Spiels — und sonst nichts.
//
// Diese Datei kennt weder Browser noch Bildschirm. Dadurch kann Node sie
// prüfen (pruefe-wirtschaft.mjs) und durchrechnen (balance.mjs), während
// der Browser dieselbe Logik benutzt. Es gibt also keine zweite Wahrheit.
//
// Die Stellschrauben je Ausbau stehen bewusst nicht hier, sondern in
// spiel/daten/ausbauten.js — dort sieht man sie als Tabelle beisammen.

import { RECKEN } from '../spiel/daten/recken.js';
import { AUSBAUTEN, AUSBAU_NACH_ID, DAUERHAFT, DAUERHAFT_NACH_ID } from '../spiel/daten/ausbauten.js';
import { TAG_DAUER, NACHT_DAUER, VOLLER_TAG, wellenStaerke, wellenZahl } from '../spiel/tageslauf.js';

export const STUFEN_LEER = { lockruf: 0, klinge: 0, tor: 0, presse: 0, kobold: 0 };
export const DAUERHAFT_LEER = { blutzoll: 0, ruf: 0, erbe: 0, verwalter: 0 };

/** Ab so vielen Schädeln lohnt sich ein Neuanfang überhaupt. */
export const NEUANFANG_AB = 1;
/** Wie viele Knochen einen Schädel wert sind (quadratisch, siehe schaedelFuer). */
export const KNOCHEN_JE_SCHAEDEL = 120;

/* ---------------- Preise ---------------- */

/** Was die nächste Stufe kostet, wenn `stufe` bereits erreicht ist. */
export function preis(id, stufe) {
  const a = AUSBAU_NACH_ID[id];
  if (!a) return Infinity;
  return Math.ceil(a.grundpreis * Math.pow(a.preiswachstum, stufe));
}

export function dauerhaftPreis(id, stufe) {
  const d = DAUERHAFT_NACH_ID[id];
  if (!d) return Infinity;
  if (d.hoechstStufe != null && stufe >= d.hoechstStufe) return Infinity;
  return Math.ceil(d.grundpreis * Math.pow(d.preiswachstum, stufe));
}

/** Reicht das Geld für die nächste Stufe? */
export function kannKaufen(zustand, id) {
  const a = AUSBAU_NACH_ID[id];
  if (!a) return false;
  return zustand[a.waehrung] >= preis(id, zustand.stufen[id] || 0);
}

/**
 * Kauft eine Stufe und zieht den Preis ab.
 * Gibt zurück, ob es geklappt hat — der Aufrufer muss nicht vorher prüfen.
 */
export function kaufen(zustand, id) {
  if (!kannKaufen(zustand, id)) return false;
  const a = AUSBAU_NACH_ID[id];
  const stufe = zustand.stufen[id] || 0;
  zustand[a.waehrung] -= preis(id, stufe);
  zustand.stufen[id] = stufe + 1;
  return true;
}

export function kannDauerhaftKaufen(zustand, id) {
  const stufe = zustand.dauerhaft[id] || 0;
  return zustand.schaedel >= dauerhaftPreis(id, stufe);
}

export function dauerhaftKaufen(zustand, id) {
  if (!kannDauerhaftKaufen(zustand, id)) return false;
  const stufe = zustand.dauerhaft[id] || 0;
  zustand.schaedel -= dauerhaftPreis(id, stufe);
  zustand.dauerhaft[id] = stufe + 1;
  return true;
}

/* ---------------- Kennzahlen ---------------- */

/**
 * Die Zahlen, aus denen sich alles andere ergibt.
 *
 *  zulauf        Recken je Sekunde am Tag, im Tagesmittel
 *  verweildauer  Sekunden, die ein Recke im Tor verbringt
 *  torplaetze    wie viele gleichzeitig bedient werden
 *  beute         Faktor auf Blut und Schrott je Recke
 *  ernteTempo    Stücke je Sekunde, die nachts abgetragen werden
 *  lagerplatz    wie viele Stücke der Haufen fasst, bevor etwas verlorengeht
 */
export function raten(stufen, dauerhaft = DAUERHAFT_LEER) {
  const s = { ...STUFEN_LEER, ...stufen };
  const d = { ...DAUERHAFT_LEER, ...dauerhaft };
  const A = AUSBAU_NACH_ID;

  const rufBonus = Math.pow(DAUERHAFT_NACH_ID.ruf.wirkung, d.ruf);
  const blutzollBonus = Math.pow(DAUERHAFT_NACH_ID.blutzoll.wirkung, d.blutzoll);
  const kobolde = Math.pow(A.kobold.wirkung, s.kobold);

  return {
    zulauf: 0.42 * Math.pow(A.lockruf.wirkung, s.lockruf) * rufBonus,
    verweildauer: Math.max(0.14, 2.4 / Math.pow(A.klinge.wirkung, s.klinge)),
    torplaetze: 1 + s.tor,
    beute: Math.pow(A.presse.wirkung, s.presse) * blutzollBonus,
    // Ohne Kobolde trägt das Haus selbst ab, nur eben gemächlich.
    ernteTempo: 1.5 * kobolde,
    lagerplatz: Math.round(70 * kobolde)
  };
}

export function freigeschaltet(erledigte) {
  return RECKEN.filter((r) => erledigte >= r.ab);
}

/**
 * Wie wahrscheinlich jede freigeschaltete Klasse auftaucht.
 * Später Freigeschaltete sind häufiger; die jeweils neueste bekommt einen
 * kleinen Aufschlag, damit sie sofort auffällt.
 */
export function klassenGewichte(erledigte) {
  const frei = freigeschaltet(erledigte);
  const n = frei.length;
  const gewichte = frei.map((_, i) => Math.pow(1.5, i) * (i === n - 1 ? 1.1 : 1));
  const summe = gewichte.reduce((a, b) => a + b, 0);
  return frei.map((klasse, i) => ({ klasse, gewicht: gewichte[i], anteil: gewichte[i] / summe }));
}

export function klasseWaehlen(erledigte, zufall = Math.random) {
  const verteilung = klassenGewichte(erledigte);
  let rest = zufall();
  for (const eintrag of verteilung) {
    rest -= eintrag.anteil;
    if (rest <= 0) return eintrag.klasse;
  }
  return verteilung[verteilung.length - 1].klasse;
}

/** Mittlere Beute je erledigtem Recken, Ausbauten eingerechnet. */
export function mittlereBeute(erledigte, stufen, dauerhaft) {
  const r = raten(stufen, dauerhaft);
  let blut = 0;
  let knochen = 0;
  let schrott = 0;
  for (const { klasse, anteil } of klassenGewichte(erledigte)) {
    blut += anteil * klasse.blut;
    knochen += anteil * klasse.knochen;
    schrott += anteil * klasse.schrott;
  }
  return { blut: blut * r.beute, knochen, schrott: schrott * r.beute };
}

/**
 * Was das Tor höchstens schafft, in Recken je Sekunde.
 * Mehr Plätze oder kürzere Verweildauer heben diese Grenze.
 */
export function torLeistung(stufen, dauerhaft) {
  const r = raten(stufen, dauerhaft);
  return r.torplaetze / r.verweildauer;
}

/**
 * Erledigte je Sekunde in der Spitze einer Welle.
 * Es zählt immer der Engpass: entweder kommen zu wenige, oder das Tor
 * kommt nicht hinterher.
 */
export function durchsatz(stufen, dauerhaft, zulaufFaktor = 1) {
  const r = raten(stufen, dauerhaft);
  return Math.min(r.zulauf * zulaufFaktor, torLeistung(stufen, dauerhaft));
}

export function engpass(stufen, dauerhaft) {
  const r = raten(stufen, dauerhaft);
  const spitze = r.zulauf * (VOLLER_TAG / TAG_DAUER) * 1.6; // grobe Wellenspitze
  return spitze <= torLeistung(stufen, dauerhaft) ? 'zulauf' : 'tor';
}

/**
 * Rechnet einen vollständigen Tag-und-Nacht-Zyklus durch.
 *
 * Das muss numerisch geschehen, weil zwei Dinge nicht linear sind: Der
 * Zulauf kommt in Wellen und das Tor deckelt jede Spitze ab, und der
 * Beutehaufen hat eine Grenze — was darüber hinaus anfällt, fällt in die
 * Schlucht. Eine geschlossene Formel würde beides unterschlagen.
 *
 * `verloren` ist der wichtigste Rückgabewert: steht dort etwas, lohnen
 * sich Kobolde mehr als alles andere.
 */
export function tagesbilanz(erledigte, stufen, dauerhaft, tag = 1) {
  const r = raten(stufen, dauerhaft);
  const b = mittlereBeute(erledigte, stufen, dauerhaft);
  const grenze = torLeistung(stufen, dauerhaft);
  const wellen = wellenZahl(tag);

  const SCHRITT = 0.5;
  let gefallen = 0;
  let blut = 0;
  let haufen = 0;
  let verloren = 0;

  // Tag: Wellen laufen an, das Tor arbeitet, der Haufen wächst.
  for (let t = 0; t < TAG_DAUER; t += SCHRITT) {
    const faktor = wellenStaerke(t / TAG_DAUER, wellen) * (VOLLER_TAG / TAG_DAUER);
    const jetzt = Math.min(r.zulauf * faktor, grenze) * SCHRITT;
    gefallen += jetzt;
    blut += b.blut * jetzt;
    const platz = Math.max(0, r.lagerplatz - haufen);
    const passt = Math.min(jetzt, platz);
    haufen += passt;
    verloren += jetzt - passt;
  }

  // Nacht: der Haufen wird abgetragen.
  const abgetragen = Math.min(haufen, r.ernteTempo * NACHT_DAUER);

  return {
    erledigte: gefallen,
    blut,
    knochen: abgetragen * b.knochen,
    schrott: abgetragen * b.schrott,
    verlorenStueck: verloren,
    liegengeblieben: haufen - abgetragen,
    haufenHoehe: haufen,
    lagerplatz: r.lagerplatz,
    lagerVoll: verloren > 0.5
  };
}

/** Einnahmen je Sekunde, gemittelt über einen ganzen Tag-Nacht-Zyklus. */
export function einnahmen(erledigte, stufen, dauerhaft, tag = 1) {
  const bilanz = tagesbilanz(erledigte, stufen, dauerhaft, tag);
  return {
    blut: bilanz.blut / VOLLER_TAG,
    knochen: bilanz.knochen / VOLLER_TAG,
    schrott: bilanz.schrott / VOLLER_TAG,
    erledigte: bilanz.erledigte / VOLLER_TAG
  };
}

/* ---------------- Was lohnt sich gerade? ---------------- */

/**
 * Wie gut ein Ausbau im Moment ist, gemessen als "wie viel mehr Blut je
 * Sekunde bekomme ich, geteilt durch die Zeit, die ich dafür sparen muss".
 *
 * Das ist die Frage, die ein guter Spieler stellt, und sie taugt für
 * beides: den Verwalter im Spiel und den Balance-Rechner, der prüft, ob
 * die Preiskurve trägt.
 *
 * Ergebnis 0 heißt: bringt nichts oder ist unbezahlbar.
 */
export function bewertung(zustand, id, tag = 1) {
  const a = AUSBAU_NACH_ID[id];
  if (!a) return 0;
  const stufe = zustand.stufen[id] || 0;
  const kosten = preis(id, stufe);
  if (!isFinite(kosten) || kosten <= 0) return 0;

  const jetzt = einnahmen(zustand.erledigte, zustand.stufen, zustand.dauerhaft, tag);
  const nachher = einnahmen(
    zustand.erledigte,
    { ...zustand.stufen, [id]: stufe + 1 },
    zustand.dauerhaft,
    tag
  );

  // Alle drei Währungen zählen, und zwar **relativ**.
  //
  // Absolut zu rechnen wäre falsch: Blut kommt in Litern zu Tausenden,
  // Knochen einzeln. Ein Ausbau, der die Knochen verdoppelt, sähe neben
  // ein bisschen mehr Blut nach nichts aus. Genau daran sind die Kobolde
  // im ersten Anlauf durchgefallen — sie bringen kein Blut, sondern
  // retten Knochen und Schrott vor dem Absturz in die Schlucht.
  let zuwachs = 0;
  for (const w of ['blut', 'knochen', 'schrott']) {
    const vorher = jetzt[w];
    const nachdem = nachher[w];
    if (!(nachdem > vorher)) continue;
    zuwachs += vorher > 1e-9 ? (nachdem - vorher) / vorher : 1;
  }
  if (!(zuwachs > 0)) return 0;

  // Wie lange muss ich auf das Geld warten? Was schon da ist, zählt nicht.
  const fehlt = Math.max(0, kosten - zustand[a.waehrung]);
  const zufluss = jetzt[a.waehrung];
  const wartezeit = fehlt <= 0 ? 1 : (zufluss > 0 ? fehlt / zufluss + 1 : Infinity);
  if (!isFinite(wartezeit)) return 0;

  return zuwachs / wartezeit;
}

/**
 * Der lohnendste Ausbau. Mit `nurBezahlbar` nur unter denen, die man sich
 * gerade leisten kann — so entscheidet der Verwalter.
 */
export function bestesAngebot(zustand, nurBezahlbar = false) {
  let beste = null;
  let besterWert = 0;
  for (const a of AUSBAUTEN) {
    if (nurBezahlbar && !kannKaufen(zustand, a.id)) continue;
    const wert = bewertung(zustand, a.id);
    if (wert > besterWert) { besterWert = wert; beste = a.id; }
  }
  return beste;
}

/* ---------------- Neuanfang ---------------- */

/**
 * Wie viele Schädel der Knochenhaufen hergibt.
 * Die Wurzel sorgt dafür, dass doppelt so lange spielen nicht doppelt so
 * viel bringt — sonst würde es sich lohnen, eine Runde ewig auszudehnen.
 */
export function schaedelFuer(knochen) {
  if (!(knochen > 0)) return 0;
  return Math.floor(Math.sqrt(knochen / KNOCHEN_JE_SCHAEDEL));
}

/** Wie viele Knochen bis zum nächsten Schädel fehlen. */
export function knochenBisSchaedel(knochen) {
  const naechster = schaedelFuer(knochen) + 1;
  return Math.ceil(naechster * naechster * KNOCHEN_JE_SCHAEDEL) - Math.floor(knochen);
}

export function darfNeuAnfangen(zustand) {
  return schaedelFuer(zustand.knochen) >= NEUANFANG_AB;
}

/** Womit eine neue Runde beginnt — abhängig vom dauerhaft Gekauften. */
export function startkapital(dauerhaft) {
  const stufe = (dauerhaft && dauerhaft.erbe) || 0;
  if (stufe === 0) return { blut: 0, schrott: 0 };
  return {
    blut: Math.round(50 * Math.pow(6, stufe - 1)),
    schrott: Math.round(20 * Math.pow(6, stufe - 1))
  };
}

/** Wie oft je Minute das Haus selbst einkauft (0 = gar nicht). */
export function verwalterTakt(dauerhaft) {
  const stufe = (dauerhaft && dauerhaft.verwalter) || 0;
  if (stufe === 0) return 0;
  return [0, 6, 3, 1.2][stufe] || 1.2;
}

/* ---------------- Zahlen fürs Auge ---------------- */

const EINHEITEN = [
  ['Bio', 1e12], ['Mrd', 1e9], ['Mio', 1e6], ['k', 1e3]
];

/**
 * 1234 wird zu "1,23 k", 5,6 Mio zu "5,60 Mio".
 * Jenseits von Billionen gibt es keine Einheit mehr, die noch jemand
 * versteht — dort steht dann "1,2·10^15". Genau das fehlte vorher: die
 * alte Anzeige lief ab 10^15 in eine endlose Ziffernkette.
 */
export function zahl(n) {
  if (!isFinite(n) || n <= 0) return '0';
  if (n < 1000) return (n < 10 && n % 1 ? n.toFixed(1) : String(Math.floor(n))).replace('.', ',');
  if (n >= 1e15) {
    const exponent = Math.floor(Math.log10(n));
    const vorne = n / Math.pow(10, exponent);
    return vorne.toFixed(1).replace('.', ',') + '·10^' + exponent;
  }
  for (const [kuerzel, wert] of EINHEITEN) {
    if (n >= wert) {
      const q = n / wert;
      const text = q < 10 ? q.toFixed(2) : q < 100 ? q.toFixed(1) : String(Math.floor(q));
      return text.replace('.', ',') + ' ' + kuerzel;
    }
  }
  return String(Math.floor(n));
}

/**
 * Blut wird in Litern gerechnet. Damit die Zahl auch dann noch etwas
 * bedeutet, wenn sie zwölf Stellen hat, gibt es dazu einen Vergleich:
 * niemand kann sich 4·10^13 Liter vorstellen, einen Bodensee schon.
 *
 * Die Werte sind gerundete, aber echte Größen.
 */
const GEFAESSE = [
  { ab: 10, eins: 'Eimer', viele: 'Eimer', inhalt: 10 },
  { ab: 150, eins: 'Badewanne', viele: 'Badewannen', inhalt: 150 },
  { ab: 30_000, eins: 'Tankwagen', viele: 'Tankwagen', inhalt: 30_000 },
  { ab: 2_500_000, eins: 'Schwimmbecken', viele: 'Schwimmbecken', inhalt: 2_500_000 },
  { ab: 300_000_000, eins: 'Öltanker', viele: 'Öltanker', inhalt: 300_000_000 },
  { ab: 4.8e13, eins: 'Bodensee', viele: 'Bodenseen', inhalt: 4.8e13 },
  { ab: 5.4e16, eins: 'Nordsee', viele: 'Nordseen', inhalt: 5.4e16 },
  { ab: 3.75e18, eins: 'Mittelmeer', viele: 'Mittelmeere', inhalt: 3.75e18 },
  { ab: 1.332e21, eins: 'Weltmeer', viele: 'Weltmeere', inhalt: 1.332e21 }
];

export function blutVergleich(liter) {
  if (!isFinite(liter) || liter < GEFAESSE[0].ab) return '';
  let passend = GEFAESSE[0];
  for (const g of GEFAESSE) if (liter >= g.ab) passend = g;
  const menge = liter / passend.inhalt;
  const text = zahl(menge);
  // Im Deutschen steht alles außer der glatten Eins im Plural:
  // "1 Badewanne", aber "1,5 Badewannen".
  const wort = text === '1' ? passend.eins : passend.viele;
  return 'etwa ' + text + ' ' + wort;
}

/** Sekunden als "3 Min 20 s" oder "2 Std 5 Min". */
export function dauer(sekunden) {
  if (!isFinite(sekunden) || sekunden < 0) return '—';
  if (sekunden < 60) return Math.round(sekunden) + ' s';
  if (sekunden < 3600) {
    const min = Math.floor(sekunden / 60);
    const rest = Math.round(sekunden % 60);
    return rest ? `${min} Min ${rest} s` : `${min} Min`;
  }
  const std = Math.floor(sekunden / 3600);
  const min = Math.round((sekunden % 3600) / 60);
  return min ? `${std} Std ${min} Min` : `${std} Std`;
}

export { AUSBAUTEN, DAUERHAFT };
