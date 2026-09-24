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
import Replay from "./routes/rooms/Replay.tsx";
import Problems from "./routes/Problems.tsx";
import About from "./routes/About.tsx";
import { ClerkAuthBridge } from "./lib/auth.ts";
import { UserBootstrap } from "./lib/UserBootstrap.tsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

// Clerk's sign-in and account dialogs, in the site's colours.
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "#f97316",
    colorTextOnPrimaryBackground: "#0a0a0b",
    colorBackground: "#18181b",
    colorText: "#f4f4f5",
    colorTextSecondary: "#a1a1aa",
    colorNeutral: "#f4f4f5",
    colorInputBackground: "#09090b",
    colorInputText: "#f4f4f5",
    borderRadius: "0",
  },
};

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/rooms", element: <Rooms /> },
  { path: "/rooms/create", element: <CreateRoom /> },
  { path: "/rooms/:roomId", element: <RoomView /> },
  { path: "/rooms/:roomId/replay", element: <Replay /> },
  { path: "/rooms/join", element: <JoinRoom /> },
  { path: "/problems", element: <Problems /> },
  { path: "/about", element: <About /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={CLERK_APPEARANCE}>
      <ClerkAuthBridge />
      <UserBootstrap>
        <RouterProvider router={router} />
      </UserBootstrap>
    </ClerkProvider>
  </StrictMode>
);
