/* Dashboard JS — Pressing du Parc Heller */

// ============================================================
//  NAVIGATION SIDEBAR
// ============================================================
const navLinks = {
  prices: document.getElementById('navPrices'),
  reviews: document.getElementById('navReviews'),
  settings: document.getElementById('navSettings'),
  password: document.getElementById('navPassword')
};
const sections = {
  prices: document.getElementById('sectionPrices'),
  reviews: document.getElementById('sectionReviews'),
  settings: document.getElementById('sectionSettings'),
  password: document.getElementById('sectionPassword')
};

function showSection(key) {
  Object.keys(sections).forEach(k => {
    sections[k].classList.toggle('hidden', k !== key);
    navLinks[k].classList.toggle('active', k === key);
  });
}

navLinks.prices.addEventListener('click',   () => showSection('prices'));
navLinks.reviews.addEventListener('click',  () => { showSection('reviews'); loadReviews(); });
navLinks.settings.addEventListener('click', () => { showSection('settings'); loadSettingsForm(); });
navLinks.password.addEventListener('click', () => showSection('password'));

// ============================================================
//  TOAST
// ============================================================
const toast = document.getElementById('toast');
let toastTimer;

function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  toast.textContent = (type === 'success' ? '✓ ' : '✕ ') + msg;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 4000);
}

// ============================================================
//  LOGOUT
// ============================================================
document.getElementById('btnLogout').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/admin/';
});

// ============================================================
//  CHARGER LES SERVICES
// ============================================================
let allServices = [];

