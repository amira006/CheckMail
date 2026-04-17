import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./navBar";
import Footer from "./footer";
import HeroSection from "./heroSection";
import Sensibilisation from "./Sensibilisation";
import Upload from "./Upload";
import Results from "./Results";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import ProtectedRoute from "./ProtectedRoute";
import Historique from "./Historique";
import Forfaits from "./Forfaits";

import "./App.css";

// ── Layout global ─────────────────────────
function Layout({ children }) {
  const location = useLocation();

  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {!hideLayout && <Navbar />}

      <div style={{ flex: 1 }}>{children}</div>

      {!hideLayout && <Footer />}
    </div>
  );
}

// ── Routes ─────────────────────────
function AppRoutes() {
  const navigate = useNavigate();
  const [emlData, setEmlData] = useState(null);

  const handleAnalyze = (data) => {
    setEmlData(data);
    navigate("/results");
  };

  return (
    <Layout>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public */}
        <Route path="/" element={<HeroSection />} />
        <Route path="/sensibilisation" element={<Sensibilisation />} />
        <Route path="/forfaits" element={<Forfaits />} />

        {/* Protected */}
        <Route
          path="/historique"
          element={
            <ProtectedRoute>
              <Historique />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <Upload onAnalyze={handleAnalyze} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results emlData={emlData} onBack={() => navigate("/analyze")} />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

// ── App root ─────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
