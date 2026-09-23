import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import RequireSignIn from "../../components/RequireSignIn";
import { roomApi } from "../../lib/api";
import { timeAgo } from "../../lib/format";
import { button, card, muted } from "../../lib/ui";

type Room = {
  id: string;
  name: string;
  description: string | null;
  createdByName: string | null;
  createdAt: string;
  advertised: boolean;
  memberCount: number;
};

const LookingForPartner = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-zinc-950">
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
    </span>
    Looking for a partner
  </span>
);

const RoomList = () => {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    roomApi
      .getAllRooms()
      .then(setRooms)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-sm text-red-600">Could not load rooms.</p>;
  if (rooms === null) return <p className={`${muted} text-sm`}>Loading...</p>;
  if (rooms.length === 0) {
    return (
      <div className={`${card} p-8 text-center`}>
        <p className="font-medium">No open rooms</p>
        <p className={`${muted} mt-1 mb-4 text-sm`}>Start one and invite a partner.</p>
        <Link to="/rooms/create" className={button.primary}>
          Create a room
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <div
          key={room.id}
          className={`${card} flex flex-col p-5 ${
            room.advertised
              ? "border-orange-400 bg-orange-50 shadow-lg shadow-orange-500/20 ring-2 ring-orange-400 dark:border-orange-500 dark:bg-orange-950/40 dark:ring-orange-500"
              : ""
          }`}
        >
          {room.advertised && (
            <div className="mb-3">
              <LookingForPartner />
            </div>
          )}
          <h2 className="font-semibold">{room.name}</h2>
          <p className={`${muted} mt-1 flex-1 text-sm`}>
            {room.description || "No description"}
          </p>
          <p className={`${muted} mt-3 text-xs`}>
            {room.createdByName ?? "Someone"} · {room.memberCount} here · opened {timeAgo(room.createdAt)}
          </p>
          <Link
            to={`/rooms/${room.id}`}
            className={`${room.advertised ? button.primary : button.secondary} mt-4`}
          >
            Join
          </Link>
        </div>
      ))}
    </div>
  );
};

const Rooms = () => (
  <Layout>
    <RequireSignIn>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rooms</h1>
          <p className={`${muted} mt-1 text-sm`}>Open sessions you can join right now.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/rooms/join" className={button.secondary}>
            Have an invite link?
          </Link>
          <Link to="/rooms/create" className={button.primary}>
            Create a room
          </Link>
        </div>
      </div>
      <RoomList />
    </RequireSignIn>
  </Layout>
);

export default Rooms;
