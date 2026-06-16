/* Dashboard JS — Pressing du Parc Heller */

// ============================================================
//  NAVIGATION SIDEBAR
// ============================================================
const navLinks = {
  prices: document.getElementById('navPrices'),
  messages: document.getElementById('navMessages'),
  settings: document.getElementById('navSettings'),
  password: document.getElementById('navPassword')
};
const sections = {
  prices: document.getElementById('sectionPrices'),
  messages: document.getElementById('sectionMessages'),
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
navLinks.messages.addEventListener('click', () => { showSection('messages'); loadMessages(); });
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

    // Charger le compteur de messages non lus
    await loadUnreadCount();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row" style="color:#ef4444">Erreur de chargement.</td></tr>';
  }
}

async function loadUnreadCount() {
  try {
    const res = await fetch('/api/contact/messages/unread-count', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      const badge = document.getElementById('unreadBadge');
      if (badge) {
        if (data.count > 0) {
          badge.textContent = data.count;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (e) {}
}

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
  return iconMap[slug] || `<span style="font-size: 1.2rem; line-height: 1;">${emojiFallback || '✦'}</span>`;
}

function renderTable(services) {
  const tbody = document.getElementById('servicesBody');
  if (!services.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Aucun service.</td></tr>';
    return;
  }

  tbody.innerHTML = services.map(s => `
    <tr data-slug="${esc(s.slug)}">
      <td class="emoji-cell">${getServiceIcon(s.slug, s.emoji)}</td>
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
        <div style="display:flex; gap:8px;">
          <button class="btn-edit btn-modify-svc" data-slug="${esc(s.slug)}">Modifier</button>
          <button class="btn-edit btn-delete-svc" data-slug="${esc(s.slug)}" style="background:#ef4444; border-color:#ef4444;">Supprimer</button>
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

  tbody.querySelectorAll('.btn-delete-svc').forEach(btn => {
    btn.addEventListener('click', () => deleteService(btn.dataset.slug));
  });
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
const addEmoji         = document.getElementById('addEmoji');
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
  addEmoji.focus();
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

  const emoji = addEmoji.value.trim();
  const nom = addNom.value.trim();
  const desc = addDesc.value.trim();
  const prix = addPrix.value.trim();

  if (!emoji || !nom || !prix) {
    addServiceError.textContent = 'L\'emoji, le nom et le prix sont requis.';
    return;
  }

  btnSubmitAddService.disabled = true;
  btnSubmitAddService.textContent = 'Création...';

  try {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ emoji, nom, description: desc, prix }),
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
//  GESTION DES MESSAGES
// ============================================================
async function loadMessages() {
  const tbody = document.getElementById('messagesBody');
  tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Chargement...</td></tr>';

  try {
    const res = await fetch('/api/contact/messages', { credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    const data = await res.json();
    renderMessages(data.messages);
    await loadUnreadCount(); // rafraîchir le badge
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row" style="color:#ef4444">Erreur lors de la récupération des messages.</td></tr>';
  }
}

function renderMessages(messages) {
  const tbody = document.getElementById('messagesBody');
  if (!messages || !messages.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Aucun message reçu.</td></tr>';
    return;
  }

  tbody.innerHTML = messages.map(m => {
    const dateStr = new Date(m.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    const rowClass = m.lu ? 'msg-read' : 'msg-unread';
    return `
      <tr class="${rowClass}" data-id="${m.id}">
        <td><span style="font-size:0.83rem; color:#6b7280;">${esc(dateStr)}</span></td>
        <td>
          <strong>${esc(m.nom)}</strong><br/>
          <a href="mailto:${esc(m.email)}" style="font-size:0.8rem; color:var(--gold); text-decoration:underline;">${esc(m.email)}</a>
        </td>
        <td><strong>${esc(m.sujet)}</strong></td>
        <td><div style="max-height:100px; overflow-y:auto; font-size:0.88rem; white-space:pre-wrap;">${esc(m.message)}</div></td>
        <td>
          <div style="display:flex; gap:8px;">
            <button class="btn-read-toggle btn-edit" data-id="${m.id}" data-lu="${m.lu}" style="font-size:0.75rem; padding:6px 10px;">
              ${m.lu ? 'Non lu' : 'Lu'}
            </button>
            <button class="btn-delete-msg btn-edit" data-id="${m.id}" style="background:#ef4444; border-color:#ef4444; font-size:0.75rem; padding:6px 10px;">
              Supprimer
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-read-toggle').forEach(btn => {
    btn.addEventListener('click', () => toggleMessageRead(btn.dataset.id, btn.dataset.lu !== '1'));
  });

  tbody.querySelectorAll('.btn-delete-msg').forEach(btn => {
    btn.addEventListener('click', () => deleteMessage(btn.dataset.id));
  });
}

async function toggleMessageRead(id, shouldBeRead) {
  try {
    const res = await fetch(`/api/contact/messages/${id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ lu: shouldBeRead }),
    });
    if (res.ok) {
      await loadMessages();
    }
  } catch (e) {}
}

async function deleteMessage(id) {
  if (!confirm('Supprimer définitivement ce message ?')) return;
  try {
    const res = await fetch(`/api/contact/messages/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    if (res.ok) {
      showToast('Message supprimé.');
      await loadMessages();
    }
  } catch (e) {}
}

// ============================================================
//  SAUVEGARDE DB
// ============================================================
document.getElementById('btnBackupDb').addEventListener('click', () => {
  window.location.href = '/api/settings/backup';
});

// ============================================================
//  INIT
// ============================================================
loadServices();
