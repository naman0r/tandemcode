import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children, wide = false }: { children: ReactNode; wide?: boolean }) => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;
