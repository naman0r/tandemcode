import { useState, useEffect } from "react";
import { roomApi } from "../lib/api";
import { useUser } from "../hooks/useUser";
import useWebSocket from "../hooks/UseWebSocket";

interface RoomMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

const RoomMembersPanel = ({ roomId }: { roomId: string }) => {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { clerkUser, isSignedIn } = useUser();
  const { connectionState } = useWebSocket(roomId); // Listen to WebSocket state changes

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const apiMembers = await roomApi.getMembersInRoom(roomId);

      // Check if current user is in the list, if not add them
      const currentUserId = clerkUser?.id;
      const hasCurrentUser = apiMembers.some(
        (member: RoomMember) => member.userId === currentUserId
      );

      if (currentUserId && isSignedIn && !hasCurrentUser) {
        // Add current user to the list if they're not there yet
        const currentUserMember: RoomMember = {
          userId: currentUserId,
          name: clerkUser.fullName || clerkUser.firstName || "You",
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          role: "participant",
          joinedAt: new Date().toISOString(),
        };
        setMembers([currentUserMember, ...apiMembers]);
      } else {
        setMembers(apiMembers);
      }
    } catch (error) {
      console.error("Error fetching room members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch members when component mounts or when WebSocket connection changes
  useEffect(() => {
    if (roomId && isSignedIn) {
      fetchMembers();
    }
  }, [roomId, isSignedIn]);

  // Refresh members when WebSocket connection state changes (someone joins/leaves)
  useEffect(() => {
    if (connectionState === "connected" && roomId && isSignedIn) {
      // Small delay to ensure backend has processed the connection
      const timer = setTimeout(fetchMembers, 1000);
      return () => clearTimeout(timer);
    }
  }, [connectionState]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Room members
        </h3>
        <div className="text-gray-500">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Room members ({members.length})
      </h3>

      {members.length === 0 ? (
        <div className="text-gray-500">No members in this room</div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.userId === clerkUser?.id;
            const profileImage = isCurrentUser ? clerkUser?.imageUrl : null;

            return (
              <div key={member.userId} className="flex items-center space-x-3">
                {/* Profile picture with Clerk image or initials */}
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

                {/* User info */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {isCurrentUser
                      ? `${member.name} (You)`
                      : member.name || "Unknown user"}
                  </div>
                  <div className="text-xs text-gray-500">{member.role}</div>
                </div>

                {/* Online indicator */}
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