async function loadServices() {
  const tbody = document.getElementById('servicesBody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Chargement…</td></tr>';

  try {
    const res = await fetch('/api/prices/all', { credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    const data = await res.json();
    allServices = data.services;
    renderTable(allServices);

    // Afficher l'email admin
    // (on le récupère depuis le token côté serveur, on l'injecte via une autre route)
    const meRes = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (meRes.ok) {
      const me = await meRes.json();
      document.getElementById('adminEmail').textContent = me.email;
      const profileEmailInput = document.getElementById('profileEmail');
      if (profileEmailInput) profileEmailInput.value = me.email;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row" style="color:#ef4444">Erreur de chargement.</td></tr>';
  }
}

function renderTable(services) {
  const tbody = document.getElementById('servicesBody');
  if (!services.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Aucun service.</td></tr>';
    return;
  }

  tbody.innerHTML = services.map(s => `
    <tr data-slug="${esc(s.slug)}">
      <td class="col-name">${esc(s.nom)}</td>
      <td class="col-desc" title="${esc(s.description)}">${esc(s.description) || '—'}</td>
      <td>${s.prix ? `<span class="prix-badge">${esc(s.prix)}</span>` : '—'}</td>
      <td class="col-center">
        <label class="switch" title="${s.visible ? 'Masquer sur le site' : 'Afficher sur le site'}">
          <input type="checkbox" class="toggle-vis" data-slug="${esc(s.slug)}" ${s.visible ? 'checked' : ''} />
          <span class="switch-slider"></span>
        </label>
      </td>
      <td class="col-actions">
        <div class="row-actions">
          <button class="btn-edit btn-modify-svc" data-slug="${esc(s.slug)}">Modifier</button>
          <button class="btn-edit btn-danger btn-delete-svc" data-slug="${esc(s.slug)}">Supprimer</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Events toggle visible
  tbody.querySelectorAll('.toggle-vis').forEach(chk => {
    chk.addEventListener('change', () => toggleVisible(chk.dataset.slug, chk.checked));
  });

  // Events bouton modifier
  tbody.querySelectorAll('.btn-modify-svc').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.slug));
  });

  // Events bouton supprimer
  tbody.querySelectorAll('.btn-delete-svc').forEach(btn => {
    btn.addEventListener('click', () => deleteService(btn.dataset.slug));
  });
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
//  TOGGLE VISIBLE
// ============================================================
async function toggleVisible(slug, visible) {
  try {
    const res = await fetch(`/api/prices/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ visible }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(visible ? 'Service affiché sur le site.' : 'Service masqué du site.');
      // Mettre à jour le cache local
      const svc = allServices.find(s => s.slug === slug);
      if (svc) svc.visible = visible ? 1 : 0;
    } else {
      showToast(data.error || 'Erreur.', 'error');
    }
  } catch {
    showToast('Erreur réseau.', 'error');
  }
}

// ============================================================
//  MODAL ÉDITION
// ============================================================
const modalOverlay = document.getElementById('modalOverlay');
const modalForm    = document.getElementById('modalForm');
const editSlug     = document.getElementById('editSlug');
const editNom      = document.getElementById('editNom');
const editDesc     = document.getElementById('editDescription');
const editPrix     = document.getElementById('editPrix');
const modalError   = document.getElementById('modalError');
const descCount    = document.getElementById('descCount');
const btnSave      = document.getElementById('btnSave');

function openModal(slug) {
  const svc = allServices.find(s => s.slug === slug);
  if (!svc) return;

  editSlug.value = svc.slug;
  editNom.value  = svc.nom;
  editDesc.value = svc.description;
  editPrix.value = svc.prix;
  descCount.textContent = `${svc.description.length} / 300`;
  modalError.textContent = '';
  modalOverlay.style.display = '';
  editNom.focus();
}

function closeModal() {
  modalOverlay.style.display = 'none';
  modalForm.reset();
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

editDesc.addEventListener('input', () => {
  descCount.textContent = `${editDesc.value.length} / 300`;
});

modalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  modalError.textContent = '';

  const slug = editSlug.value;
  const nom  = editNom.value.trim();
  const desc = editDesc.value.trim();
  const prix = editPrix.value.trim();

  if (!nom || !prix) {
    modalError.textContent = 'Le nom et le prix sont obligatoires.';
    return;
  }

  btnSave.disabled = true;
  btnSave.textContent = 'Enregistrement…';

  try {
    const res = await fetch(`/api/prices/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ nom, description: desc, prix }),
    });
    const data = await res.json();

    if (res.ok) {
      closeModal();
      showToast(`"${nom}" mis à jour avec succès !`);
      await loadServices(); // Recharger le tableau
    } else {
      modalError.textContent = data.error || 'Erreur lors de la sauvegarde.';
    }
  } catch {
    modalError.textContent = 'Erreur réseau. Réessayez.';
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Enregistrer';
  }
});

// ============================================================
//  CHANGER LE PROFIL ADMIN (EMAIL & MOT DE PASSE)
// ============================================================
const pwForm      = document.getElementById('passwordForm');
const profileEmail = document.getElementById('profileEmail');
const currentPw   = document.getElementById('currentPassword');
const newPw       = document.getElementById('newPassword');
const confirmPw   = document.getElementById('confirmPassword');
const pwError     = document.getElementById('pwError');
const btnChangePw = document.getElementById('btnChangePw');

pwForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pwError.textContent = '';

  const emailVal = profileEmail.value.trim();
  const currentPwVal = currentPw.value;
  const newPwVal = newPw.value;
  const confirmPwVal = confirmPw.value;

  if (!emailVal || !currentPwVal) {
    pwError.textContent = 'L\'email et le mot de passe actuel sont requis.';
    return;
  }

  // Si changement de mot de passe demandé
  if (newPwVal || confirmPwVal) {
    if (newPwVal !== confirmPwVal) {
      pwError.textContent = 'Les nouveaux mots de passe ne correspondent pas.';
      return;
    }
    if (newPwVal.length < 8) {
      pwError.textContent = 'Le nouveau mot de passe doit faire au moins 8 caractères.';
      return;
    }
    if (!/[A-Z]/.test(newPwVal)) {
      pwError.textContent = 'Le nouveau mot de passe doit contenir au moins une majuscule.';
      return;
    }
    if (!/[0-9]/.test(newPwVal)) {
      pwError.textContent = 'Le nouveau mot de passe doit contenir au moins un chiffre.';
      return;
    }
  }

  btnChangePw.disabled = true;
  btnChangePw.textContent = 'Modification…';

  try {
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: emailVal,
        currentPassword: currentPwVal,
        newPassword: newPwVal || undefined
      }),
    });
    const data = await res.json();

    if (res.ok) {
      currentPw.value = '';
      newPw.value = '';
      confirmPw.value = '';
      showToast('Profil administrateur mis à jour avec succès !');
      document.getElementById('adminEmail').textContent = data.email;
      profileEmail.value = data.email;
      showSection('prices');
    } else {
      pwError.textContent = data.error || 'Erreur.';
    }
  } catch {
    pwError.textContent = 'Erreur réseau.';
  } finally {
    btnChangePw.disabled = false;
    btnChangePw.textContent = 'Enregistrer les modifications';
  }
});

// ============================================================
//  PARAMÈTRES (COORDONNÉES & HORAIRES)
// ============================================================
const settingsForm = document.getElementById('settingsForm');
const contactPhoneInput = document.getElementById('contactPhone');
const contactAddressInput = document.getElementById('contactAddress');
const hoursWeekInput = document.getElementById('hoursWeek');
const hoursThursdayInput = document.getElementById('hoursThursday');
const hoursSatInput = document.getElementById('hoursSat');
const googleMapsIframeInput = document.getElementById('googleMapsIframe');
const settingsError = document.getElementById('settingsError');
const btnSaveSettings = document.getElementById('btnSaveSettings');

async function loadSettingsForm() {
  settingsError.textContent = '';
  btnSaveSettings.disabled = true;
  btnSaveSettings.textContent = 'Chargement…';

  try {
    const res = await fetch('/api/settings', { credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    const data = await res.json();
    const settings = data.settings;

    if (settings) {
      contactPhoneInput.value = settings.contact_phone || '';
      contactAddressInput.value = settings.contact_address || '';
      hoursWeekInput.value = settings.hours_week || '';
      hoursThursdayInput.value = settings.hours_thursday || '';
      hoursSatInput.value = settings.hours_sat || '';
      googleMapsIframeInput.value = settings.google_maps_iframe || '';
    }
  } catch (err) {
    settingsError.textContent = 'Erreur lors du chargement des paramètres.';
  } finally {
    btnSaveSettings.disabled = false;
    btnSaveSettings.textContent = 'Enregistrer les paramètres';
  }
}

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  settingsError.textContent = '';

  const phone = contactPhoneInput.value.trim();
  const address = contactAddressInput.value.trim();
  const hoursWeek = hoursWeekInput.value.trim();
  const hoursThursday = hoursThursdayInput.value.trim();
  const hoursSat = hoursSatInput.value.trim();
  const mapUrl = googleMapsIframeInput.value.trim();

  if (!phone || !address || !hoursWeek || !hoursThursday || !hoursSat || !mapUrl) {
    settingsError.textContent = 'Tous les champs sont obligatoires.';
    return;
  }

  btnSaveSettings.disabled = true;
  btnSaveSettings.textContent = 'Enregistrement…';

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        contact_phone: phone,
        contact_address: address,
        hours_week: hoursWeek,
        hours_thursday: hoursThursday,
        hours_sat: hoursSat,
        google_maps_iframe: mapUrl
      }),
    });
    const data = await res.json();

    if (res.ok) {
      showToast('Paramètres enregistrés avec succès !');
    } else {
      settingsError.textContent = data.error || 'Erreur lors de la sauvegarde.';
    }
  } catch {
    settingsError.textContent = 'Erreur réseau. Réessayez.';
  } finally {
    btnSaveSettings.disabled = false;
    btnSaveSettings.textContent = 'Enregistrer les paramètres';
  }
});

async function deleteService(slug) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce service ? Cette action est irréversible.')) {
    return;
  }

  try {
    const res = await fetch(`/api/prices/${slug}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Service supprimé avec succès.');
      await loadServices();
    } else {
      showToast(data.error || 'Erreur lors de la suppression.', 'error');
    }
  } catch (err) {
    showToast('Erreur réseau.', 'error');
  }
}

// ============================================================
//  MODAL AJOUT SERVICE
// ============================================================
const addServiceModal = document.getElementById('addServiceModal');
const addServiceForm  = document.getElementById('addServiceForm');
const addNom           = document.getElementById('addNom');
const addDesc          = document.getElementById('addDescription');
const addPrix          = document.getElementById('addPrix');
const addServiceError  = document.getElementById('addServiceError');
const addDescCount     = document.getElementById('addDescCount');
const btnSubmitAddService = document.getElementById('btnSubmitAddService');

document.getElementById('btnOpenAddServiceModal').addEventListener('click', () => {
  addServiceError.textContent = '';
  addServiceForm.reset();
  addDescCount.textContent = '0 / 300';
  addServiceModal.style.display = '';
  addNom.focus();
});

function closeAddServiceModal() {
  addServiceModal.style.display = 'none';
}

document.getElementById('addServiceClose').addEventListener('click', closeAddServiceModal);
document.getElementById('addServiceCancel').addEventListener('click', closeAddServiceModal);
addServiceModal.addEventListener('click', e => { if (e.target === addServiceModal) closeAddServiceModal(); });

addDesc.addEventListener('input', () => {
  addDescCount.textContent = `${addDesc.value.length} / 300`;
});

addServiceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addServiceError.textContent = '';

  const nom = addNom.value.trim();
  const desc = addDesc.value.trim();
  const prix = addPrix.value.trim();

  if (!nom || !prix) {
    addServiceError.textContent = 'Le nom et le prix sont requis.';
    return;
  }

  btnSubmitAddService.disabled = true;
  btnSubmitAddService.textContent = 'Création...';

  try {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ nom, description: desc, prix }),
    });
    const data = await res.json();

    if (res.ok) {
      closeAddServiceModal();
      showToast(`Service "${nom}" créé avec succès !`);
      await loadServices();
    } else {
      addServiceError.textContent = data.error || 'Erreur lors de la création.';
    }
  } catch (err) {
    addServiceError.textContent = 'Erreur réseau. Réessayez.';
  } finally {
    btnSubmitAddService.disabled = false;
    btnSubmitAddService.textContent = 'Créer le service';
  }
});

