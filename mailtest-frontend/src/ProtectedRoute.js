// ── ProtectedRoute.js ─────────────────────────────────────────────────────
// Redirige vers /login si l'utilisateur n'est pas connecté

import { Navigate } from "react-router-dom";
import { isLogged } from "./authService";

export default function ProtectedRoute({ children }) {
  return isLogged() ? children : <Navigate to="/login" replace />;
}