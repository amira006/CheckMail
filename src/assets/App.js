import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./navBar";
import HeroSection from "./heroSection";
import Sensibilisation from "./Sensibilisation";
import Footer from "./footer";
import "./App.css";

function App() {
  return (
    <Router>   

      <NavBar />

      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/sensibilisation" element={<Sensibilisation />} />
      </Routes>

      <Footer />

    </Router>
  );
}

export default App;