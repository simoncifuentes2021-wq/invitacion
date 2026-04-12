/**
 * Alex & Trayssi — Invitación Digital de Matrimonio
 * Script principal: apertura, pétalos, animaciones de scroll
 */

'use strict';

window._pageReadyForInteraction = false;
window._guestReady = false;

const DEFAULT_GUEST = {
  tituloPortada: 'Invitacion especial',
  nombrePortada: 'Familia invitada',
  saludoHero: 'Con mucho carino queremos compartir este momento contigo.',
  mensajeHero: 'Tu presencia hara aun mas especial este dia tan importante para nosotros. Hemos preparado esta invitacion con mucho amor y alegria para ti.',
  cantidadPases: 1,
  whatsappNombre: 'Familia invitada'
};

function waitForImage(img) {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();

  return new Promise(resolve => {
    const finish = () => {
      img.removeEventListener('load', finish);
      img.removeEventListener('error', finish);
      resolve();
    };

    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', finish, { once: true });
  });
}

function waitForInitialResources() {
  const images = Array.from(document.images);
  const imagePromises = images.map(waitForImage);
  const fontPromise = document.fonts && document.fonts.ready
    ? document.fonts.ready.catch(() => {})
    : Promise.resolve();
  const safetyTimeout = new Promise(resolve => setTimeout(resolve, 5000));

  return Promise.race([
    Promise.all([...imagePromises, fontPromise]),
    safetyTimeout
  ]);
}

function getGuestIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getGuestNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('nombre');
}

function updateText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
}

function updateHtml(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.innerHTML = value;
}

function initMusicPlayer() {
  const audio = document.getElementById('bgMusic');
  const toggle = document.getElementById('musicToggle');

  if (!audio || !toggle) return;

  const label = toggle.querySelector('.music-toggle-label');

  const renderState = () => {
    const isPaused = audio.paused;
    toggle.classList.toggle('is-muted', isPaused);
    toggle.classList.remove('hidden');
    toggle.setAttribute('aria-label', isPaused ? 'Reproducir música' : 'Pausar música');
    if (label) {
      label.textContent = isPaused ? 'Activar música' : 'Música encendida';
    }
  };

  window._playInvitationMusic = async () => {
    try {
      audio.volume = 0.55;
      await audio.play();
    } catch {}
    renderState();
  };

  toggle.addEventListener('click', async () => {
    if (audio.paused) {
      await window._playInvitationMusic();
      return;
    }

    audio.pause();
    renderState();
  });

  audio.addEventListener('play', renderState);
  audio.addEventListener('pause', renderState);
  renderState();
}

function buildGuestHeroMessage(guest) {
  const passes = Number(guest.cantidadPases || 1);
  const passesLabel = passes > 1 ? `${passes} lugares reservados` : '1 lugar reservado';
  return `${guest.mensajeHero}<br><span class="guest-pass-note">${passesLabel} especialmente para ustedes.</span>`;
}

function applyGuestData(guest) {
  const mergedGuest = { ...DEFAULT_GUEST, ...guest };
  const guestName = mergedGuest.nombrePortada || DEFAULT_GUEST.nombrePortada;
  const portadaTitle = mergedGuest.tituloPortada || DEFAULT_GUEST.tituloPortada;

  updateText('[data-guest-cover-title]', portadaTitle);
  updateText('[data-guest-cover-name]', guestName);
  updateText('[data-guest-badge]', `Reservado para ${guestName}`);
  updateText('[data-guest-salute]', mergedGuest.saludoHero);
  updateHtml('[data-guest-message]', buildGuestHeroMessage(mergedGuest));

  const ctaNote = document.querySelector('[data-guest-note]');
  if (ctaNote) {
    ctaNote.textContent = `Nos encantara celebrar junto a ${guestName}.`;
  }

  const whatsappBtn = document.querySelector('.whatsapp-btn');
  if (whatsappBtn) {
    const guestLabel = encodeURIComponent(mergedGuest.whatsappNombre || guestName);
    whatsappBtn.href = `https://wa.me/56944852746?text=Hola%20Trayssi!%20Confirmo%20mi%20asistencia%20a%20tu%20matrimonio.%20Invitacion%20a%20nombre%20de%20${guestLabel}%20%F0%9F%92%8D`;
  }
}

