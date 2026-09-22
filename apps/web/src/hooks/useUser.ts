import { createContext, useContext } from "react";

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export const UserContext = createContext<BackendUser | null>(null);

/** The caller's backend user record. Null only when signed out. */
export const useUser = () => useContext(UserContext);
