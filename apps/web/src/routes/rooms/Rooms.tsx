import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import RequireSignIn from "../../components/RequireSignIn";
import { roomApi } from "../../lib/api";
import { timeAgo } from "../../lib/format";
import { button, card, heading, muted, title } from "../../lib/ui";

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
  <span className="inline-flex items-center gap-2 bg-orange-500 px-2 pt-0.5 font-pixel text-lg leading-tight text-zinc-950">
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping bg-white opacity-75" />
      <span className="relative inline-flex h-2 w-2 bg-white" />
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

  if (error) return <p className="text-sm text-red-400">Could not load rooms.</p>;
  if (rooms === null) return <p className={`${muted} text-sm`}>Loading...</p>;
  if (rooms.length === 0) {
    return (
      <div className={`${card} p-8 text-center`}>
        <p className={heading}>No open rooms</p>
        <p className={`${muted} mt-2 mb-5 text-sm`}>Start one and invite a partner.</p>
        <Link to="/rooms/create" className={button.primary}>
          Create a room
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <div
          key={room.id}
          className={`${room.advertised ? "px-box bg-orange-950/60 [--px:#f97316]" : card} flex flex-col p-5`}
        >
          {room.advertised && (
            <div className="mb-3">
              <LookingForPartner />
            </div>
          )}
          <h2 className={heading}>{room.name}</h2>
          <p className={`${muted} mt-2 flex-1 text-sm`}>
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={title}>Rooms</h1>
          <p className={`${muted} mt-3 text-sm`}>Open sessions you can join right now.</p>
        </div>
        <div className="flex gap-3">
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
