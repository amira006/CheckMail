import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './navBar';
import Footer from './footer';
import HeroSection from './heroSection';
import Sensibilisation from './Sensibilisation';
import Upload from './Upload';
import Results from './Results';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import Historique from './Historique';
import './App.css';

// Composant interne qui a accès à useNavigate
function AppRoutes() {
  const [emlData, setEmlData] = useState(null);
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Auth pages — no navbar/footer */}
      <Route path="/login"           element={<Login />} />
      <Route path="/signup"          element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Main pages — with navbar + footer */}
      <Route path="*" element={
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Routes>
            <Route path="/"                element={<HeroSection />} />
            <Route path="/sensibilisation" element={<Sensibilisation />} />
            <Route path="/historique"      element={<Historique />} />

            <Route path="/analyze" element={
              <Upload onAnalyze={(data) => {
                setEmlData(data);       // garde les données en mémoire
                navigate('/results');   // navigue sans rechargement
              }} />
            } />

            <Route path="/results" element={
              <Results
                emlData={emlData}
                onNewEmail={() => {
                  setEmlData(null);
                  navigate('/analyze');
                }}
              />
            } />
          </Routes>
          <Footer />
        </div>
      } />
    </Routes>
  );
}

// BrowserRouter doit envelopper AppRoutes pour que useNavigate fonctionne
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}