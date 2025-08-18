import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import RoomChatComponent from "../../components/RoomChatComponent";
import RoomMembersPanel from "../../components/RoomMembersPanel";
import { roomApi } from "../../lib/api";
import useWebSocket from "../../hooks/UseWebSocket";

const RoomView = () => {
  const { roomId } = useParams();
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get real WebSocket connection state
  const { connectionState } = useWebSocket(roomId || "");
  const isConnected = connectionState === "connected";

  // Fetch real room data
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!roomId) return;

      try {
        setLoading(true);
        const room = await roomApi.getRoom(roomId);
        setRoomData(room);
      } catch (error) {
        console.error("Error fetching room:", error);
        setRoomData({
          name: "Room not found",
          description: "This room may have been deleted or doesn't exist.",
          createdBy: "Unknown",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-center">Loading room...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
              <span className="text-gray-900 font-medium">
                {roomData?.name}
              </span>
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
                {roomData?.name}
              </h1>
              <p className="text-gray-600 mb-4">{roomData?.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Created by {roomData?.createdBy}</span>
                <span>•</span>
                <span>Room ID: {roomId}</span>
              </div>
            </div>

            {/* Room Actions */}
            <div className="flex items-center space-x-3">
              <button className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                Share room
              </button>
              <button className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors border border-red-200">
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

          {/* Right Column: Real User Presence & Chat */}
          <div className="space-y-6">
            {/* Real Room Members Panel */}
            <RoomMembersPanel roomId={roomId || ""} />

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
