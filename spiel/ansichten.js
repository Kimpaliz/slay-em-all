// Umschalten zwischen den Ansichten: das Tor und die Schatzkammer.
//
// Bedient wird mit Wischen (Handy), Klick auf die Reiter (Maus) und den
// Pfeiltasten (Tastatur). Wichtig ist, dass die abgeschaltete Ansicht
// wirklich aus dem Fluss verschwindet — sonst kann man mit der Tabulator-
// taste in unsichtbare Knöpfe springen.

const MINDEST_WISCH = 60;   // Bildpunkte, ab denen ein Wischen zählt
const MAX_SCHRAEG = 0.6;    // senkrechter Anteil, ab dem es Scrollen ist

export function ansichtenAnlegen(wurzel = document) {
  const seiten = [...wurzel.querySelectorAll('[data-ansicht]')];
  const reiter = [...wurzel.querySelectorAll('[data-zu-ansicht]')];
  if (seiten.length < 2) return { zeigen() {}, aktuelle: () => null };

  let aktuell = seiten[0].dataset.ansicht;

  function zeigen(name) {
    if (!seiten.some((s) => s.dataset.ansicht === name)) return;
    aktuell = name;
    for (const seite of seiten) {
      const an = seite.dataset.ansicht === name;
      seite.hidden = !an;
      seite.setAttribute('aria-hidden', an ? 'false' : 'true');
    }
    for (const r of reiter) {
      const an = r.dataset.zuAnsicht === name;
      r.classList.toggle('reiter-aktiv', an);
      r.setAttribute('aria-selected', an ? 'true' : 'false');
    }
  }

  function weiter(richtung) {
    const i = seiten.findIndex((s) => s.dataset.ansicht === aktuell);
    const nächste = seiten[(i + richtung + seiten.length) % seiten.length];
    zeigen(nächste.dataset.ansicht);
  }

  for (const r of reiter) {
    r.addEventListener('click', () => zeigen(r.dataset.zuAnsicht));
  }

  // Wischen
  let startX = 0;
  let startY = 0;
  let liegtAn = false;
  wurzel.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    liegtAn = true;
  }, { passive: true });

  wurzel.addEventListener('touchend', (e) => {
    if (!liegtAn) return;
    liegtAn = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) < MINDEST_WISCH) return;
    // Senkrechtes Wischen ist Scrollen, nicht Blättern.
    if (Math.abs(dy) > Math.abs(dx) * MAX_SCHRAEG) return;
    weiter(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Pfeiltasten, aber nicht während man in einem Feld tippt
  wurzel.addEventListener('keydown', (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') weiter(1);
    else if (e.key === 'ArrowLeft') weiter(-1);
  });

  zeigen(aktuell);
  return { zeigen, aktuelle: () => aktuell };
}
