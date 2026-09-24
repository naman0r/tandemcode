import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import RequireSignIn from "../components/RequireSignIn";
import { useUser } from "../hooks/useUser";
import { roomApi } from "../lib/api";
import { timeAgo } from "../lib/format";
import { Sprite } from "../components/Pixel";
import { button, card, heading, muted, title } from "../lib/ui";

type Room = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

const RoomRows = ({ active, empty }: { active: boolean; empty: string }) => {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    roomApi
      .getMyRooms(active)
      .then(setRooms)
      .catch(() => setError(true));
  }, [active]);

  if (error) return <p className="text-sm text-red-400">Could not load rooms.</p>;
  if (rooms === null) return <p className={`${muted} text-sm`}>Loading...</p>;
  if (rooms.length === 0) return <p className={`${muted} text-sm`}>{empty}</p>;

  return (
    <ul className="divide-y-2 divide-zinc-800">
      {rooms.map((room) => {
        const href = active ? `/rooms/${room.id}` : `/rooms/${room.id}/replay`;
        return (
          <li key={room.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <Link to={href} className="font-medium hover:text-orange-400">
                {room.name}
              </Link>
              <p className={`${muted} text-xs`}>
                {room.description || "No description"} · {timeAgo(room.createdAt)}
              </p>
            </div>
            <Link to={href} className={button.secondary}>
              {active ? "Open" : "Replay"}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

const Dashboard = () => {
  const user = useUser();

  return (
    <Layout>
      <RequireSignIn>
        <h1 className={title}>
          {user?.name ? `Hi, ${user.name.split(" ")[0]}` : "Dashboard"}
        </h1>
        <p className={`${muted} mt-3 text-sm`}>Pick up a room or start a new one.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Link to="/rooms/create" className={`${card} flex items-center gap-4 p-5 hover:[--px:#f97316]`}>
            <Sprite name="door" size={36} />
            <div>
              <p className={heading}>Create a room</p>
              <p className={`${muted} text-sm`}>Then send your partner the invite link.</p>
            </div>
          </Link>
          <Link to="/rooms" className={`${card} flex items-center gap-4 p-5 hover:[--px:#f97316]`}>
            <Sprite name="link" size={36} />
            <div>
              <p className={heading}>Browse open rooms</p>
              <p className={`${muted} text-sm`}>Join a session that is already running.</p>
            </div>
          </Link>
        </div>

        <section className={`${card} mt-8 p-5`}>
          <h2 className={`${heading} mb-2`}>Open rooms</h2>
          <RoomRows active empty="You are not in any open room." />
        </section>

        <section className={`${card} mt-8 p-5`}>
          <h2 className={`${heading} mb-2`}>Past sessions</h2>
          <RoomRows active={false} empty="Closed rooms you were in show up here, with a replay." />
        </section>
      </RequireSignIn>
    </Layout>
  );
};

export default Dashboard;
