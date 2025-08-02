import React from "react";
import BrandLogo from "../../assets/brand.svg";
import "./style.css";

export default function Header() {
  return (
    <header className="header-bar">
      <img
        src={BrandLogo}
        alt="Brand Logo"
        className="brand-logo"
      />
    </header>
  );
}