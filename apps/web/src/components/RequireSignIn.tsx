import type { ReactNode } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { button, card, muted } from "../lib/ui";

// Pages that call the API cannot render signed out: every request needs a
// session token. A sign-in prompt beats a "failed to load" message.
const RequireSignIn = ({ children }: { children: ReactNode }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <div className={`${card} mx-auto mt-16 max-w-md p-8 text-center`}>
        <h1 className="text-lg font-semibold">Sign in to continue</h1>
        <p className={`${muted} mt-1 mb-6 text-sm`}>
          Rooms and problems are tied to your account.
        </p>
        <SignInButton mode="modal">
          <button type="button" className={button.primary}>
            Sign in
          </button>
        </SignInButton>
      </div>
    </SignedOut>
  </>
);

export default RequireSignIn;
