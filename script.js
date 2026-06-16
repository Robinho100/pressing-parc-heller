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
  function getServiceIcon(slug, emojiFallback) {
    const iconMap = {
      costumes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z"/><path d="M12 5v3"/><path d="M21 16.5A2.5 2.5 0 0 1 18.5 19H5.5A2.5 2.5 0 0 1 3 16.5L12 8l9 8.5z"/></svg>`,
      mariage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l-2 5H8L6 3z"/><path d="M8 8l-3 13h14L16 8H8z"/><path d="M12 3v5"/></svg>`,
      chemises: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 6.14V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3.14L3.62 3.46A1 1 0 0 0 2 4.3v15.2a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V4.3a1 1 0 0 0-1.62-.84z"/><path d="M12 22V6"/><path d="M16 6l-4 4-4-4"/></svg>`,
      doudounes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M4 8h16"/><path d="M4 13h16"/><path d="M4 17h16"/></svg>`,
      cuir: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      rideaux: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>`,
      couture: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="9.8" y1="8.2" x2="20" y2="17"/><line x1="9.8" y1="15.8" x2="20" y2="7"/></svg>`,
      blanchisserie: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="4"/><circle cx="8" cy="7" r="1"/></svg>`,
      livraison: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    };
    return iconMap[slug] || `<span style="font-size: 2.2rem; line-height: 1;">${emojiFallback || '✦'}</span>`;
  }

  // -------- PRIX DYNAMIQUES (API) --------
  async function loadPrices() {
    try {
      const res  = await fetch('/api/prices');
      if (!res.ok) return;
      const data = await res.json();

      const grid = document.querySelector('.services-grid');
      if (!grid) return;

      // Vider le grid de secours statique et le remplacer par le contenu dynamique de la base de données
      grid.innerHTML = '';

      data.services.forEach(svc => {
        const card = document.createElement('div');
        card.className = 'service-card reveal';
        card.id = `service-${svc.slug}`;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'service-icon';
        iconDiv.innerHTML = getServiceIcon(svc.slug, svc.emoji);
        card.appendChild(iconDiv);

        const title = document.createElement('h3');
        title.innerHTML = svc.nom;
        card.appendChild(title);

        const desc = document.createElement('p');
        desc.innerHTML = svc.description || '';
        card.appendChild(desc);

        const badge = document.createElement('span');
        badge.className = 'price-badge';
        badge.innerHTML = svc.prix;
        card.appendChild(badge);

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
      const target = parseInt(el.getAttribute('data-target'), 10);
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current).toLocaleString('fr-FR');
        if (current >= target) {
          el.textContent = target.toLocaleString('fr-FR');
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
