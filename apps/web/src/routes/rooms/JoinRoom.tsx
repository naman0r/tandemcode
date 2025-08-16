import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const JoinRoom = () => {
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;

    setIsJoining(true);
    // You'll implement the actual join logic here
    setTimeout(() => {
      // Mock delay - replace with actual API call
      setIsJoining(false);
      // Navigate to room: navigate(`/rooms/${roomId}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      {/* Main Content */}
      <div
        className="flex items-center justify-center px-4 sm:px-6 lg:px-8"
        style={{ minHeight: "calc(100vh - 4rem)" }}
      >
        <div className="max-w-md w-full">
          {/* Back Link */}
          <div className="mb-8">
            <Link
              to="/rooms"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to rooms
            </Link>
          </div>

          {/* Join Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Join a room
              </h1>
              <p className="text-gray-600">
                Enter a room id to join an existing coding session
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div>
                <label
                  htmlFor="roomId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Room id
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="e.g. room-abc123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Ask your partner for the room id to join their session
                </p>
              </div>

              <button
                type="submit"
                disabled={isJoining || !roomId.trim()}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isJoining ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Joining room...
                  </div>
                ) : (
                  "Join room"
                )}
              </button>
            </form>

            {/* Alternative Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Don't have a room id?
                </p>
                <Link
                  to="/rooms"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Browse available rooms
                </Link>
                <span className="text-gray-400 mx-2">or</span>
                <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                  Create a new room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JoinRoom;
