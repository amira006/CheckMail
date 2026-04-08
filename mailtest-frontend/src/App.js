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
import ProtectedRoute from "./ProtectedRoute";
import "./App.css";

// ── Wrapper interne pour utiliser useNavigate ─────────────────────────────
function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [emlData, setEmlData] = useState(null);

  const handleAnalyze = (data) => {
    setEmlData(data);
    navigate("/results");
  };
  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/results";

  return (
    <Routes>
      {/* ── Pages auth — sans navbar/footer ───────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ── Pages principales ───────────────────────── */}
      <Route
        path="*"
        element={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            {!hideLayout && <Navbar />}

            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<HeroSection />} />
                <Route path="/sensibilisation" element={<Sensibilisation />} />

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
                      <Results
                        emlData={emlData}
                        onBack={() => navigate("/analyze")}
                      />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            {!hideLayout && <Footer />}
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