// ============================================================
//  GESTION DES AVIS CLIENTS
// ============================================================
let allReviews = [];

const reviewModal   = document.getElementById('reviewModal');
const reviewForm    = document.getElementById('reviewForm');
const reviewId      = document.getElementById('reviewId');
const reviewAuteur  = document.getElementById('reviewAuteur');
const reviewLocalite = document.getElementById('reviewLocalite');
const reviewTexte   = document.getElementById('reviewTexte');
const reviewTexteCount = document.getElementById('reviewTexteCount');
const reviewNote    = document.getElementById('reviewNote');
const reviewSource  = document.getElementById('reviewSource');
const reviewVisible = document.getElementById('reviewVisible');
const reviewError   = document.getElementById('reviewError');
const btnSaveReview = document.getElementById('btnSaveReview');
const reviewModalTitle = document.getElementById('reviewModalTitle');

async function loadReviews() {
  const tbody = document.getElementById('reviewsBody');
  tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Chargement…</td></tr>';

  try {
    const res = await fetch('/api/reviews/all', { credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    const data = await res.json();
    allReviews = data.reviews || [];
    renderReviews(allReviews);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row" style="color:#ef4444">Erreur de chargement.</td></tr>';
  }
}

function renderReviews(reviews) {
  const tbody = document.getElementById('reviewsBody');
  if (!reviews.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Aucun avis. Cliquez sur « Ajouter un avis ».</td></tr>';
    return;
  }

  tbody.innerHTML = reviews.map(r => {
    const note = Math.max(1, Math.min(5, Number(r.note) || 5));
    const stars = '★'.repeat(note) + '☆'.repeat(5 - note);
    const extrait = r.texte.length > 140 ? r.texte.slice(0, 140) + '…' : r.texte;
    return `
      <tr data-id="${r.id}">
        <td class="col-name">${esc(r.auteur)}${r.localite ? `<br/><span style="font-size:0.8rem;color:#64748b;font-weight:400">${esc(r.localite)}</span>` : ''}</td>
        <td><div style="max-width:340px;font-size:0.86rem;color:#475569;">${esc(extrait)}</div></td>
        <td><span style="color:#f5a623;letter-spacing:1px;">${stars}</span></td>
        <td><span class="prix-badge">${esc(r.source)}</span></td>
        <td class="col-center">
          <label class="switch" title="${r.visible ? 'Masquer du site' : 'Afficher sur le site'}">
            <input type="checkbox" class="toggle-review-vis" data-id="${r.id}" ${r.visible ? 'checked' : ''} />
            <span class="switch-slider"></span>
          </label>
        </td>
        <td class="col-actions">
          <div class="row-actions">
            <button class="btn-edit btn-modify-review" data-id="${r.id}">Modifier</button>
            <button class="btn-edit btn-danger btn-delete-review" data-id="${r.id}">Supprimer</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.toggle-review-vis').forEach(chk => {
    chk.addEventListener('change', () => toggleReviewVisible(chk.dataset.id, chk.checked));
  });
  tbody.querySelectorAll('.btn-modify-review').forEach(btn => {
    btn.addEventListener('click', () => openReviewModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.btn-delete-review').forEach(btn => {
    btn.addEventListener('click', () => deleteReview(btn.dataset.id));
  });
}

function openReviewModal(id) {
  reviewError.textContent = '';
  reviewForm.reset();

  if (id) {
    const r = allReviews.find(x => String(x.id) === String(id));
    if (!r) return;
    reviewModalTitle.textContent = 'Modifier un avis';
    reviewId.value = r.id;
    reviewAuteur.value = r.auteur;
    reviewLocalite.value = r.localite || '';
    reviewTexte.value = r.texte;
    reviewNote.value = String(Math.max(1, Math.min(5, Number(r.note) || 5)));
    reviewSource.value = r.source || 'Google';
    reviewVisible.checked = !!r.visible;
  } else {
    reviewModalTitle.textContent = 'Ajouter un avis';
    reviewId.value = '';
    reviewVisible.checked = true;
    reviewNote.value = '5';
    reviewSource.value = 'Google';
  }

  reviewTexteCount.textContent = `${reviewTexte.value.length} / 1000`;
  reviewModal.style.display = '';
  reviewAuteur.focus();
}

function closeReviewModal() {
  reviewModal.style.display = 'none';
}

document.getElementById('btnOpenAddReviewModal').addEventListener('click', () => openReviewModal(null));
document.getElementById('reviewModalClose').addEventListener('click', closeReviewModal);
document.getElementById('reviewCancel').addEventListener('click', closeReviewModal);
reviewModal.addEventListener('click', e => { if (e.target === reviewModal) closeReviewModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeReviewModal(); });

reviewTexte.addEventListener('input', () => {
  reviewTexteCount.textContent = `${reviewTexte.value.length} / 1000`;
});

reviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  reviewError.textContent = '';

  const payload = {
    auteur: reviewAuteur.value.trim(),
    localite: reviewLocalite.value.trim(),
    texte: reviewTexte.value.trim(),
    note: parseInt(reviewNote.value, 10),
    source: reviewSource.value,
    visible: reviewVisible.checked,
  };

  if (!payload.auteur || !payload.texte) {
    reviewError.textContent = "L'auteur et le texte de l'avis sont obligatoires.";
    return;
  }

  const id = reviewId.value;
  const isEdit = !!id;

  btnSaveReview.disabled = true;
  btnSaveReview.textContent = 'Enregistrement…';

  try {
    const res = await fetch(isEdit ? `/api/reviews/${id}` : '/api/reviews', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      closeReviewModal();
      showToast(isEdit ? 'Avis mis à jour.' : 'Avis ajouté.');
      await loadReviews();
    } else {
      reviewError.textContent = data.error || 'Erreur lors de la sauvegarde.';
    }
  } catch {
    reviewError.textContent = 'Erreur réseau. Réessayez.';
  } finally {
    btnSaveReview.disabled = false;
    btnSaveReview.textContent = 'Enregistrer';
  }
});

async function toggleReviewVisible(id, visible) {
  try {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ visible }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(visible ? 'Avis affiché sur le site.' : 'Avis masqué du site.');
      const r = allReviews.find(x => String(x.id) === String(id));
      if (r) r.visible = visible ? 1 : 0;
    } else {
      showToast(data.error || 'Erreur.', 'error');
      await loadReviews();
    }
  } catch {
    showToast('Erreur réseau.', 'error');
  }
}

async function deleteReview(id) {
  if (!confirm('Supprimer définitivement cet avis ? Cette action est irréversible.')) return;
  try {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Avis supprimé.');
      await loadReviews();
    } else {
      showToast(data.error || 'Erreur lors de la suppression.', 'error');
    }
  } catch {
    showToast('Erreur réseau.', 'error');
  }
}

// ============================================================
//  INIT
// ============================================================
loadServices();
