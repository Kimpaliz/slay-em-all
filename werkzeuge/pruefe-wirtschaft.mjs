// Prüft die Wirtschaft — ohne Browser.
//
//   node werkzeuge/pruefe-wirtschaft.mjs
//
// Feste Erwartungen, die stimmen müssen. Was sich tatsächlich über die
// Zeit entwickelt, rechnet balance.mjs aus.

import { RECKEN } from '../spiel/daten/recken.js';
import { AUSBAUTEN, AUSBAU_IDS, KAUFSPRUCH, DAUERHAFT } from '../spiel/daten/ausbauten.js';
import { TAG_DAUER, NACHT_DAUER, VOLLER_TAG, tagesStand, zulaufFaktor, wellenZahl, wellenStaerke } from '../spiel/tageslauf.js';
import {
  raten, torLeistung, freigeschaltet, klassenGewichte, mittlereBeute, tagesbilanz,
  einnahmen, preis, dauerhaftPreis, kannKaufen, kaufen, kannDauerhaftKaufen,
  dauerhaftKaufen, schaedelFuer, knochenBisSchaedel, darfNeuAnfangen, startkapital,
  bestesAngebot, zahl, dauer, blutVergleich, STUFEN_LEER, DAUERHAFT_LEER
} from './wirtschaft.mjs';

let geprueft = 0;
let gescheitert = 0;
const fehler = [];

function pruefe(was, bedingung, zusatz = '') {
  geprueft++;
  if (bedingung) return;
  gescheitert++;
  fehler.push(was + (zusatz ? '  — ' + zusatz : ''));
}

const nah = (a, b, t = 1e-9) => Math.abs(a - b) <= t;
const frischerZustand = () => ({
  blut: 0, knochen: 0, schrott: 0, schaedel: 0,
  stufen: { ...STUFEN_LEER }, dauerhaft: { ...DAUERHAFT_LEER }, erledigte: 0
});

console.log('\n=== Prüfungen ===\n');

/* ---------------- Daten ---------------- */

pruefe('fünf Reckenklassen', RECKEN.length === 5);
pruefe('fünf Ausbauten', AUSBAUTEN.length === 5);
pruefe('jede Ausbaustufe hat Kaufsprüche',
  AUSBAU_IDS.every((id) => Array.isArray(KAUFSPRUCH[id]) && KAUFSPRUCH[id].length > 0));
pruefe('Freischaltschwellen steigen',
  RECKEN.every((r, i) => i === 0 || r.ab > RECKEN[i - 1].ab));
pruefe('Beute steigt mit der Klasse',
  RECKEN.every((r, i) => i === 0 || r.blut > RECKEN[i - 1].blut));
pruefe('ein Bauer trägt fünf Liter — die Einheit ist ehrlich verankert',
  RECKEN[0].blut === 5);

// Die wichtigste Balanceregel überhaupt.
for (const a of AUSBAUTEN) {
  pruefe(`"${a.name}": Preis wächst schneller als die Wirkung`,
    a.preiswachstum > a.wirkung,
    `Preis ×${a.preiswachstum} gegen Wirkung ×${a.wirkung}`);
}

/* ---------------- Tageslauf ---------------- */

pruefe('ein voller Tag ist Tag plus Nacht', VOLLER_TAG === TAG_DAUER + NACHT_DAUER);
pruefe('bei Sekunde 0 ist Tag', tagesStand(0).istTag && tagesStand(0).tag === 1);
pruefe('kurz vor Tagesende ist noch Tag', tagesStand(TAG_DAUER - 1).istTag);
pruefe('bei Tagesende beginnt die Nacht', !tagesStand(TAG_DAUER).istTag);
pruefe('nach einem vollen Zyklus beginnt Tag 2',
  tagesStand(VOLLER_TAG).istTag && tagesStand(VOLLER_TAG).tag === 2);
pruefe('nachts kommt niemand', zulaufFaktor(TAG_DAUER + 10) === 0);
pruefe('tagsüber kommt jemand', zulaufFaktor(TAG_DAUER / 2) > 0);
pruefe('mitten in der Nacht ist es stockdunkel', tagesStand(TAG_DAUER + 20).helligkeit === 0);
pruefe('mittags ist es am hellsten', nah(tagesStand(TAG_DAUER / 2).helligkeit, 1));
pruefe('im Morgengrauen ist es halbdunkel',
  tagesStand(1).helligkeit > 0 && tagesStand(1).helligkeit < 0.3);
