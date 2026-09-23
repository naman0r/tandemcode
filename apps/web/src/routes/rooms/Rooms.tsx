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
};

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
        <div key={room.id} className={`${card} flex flex-col p-5`}>
          <h2 className="font-semibold">{room.name}</h2>
          <p className={`${muted} mt-1 flex-1 text-sm`}>
            {room.description || "No description"}
          </p>
          <p className={`${muted} mt-3 text-xs`}>
            {room.createdByName ?? "Someone"} · opened {timeAgo(room.createdAt)}
          </p>
          <Link to={`/rooms/${room.id}`} className={`${button.secondary} mt-4`}>
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
