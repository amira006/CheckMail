import { getToken } from "./authService";

const AUTH_API = "/auth-api";

// ============================================================
// ✅ HASH UNIQUE — utilisé partout (saveAnalysis + checkIfEmailSaved)
// ============================================================
export async function generateContentHash(content) {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode((content || "").substring(0, 5000))
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================
// ✅ CHECK si email deja dans MongoDB (via endpoint check-hash)
// ============================================================
export async function checkIfEmailSaved(emlContent) {
  const token = getToken();
  if (!token) return false;

  try {
    const hash = await generateContentHash(emlContent);
    const res = await fetch(`${AUTH_API}/api/emails/check-hash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contentHash: hash }),
    });
    const data = await res.json();
    return data.exists === true;
  } catch {
    return false;
  }
}

// ============================================================
// 💾 SAVE ANALYSIS
// ============================================================
export async function saveAnalysis(emlName, report, meta, emlContent) {
  const token = getToken();
  if (!token) return null;

  try {
    const contentHash = await generateContentHash(emlContent || emlName || "");

    const verdictMap = {
      SAFE: "Propre",
      SUSPICIOUS: "Suspect",
      DANGEROUS: "Infecté",
    };

    const body = {
      filename: emlName || "email.eml",
      contentHash,
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
    return data.data;
  } catch (e) {
    console.warn("Sauvegarde BD échouée:", e.message);
    return null;
  }
}

// ============================================================
// 📋 HISTORY / STATS / DELETE
// ============================================================
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

export async function getStats() {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${AUTH_API}/api/emails/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.success ? data.data : null;
}

// ============================================================
// 🛠️ HELPERS INTERNES
// ============================================================
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
      threats.push({ icon: "🔴", text: c.message, level: "high" })
    );

  checks
    .filter((c) => c.status === "warn")
    .slice(0, 3)
    .forEach((c) =>
      threats.push({ icon: "🟡", text: c.message, level: "medium" })
    );

  return threats;
}