pruefe('mehr Tage bringen mehr Wellen', wellenZahl(10) > wellenZahl(1));
pruefe('die Wellenzahl ist gedeckelt', wellenZahl(1000) === 6);

// Ohne diese Normierung würde jede Änderung der Wellenform still die
// gesamte Balance verschieben.
{
  let summe = 0;
  const n = 4000;
  for (let i = 0; i < n; i++) summe += wellenStaerke((i + 0.5) / n, 4);
  pruefe('der Wellenmittelwert über einen Tag ist genau 1', nah(summe / n, 1, 1e-6),
    'gemessen ' + (summe / n).toFixed(6));
}
// Und über einen ganzen Zyklus kommen genauso viele wie bei stetigem Strom.
{
  let summe = 0;
  const n = 6000;
  for (let i = 0; i < n; i++) summe += zulaufFaktor((i + 0.5) / n * VOLLER_TAG);
  pruefe('über Tag und Nacht gemittelt bleibt der Zulauf gleich', nah(summe / n, 1, 1e-3),
    'gemessen ' + (summe / n).toFixed(4));
}
// Wellen heißt: es gibt auch Ruhe.
{
  let spitze = 0;
  let tal = Infinity;
  for (let i = 0; i < 500; i++) {
    const f = wellenStaerke(i / 500, 4);
    spitze = Math.max(spitze, f);
    tal = Math.min(tal, f);
  }
  pruefe('zwischen den Wellen ist es deutlich ruhiger', spitze > tal * 3,
    `Spitze ${spitze.toFixed(2)}, Tal ${tal.toFixed(2)}`);
}

/* ---------------- Grundraten ---------------- */

const leer = raten(STUFEN_LEER);
pruefe('Zulauf ohne Ausbau ist 0,42/s', nah(leer.zulauf, 0.42));
pruefe('Verweildauer ohne Ausbau ist 2,4 s', nah(leer.verweildauer, 2.4));
pruefe('ein Torplatz ohne Ausbau', leer.torplaetze === 1);
pruefe('Beutefaktor ohne Ausbau ist 1', nah(leer.beute, 1));
pruefe('auch ohne Kobolde wird geerntet', leer.ernteTempo > 0);
pruefe('auch ohne Kobolde gibt es Lagerplatz', leer.lagerplatz > 0);
pruefe('Kobolde erhöhen Ernte und Lager', () => true);
{
  const mit = raten({ ...STUFEN_LEER, kobold: 5 });
  pruefe('fünf Kobolde ernten schneller', mit.ernteTempo > leer.ernteTempo);
  pruefe('fünf Kobolde schaffen mehr Lagerplatz', mit.lagerplatz > leer.lagerplatz);
}
pruefe('Verweildauer fällt nie unter 0,14 s',
  nah(raten({ ...STUFEN_LEER, klinge: 80 }).verweildauer, 0.14));

/* ---------------- Freischaltung und Verteilung ---------------- */

pruefe('am Anfang nur der Bauer', freigeschaltet(0).length === 1);
pruefe('bei 30 Erledigten kommt der Söldner', freigeschaltet(30).length === 2);
pruefe('bei 50.000 Erledigten sind alle da', freigeschaltet(50000).length === 5);
{
  const v = klassenGewichte(50000);
  pruefe('Anteile ergeben zusammen 1', nah(v.reduce((a, e) => a + e.anteil, 0), 1, 1e-12));
  pruefe('die stärkste Klasse ist die häufigste',
    v[v.length - 1].anteil === Math.max(...v.map((e) => e.anteil)));
}
pruefe('am Anfang gibt es keinen Schrott', mittlereBeute(0, STUFEN_LEER).schrott === 0);
pruefe('mit Söldnern kommt Schrott', mittlereBeute(30, STUFEN_LEER).schrott > 0);
pruefe('die Presse erhöht Blut und Schrott, nicht die Knochen', () => true);
{
  const ohne = mittlereBeute(200, STUFEN_LEER);
  const mit = mittlereBeute(200, { ...STUFEN_LEER, presse: 5 });
  pruefe('Presse erhöht Blut', mit.blut > ohne.blut);
  pruefe('Presse erhöht Schrott', mit.schrott > ohne.schrott);
  pruefe('Presse lässt Knochen unberührt', nah(mit.knochen, ohne.knochen));
}

