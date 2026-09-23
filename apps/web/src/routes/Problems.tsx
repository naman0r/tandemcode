import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import RequireSignIn from "../components/RequireSignIn";
import { problemApi } from "../lib/api";
import { badge, button, card, difficulty, muted } from "../lib/ui";

type Problem = {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  timeLimitMs: number;
  statement: string | null;
};

const FILTERS = ["all", "easy", "medium", "hard"];

const ProblemTable = () => {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setProblems(null);
    problemApi
      .getAllProblems(filter === "all" ? undefined : filter)
      .then(setProblems)
      .catch(() => setError(true));
  }, [filter]);

  return (
    <>
      <div className="mb-4 flex gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`${filter === value ? button.primary : button.secondary} px-3 py-1 capitalize`}
          >
            {value}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">Could not load problems.</p>}
      {!error && problems === null && <p className={`${muted} text-sm`}>Loading...</p>}
      {problems && problems.length === 0 && (
        <p className={`${muted} text-sm`}>No problems match this filter.</p>
      )}

      {problems && problems.length > 0 && (
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead className={`${muted} border-b border-zinc-200 bg-zinc-50 text-left text-xs dark:border-zinc-800 dark:bg-zinc-900`}>
              <tr>
                <th className="px-4 py-2 font-medium">Problem</th>
                <th className="px-4 py-2 font-medium">Difficulty</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {problems.map((problem) => (
                <tr key={problem.id}>
                  <td className="px-4 py-3 font-medium">
                    {problem.title}
                    {!problem.statement && (
                      <span className={`${muted} ml-2 text-xs font-normal`}>no tests yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={badge(difficulty[problem.difficulty])}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/rooms/create?problem=${problem.id}`}
                      className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Solve in a room
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

const Problems = () => (
  <Layout>
    <RequireSignIn>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Problems</h1>
          <p className={`${muted} mt-1 text-sm`}>
            Pick one and solve it with a partner. Programs read stdin and print the answer.
          </p>
        </div>
        <Link to="/rooms/create" className={button.primary}>
          Create a room
        </Link>
      </div>
      <ProblemTable />
    </RequireSignIn>
  </Layout>
);

export default Problems;
