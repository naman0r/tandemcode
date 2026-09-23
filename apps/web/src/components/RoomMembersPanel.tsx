import { useUser as useClerkUser } from "@clerk/clerk-react";
import type { ConnectionState, RoomMember } from "../hooks/UseWebSocket";
import { card, muted } from "../lib/ui";

const RoomMembersPanel = ({
  members,
  connectionState,
}: {
  members: RoomMember[];
  connectionState: ConnectionState;
}) => {
  const { user: clerkUser } = useClerkUser();

  // Membership is presence: the server pushes the roster whenever anyone joins
  // or leaves, so everyone listed is connected right now.
  return (
    <section className={`${card} p-4`}>
      <h2 className="mb-3 font-semibold">In the room ({members.length})</h2>

      {members.length === 0 ? (
        <p className={`${muted} text-sm`}>
          {connectionState === "connected" ? "Nobody here yet." : "Connecting..."}
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => {
            const isCurrentUser = member.userId === clerkUser?.id;
            const image = isCurrentUser ? clerkUser?.imageUrl : null;
            const name = member.name || "Unknown user";
            return (
              <li key={member.userId} className="flex items-center gap-3 text-sm">
                {image ? (
                  <img src={image} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="flex-1">
                  {name}
                  {isCurrentUser && <span className={`${muted} ml-1`}>(you)</span>}
                </span>
                {member.role === "owner" && <span className={`${muted} text-xs`}>owner</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default RoomMembersPanel;
