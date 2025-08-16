import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import RoomChatComponent from "../../components/RoomChatComponent";

const RoomView = () => {
  const { roomId } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [currentUsers] = useState([
    { id: "1", name: "Sarah Chen", isOnline: true },
    { id: "2", name: "You", isOnline: true },
  ]);

  // Mock room data - you'll replace with API call
  const roomData = {
    name: "Python leetcode practice",
    description: "Solve two-sum and array problems",
    createdBy: "Sarah Chen",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      {/* Room Status Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <nav className="flex items-center space-x-6">
              <Link
                to="/rooms"
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
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
                Rooms
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-900 font-medium">{roomData.name}</span>
            </nav>
            <div className="flex items-center space-x-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-gray-600">
                {isConnected ? "Connected" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Room Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Room Info Banner */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {roomData.name}
              </h1>
              <p className="text-gray-600 mb-4">{roomData.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Created by {roomData.createdBy}</span>
                <span>•</span>
                <span>Room ID: {roomId}</span>
              </div>
            </div>

            {/* Room Actions */}
            <div className="flex items-center space-x-3">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                Share room
              </button>
              <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors">
                Leave room
              </button>
            </div>
          </div>
        </div>

        {/* Main Room Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Code Editor & Problem */}
          <div className="lg:col-span-2 space-y-6">
            {/* Code Editor Placeholder */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Code editor
                </h2>
                <div className="flex items-center space-x-2">
                  <select className="text-sm border border-gray-300 rounded px-3 py-1">
                    <option>Python</option>
                    <option>JavaScript</option>
                    <option>Java</option>
                  </select>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                    Run code
                  </button>
                </div>
              </div>

              {/* Mock Code Editor */}
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64">
                <div className="text-gray-500"># Collaborative code editor</div>
                <div className="text-blue-400">def</div>{" "}
                <span className="text-yellow-400">two_sum</span>(nums, target):
                <div className="pl-4">
                  <div className="text-gray-500">
                    # Your implementation here
                  </div>
                  <div>
                    <span className="text-blue-400">return</span> []
                  </div>
                </div>
              </div>
            </div>

            {/* Problem Statement */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Problem: Two sum
              </h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 mb-4">
                  Given an array of integers <code>nums</code> and an integer{" "}
                  <code>target</code>, return indices of the two numbers such
                  that they add up to target.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Example:</h4>
                  <pre className="text-sm text-gray-700">
                    {`Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] == 9`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chat & Users */}
          <div className="space-y-6">
            {/* Online Users */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Online users ({currentUsers.length})
              </h3>
              <div className="space-y-3">
                {currentUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.isOnline ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Component */}
            <div className="h-96">
              <RoomChatComponent roomId={roomId} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RoomView;
