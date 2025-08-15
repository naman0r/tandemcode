import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import Header from "./components/Header";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  return (
    <>
      <Header />
      <HeroSection />
      <Footer />
    </>
  );
}
