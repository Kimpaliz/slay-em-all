// Vollbild im normalen Browser.
//
// Warum das eigens sein muss: `display: fullscreen` im Manifest wirkt
// **nur in der installierten App**. Wer die Seite als gewöhnlichen Tab
// öffnet, behält die Adressleiste — daran ändert kein Manifest etwas.
// Vollbild geht dort ausschließlich über die Fullscreen-API, und die
// verlangt eine echte Nutzergeste. Also braucht es einen Knopf.
//
// Der Knopf zeigt sich nur, wenn er gebraucht wird: nicht in der
// installierten App (dort ist schon Vollbild) und nicht dort, wo der
// Browser die API gar nicht kennt — auf dem iPhone kann Safari das bis
// heute nicht, dort bleibt nur das Installieren.

/** Läuft die Seite bereits als installierte App? */
export function alsAppGestartet() {
  return window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;   // iOS
}

/** Kann dieser Browser überhaupt Vollbild? */
export function vollbildMoeglich() {
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

function istVollbild() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

async function einschalten() {
  const el = document.documentElement;
  const anfordern = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!anfordern) return false;
  try {
    // `navigationUI: hide` bittet darum, auch die Systemleisten
    // wegzulassen. Browser, die das nicht kennen, ignorieren es.
    await anfordern.call(el, { navigationUI: 'hide' });
  } catch (fehler) {
    return false;
  }
  // Im Vollbild darf die Ausrichtung festgelegt werden — außerhalb
  // nicht. Die Szene ist 2,4 : 1, quer füllt sie den Schirm.
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (fehler) { /* Viele Geräte lehnen das ab. Kein Grund zur Sorge. */ }
  return true;
}

async function ausschalten() {
  try {
    if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
  } catch (fehler) { /* egal */ }
  const verlassen = document.exitFullscreen || document.webkitExitFullscreen;
  if (verlassen) {
    try { await verlassen.call(document); } catch (fehler) { /* egal */ }
  }
}

/**
 * Hängt den Umschalter an den Knopf.
 * Ohne Knopf oder ohne API passiert schlicht nichts.
 */
export function vollbildAnlegen(knopf) {
  if (!knopf) return null;

  // In der installierten App ist schon Vollbild, und wo die API fehlt,
  // wäre der Knopf eine leere Versprechung.
  if (alsAppGestartet() || !vollbildMoeglich()) {
    knopf.hidden = true;
    return null;
  }

  const nachfuehren = () => {
    const drin = istVollbild();
    knopf.classList.toggle('an', drin);
    knopf.setAttribute('aria-pressed', drin ? 'true' : 'false');
    knopf.title = drin ? 'Vollbild verlassen' : 'Vollbild — ohne Browserleiste spielen';
    knopf.setAttribute('aria-label', knopf.title);
  };

  knopf.addEventListener('click', async () => {
    if (istVollbild()) await ausschalten();
    else await einschalten();
    nachfuehren();
  });

  // Auch die Esc-Taste und die Zurück-Geste beenden Vollbild — der
  // Knopf muss das mitbekommen.
  document.addEventListener('fullscreenchange', nachfuehren);
  document.addEventListener('webkitfullscreenchange', nachfuehren);

  nachfuehren();
  return { nachfuehren };
}
