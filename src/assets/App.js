import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './navBar';
import Footer from './footer';
import HeroSection from './heroSection';
import Sensibilisation from './Sensibilisation';
import Upload from './Upload';
import Results from './Results';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import './App.css';

export default function App() {
  const [emlData, setEmlData] = useState(null);

  return (
    <BrowserRouter>
      <Routes>

        {/* Auth pages — no navbar/footer */}
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Main app pages — with navbar + footer */}
        <Route path="*" element={
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Routes>
              <Route path="/" element={<HeroSection />} />
              <Route path="/sensibilisation" element={<Sensibilisation />} />
              <Route path="/analyze" element={
                <Upload onAnalyze={(data) => {
                  setEmlData(data);
                  window.location.href = '/results';
                }} />
              } />
              <Route path="/results" element={
                <Results
                  emlData={emlData}
                  onNewEmail={() => { window.location.href = '/analyze'; }}
                />
              } />
            </Routes>
            <Footer />
          </div>
        } />

      </Routes>
    </BrowserRouter>
  );
}