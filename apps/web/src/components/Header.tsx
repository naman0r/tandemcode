import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link, NavLink } from "react-router-dom";
import { Mascot } from "./Pixel";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `font-pixel text-xl transition-colors ${isActive ? "text-orange-400" : "text-zinc-400 hover:text-zinc-100"}`;

const Header = () => (
  <header className="sticky top-0 z-40 border-b-4 border-zinc-900 bg-[#0c0c0e]/90 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex items-center gap-4 sm:gap-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="TandemCode home">
          <Mascot className="h-9 w-9" />
          <span className="hidden font-pixel text-3xl leading-none sm:inline">TandemCode</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <NavLink to="/rooms" className={navLink}>
            Rooms
          </NavLink>
          <NavLink to="/problems" className={navLink}>
            Problems
          </NavLink>
          <NavLink to="/about" className={navLink}>
            About
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button type="button" className="px-box bg-zinc-100 px-3 py-1 font-pixel text-xl leading-none text-zinc-950 [--px:#0a0a0b] hover:bg-white">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <NavLink to="/dashboard" className={navLink}>
            Dashboard
          </NavLink>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8 rounded-none" } }} />
        </SignedIn>
      </div>
    </div>
  </header>
);

export default Header;
