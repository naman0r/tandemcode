import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import RoomChatComponent from "../../components/RoomChatComponent";
import RoomMembersPanel from "../../components/RoomMembersPanel";
import CollaborativeEditor from "../../components/CollaborativeEditor";
import { roomApi, problemApi, submissionApi } from "../../lib/api";
import { RoomSocketProvider } from "../../hooks/RoomSocketProvider";
import { useRoomSocket } from "../../hooks/roomSocketContext";

type Problem = {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  timeLimitMs: number;
  memLimitMb: number;
};

type Submission = {
  id: string;
  status: string;
  language: string;
  createdAt: string;
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-600 bg-green-50 border-green-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  hard: "text-red-600 bg-red-50 border-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50",
  running: "text-blue-600 bg-blue-50",
  accepted: "text-green-600 bg-green-50",
  wrong_answer: "text-red-600 bg-red-50",
  error: "text-red-600 bg-red-50",
};

const ConnectionStatus = () => {
  const { isConnected } = useRoomSocket();
  return (
    <div className="flex items-center space-x-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-gray-600">
        {isConnected ? "Connected" : "Connecting..."}
      </span>
    </div>
  );
};

const LeaveRoomButton = ({ roomId }: { roomId: string }) => {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await roomApi.leaveRoom(roomId);
    } catch (err) {
      console.error("Failed to leave room:", err);
    } finally {
      // Navigating unmounts the provider, which closes the socket and lets the
      // server tell everyone still here that we have gone.
      navigate("/rooms");
    }
  };

  return (
    <button
      onClick={handleLeave}
      disabled={leaving}
      className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors border border-red-200 text-sm disabled:opacity-50"
    >
      {leaving ? "Leaving..." : "Leave room"}
    </button>
  );
};

const RoomViewContent = () => {
  const { roomId } = useParams();
  const { user } = useUser();

  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("# Write your solution here\n");
  const [language, setLanguage] = useState("python");
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProblemPicker, setShowProblemPicker] = useState(false);
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(false);

  const isRoomCreator = roomData?.createdBy === user?.id;

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      try {
        setLoading(true);
        const room = await roomApi.getRoom(roomId);
        setRoomData(room);
      } catch (err) {
        console.error("Error fetching room:", err);
        setRoomData({
          name: "Room not found",
          description: "This room may have been deleted.",
          createdBy: "",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  // Fetch problem when room has one assigned
  useEffect(() => {
    if (!roomData?.currentProblemId) {
      setCurrentProblem(null);
      return;
    }
    problemApi
      .getProblem(roomData.currentProblemId)
      .then(setCurrentProblem)
      .catch(() => setCurrentProblem(null));
  }, [roomData?.currentProblemId]);

  const openProblemPicker = async () => {
    setShowProblemPicker(true);
    if (availableProblems.length > 0) return;
    try {
      setLoadingProblems(true);
      const data = await problemApi.getAllProblems();
      setAvailableProblems(data);
    } catch (err) {
      console.error("Failed to load problems:", err);
    } finally {
      setLoadingProblems(false);
    }
  };

  const assignProblem = async (problem: Problem) => {
    if (!roomId) return;
    try {
      const updated = await roomApi.setRoomProblem(roomId, problem.id);
      setRoomData(updated);
      setShowProblemPicker(false);
    } catch (err) {
      console.error("Failed to assign problem:", err);
    }
  };

  const runCode = async () => {
    if (!roomId || !user || !currentProblem) return;
    try {
      setIsSubmitting(true);
      const submission = await submissionApi.submit({
        roomId,
        problemId: currentProblem.id,
        language,
        code,
      });
      setLastSubmission(submission);
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
            Loading room...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      {/* Status Bar */}
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
              <span className="text-gray-900 font-medium">{roomData?.name}</span>
            </nav>
            <ConnectionStatus />
          </div>
        </div>
      </div>

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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigator.clipboard.writeText(roomId || "")}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 text-sm"
              >
                Copy room ID
              </button>
              <LeaveRoomButton roomId={roomId || ""} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Code Editor */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Code editor
                </h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-3 py-1"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                  </select>
                  <button
                    onClick={runCode}
                    disabled={isSubmitting || !currentProblem || !user}
                    title={
                      !currentProblem
                        ? "Assign a problem first"
                        : !user
                        ? "Sign in to submit"
                        : ""
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Run code"}
                  </button>
                </div>
              </div>

              <CollaborativeEditor
                roomId={roomId || ""}
                language={language}
                onCodeChange={setCode}
              />

              {/* Submission status */}
              {lastSubmission && (
                <div className="mt-3 flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">Last submission:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium capitalize ${
                      STATUS_COLORS[lastSubmission.status] ??
                      "text-gray-600 bg-gray-50"
                    }`}
                  >
                    {lastSubmission.status.replace("_", " ")}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {new Date(lastSubmission.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Problem Statement */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentProblem ? (
                    <span className="flex items-center gap-2">
                      Problem: {currentProblem.title}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          DIFFICULTY_COLORS[currentProblem.difficulty] ??
                          "text-gray-600 bg-gray-50 border-gray-200"
                        }`}
                      >
                        {currentProblem.difficulty}
                      </span>
                    </span>
                  ) : (
                    "No problem assigned"
                  )}
                </h2>
                {isRoomCreator && (
                  <button
                    onClick={openProblemPicker}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    {currentProblem ? "Change problem" : "Assign problem"}
                  </button>
                )}
              </div>

              {currentProblem ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600 text-sm">
                    Time limit: {currentProblem.timeLimitMs}ms · Memory:{" "}
                    {currentProblem.memLimitMb}MB
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  {isRoomCreator
                    ? "Assign a problem to get started."
                    : "Waiting for the room creator to assign a problem."}
                </p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <RoomMembersPanel />
            <div className="h-96">
              <RoomChatComponent roomId={roomId} />
            </div>
          </div>
        </div>
      </div>

      {/* Problem Picker Modal */}
      {showProblemPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign a problem
              </h3>
              <button
                onClick={() => setShowProblemPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingProblems && (
                <div className="p-6 text-center text-gray-500">
                  Loading problems...
                </div>
              )}
              {!loadingProblems && availableProblems.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No problems available. Add some via the API.
                </div>
              )}
              {availableProblems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => assignProblem(problem)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 flex items-center justify-between transition-colors"
                >
                  <span className="font-medium text-gray-900">
                    {problem.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                      DIFFICULTY_COLORS[problem.difficulty] ??
                      "text-gray-600 bg-gray-50 border-gray-200"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const RoomView = () => {
  const { roomId } = useParams();

  return (
    <RoomSocketProvider roomId={roomId || ""}>
      <RoomViewContent />
    </RoomSocketProvider>
  );
};

export default RoomView;
