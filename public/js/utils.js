// public/js/utils.js - Shared utilities across all pages

const API_BASE = '/api';

// ── Auth token management ───────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  save: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isLoggedIn: () => !!localStorage.getItem('token'),
};

// ── API request helper ──────────────────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await response.json();

  if (!response.ok) {
    // Auto-logout on 401
    if (response.status === 401) {
      Auth.clear();
      window.location.href = '/login';
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ── UI helpers ──────────────────────────────────────────────────────────
function showAlert(alertEl, message, type = 'error') {
  alertEl.className = `alert alert-${type} show`;
  alertEl.innerHTML = `<span>${type === 'error' ? '⚠' : '✓'}</span> ${message}`;
  setTimeout(() => alertEl.classList.remove('show'), 5000);
}

function setLoading(btn, loading, text = 'Loading...') {
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner"></div> ${text}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || text;
    btn.disabled = false;
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getBadgeClass(type) {
  const map = {
    Creative: 'badge-purple',
    Technical: 'badge-blue',
    Analytical: 'badge-green',
    Business: 'badge-orange',
    Educational: 'badge-green',
    Conversational: 'badge-blue',
    Other: 'badge-red',
  };
  return map[type] || 'badge-blue';
}

function getAIBadgeClass(ai) {
  const map = { ChatGPT: 'badge-green', Gemini: 'badge-blue', DeepSeek: 'badge-purple', Perplexity: 'badge-orange' };
  return map[ai] || 'badge-blue';
}

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Copied!';
    setTimeout(() => (btn.innerHTML = orig), 2000);
  } catch {
    btn.innerHTML = '✗ Failed';
    setTimeout(() => (btn.innerHTML = '📋 Copy'), 2000);
  }
}

// ── Navbar setup (inject into each page) ───────────────────────────────
function setupNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const isLoggedIn = Auth.isLoggedIn();
  const user = Auth.getUser();

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="/" class="logo">⚡ Prompt AI</a>
      <div class="nav-links">
        ${isLoggedIn
          ? `<a href="/dashboard">Dashboard</a>
             <span style="color:var(--text-muted);font-size:0.85rem">Hi, ${user?.name?.split(' ')[0] || 'User'}</span>
             <a href="#" onclick="logout()" class="btn-nav btn">Logout</a>`
          : `<a href="/login">Login</a>
             <a href="/signup" class="btn-nav btn">Sign Up →</a>`
        }
      </div>
    </div>
  `;
}

function logout() {
  Auth.clear();
  window.location.href = '/login';
}

// Initialize navbar on load
document.addEventListener('DOMContentLoaded', setupNavbar);
