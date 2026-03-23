import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { problemApi } from "../lib/api";

type Problem = {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  timeLimitMs: number;
  memLimitMb: number;
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-600 bg-green-50 border-green-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  hard: "text-red-600 bg-red-50 border-red-200",
};

const Problems = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const data = await problemApi.getAllProblems(
          difficultyFilter !== "all" ? difficultyFilter : undefined
        );
        setProblems(data);
      } catch (err) {
        setError("Failed to load problems.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [difficultyFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Problems</h1>
            <p className="text-gray-500 mt-1">
              Pick a problem and solve it in a room with a partner.
            </p>
          </div>
          <button
            onClick={() => navigate("/rooms/create")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Create Room
          </button>
        </div>

        {/* Difficulty filter tabs */}
        <div className="flex space-x-2 mb-6">
          {["all", "easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                difficultyFilter === d
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-500">
            Loading problems...
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-red-500">{error}</div>
        )}

        {!loading && !error && problems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 mb-2">No problems found.</p>
            <p className="text-sm text-gray-400">
              Problems can be added via the API.
            </p>
          </div>
        )}

        {!loading && !error && problems.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Title
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Difficulty
                  </th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">
                    Time Limit
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {problems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {problem.title}
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        {problem.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          DIFFICULTY_COLORS[problem.difficulty] ??
                          "text-gray-600 bg-gray-50 border-gray-200"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {problem.timeLimitMs}ms
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate("/rooms/create")}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                      >
                        Solve in room →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Problems;
