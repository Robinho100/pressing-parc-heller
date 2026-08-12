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

  // Icon mapping helper (SVGs for premium feel, emojis for fallbacks)
  function getServiceIcon(slug) {
    const iconMap = {
      mariage:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v3"/><path d="M9 5h6l1 4H8l1-4z"/><path d="M8 9l-4 12h16L16 9"/><path d="M12 9v12"/></svg>`,
      chemises:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M8 3h8l4 3-3 4-3-2v13H10V8L7 10 4 6l4-3z"/><circle cx="12" cy="11" r="0.75" fill="currentColor"/><circle cx="12" cy="15" r="0.75" fill="currentColor"/></svg>`,
      doudounes:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.5c0-1 1.3-1.5 3-1.5s3 .5 3 1.5"/><path d="M6 6h12l3 4.5-2 11.5H5L3 10.5 6 6z"/><path d="M6 6v16"/><path d="M18 6v16"/><line x1="12" y1="6" x2="12" y2="22"/><line x1="3.5" y1="11" x2="20.5" y2="11"/><line x1="4.2" y1="16" x2="19.8" y2="16"/></svg>`,
      cuir:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-2.5 0-4-1-6-1-1.8 0-2.5 1.5-2 3.5.5 2 1.8 3.5 1.8 6.5s-1.3 4.5-1.8 6.5c-.5 2 .2 3.5 2 3.5 2 0 3.5-1 6-1s4 1 6 1c1.8 0 2.5-1.5 2-3.5-.5-2-1.8-3.5-1.8-6.5s1.3-4.5 1.8-6.5c.5-2-.2-3.5-2-3.5-2 0-3.5 1-6 1z"/><circle cx="12" cy="7" r="1.2" fill="currentColor"/></svg>`,
      rideaux:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="3" x2="22" y2="3"/><circle cx="2" cy="3" r="1" fill="currentColor"/><circle cx="22" cy="3" r="1" fill="currentColor"/><path d="M4 3v8c0 0 2-1.5 4.5-8"/><path d="M4 13v8c0 0 2-1.5 4.5-8"/><line x1="3.5" y1="13" x2="9" y2="13"/><path d="M20 3v8c0 0-2-1.5-4.5-8"/><path d="M20 13v8c0 0-2-1.5-4.5-8"/><line x1="15" y1="13" x2="20.5" y2="13"/></svg>`,
      couture:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="8.5" y1="8.5" x2="20" y2="20"/><line x1="8.5" y1="15.5" x2="20" y2="4"/><path d="M14 4c2 0 4 2 4 4" stroke-dasharray="2 2"/></svg>`,
      blanchisserie:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="13" r="5"/><circle cx="12" cy="13" r="2"/><circle cx="7" cy="7" r="1"/><circle cx="10" cy="7" r="0.75"/></svg>`,
      cordonnerie:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16c0 0 2-3 6-3h4l3 2h5a1 1 0 0 1 1 1.5L20 18H2v-2z"/><path d="M2 18v2h18v-2"/><path d="M8 13V9h4l3 4"/><path d="M8 9H5L4 13"/></svg>`,
    };
    return iconMap[slug] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>`;
  }

  // -------- PRIX DYNAMIQUES (API) --------
  async function loadPrices() {
    const grid = document.querySelector('.services-grid');
    if (!grid) return;

    const originalHTML = grid.innerHTML;

    // Afficher des skeleton loaders pendant le chargement
    grid.innerHTML = Array(6).fill(0).map(() => `
      <div class="service-card skeleton">
        <div class="skeleton-box skeleton-icon"></div>
        <div class="skeleton-box skeleton-title"></div>
        <div class="skeleton-box skeleton-desc"></div>
        <div class="skeleton-box skeleton-desc-short"></div>
      </div>
    `).join('');

    try {
      const res  = await fetch('/api/prices');
      if (!res.ok) {
        grid.innerHTML = originalHTML;
        return;
      }
      const data = await res.json();

      // Vider les skeletons et insérer les vrais services
      grid.innerHTML = '';

      data.services.forEach(svc => {
        const card = document.createElement('div');
        card.className = svc.slug === 'nettoyage' ? 'service-card service-card-featured reveal' : 'service-card reveal';
        card.id = `service-${svc.slug}`;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'service-icon';
        iconDiv.innerHTML = getServiceIcon(svc.slug);
        card.appendChild(iconDiv);

        const title = document.createElement('h3');
        title.innerHTML = (svc.nom || '').replace(/\s*&\s*/g, ' et ');
        card.appendChild(title);

        grid.appendChild(card);

        // Enregistrer la carte avec l'intersection observer pour l'effet de scroll reveal
        if (observer) {
          observer.observe(card);
        }
      });
    } catch (e) {
      // Silencieux — en cas d'erreur on laisse le HTML statique de secours
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

      // 2. Email
      if (settings.contact_email) {
        const contactEmail = document.getElementById('contact-email');
        const contactEmailText = document.getElementById('contact-email-text');
        const footerEmail = document.getElementById('footer-email');

        const mailtoLink = `mailto:${settings.contact_email}`;
        if (contactEmail) contactEmail.href = mailtoLink;
        if (contactEmailText) contactEmailText.textContent = settings.contact_email;
        if (footerEmail) {
          footerEmail.href = mailtoLink;
          footerEmail.textContent = settings.contact_email;
        }
      }

      // 3. Adresse
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
  const cards    = track.querySelectorAll('.avis-card');
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
    perView = getPerView();
    total   = Math.ceil(cards.length / perView);
    current = 0;
    buildDots();
    goTo(0);
  }

  initCarousel();

  window.addEventListener('resize', () => {
    initCarousel();
  });

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
    '.service-card, .about-container, .stat-card, .avis-card, .contact-card, .horaires-box, .map-wrap, .footer-container > div'
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
