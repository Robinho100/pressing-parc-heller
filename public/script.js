/* ============================================
   PRESSING DU PARC HELLER — JAVASCRIPT
   - Navbar scroll effect
   - Mobile menu toggle
   - Avis carousel
   - Stats counter animation
   - Scroll reveal
   - Chargement dynamique des prix (API)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  let observer;

  // Icônes de prestations : correspondance slug → symbole du sprite SVG.
  const SERVICE_ICONS = new Set([
    'mariage', 'chemises', 'doudounes', 'cuir',
    'rideaux', 'couture', 'blanchisserie', 'cordonnerie',
  ]);
  function serviceIconId(slug) {
    const base = String(slug || '').replace(/-\d+$/, '');
    return SERVICE_ICONS.has(base) ? `ico-${base}` : 'ico-default';
  }

  // -------- PRIX DYNAMIQUES (API) --------
  async function loadPrices() {
    const list = document.querySelector('.service-list');
    if (!list) return;

    const originalHTML = list.innerHTML;

    try {
      const res  = await fetch('/api/prices');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.services || !data.services.length) return;

      list.innerHTML = '';

      data.services.forEach((svc, i) => {
        const row = document.createElement('li');
        row.className = 'service-row reveal';
        row.id = `service-${svc.slug}`;

        const index = document.createElement('span');
        index.className = 'service-index';
        index.textContent = String(i + 1).padStart(2, '0');
        row.appendChild(index);

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('class', 'service-icon');
        icon.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', `#${serviceIconId(svc.slug)}`);
        icon.appendChild(use);
        row.appendChild(icon);

        const body = document.createElement('div');
        body.className = 'service-body';

        const title = document.createElement('h3');
        title.textContent = (svc.nom || '').replace(/\s*&\s*/g, ' et ');
        body.appendChild(title);

        // Description : affichée uniquement si l'admin en a saisi une.
        const descText = (svc.description || '').trim();
        if (descText) {
          const desc = document.createElement('p');
          desc.className = 'service-desc';
          desc.textContent = descText;
          body.appendChild(desc);
        }

        row.appendChild(body);

        // Prix : affiché uniquement si l'admin en a saisi un, aligné à droite de la ligne.
        const prixText = (svc.prix || '').trim();
        if (prixText) {
          const prix = document.createElement('span');
          prix.className = 'service-price';
          prix.textContent = prixText;
          row.appendChild(prix);
        }

        list.appendChild(row);

        // Enregistrer la ligne avec l'intersection observer pour l'effet de scroll reveal
        if (observer) {
          observer.observe(row);
        }
      });
    } catch (e) {
      list.innerHTML = originalHTML;
    }
  }

  // -------- PARAMÈTRES DYNAMIQUES (API) --------
  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      const settings = data.settings;
      if (!settings) return;

      // 1. Téléphone
      if (settings.contact_phone) {
        const heroPhoneLink = document.getElementById('hero-phone-link');
        const heroPhoneText = document.getElementById('hero-phone-text');
        const contactPhone = document.getElementById('contact-phone');
        const contactPhoneText = document.getElementById('contact-phone-text');
        const footerPhone = document.getElementById('footer-phone');

        const telLink = `tel:${settings.contact_phone.replace(/\s+/g, '')}`;
        if (heroPhoneLink) heroPhoneLink.href = telLink;
        if (heroPhoneText) heroPhoneText.textContent = settings.contact_phone;
        if (contactPhone) contactPhone.href = telLink;
        if (contactPhoneText) contactPhoneText.textContent = settings.contact_phone;
        if (footerPhone) {
          footerPhone.href = telLink;
          footerPhone.textContent = settings.contact_phone;
        }
      }

      // 2. Adresse
      if (settings.contact_address) {
        const heroAddress = document.getElementById('hero-address');
        const contactAddressText = document.getElementById('contact-address-text');
        const footerAddress = document.getElementById('footer-address');

        if (heroAddress) heroAddress.textContent = settings.contact_address;
        const formatted = settings.contact_address.replace(/,\s*/, '<br/>');
        if (contactAddressText) contactAddressText.innerHTML = formatted;
        if (footerAddress) footerAddress.innerHTML = formatted;
      }

      // 4. Horaires
      if (settings.hours_week) {
        const heroHoursWeek = document.getElementById('hero-hours-week');
        const contactHoursWeek = document.getElementById('contact-hours-week');
        if (heroHoursWeek) heroHoursWeek.textContent = settings.hours_week;
        if (contactHoursWeek) contactHoursWeek.textContent = settings.hours_week;
      }

      if (settings.hours_thursday) {
        const contactHoursThursday = document.getElementById('contact-hours-thursday');
        if (contactHoursThursday) contactHoursThursday.textContent = settings.hours_thursday;
      }

      if (settings.hours_sat) {
        const heroHoursSat = document.getElementById('hero-hours-sat');
        const contactHoursSat = document.getElementById('contact-hours-sat');
        if (heroHoursSat) heroHoursSat.textContent = settings.hours_sat;
        if (contactHoursSat) contactHoursSat.textContent = settings.hours_sat;
      }

      // 5. Carte Google Maps
      if (settings.google_maps_iframe) {
        const googleMap = document.getElementById('google-map');
        if (googleMap) googleMap.src = settings.google_maps_iframe;
      }
    } catch (e) {
      // Silencieux
    }
  }

  loadPrices();
  loadSettings();

  // -------- CARROUSEL PHOTOS "À PROPOS" --------
  const aboutTrack = document.getElementById('aboutPhotos');
  const aboutPrev  = document.getElementById('aboutPhotosPrev');
  const aboutNext  = document.getElementById('aboutPhotosNext');

  if (aboutTrack && aboutPrev && aboutNext) {
    const stepSize = () => {
      const first = aboutTrack.querySelector('.about-photo');
      if (!first) return aboutTrack.clientWidth;
      const gap = parseFloat(getComputedStyle(aboutTrack).columnGap) || 12;
      return first.getBoundingClientRect().width + gap;
    };

    const syncButtons = () => {
      const maxScroll = aboutTrack.scrollWidth - aboutTrack.clientWidth - 1;
      aboutPrev.disabled = aboutTrack.scrollLeft <= 0;
      aboutNext.disabled = aboutTrack.scrollLeft >= maxScroll;
    };

    aboutPrev.addEventListener('click', () => {
      aboutTrack.scrollBy({ left: -stepSize(), behavior: 'smooth' });
    });
    aboutNext.addEventListener('click', () => {
      aboutTrack.scrollBy({ left: stepSize(), behavior: 'smooth' });
    });
    aboutTrack.addEventListener('scroll', syncButtons, { passive: true });
    window.addEventListener('resize', syncButtons);
    syncButtons();
  }

  // -------- NAVBAR SCROLL --------
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // -------- MOBILE MENU --------
  const navToggle = document.getElementById('navToggle');
  const navMenu   = document.getElementById('navMenu');

  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    const spans = navToggle.querySelectorAll('span');
    if (navMenu.classList.contains('open')) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  // Close mobile menu on link click
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });

  // -------- AVIS CAROUSEL --------
  const track    = document.getElementById('avisTrack');
  let   cards    = track.querySelectorAll('.avis-card');
  const dotsWrap = document.getElementById('avisDots');
  const prevBtn  = document.getElementById('avisPrev');
  const nextBtn  = document.getElementById('avisNext');

  let current = 0;
  let perView = getPerView();
  let total   = Math.ceil(cards.length / perView);

  function getPerView() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'avis-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    dotsWrap.querySelectorAll('.avis-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  }

  function getCardWidth() {
    if (cards.length === 0) return 0;
    const card = cards[0];
    const gap  = 24;
    return card.offsetWidth + gap;
  }

  function goTo(index) {
    current = index;
    const offset = current * perView * getCardWidth();
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
  }

  function next() {
    current = (current + 1) % total;
    goTo(current);
  }

  function prev() {
    current = (current - 1 + total) % total;
    goTo(current);
  }

  nextBtn.addEventListener('click', () => { next(); });
  prevBtn.addEventListener('click', () => { prev(); });

  // Touch swipe support
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  // Init carousel
  function initCarousel() {
    cards   = track.querySelectorAll('.avis-card');
    perView = getPerView();
    total   = Math.max(1, Math.ceil(cards.length / perView));
    current = 0;
    buildDots();
    goTo(0);
  }

  initCarousel();

  window.addEventListener('resize', () => {
    initCarousel();
  });

  // -------- AVIS DYNAMIQUES (API) --------
  function makeReviewCard(r) {
    const note = Math.max(1, Math.min(5, Number(r.note) || 5));

    const card = document.createElement('div');
    card.className = 'avis-card';

    const header = document.createElement('div');
    header.className = 'avis-card-header';

    const stars = document.createElement('div');
    stars.className = 'stars';
    const full = document.createElement('span');
    full.textContent = '★'.repeat(note);
    stars.appendChild(full);
    if (note < 5) {
      const dim = document.createElement('span');
      dim.style.opacity = '0.3';
      dim.textContent = '★'.repeat(5 - note);
      stars.appendChild(dim);
    }

    const src = document.createElement('span');
    const srcName = r.source || 'Google';
    src.className = 'avis-source ' + (
      srcName === 'Pages Jaunes' ? 'pages-source' :
      srcName === 'Autre'        ? 'autre-source' : 'google-source'
    );
    src.textContent = srcName;

    header.appendChild(stars);
    header.appendChild(src);

    const p = document.createElement('p');
    p.className = 'avis-text';
    p.textContent = '« ' + String(r.texte || '').trim() + ' »';

    const author = document.createElement('div');
    author.className = 'avis-author';
    const avatar = document.createElement('div');
    avatar.className = 'author-avatar';
    avatar.textContent = (String(r.auteur || '?').trim()[0] || '?').toUpperCase();
    const meta = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = r.auteur || '';
    meta.appendChild(strong);
    if (r.localite) {
      const span = document.createElement('span');
      span.textContent = r.localite;
      meta.appendChild(span);
    }
    author.appendChild(avatar);
    author.appendChild(meta);

    card.appendChild(header);
    card.appendChild(p);
    card.appendChild(author);
    return card;
  }

  async function loadReviews() {
    try {
      const res = await fetch('/api/reviews');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.reviews || !data.reviews.length) return;

      track.innerHTML = '';
      data.reviews.forEach(r => track.appendChild(makeReviewCard(r)));

      initCarousel();

      // Ré-enregistrer les nouvelles cartes pour l'effet d'apparition au scroll
      if (observer) {
        track.querySelectorAll('.avis-card').forEach(el => {
          el.classList.add('reveal');
          observer.observe(el);
        });
      }
    } catch (e) {
      // On garde les avis statiques présents dans le HTML
    }
  }

  // -------- STATS COUNTER --------
  const statNums = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  function animateCounters() {
    statNums.forEach(el => {
      const rawTarget = el.getAttribute('data-target');
      const target = parseFloat(rawTarget);
      const isFloat = rawTarget.includes('.');
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString('fr-FR');
        if (current >= target) {
          el.textContent = isFloat ? target.toFixed(1) : target.toLocaleString('fr-FR');
          clearInterval(timer);
        }
      }, 16);
    });
  }

  // -------- INTERSECTION OBSERVER (reveal + stats) --------
  const revealEls = document.querySelectorAll(
    '.service-row, .about-container, .stat-card, .avis-card, .contact-card, .horaires-box, .map-wrap, .footer-container > div'
  );

  revealEls.forEach(el => el.classList.add('reveal'));

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealEls.forEach(el => observer.observe(el));

  // Charger les avis gérés depuis l'admin (remplace les avis statiques si présents)
  loadReviews();

  // Stats observer
  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !statsAnimated) {
        statsAnimated = true;
        animateCounters();
        statsObserver.disconnect();
      }
    }, { threshold: 0.5 });
    statsObserver.observe(statsSection);
  }

  // -------- BACK TO TOP BUTTON --------
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // -------- SMOOTH NAV HIGHLIGHT --------
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let found = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        found = section.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active-nav', link.getAttribute('href') === '#' + found);
    });
  }, { passive: true });

  // -------- FORMULAIRE DE CONTACT --------
  const contactForm = document.getElementById('homeContactForm');
  const contactFeedback = document.getElementById('contactFormFeedback');
  const btnSend = document.getElementById('btnSendContact');
  const btnSendText = document.getElementById('contactBtnText');
  const btnSendLoader = document.getElementById('contactBtnLoader');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      contactFeedback.textContent = '';
      contactFeedback.className = 'contact-form-feedback';

      const nom = document.getElementById('contact_nom').value.trim();
      const email = document.getElementById('contact_email').value.trim();
      const sujet = document.getElementById('contact_sujet').value.trim();
      const message = document.getElementById('contact_message').value.trim();

      if (!nom || !email || !sujet || !message) {
        contactFeedback.textContent = 'Veuillez remplir tous les champs.';
        contactFeedback.classList.add('error');
        return;
      }

      // Loader
      btnSendText.style.display = 'none';
      btnSendLoader.style.display = 'inline-block';
      btnSend.disabled = true;

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom, email, sujet, message }),
        });
        const data = await res.json();

        if (res.ok) {
          contactFeedback.textContent = data.message || 'Votre message a bien été envoyé !';
          contactFeedback.classList.add('success');
          contactForm.reset();
        } else {
          contactFeedback.textContent = data.error || 'Une erreur est survenue.';
          contactFeedback.classList.add('error');
        }
      } catch (err) {
        contactFeedback.textContent = 'Impossible de se connecter au serveur. Réessayez.';
        contactFeedback.classList.add('error');
      } finally {
        btnSendText.style.display = 'inline';
        btnSendLoader.style.display = 'none';
        btnSend.disabled = false;
      }
    });
  }

});
