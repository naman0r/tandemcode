import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Code2,
  Users,
  Zap,
  GitBranch,
  Clock,
  Trophy,
} from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-gradient-to-br from-sky-400 via-white to-blue-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>Real-time Collaboration</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Code Together,
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Learn Faster
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              The ultimate pair programming platform with live code editing,
              hidden test cases, and complexity analysis. Perfect for
              interviews, learning, and collaboration.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Users, text: "Live Collaboration" },
                { icon: Code2, text: "Smart Code Editor" },
                { icon: GitBranch, text: "Version Control" },
                { icon: Trophy, text: "Complexity Analysis" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-gray-700"
                >
                  <feature.icon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2">
                    <span>Start Coding Together</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
                <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-50">
                  Watch Demo
                </button>
              </SignedOut>

              <SignedIn>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-50">
                  Create Room
                </button>
              </SignedIn>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8 mt-12 pt-8 border-t border-gray-200">
              {/*           <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">1K+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Code Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div> */}

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">Beta</div>
                <div className="text-sm text-gray-600">
                  You are testing a Beta version
                </div>
              </div>
            </div>
          </div>

          {/* Visual/Demo */}
          <div className="relative lg:ml-8">
            {/* Code Editor Mockup */}
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Editor Header */}
              <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm font-mono">
                  two-sum.py
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">Alice</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-400 text-xs">Bob</span>
                </div>
              </div>

              {/* Editor Content */}
              <div className="p-6 font-mono text-sm">
                <div className="space-y-1">
                  <div className="text-gray-400"># Two Sum Problem</div>
                  <div className="text-blue-400">
                    def <span className="text-yellow-400">two_sum</span>(
                    <span className="text-orange-400">nums</span>,{" "}
                    <span className="text-orange-400">target</span>):
                  </div>
                  <div className="text-gray-300 ml-4"># Alice is typing...</div>
                  <div className="text-purple-400 ml-4">
                    for <span className="text-orange-400">i</span> in{" "}
                    <span className="text-blue-400">range</span>(
                    <span className="text-blue-400">len</span>(nums)):
                  </div>
                  <div className="text-purple-400 ml-8">
                    for <span className="text-orange-400">j</span> in{" "}
                    <span className="text-blue-400">range</span>(i + 1,{" "}
                    <span className="text-blue-400">len</span>(nums)):
                  </div>
                  <div className="text-gray-300 ml-12">
                    if nums[i] + nums[j] == target:
                  </div>
                  <div className="text-gray-300 ml-16 flex items-center">
                    <span>return [i, j]</span>
                    <div className="w-1 h-4 bg-green-400 ml-1 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400">15/15 tests passed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400">O(n²) complexity</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 bg-white rounded-lg shadow-lg p-3 transform rotate-12 hover:rotate-6 transition-transform">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-black font-medium">
                  Live Cursors
                </span>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-3 transform -rotate-12 hover:-rotate-6 transition-transform">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-black font-medium">
                  Real-time Results
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
