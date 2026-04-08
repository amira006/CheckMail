// updated
// Toutes les interactions avec le backend Node.js (port 5000)

const API = "/auth-api"; // proxy vers localhost:5000

// ── Helpers token ─────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("cm_token");
export const getUser = () =>
  JSON.parse(localStorage.getItem("cm_user") || "null");
export const isLogged = () => !!getToken();
export const saveAuth = (token, user) => {
  localStorage.setItem("cm_token", token);
  localStorage.setItem("cm_user", JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem("cm_token");
  localStorage.removeItem("cm_user");
};

// ── Register ──────────────────────────────────────────────────────────────
export async function register(name, email, password) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Erreur inscription");
  saveAuth(data.token, data.user);
  return data.user;
}

// ── Login ─────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Identifiants incorrects");
  saveAuth(data.token, data.user);
  return data.user;
}

// ── Forgot password ───────────────────────────────────────────────────────
export async function forgotPassword(email) {
  const res = await fetch(`${API}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Erreur serveur");
  return data;
}

// ── Me (profil protégé) ───────────────────────────────────────────────────
export async function fetchMe() {
  const token = getToken();
  if (!token) throw new Error("Non authentifié");
  const res = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.user;
}

// ── Logout ────────────────────────────────────────────────────────────────
export function logout() {
  clearAuth();
  window.location.href = "/login";
}
