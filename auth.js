/* ═══════════════════════════════════════════════════════════════
   AUTH — Firebase email/password gate for Vishnupriyaa BMS
   Shows #auth-screen until signed in, then reveals #app-root
   and triggers initAppUI() (defined in index.html) exactly once.
   ═══════════════════════════════════════════════════════════════ */

let _authMode = 'login'; // 'login' | 'signup'
let _appBooted = false;

function authSwitchTab(mode) {
  _authMode = mode;
  document.getElementById('auth-tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('auth-tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('auth-submit').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('auth-forgot').style.display = mode === 'login' ? '' : 'none';
  document.getElementById('auth-error').textContent = '';
}

function _authSetError(msg) {
  const el = document.getElementById('auth-error');
  if (el) el.textContent = msg || '';
}

function _authFriendlyError(code) {
  const map = {
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-password': 'Enter a password.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/email-already-in-use': 'An account already exists for this email — try Sign In instead.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found for this email.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error — check your connection.'
  };
  return map[code] || 'Something went wrong. Please try again.';
}

function authSubmit() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  _authSetError('');

  if (!email) { _authSetError('Enter your email.'); return; }
  if (!password) { _authSetError('Enter your password.'); return; }

  const btn = document.getElementById('auth-submit');
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Please wait…';

  const done = () => { btn.disabled = false; btn.textContent = originalText; };

  if (_authMode === 'login') {
    _auth.signInWithEmailAndPassword(email, password)
      .then(done)
      .catch(err => { done(); _authSetError(_authFriendlyError(err.code)); });
  } else {
    _auth.createUserWithEmailAndPassword(email, password)
      .then(done)
      .catch(err => { done(); _authSetError(_authFriendlyError(err.code)); });
  }
}

function authForgotPassword() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) { _authSetError('Enter your email above first, then click "Forgot password?"'); return; }
  _authSetError('');
  _auth.sendPasswordResetEmail(email)
    .then(() => { _authSetError('Password reset email sent — check your inbox.'); })
    .catch(err => { _authSetError(_authFriendlyError(err.code)); });
}

function authLogout() {
  if (!confirm('Sign out of the BMS?')) return;
  _auth.signOut();
}

/* Allow Enter key to submit from either field */
document.addEventListener('DOMContentLoaded', () => {
  ['auth-email', 'auth-password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') authSubmit();
    });
  });
});

/* ─── Core gate: react to Firebase auth state ─── */
_auth.onAuthStateChanged(user => {
  const authScreen = document.getElementById('auth-screen');
  const appRoot = document.getElementById('app-root');

  if (user) {
    authScreen.style.display = 'none';
    appRoot.classList.remove('app-hidden');
    const emailEl = document.getElementById('su-email');
    if (emailEl) emailEl.textContent = user.email || '';

    if (!_appBooted) {
      _appBooted = true;
      if (typeof initAppUI === 'function') initAppUI();
    }
  } else {
    appRoot.classList.add('app-hidden');
    authScreen.style.display = 'flex';
    _authSetError('');
    const pwEl = document.getElementById('auth-password');
    if (pwEl) pwEl.value = '';
  }
});
