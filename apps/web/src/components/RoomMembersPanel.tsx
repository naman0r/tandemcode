import { useRoomSocket } from "../hooks/roomSocketContext";
import { useUser } from "../hooks/useUser";

const RoomMembersPanel = () => {
  const { members, connectionState } = useRoomSocket();
  const { clerkUser } = useUser();

  // Membership is presence: the server pushes the roster whenever anyone joins
  // or leaves, so everyone listed is connected right now.
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Room members ({members.length})
      </h3>

      {members.length === 0 ? (
        <div className="text-gray-500">
          {connectionState === "connected" ? "No members in this room" : "Connecting..."}
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.userId === clerkUser?.id;
            const profileImage = isCurrentUser ? clerkUser?.imageUrl : null;

            return (
              <div key={member.userId} className="flex items-center space-x-3">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {member.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {isCurrentUser
                      ? `${member.name} (You)`
                      : member.name || "Unknown user"}
                  </div>
                  <div
                    className={`text-xs capitalize ${
                      member.role === "owner"
                        ? "text-indigo-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {member.role}
                  </div>
                </div>

                <div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  title="Online"
                ></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomMembersPanel;
