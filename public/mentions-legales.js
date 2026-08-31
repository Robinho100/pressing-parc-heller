/* Mentions légales — injecte le numéro de téléphone courant depuis l'API settings */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const data = await res.json();
    const settings = data.settings;
    if (settings && settings.contact_phone) {
      const telLink = 'tel:' + settings.contact_phone.replace(/\s+/g, '');
      document.querySelectorAll('#legal-phone, #legal-rgpd-phone, #legal-rgpd-phone2').forEach((el) => {
        el.href = telLink;
        el.textContent = settings.contact_phone;
      });
    }
  } catch (e) {
    /* silencieux : la page reste valide avec le numéro par défaut */
  }
});
