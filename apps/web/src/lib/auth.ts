import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

// Clerk only hands out session tokens through a React hook, but the axios
// instance in lib/api.ts is module scope and has no hooks available. The bridge
// below publishes the getter once so non-React callers can reach it.
let tokenGetter: (() => Promise<string | null>) | null = null;

export const getSessionToken = async (): Promise<string | null> =>
  tokenGetter ? tokenGetter() : null;

/** Renders nothing. Must be inside ClerkProvider. */
export const ClerkAuthBridge = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    tokenGetter = getToken;
    return () => {
      tokenGetter = null;
    };
  }, [getToken]);

  return null;
};
