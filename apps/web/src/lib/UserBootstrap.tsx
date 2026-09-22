import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { UserContext } from "../hooks/useUser";
import type { BackendUser } from "../hooks/useUser";
import { userApi } from "./api";

type State =
  | { status: "pending" }
  | { status: "ready"; user: BackendUser | null }
  | { status: "failed"; message: string };

const Notice = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-600">
    {children}
  </div>
);

/**
 * Syncs the signed-in user into the backend exactly once, before anything that
 * depends on that row renders.
 *
 * Rooms, presence and submissions all carry a foreign key to `users`. When this
 * ran as a hook side effect it fired from several components at once and raced
 * navigation, so a room could be created, or a socket opened, against a user
 * row that did not exist yet.
 */
export const UserBootstrap = ({ children }: { children: ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [state, setState] = useState<State>({ status: "pending" });

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setState({ status: "ready", user: null });
      return;
    }

    let cancelled = false;
    setState({ status: "pending" });

    userApi
      .syncUser()
      .then((user) => {
        if (!cancelled) setState({ status: "ready", user });
      })
      .catch((error) => {
        console.error("Failed to sync user:", error);
        if (!cancelled) {
          setState({ status: "failed", message: "Could not load your account." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || state.status === "pending") {
    return <Notice>Loading...</Notice>;
  }

  if (state.status === "failed") {
    return <Notice>{state.message} Try reloading the page.</Notice>;
  }

  return <UserContext.Provider value={state.user}>{children}</UserContext.Provider>;
};
