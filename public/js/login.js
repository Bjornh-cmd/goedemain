const form = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameStep = document.getElementById('username-step');
const passwordStep = document.getElementById('password-step');
const loginSubtitle = document.getElementById('login-subtitle');
const backUsernameBtn = document.getElementById('back-username');
const errorEl = document.getElementById('error');
const errorText = document.getElementById('error-text');
const submitBtn = document.getElementById('submit-btn');
const guestSection = document.getElementById('guest-section');
const guestBtn = document.getElementById('guest-btn');
const togglePassword = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');

let step = 'username';
let pendingUsername = '';

togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  eyeIcon.innerHTML = isPassword
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
});

function showUsernameStep() {
  step = 'username';
  pendingUsername = '';
  usernameStep.classList.remove('hidden');
  passwordStep.classList.add('hidden');
  passwordInput.required = false;
  passwordInput.value = '';
  usernameInput.required = true;
  loginSubtitle.textContent = 'Voer je gebruikersnaam in om door te gaan.';
  submitBtn.textContent = 'Volgende';
  usernameInput.focus();
}

function showPasswordStep(username) {
  step = 'password';
  pendingUsername = username;
  usernameStep.classList.add('hidden');
  passwordStep.classList.remove('hidden');
  usernameInput.required = false;
  passwordInput.required = true;
  const isBjorn = username.toLowerCase() === 'bjorn';
  loginSubtitle.textContent = isBjorn
    ? 'Welkom terug, Bjorn — voer je wachtwoord in.'
    : `Hallo ${username} — voer je wachtwoord in.`;
  submitBtn.textContent = 'Inloggen';
  passwordInput.focus();
}

backUsernameBtn.addEventListener('click', () => {
  errorEl.classList.add('hidden');
  showUsernameStep();
});

async function checkGuestMode() {
  try {
    const res = await fetch('/api/guest/info');
    if (!res.ok) return;
    const { enabled, name } = await res.json();
    if (enabled) {
      guestSection.classList.remove('hidden');
      guestBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        ${name || 'Gast'}
      `;
    }
  } catch {
    // ignore
  }
}

checkGuestMode();

guestBtn.addEventListener('click', async () => {
  errorEl.classList.add('hidden');
  guestBtn.disabled = true;
  const label = guestBtn.textContent.trim();

  try {
    const res = await fetch('/api/login/guest', { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      errorText.textContent = data.error || 'Inloggen als gast mislukt';
      errorEl.classList.remove('hidden');
      return;
    }

    window.location.href = '/dashboard';
  } catch {
    errorText.textContent = 'Verbindingsfout. Probeer opnieuw.';
    errorEl.classList.remove('hidden');
  } finally {
    guestBtn.disabled = false;
    guestBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      ${label}
    `;
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.add('hidden');

  if (step === 'username') {
    const username = usernameInput.value.trim();
    if (!username) {
      errorText.textContent = 'Gebruikersnaam is verplicht';
      errorEl.classList.remove('hidden');
      return;
    }
    showPasswordStep(username);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Bezig met inloggen...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: pendingUsername,
        password: passwordInput.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorText.textContent = data.error || 'Inloggen mislukt';
      errorEl.classList.remove('hidden');
      return;
    }

    window.location.href = '/dashboard';
  } catch {
    errorText.textContent = 'Verbindingsfout. Probeer opnieuw.';
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Inloggen';
  }
});
