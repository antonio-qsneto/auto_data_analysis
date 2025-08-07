import React from "react";
import Header from "../components/layout/Header";
import HeroSection from "../components/layout/HeroSection";
import HowItWorks from "../components/layout/HowItWorks";
import Footer from "../components/layout/Footer";
import UseCases from "../components/layout/UseCases";

export default function Index() {
  return (
    <>
      <Header />
      <HeroSection />
      <HowItWorks />
      <UseCases />
      <Footer />
    </>
  );
}