async function fetchGuestData() {
  const guestId = getGuestIdFromUrl();
  const guestName = getGuestNameFromUrl();

  if (guestId) {
    try {
      const response = await fetch(`/api/invitado?id=${encodeURIComponent(guestId)}`, {
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {}
  }

  if (guestName) {
    return {
      nombrePortada: guestName,
      whatsappNombre: guestName,
      saludoHero: `Esta invitacion ha sido preparada especialmente para ${guestName}.`,
      mensajeHero: 'Queremos que vivas con nosotros una celebracion intima, elegante y llena de gratitud.'
    };
  }

  return DEFAULT_GUEST;
}

(function initExperienceGate() {
  const preloader = document.getElementById('page-preloader');
  const openBtn = document.getElementById('openBtn');

  if (openBtn) {
    openBtn.classList.add('is-disabled');
    openBtn.setAttribute('aria-disabled', 'true');
  }

  Promise.all([
    waitForInitialResources(),
    fetchGuestData().then(guest => {
      applyGuestData(guest);
      window._guestReady = true;
    }).catch(() => {
      applyGuestData(DEFAULT_GUEST);
      window._guestReady = true;
    })
  ]).finally(() => {
    window._pageReadyForInteraction = true;
    document.body.classList.remove('is-loading');

    if (openBtn) {
      openBtn.classList.remove('is-disabled');
      openBtn.removeAttribute('aria-disabled');
    }

    if (preloader) {
      preloader.classList.add('is-hidden');
      setTimeout(() => preloader.remove(), 500);
    }
  });
})();

initMusicPlayer();

/* ══════════════════════════════════════════════════
   PÉTALOS / PARTÍCULAS — Canvas compartido
   ══════════════════════════════════════════════════ */

class Petal {
  constructor(canvas, isOpening = false) {
    this.canvas = canvas;
    this.isOpening = isOpening;
    this.reset(true);
  }

  reset(initial = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.x = Math.random() * w;
    this.y = initial ? Math.random() * h : -20;
    this.size = Math.random() * 8 + 4;
    this.speedY = Math.random() * 1.2 + 0.4;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.03;
    this.opacity = Math.random() * 0.5 + 0.15;
    this.swing = Math.random() * Math.PI * 2;
    this.swingSpeed = Math.random() * 0.02 + 0.01;
    this.swingAmp = Math.random() * 20 + 8;
    // Variantes de color: burdeos y dorado
    const colors = ['#8B1A2F', '#A52035', '#C02840', '#7A1528', '#C9A84C', '#E2C97E'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.y += this.speedY;
    this.swing += this.swingSpeed;
    this.x += Math.sin(this.swing) * 0.6 + this.speedX;
    this.rotation += this.rotSpeed;
    if (this.y > this.canvas.height + 20) this.reset();
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    // Forma de pétalo simple
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 0.45, this.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Pétalos en pantalla de apertura ── */
(function initOpeningPetals() {
  const canvas = document.getElementById('opening-petals');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let petals = [];
  let raf;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    petals = Array.from({ length: 30 }, () => new Petal(canvas, true));
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach(p => { p.update(); p.draw(ctx); });
    raf = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  init();
  animate();

  // Exponer función para detener al cerrar
  window._stopOpeningPetals = () => {
    cancelAnimationFrame(raf);
  };
})();

/* ── Pétalos en contenido principal ── */
(function initMainPetals() {
  const canvas = document.getElementById('petals-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let petals = [];
  let raf;
  let running = false;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    // Menos pétalos en main para no distraer
    petals = Array.from({ length: 18 }, () => new Petal(canvas, true));
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach(p => { p.update(); p.draw(ctx); });
    raf = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  init();

  // Se activa cuando el main es visible
  window._startMainPetals = () => {
    if (!running) { running = true; animate(); }
  };
})();


/* ══════════════════════════════════════════════════
   APERTURA DEL SOBRE
   ══════════════════════════════════════════════════ */
(function initOpening() {
  const openBtn      = document.getElementById('openBtn');
  const openScreen   = document.getElementById('opening-screen');
  const mainContent  = document.getElementById('main-content');

  if (!openBtn || !openScreen || !mainContent) return;

  function openInvitation() {
    if (!window._pageReadyForInteraction || !window._guestReady) return;

    if (window._playInvitationMusic) {
      window._playInvitationMusic();
    }

    // Efecto de apertura: fade-out de la pantalla de apertura
    openScreen.classList.add('fade-out');

    // Preparar contenido principal
    mainContent.classList.remove('hidden');
    mainContent.style.opacity = '0';

    setTimeout(() => {
      // Activar pétalos del main
      if (window._startMainPetals) window._startMainPetals();

      // Aparecer contenido con fade
      mainContent.style.transition = 'opacity 0.8s ease';
      mainContent.style.opacity = '1';

      // Scroll al inicio y activar animaciones del hero
      window.scrollTo({ top: 0 });

      setTimeout(() => {
        openScreen.style.display = 'none';
        if (window._stopOpeningPetals) window._stopOpeningPetals();

        // Activar fade-in del hero
        triggerHeroAnimations();
        // Iniciar observer de scroll
        initScrollObserver();
      }, 600);

    }, 700);
  }

  openBtn.addEventListener('click', openInvitation);
  openBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openInvitation();
  });
  openBtn.setAttribute('tabindex', '0');
  openBtn.setAttribute('role', 'button');
  openBtn.setAttribute('aria-label', 'Abrir invitación');
})();


/* ══════════════════════════════════════════════════
   ANIMACIONES HERO — aparición progresiva
   ══════════════════════════════════════════════════ */
function triggerHeroAnimations() {
  const elements = document.querySelectorAll('.hero-section .fade-in-up');
  elements.forEach(el => {
    const delay = parseFloat(getComputedStyle(el).transitionDelay) || 0;
    setTimeout(() => el.classList.add('visible'), delay * 1000 + 100);
  });
}


/* ══════════════════════════════════════════════════
   SCROLL OBSERVER — revelar secciones
   ══════════════════════════════════════════════════ */
function initScrollObserver() {
  const revealSections = document.querySelectorAll('.reveal-section');
  const revealCards    = document.querySelectorAll('.reveal-card');

  const opts = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.15
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, opts);

  const cardOpts = { ...opts, threshold: 0.1 };

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Delay escalonado para múltiples cards
        setTimeout(() => entry.target.classList.add('visible'), i * 120);
        cardObserver.unobserve(entry.target);
      }
    });
  }, cardOpts);

  revealSections.forEach(el => sectionObserver.observe(el));
  revealCards.forEach(el => cardObserver.observe(el));
}


