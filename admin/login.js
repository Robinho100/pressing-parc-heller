/* Login page JS — Pressing du Parc Heller */

const form    = document.getElementById('loginForm');
const emailEl = document.getElementById('email');
const pwEl    = document.getElementById('password');
const errEl   = document.getElementById('formError');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const btnLogin  = document.getElementById('btnLogin');
const togglePw  = document.getElementById('togglePw');

// ---- Afficher/cacher le mot de passe ----
togglePw.addEventListener('click', () => {
  const isHidden = pwEl.type === 'password';
  pwEl.type = isHidden ? 'text' : 'password';
  togglePw.setAttribute('aria-label', isHidden ? 'Cacher le mot de passe' : 'Afficher le mot de passe');
});

// ---- Soumission du formulaire ----
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';

  const email    = emailEl.value.trim();
  const password = pwEl.value.trim();

  if (!email || !password) {
    errEl.textContent = 'Veuillez remplir tous les champs.';
    return;
  }

  // Loader
  btnText.style.display   = 'none';
  btnLoader.style.display = 'inline-block';
  btnLogin.disabled = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'same-origin',
    });

    const data = await res.json();

    if (res.ok) {
      window.location.href = '/admin/dashboard.html';
    } else {
      errEl.textContent = data.error || 'Erreur de connexion.';
    }
  } catch (err) {
    errEl.textContent = 'Impossible de contacter le serveur. Réessayez.';
  } finally {
    btnText.style.display   = 'inline';
    btnLoader.style.display = 'none';
    btnLogin.disabled = false;
  }
});

// ---- Focus automatique ----
emailEl.focus();
