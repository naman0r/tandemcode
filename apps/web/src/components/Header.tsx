import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link, NavLink } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";
import { button } from "../lib/ui";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
  }`;

const Header = () => {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src="/icon.png" alt="" className="h-7 w-7" />
            <span>TandemCode</span>
          </Link>
          <nav className="flex items-center gap-1">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className={`${button.ghost} px-2`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className={button.primary}>
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <NavLink to="/dashboard" className={navLink}>
              Dashboard
            </NavLink>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Header;
