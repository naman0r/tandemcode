import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import RequireSignIn from "../components/RequireSignIn";
import { problemApi } from "../lib/api";
import { badge, button, card, difficulty, muted, title } from "../lib/ui";

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
      <div className="mb-6 flex flex-wrap gap-3">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`${filter === value ? button.primary : button.secondary} capitalize`}
          >
            {value}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">Could not load problems.</p>}
      {!error && problems === null && <p className={`${muted} text-sm`}>Loading...</p>}
      {problems && problems.length === 0 && (
        <p className={`${muted} text-sm`}>No problems match this filter.</p>
      )}

      {problems && problems.length > 0 && (
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead className={`${muted} border-b-2 border-zinc-800 bg-zinc-950/40 text-left font-pixel text-lg`}>
              <tr>
                <th className="px-4 py-2 font-normal">Problem</th>
                <th className="px-4 py-2 font-normal">Difficulty</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-800">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-zinc-800/40">
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
                      className="font-pixel text-xl text-orange-400 hover:text-orange-300"
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={title}>Problems</h1>
          <p className={`${muted} mt-3 text-sm`}>
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
