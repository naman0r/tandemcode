import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useUser } from "./hooks/useUser";

export default function App() {
  // This will automatically sync users with backend when they sign in on home page
  useUser();

  return (
    <>
      <Header />
      <HeroSection />
      <Footer />
    </>
  );
}