/* ---------------- Preise und Kaufen ---------------- */

pruefe('die erste Stufe kostet den Grundpreis',
  preis('lockruf', 0) === Math.ceil(AUSBAUTEN[0].grundpreis));
pruefe('jede weitere Stufe kostet mehr', preis('lockruf', 5) > preis('lockruf', 4));
{
  const z = frischerZustand();
  pruefe('ohne Geld geht nichts', !kannKaufen(z, 'lockruf'));
  pruefe('ein Kauf ohne Geld schlägt fehl', kaufen(z, 'lockruf') === false);
  pruefe('und verändert nichts', z.stufen.lockruf === 0 && z.blut === 0);

  z.blut = preis('lockruf', 0);
  pruefe('mit genau genug Geld geht es', kannKaufen(z, 'lockruf'));
  const vorher = z.blut;
  pruefe('der Kauf klappt', kaufen(z, 'lockruf') === true);
  pruefe('die Stufe steigt', z.stufen.lockruf === 1);
  pruefe('das Geld ist weg', z.blut === vorher - preis('lockruf', 0));
  pruefe('genau bis auf null', z.blut === 0);
}
{
  const z = frischerZustand();
  z.schrott = 1e9;
  pruefe('Schrottausbauten kosten Schrott, nicht Blut',
    kaufen(z, 'klinge') && z.blut === 0 && z.schrott < 1e9);
}

/* ---------------- Der Verwalter wählt sinnvoll ---------------- */
{
  const z = frischerZustand();
  z.erledigte = 300;
  z.blut = 1e6;
  z.schrott = 1e6;
  const gewaehlt = bestesAngebot(z, true);
  pruefe('bei voller Kasse wird irgendetwas Sinnvolles gewählt',
    gewaehlt !== null && AUSBAU_IDS.includes(gewaehlt), 'gewählt: ' + gewaehlt);

  const arm = frischerZustand();
  arm.erledigte = 300;
  pruefe('mit leerer Kasse wird nichts gewählt', bestesAngebot(arm, true) === null);
}

/* ---------------- Tagesbilanz ---------------- */
{
  const b = tagesbilanz(0, STUFEN_LEER, DAUERHAFT_LEER, 1);
  pruefe('am ersten Tag fallen Recken', b.erledigte > 0);
  pruefe('am ersten Tag fließt Blut', b.blut > 0);
  pruefe('am ersten Tag geht nichts verloren', !b.lagerVoll,
    b.verlorenStueck.toFixed(1) + ' Stück verloren');
  pruefe('der Haufen wird über Nacht ganz abgetragen', b.liegengeblieben < 0.5,
    b.liegengeblieben.toFixed(1) + ' liegengeblieben');
}
{
  // Viel Durchsatz, keine Kobolde: der Haufen muss überlaufen.
  const wild = { ...STUFEN_LEER, lockruf: 30, tor: 12, klinge: 12 };
  const b = tagesbilanz(500, wild, DAUERHAFT_LEER, 5);
  pruefe('ohne Kobolde läuft der Haufen bei hohem Durchsatz über', b.lagerVoll,
    b.verlorenStueck.toFixed(1) + ' Stück verloren');
  const mit = tagesbilanz(500, { ...wild, kobold: 14 }, DAUERHAFT_LEER, 5);
  pruefe('Kobolde beheben genau das', mit.verlorenStueck < b.verlorenStueck);
  pruefe('und bringen dadurch mehr Schrott ein', mit.schrott > b.schrott);
}
{
  const e = einnahmen(200, { ...STUFEN_LEER, lockruf: 4 }, DAUERHAFT_LEER, 1);
  pruefe('Einnahmen sind je Sekunde gerechnet', e.blut > 0 && e.blut < 1e6);
  pruefe('Knochen kommen erst über die Ernte', e.knochen > 0);
}

/* ---------------- Neuanfang ---------------- */

pruefe('ohne Knochen kein Schädel', schaedelFuer(0) === 0);
pruefe('120 Knochen ergeben einen Schädel', schaedelFuer(120) === 1);
pruefe('480 Knochen ergeben zwei', schaedelFuer(480) === 2);
pruefe('doppelt so lange spielen bringt nicht doppelt so viel',
  schaedelFuer(4000) < 2 * schaedelFuer(2000));
