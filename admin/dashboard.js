/* Dashboard JS — Pressing du Parc Heller */

// ============================================================
//  NAVIGATION SIDEBAR
// ============================================================
const navLinks = {
  prices: document.getElementById('navPrices'),
  settings: document.getElementById('navSettings'),
  password: document.getElementById('navPassword')
};
const sections = {
  prices: document.getElementById('sectionPrices'),
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
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Aucun service.</td></tr>';
    return;
  }

  tbody.innerHTML = services.map(s => `
    <tr data-slug="${esc(s.slug)}">
      <td class="emoji-cell">${esc(s.emoji)}</td>
      <td><strong>${esc(s.nom)}</strong></td>
      <td style="max-width:240px;color:#6b7280;font-size:0.83rem">${esc(s.description)}</td>
      <td><span class="prix-badge">${esc(s.prix)}</span></td>
      <td>
        <label class="switch" title="${s.visible ? 'Masquer sur le site' : 'Afficher sur le site'}">
          <input type="checkbox" class="toggle-vis" data-slug="${esc(s.slug)}" ${s.visible ? 'checked' : ''} />
          <span class="switch-slider"></span>
        </label>
      </td>
      <td>
        <button class="btn-edit" data-slug="${esc(s.slug)}">Modifier</button>
      </td>
    </tr>
  `).join('');

  // Events toggle visible
  tbody.querySelectorAll('.toggle-vis').forEach(chk => {
    chk.addEventListener('change', () => toggleVisible(chk.dataset.slug, chk.checked));
  });

  // Events bouton modifier
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.slug));
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
const contactEmailInput = document.getElementById('contactEmail');
const contactPhoneInput = document.getElementById('contactPhone');
const contactAddressInput = document.getElementById('contactAddress');
const hoursWeekInput = document.getElementById('hoursWeek');
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
      contactEmailInput.value = settings.contact_email || '';
      contactPhoneInput.value = settings.contact_phone || '';
      contactAddressInput.value = settings.contact_address || '';
      hoursWeekInput.value = settings.hours_week || '';
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

  const email = contactEmailInput.value.trim();
  const phone = contactPhoneInput.value.trim();
  const address = contactAddressInput.value.trim();
  const hoursWeek = hoursWeekInput.value.trim();
  const hoursSat = hoursSatInput.value.trim();
  const mapUrl = googleMapsIframeInput.value.trim();

  if (!email || !phone || !address || !hoursWeek || !hoursSat || !mapUrl) {
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
        contact_email: email,
        contact_phone: phone,
        contact_address: address,
        hours_week: hoursWeek,
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

// ============================================================
//  INIT
// ============================================================
loadServices();
