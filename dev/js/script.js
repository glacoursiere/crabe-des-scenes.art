document.addEventListener('DOMContentLoaded', () => {
  const h = document.querySelector('#site-header');
  const b = document.querySelector('.menu-toggle');
  const n = document.querySelector('#main-nav');
  const y = document.querySelector('#year');
  const theatreHero = document.querySelector('.hero-stage, .page-hero');

  /* L'en-tête devient noir seulement lorsque le décor théâtral complet
     (rideau supérieur et rideaux latéraux) a quitté l'écran. */
  const update = () => {
    if (!h) return;
    const threshold = theatreHero
      ? theatreHero.offsetTop + theatreHero.offsetHeight - h.offsetHeight
      : 50;
    h.classList.toggle('scrolled', window.scrollY >= threshold);
  };

  update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });

  b?.addEventListener('click', () => {
    const o = !n.classList.contains('open');
    n.classList.toggle('open', o);
    b.setAttribute('aria-expanded', String(o));
  });
  n?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => n.classList.remove('open')));
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(e => obs.observe(e));
  if (y) y.textContent = new Date().getFullYear();
});

// Mouvement très léger des lumières selon la souris.
// Désactivé sur écran tactile et lorsque l'utilisateur réduit les animations.
(() => {
  const hero = document.querySelector(".hero-stage");
  const canAnimate =
    hero &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canAnimate) return;

  const centerLight = hero.querySelector(".spotlight-center");
  const logo = hero.querySelector(".hero-logo");

  hero.addEventListener("pointermove", event => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (centerLight) {
      centerLight.style.marginLeft = `${x * 16}px`;
      centerLight.style.marginTop = `${y * 8}px`;
    }

    if (logo) {
      logo.style.transform = `translate3d(${x * 5}px, ${y * 3}px, 0)`;
    }
  });

  hero.addEventListener("pointerleave", () => {
    if (centerLight) {
      centerLight.style.marginLeft = "0";
      centerLight.style.marginTop = "0";
    }
    if (logo) logo.style.transform = "translate3d(0,0,0)";
  });
})();

/* Orienter les projecteurs de chaque page vers le point de fuite de la scène. */
(() => {
  const stages = [...document.querySelectorAll(".hero-stage, .page-hero")];

  if (!stages.length) return;

  /* L'axe optique de l'image source est incliné d'environ 49 degrés. */
  const PROJECTOR_IMAGE_AXIS_OFFSET = 49;

  const aimProjectors = () => {
    stages.forEach(stage => {
      const projectors = [...stage.querySelectorAll(".footlights span")];
      if (!projectors.length) return;

      const floor = stage.querySelector(".stage-floor");
      const stageRect = stage.getBoundingClientRect();
      const floorRect = floor?.getBoundingClientRect();
      const targetX = stageRect.left + stageRect.width / 2;
      const targetY = floorRect?.top ?? stageRect.top + stageRect.height * .66;

      projectors.forEach(projector => {
        const rect = projector.getBoundingClientRect();
        /* Coordonnées de la lentille dans l'image source du projecteur. */
        const sourceX = rect.left + rect.width * .8;
        const sourceY = rect.top + rect.height * .22;
        const angle = Math.atan2(targetX - sourceX, sourceY - targetY) * 180 / Math.PI;
        const mirror = sourceX > targetX ? -1 : 1;
        const fixtureAngle = angle - PROJECTOR_IMAGE_AXIS_OFFSET * mirror;

        projector.style.setProperty("--projector-angle", `${angle.toFixed(2)}deg`);
        projector.style.setProperty("--projector-fixture-angle", `${fixtureAngle.toFixed(2)}deg`);
        projector.style.setProperty("--projector-mirror", String(mirror));
      });
    });
  };

  let resizeFrame = 0;
  const scheduleAim = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(aimProjectors);
  };

  aimProjectors();
  window.addEventListener("load", aimProjectors, { once: true });
  window.addEventListener("resize", scheduleAim);
})();


// Navigation active selon la page.
(() => {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll(".main-nav [data-page]").forEach(link => {
    link.classList.toggle("active", link.dataset.page === currentPage);
  });
})();


/* Campagne de sociofinancement.
 * Pour la retirer manuellement, remplacer true par false ci-dessous.
 * Elle se désactivera aussi automatiquement après le 10 août 2026.
 */
const CAMPAIGN_ENABLED = true;
const CAMPAIGN_END_DATE = new Date("2026-08-10T23:59:59-04:00");

(() => {
  if (!CAMPAIGN_ENABLED || new Date() > CAMPAIGN_END_DATE) return;

  const markup = `
    <button class="campaign-tab" type="button" aria-controls="campaign-panel" aria-expanded="false">
      Soutenez Piratage<span class="piratages-s">s</span>
    </button>
    <div class="campaign-overlay" aria-hidden="true"></div>
    <aside class="campaign-panel" id="campaign-panel" aria-hidden="true" aria-labelledby="campaign-title" tabindex="-1">
      <button class="campaign-close" type="button" aria-label="Fermer le panneau de sociofinancement">×</button>
      <p class="eyebrow">Campagne de sociofinancement</p>
      <h2 id="campaign-title">Aidez-nous à faire vivre Piratage<span class="piratages-s">s</span></h2>
      <p>Votre contribution soutient directement la création et la production de Piratage<span class="piratages-s">s</span> à l'Auberge Mowatt les 21 et 22 août prochain.</p>
      <a class="button campaign-button" href="https://laruchequebec.com/fr/projets/piratages-1" target="_blank" rel="noopener noreferrer">Contribuer sur La Ruche</a>
    </aside>`;

  document.body.insertAdjacentHTML("beforeend", markup);

  const tab = document.querySelector(".campaign-tab");
  const panel = document.querySelector(".campaign-panel");
  const overlay = document.querySelector(".campaign-overlay");
  const closeButton = document.querySelector(".campaign-close");
  let previousFocus = null;

  const openPanel = () => {
    previousFocus = document.activeElement;
    panel.classList.add("open");
    overlay.classList.add("visible");
    panel.setAttribute("aria-hidden", "false");
    tab.setAttribute("aria-expanded", "true");
    document.body.classList.add("campaign-open");
    closeButton.focus();
  };

  const closePanel = () => {
    panel.classList.remove("open");
    overlay.classList.remove("visible");
    panel.setAttribute("aria-hidden", "true");
    tab.setAttribute("aria-expanded", "false");
    document.body.classList.remove("campaign-open");
    previousFocus?.focus();
  };

  tab.addEventListener("click", openPanel);
  closeButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    closePanel();
  });
  panel.addEventListener("click", event => event.stopPropagation());
  overlay.addEventListener("click", closePanel);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && panel.classList.contains("open")) closePanel();
  });
})();
