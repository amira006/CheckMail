// src/chatService.js
import { getToken } from "./authService";

const API = "/auth-api";

// ── Sauvegarde un message ─────────────────────────────────────────────────
export async function saveMessage(emailId, role, content) {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API}/api/chat/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emailId, role, content }),
    });
  } catch (_) {}
}

// ── Récupère l'historique d'un email ─────────────────────────────────────
export async function getChatHistory(emailId) {
  const token = getToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API}/api/chat/${emailId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.messages || [];
  } catch (_) {
    return [];
  }
}
