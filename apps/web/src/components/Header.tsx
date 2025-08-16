import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Users, Zap } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="flex items-center justify-center w-40 pt-[1.7] h-10">
              <img src="/tandemcode_logo.png" alt="logos" />
            </div>
          </div>

          {/* Navigation - Hidden on mobile, shown on larger screens */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              <Users className="w-4 h-4" />
              <a href="/rooms" className="text-sm font-medium">
                Rooms
              </a>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Problems</span>
            </div>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate("/sign-in")}
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                >
                  Sign In
                </button>
                <SignInButton mode="modal">
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Get Started
                  </button>
                </SignInButton>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                >
                  Dashboard
                </button>
                <div className="scale-110 hover:scale-125 transition-transform duration-200">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 ring-2 ring-blue-500 ring-offset-2",
                      },
                    }}
                  />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
