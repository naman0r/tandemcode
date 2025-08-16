import React from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
const Rooms = () => {
  // Mock data - you'll replace this with API call
  const mockRooms = [
    {
      id: "room-1",
      name: "Python leetcode practice",
      description: "Solve two-sum and array problems",
      memberCount: 3,
      isActive: true,
    },
    {
      id: "room-2",
      name: "React interview prep",
      description: "Components, hooks, and best practices",
      memberCount: 2,
      isActive: true,
    },
    {
      id: "room-3",
      name: "System design study",
      description: "Design scalable distributed systems",
      memberCount: 5,
      isActive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Collaborative coding rooms
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join a room to practice coding problems with other developers in
            real-time
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-12">
          <Link
            to="/rooms/join"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Join existing room
          </Link>
          <button className="bg-white text-indigo-600 border-2 border-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
            Create new room
          </button>
        </div>

        {/* Active Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {room.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {room.description}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span className="text-sm">{room.memberCount} members</span>
                </div>
                <Link
                  to={`/rooms/${room.id}`}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Join room
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (when no rooms) */}
        {mockRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No active rooms
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a coding room!
            </p>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Create your first room
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Rooms;
