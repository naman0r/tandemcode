import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout";
import RequireSignIn from "../../components/RequireSignIn";
import { problemApi, roomApi } from "../../lib/api";
import { badge, button, card, difficulty, input, muted } from "../../lib/ui";

type Problem = { id: string; title: string; difficulty: string };

const CreateRoomForm = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const problemId = params.get("problem");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arriving from the problems page: the room opens with that problem set.
  useEffect(() => {
    if (!problemId) return;
    problemApi
      .getProblem(problemId)
      .then((loaded: Problem) => {
        setProblem(loaded);
        setName((current) => current || loaded.title);
      })
      .catch(() => setProblem(null));
  }, [problemId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const room = await roomApi.createRoom({ name: name.trim(), description: description.trim() });
      if (problem) await roomApi.setRoomProblem(room.id, problem.id);
      navigate(`/rooms/${room.id}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      setError("Could not create the room. Try again.");
      setCreating(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${card} mx-auto max-w-md space-y-5 p-6`}>
      <div>
        <h1 className="text-xl font-semibold">Create a room</h1>
        <p className={`${muted} mt-1 text-sm`}>You get an invite link once it is open.</p>
      </div>

      {problem && (
        <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm dark:border-orange-900 dark:bg-orange-950">
          <span>
            Problem: <span className="font-medium">{problem.title}</span>
          </span>
          <span className={badge(difficulty[problem.difficulty])}>{problem.difficulty}</span>
        </div>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Name</span>
        <input
          className={input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tuesday practice"
          required
          autoFocus
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">
          Description <span className={muted}>(optional)</span>
        </span>
        <textarea
          className={`${input} resize-none`}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What you want to work on"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <Link to="/rooms" className={`${muted} text-sm hover:underline`}>
          Back to rooms
        </Link>
        <button type="submit" disabled={creating || !name.trim()} className={button.primary}>
          {creating ? "Creating..." : "Create room"}
        </button>
      </div>
    </form>
  );
};

const CreateRoom = () => (
  <Layout>
    <RequireSignIn>
      <CreateRoomForm />
    </RequireSignIn>
  </Layout>
);

export default CreateRoom;
