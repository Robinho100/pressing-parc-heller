/* Page 404 — injecte le numéro de téléphone courant depuis l'API settings */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const data = await res.json();
    const settings = data.settings;
    if (settings && settings.contact_phone) {
      const btn = document.getElementById('call-btn');
      const txt = document.getElementById('call-btn-text');
      if (btn) btn.href = 'tel:' + settings.contact_phone.replace(/\s+/g, '');
      if (txt) txt.textContent = settings.contact_phone;
    }
  } catch (e) {
    /* silencieux */
  }
});
