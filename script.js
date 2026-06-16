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

  // -------- PRIX DYNAMIQUES (API) --------
  async function loadPrices() {
    try {
      const res  = await fetch('/api/prices');
      if (!res.ok) return;
      const data = await res.json();

      data.services.forEach(svc => {
        // Chercher la carte correspondante par son id (service-{slug})
        const card = document.getElementById(`service-${svc.slug}`);
        if (!card) return;

        // Supprimer l'ancien badge si existant
        const existing = card.querySelector('.price-badge');
        if (existing) existing.remove();

        // Ajouter le badge de prix
        const badge = document.createElement('span');
        badge.className = 'price-badge';
        badge.textContent = svc.prix;
        card.appendChild(badge);

        // Masquer la carte si non visible
        card.style.display = svc.visible === 1 || svc.visible === true ? '' : 'none';
      });
    } catch (e) {
      // Silencieux — les prix sont optionnels
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
  let autoInterval;

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

  function startAuto() {
    autoInterval = setInterval(next, 5000);
  }

  function stopAuto() {
    clearInterval(autoInterval);
  }

  nextBtn.addEventListener('click', () => { stopAuto(); next(); startAuto(); });
  prevBtn.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });

  // Touch swipe support
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) {
      stopAuto();
      if (dx < 0) next(); else prev();
      startAuto();
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
  startAuto();

  window.addEventListener('resize', () => {
    stopAuto();
    initCarousel();
    startAuto();
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

  const observer = new IntersectionObserver((entries) => {
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
