// ── emailService.js ───────────────────────────────────────────────────────
// Sauvegarde les résultats d'analyse en MongoDB via le backend Node.js

import { getToken } from "./authService";

const AUTH_API = "/auth-api";

// ── Sauvegarder une analyse en base ───────────────────────────────────────
export async function saveAnalysis(emlName, report, meta) {
  const token = getToken();
  if (!token) return null; // pas connecté → pas de sauvegarde

  try {
    // Mapper le verdict Flask → verdict MongoDB
    const verdictMap = {
      SAFE: "Propre",
      SUSPICIOUS: "Suspect",
      DANGEROUS: "Infecté",
    };

    const body = {
      filename: emlName || "email.eml",
      score: report?.score ?? 0,
      verdict: verdictMap[report?.verdict] || "Suspect",
      subject: meta?.subject || "",
      senderEmail: meta?.from || "",
      bodyPreview: report?.summary || "",
      status: "done",
      headers: {
        spf: _extractAuth(report?.checks, "SPF"),
        dkim: _extractAuth(report?.checks, "DKIM"),
        dmarc: _extractAuth(report?.checks, "DMARC"),
      },
      threats: _buildThreats(report),
      urls: (report?.suspicious_urls || []).map((u) => u.url),
    };

    const res = await fetch(`${AUTH_API}/api/emails/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data; // { id, filename, status }
  } catch (e) {
    console.warn("Sauvegarde BD échouée (non bloquant):", e.message);
    return null;
  }
}

// ── Récupérer l'historique ─────────────────────────────────────────────────
export async function getHistory(page = 1, limit = 10) {
  const token = getToken();
  if (!token) return { emails: [], pagination: {} };

  const res = await fetch(
    `${AUTH_API}/api/emails?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.success ? data.data : { emails: [], pagination: {} };
}

// ── Supprimer une analyse ──────────────────────────────────────────────────
export async function deleteAnalysis(id) {
  const token = getToken();
  if (!token) return false;

  const res = await fetch(`${AUTH_API}/api/emails/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.success;
}

// ── Statistiques ───────────────────────────────────────────────────────────
export async function getStats() {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${AUTH_API}/api/emails/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.success ? data.data : null;
}

// ── Helpers internes ───────────────────────────────────────────────────────
function _extractAuth(checks = [], proto) {
  const c = checks.find((c) => c.message?.toUpperCase().includes(proto));
  if (!c) return "unknown";
  if (c.message?.includes("PASS")) return "pass";
  if (c.message?.includes("FAIL")) return "fail";
  if (c.message?.includes("absent")) return "missing";
  return "unknown";
}

function _buildThreats(report) {
  const threats = [];
  const checks = report?.checks || [];

  checks
    .filter((c) => c.status === "danger")
    .slice(0, 5)
    .forEach((c) =>
      threats.push({
        icon: "🔴",
        text: c.message,
        level: "high",
      })
    );

  checks
    .filter((c) => c.status === "warn")
    .slice(0, 3)
    .forEach((c) =>
      threats.push({
        icon: "🟡",
        text: c.message,
        level: "medium",
      })
    );

  return threats;
}
