// --- Constants & State ---
const STORAGE_USERS_KEY = 'auth_users_db';
const STORAGE_SESSION_KEY = 'auth_active_session';

// UI Navigation Elements
const registerView = document.getElementById('registerView');
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');

const toLoginBtn = document.getElementById('toLogin');
const toRegisterBtn = document.getElementById('toRegister');
const logoutBtn = document.getElementById('logoutBtn');

// Form Elements
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// Message Boxes
const regError = document.getElementById('regError');
const regSuccess = document.getElementById('regSuccess');
const loginError = document.getElementById('loginError');

// --- Helper Functions ---

// SHA-256 Password Hashing via native Web Crypto API
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function getSession() {
  return JSON.parse(localStorage.getItem(STORAGE_SESSION_KEY));
}

function setSession(user) {
  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({
    username: user.username,
    email: user.email,
    loggedInAt: new Date().toISOString()
  }));
}

function clearSession() {
  localStorage.removeItem(STORAGE_SESSION_KEY);
}

function showMessage(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

function clearMessages() {
  [regError, regSuccess, loginError].forEach(el => {
    el.textContent = '';
    el.classList.add('hidden');
  });
}

// --- Navigation / View Router ---
function navigateTo(viewName) {
  clearMessages();
  registerView.classList.add('hidden');
  loginView.classList.add('hidden');
  dashboardView.classList.add('hidden');

  if (viewName === 'register') {
    registerView.classList.remove('hidden');
  } else if (viewName === 'login') {
    loginView.classList.remove('hidden');
  } else if (viewName === 'dashboard') {
    const activeSession = getSession();
    // Protected route check
    if (!activeSession) {
      navigateTo('login');
      return;
    }
    document.getElementById('userDisplay').textContent = activeSession.username;
    dashboardView.classList.remove('hidden');
  }
}

// --- Form Handlers ---

// Registration
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;

  // 1. Basic validation (no empty fields)
  if (!username || !email || !password) {
    showMessage(regError, 'Please fill in all required fields.');
    return;
  }

  // 2. Password rules: min 8 chars, at least 1 number
  const passwordRegex = /^(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    showMessage(regError, 'Password must be at least 8 characters long and contain at least 1 number.');
    return;
  }

  // 3. Duplicate check
  const users = getUsers();
  const userExists = users.some(user => user.username.toLowerCase() === username.toLowerCase() || user.email === email);

  if (userExists) {
    showMessage(regError, 'An account with that username or email already exists.');
    return;
  }

  // 4. Hash password & store user
  const hashedPassword = await hashPassword(password);
  users.push({ username, email, password: hashedPassword });
  saveUsers(users);

  registerForm.reset();
  showMessage(regSuccess, 'Registration successful! Redirecting to login...');
  
  setTimeout(() => {
    navigateTo('login');
  }, 1500);
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const identifier = document.getElementById('loginIdentifier').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  // 1. Basic validation
  if (!identifier || !password) {
    showMessage(loginError, 'Please enter both your credentials.');
    return;
  }

  // 2. Hash input password and match user
  const hashedPassword = await hashPassword(password);
  const users = getUsers();

  const matchedUser = users.find(user => 
    (user.username.toLowerCase() === identifier || user.email === identifier) && 
    user.password === hashedPassword
  );

  if (!matchedUser) {
    // Generic error message for security (does not reveal which field is wrong)
    showMessage(loginError, 'Invalid username/email or password.');
    return;
  }

  // 3. Set session and redirect to protected dashboard
  setSession(matchedUser);
  loginForm.reset();
  navigateTo('dashboard');
});

// Logout
logoutBtn.addEventListener('click', () => {
  clearSession();
  navigateTo('login');
});

// Switch links
toLoginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  navigateTo('login');
});

toRegisterBtn.addEventListener('click', (e) => {
  e.preventDefault();
  navigateTo('register');
});

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const activeSession = getSession();
  if (activeSession) {
    navigateTo('dashboard');
  } else {
    navigateTo('login');
  }
});