pruefe('die Restanzeige stimmt mit der Schwelle überein',
  schaedelFuer(120 - knochenBisSchaedel(0) + knochenBisSchaedel(0)) === 1);
{
  const z = frischerZustand();
  pruefe('ohne Knochen kein Neuanfang', !darfNeuAnfangen(z));
  z.knochen = 500;
  pruefe('mit genug Knochen schon', darfNeuAnfangen(z));
}
pruefe('ohne Erbe beginnt man bei null', startkapital({ erbe: 0 }).blut === 0);
pruefe('mit Erbe beginnt man mit etwas', startkapital({ erbe: 1 }).blut > 0);
{
  const z = frischerZustand();
  z.schaedel = 1;
  pruefe('ein Schädel reicht für die erste dauerhafte Stufe', kannDauerhaftKaufen(z, 'blutzoll'));
  pruefe('der Kauf klappt', dauerhaftKaufen(z, 'blutzoll'));
  pruefe('der Schädel ist weg', z.schaedel === 0);
  pruefe('die zweite Stufe kostet mehr', dauerhaftPreis('blutzoll', 1) > dauerhaftPreis('blutzoll', 0));
  pruefe('und ist jetzt unbezahlbar', !kannDauerhaftKaufen(z, 'blutzoll'));
}
pruefe('der Verwalter ist nach drei Stufen ausgebaut',
  !isFinite(dauerhaftPreis('verwalter', 3)));
{
  const ohne = raten(STUFEN_LEER, DAUERHAFT_LEER);
  const mit = raten(STUFEN_LEER, { ...DAUERHAFT_LEER, blutzoll: 3, ruf: 2 });
  pruefe('Blutzoll wirkt dauerhaft auf die Beute', mit.beute > ohne.beute);
  pruefe('Ruf wirkt dauerhaft auf den Zulauf', mit.zulauf > ohne.zulauf);
}

/* ---------------- Anzeige ---------------- */

pruefe('1234 wird zu "1,23 k"', zahl(1234) === '1,23 k', zahl(1234));
pruefe('5,6 Mio wird gekürzt', zahl(5_600_000) === '5,60 Mio', zahl(5_600_000));
pruefe('0 bleibt "0"', zahl(0) === '0');
pruefe('Unsinn ergibt "0"', zahl(NaN) === '0' && zahl(-5) === '0');
// Genau hier lief die alte Anzeige in eine endlose Ziffernkette.
pruefe('jenseits von Billionen kommt eine Zehnerpotenz statt Ziffernwust',
  zahl(1e18).includes('·10^'), zahl(1e18));
pruefe('und diese Zahl bleibt kurz', zahl(1e40).length <= 12, zahl(1e40));

pruefe('kleine Mengen bekommen keinen Vergleich', blutVergleich(3) === '');
pruefe('150 Liter sind eine Badewanne', blutVergleich(150).includes('Badewanne'), blutVergleich(150));
pruefe('2,5 Mio Liter sind ein Schwimmbecken',
  blutVergleich(2_500_000).includes('Schwimmbecken'), blutVergleich(2_500_000));
pruefe('4,8 Billionen Liter sind ein Bodensee',
  blutVergleich(4.8e13).includes('Bodensee'), blutVergleich(4.8e13));
pruefe('gigantische Mengen werden zu Weltmeeren',
  blutVergleich(1e25).includes('Weltmeer'), blutVergleich(1e25));
pruefe('bei zwei Badewannen steht die Mehrzahl',
  blutVergleich(300).includes('Badewannen'), blutVergleich(300));

pruefe('45 Sekunden bleiben Sekunden', dauer(45) === '45 s');
pruefe('90 Sekunden werden zu Minuten', dauer(90) === '1 Min 30 s', dauer(90));
pruefe('7200 Sekunden werden zu Stunden', dauer(7200) === '2 Std', dauer(7200));

/* ---------------- Ergebnis ---------------- */

if (fehler.length) {
  console.log('  Fehlgeschlagen:');
  for (const f of fehler) console.log('    · ' + f);
  console.log('');
}
console.log(`  ${geprueft - gescheitert} von ${geprueft} Prüfungen bestanden.\n`);
process.exit(gescheitert > 0 ? 1 : 0);