/* ══════════════════════════════════════════════════
   PARALLAX SUTIL en flores del hero
   ══════════════════════════════════════════════════ */
(function initParallax() {
  const floralTop    = document.querySelector('.floral-top');
  const floralBottom = document.querySelector('.floral-bottom');

  if (!floralTop || !floralBottom) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        // Flores superiores se mueven hacia arriba suavemente
        floralTop.style.transform    = `translateY(${scrollY * 0.18}px)`;
        // Flores inferiores se mueven hacia abajo suavemente
        floralBottom.style.transform = `translateY(${scrollY * -0.12}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();


/* ══════════════════════════════════════════════════
   MICROINTERACCIÓN: brillos en los nombres del hero
   ══════════════════════════════════════════════════ */
(function initNameShimmer() {
  const names = document.querySelectorAll('.name-script');
  names.forEach(name => {
    name.addEventListener('mouseenter', () => {
      name.style.textShadow = '0 2px 30px rgba(139,26,47,0.25), 0 0 60px rgba(201,168,76,0.15)';
    });
    name.addEventListener('mouseleave', () => {
      name.style.textShadow = '0 2px 20px rgba(139,26,47,0.12)';
    });
  });
})();


/* ══════════════════════════════════════════════════
   COPIADO AL PORTAPAPELES — datos bancarios
   ══════════════════════════════════════════════════ */
(function initCopyGifts() {
  const giftValues = document.querySelectorAll('.gift-value');

  giftValues.forEach(el => {
    el.style.cursor = 'pointer';
    el.setAttribute('title', 'Clic para copiar');

    el.addEventListener('click', () => {
      const text = el.textContent.trim();
      if (!navigator.clipboard) return;

      navigator.clipboard.writeText(text).then(() => {
        const original = el.textContent;
        el.textContent = '✓ Copiado';
        el.style.color = '#4A6741';
        setTimeout(() => {
          el.textContent = original;
          el.style.color = '';
        }, 1500);
      }).catch(() => {});
    });
  });
})();


/* ══════════════════════════════════════════════════
   COUNTER ANIMADO — cuenta regresiva hasta el 14 Nov
   ══════════════════════════════════════════════════ */
(function initCountdown() {
  // La boda es 14 de Noviembre 2026 a las 11:30
  const weddingDate = new Date('2026-11-14T11:30:00');

  function getCountdown() {
    const now  = new Date();
    const diff = weddingDate - now;
    if (diff <= 0) return null;

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  }

  // Insertar el countdown discretamente en el hero, bajo la fecha
  const dateBlock = document.querySelector('.date-block');
  if (!dateBlock) return;

  const cd = getCountdown();
  if (!cd) return; // Ya pasó la fecha

  const cdEl = document.createElement('div');
  cdEl.className = 'countdown-widget fade-in-up';

  function renderCd(data) {
    return `
      <div class="countdown-item">
        <div class="countdown-value">${data.days}</div>
        <div class="countdown-label">días</div>
      </div>
      <div class="countdown-separator">·</div>
      <div class="countdown-item">
        <div class="countdown-value">${String(data.hours).padStart(2,'0')}</div>
        <div class="countdown-label">horas</div>
      </div>
      <div class="countdown-separator">·</div>
      <div class="countdown-item">
        <div class="countdown-value">${String(data.minutes).padStart(2,'0')}</div>
        <div class="countdown-label">minutos</div>
      </div>
    `;
  }

  cdEl.innerHTML = renderCd(cd);
  dateBlock.insertAdjacentElement('afterend', cdEl);

  // Activar visibilidad (se activa cuando hero anima)
  setTimeout(() => {
    cdEl.classList.add('visible');
  }, 1300);

  // Actualizar cada minuto
  setInterval(() => {
    const data = getCountdown();
    if (data) cdEl.innerHTML = renderCd(data);
  }, 60000);
})();
