import React from "react";
import Header from "../components/layout/Header";
import HeroSection from "../components/layout/HeroSection";
import HowItWorks from "../components/layout/HowItWorks";
import Footer from "../components/layout/Footer";

export default function Index() {
  return (
    <>
      <Header />
      <HeroSection />
      <HowItWorks />
      <Footer />
    </>
  );
}