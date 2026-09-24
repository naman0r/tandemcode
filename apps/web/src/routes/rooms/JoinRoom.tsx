import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import RequireSignIn from "../../components/RequireSignIn";
import { button, card, input, muted, title } from "../../lib/ui";

// Accepts the invite link as copied from a room, or a bare id.
const roomIdFrom = (value: string): string => {
  const trimmed = value.trim();
  const match = trimmed.match(/\/rooms\/([^/?#]+)/);
  return match ? match[1] : trimmed;
};

const JoinRoom = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const id = roomIdFrom(value);
    if (id) navigate(`/rooms/${id}`);
  };

  return (
    <Layout>
      <RequireSignIn>
        <form onSubmit={submit} className={`${card} mx-auto max-w-md space-y-5 p-6`}>
          <div>
            <h1 className={`${title} text-4xl`}>Join a room</h1>
            <p className={`${muted} mt-2 text-sm`}>Paste the invite link your partner sent you.</p>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Invite link</span>
            <input
              className={input}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={`${window.location.origin}/rooms/...`}
              required
              autoFocus
            />
          </label>
          <div className="flex items-center justify-between">
            <Link to="/rooms" className={`${muted} text-sm hover:text-zinc-100`}>
              Browse open rooms
            </Link>
            <button type="submit" disabled={!value.trim()} className={button.primary}>
              Join
            </button>
          </div>
        </form>
      </RequireSignIn>
    </Layout>
  );
};

export default JoinRoom;
