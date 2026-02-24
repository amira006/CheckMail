import React from "react";
import "./App.css";
import NavBar from "./navBar";
import HeroSection from "./heroSection";
import Footer from "./footer";
import Sensibilisation from "./assets/Sensibilisation";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/sensibilisation" element={<Sensibilisation />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
