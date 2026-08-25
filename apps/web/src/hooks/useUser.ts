import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { userApi } from "../lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export function useUser() {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser();
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createOrFetchUser = async () => {
      if (!isLoaded || !isSignedIn || !clerkUser) {
        return;
      }

      console.log("🔍 Syncing user:", clerkUser.id);

      try {
        setIsCreating(true);
        setError(null);

        // Try to get existing user first
        try {
          const existingUser = await userApi.getUser(clerkUser.id);
          setBackendUser(existingUser);
          console.log("✅ Found existing user");
          return;
        } catch (err) {
          // User doesn't exist, create them
          console.log("⚡ Creating new user...");
        }

        // Create new user in backend
        const userData = {
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          name: clerkUser.fullName || clerkUser.firstName || "Unknown User",
        };

        const newUser = await userApi.createUser(userData);
        setBackendUser(newUser);
        console.log("✅ User created successfully");
      } catch (err) {
        console.error("Error with user creation/fetch:", err);
        setError("Failed to sync user data");
      } finally {
        setIsCreating(false);
      }
    };

    createOrFetchUser();
  }, [clerkUser, isLoaded, isSignedIn]);

  return {
    clerkUser,
    backendUser,
    isLoaded,
    isSignedIn,
    isCreating,
    error,
  };
}
