"use client";

import { useState } from "react";
import LoginModal from "@/src/app/components/LoginModal";

type NavbarProps = {
  authMode: "guest" | "user" | null;
  onContinueAsGuest: () => void;
  onLoginSuccess: () => void;
  onLogout: () => void;
};

export default function Navbar({
  authMode,
  onContinueAsGuest,
  onLoginSuccess,
  onLogout,
}: NavbarProps) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">BookNest</h1>
          </div>

          <div className="flex items-center gap-3">
            {authMode === null && (
              <>
                <button
                  onClick={onContinueAsGuest}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Continue as Guest
                </button>

                <button
                  onClick={() => setShowLogin(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Log In
                </button>
              </>
            )}

            {authMode === "guest" && (
              <>
                <span className="text-sm text-slate-600">Guest Mode</span>
                <button
                  onClick={() => setShowLogin(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Log In
                </button>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Exit Guest
                </button>
              </>
            )}

            {authMode === "user" && (
              <>
                <span className="text-sm text-slate-600">Logged In</span>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoginSuccess={() => {
            onLoginSuccess();
            setShowLogin(false);
          }}
        />
      )}
    </>
  );
}
