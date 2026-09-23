import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Dashboard from "./routes/Dashboard.tsx";
import Rooms from "./routes/rooms/Rooms.tsx";
import JoinRoom from "./routes/rooms/JoinRoom.tsx";
import RoomView from "./routes/rooms/RoomView.tsx";
import CreateRoom from "./routes/rooms/CreateRoom.tsx";
import Problems from "./routes/Problems.tsx";
import { ClerkAuthBridge } from "./lib/auth.ts";
import { UserBootstrap } from "./lib/UserBootstrap.tsx";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/rooms", element: <Rooms /> },
  { path: "/rooms/create", element: <CreateRoom /> },
  { path: "/rooms/:roomId", element: <RoomView /> },
  { path: "/rooms/join", element: <JoinRoom /> },
  { path: "/problems", element: <Problems /> },

  //{ path: "/rooms/:roomId/join", element: <JoinRoom /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ClerkAuthBridge />
      <UserBootstrap>
        <RouterProvider router={router} />
      </UserBootstrap>
    </ClerkProvider>
  </StrictMode>
);
