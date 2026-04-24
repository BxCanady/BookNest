"use client";

import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { Home, Grid2X2, Library, Download, Heart, LogOut } from "lucide-react";
import LoginModal from "./LoginModal";

interface SidebarProps {
  authMode: "guest" | "user" | null;
  setAuthMode: Dispatch<SetStateAction<"guest" | "user" | null>>;
}

interface ItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
}

export default function Sidebar({ authMode, setAuthMode }: SidebarProps) {
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = () => {
    document.cookie = "authMode=user; path=/";
    setAuthMode("user");
    setShowLogin(false);
  };

  const handleGuest = () => {
    document.cookie = "authMode=guest; path=/";
    setAuthMode("guest");
  };

  const handleLogout = () => {
    document.cookie =
      "authMode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setAuthMode(null);
  };

  return (
    <>
      <aside className="hidden w-56 px-6 py-6 md:flex md:flex-col justify-between">
        {/* Top Section */}
        <div>
          <h1 className="text-sm font-black tracking-widest">BOOKNEST</h1>

          <div className="mt-8 space-y-4 text-sm">
            <Item icon={<Home size={16} />} label="Discover" active />
            <Item icon={<Grid2X2 size={16} />} label="Category" />
            <Item icon={<Library size={16} />} label="Library" />
            <Item icon={<Download size={16} />} label="Download" />
            <Item icon={<Heart size={16} />} label="Favorite" />
          </div>
        </div>

        {/* Bottom Section (AUTH) */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {authMode === "user"
              ? "Logged In"
              : authMode === "guest"
                ? "Guest Mode"
                : "Not Logged In"}
          </p>

          {/* Not logged in */}
          {authMode === null && (
            <>
              <button
                onClick={handleGuest}
                className="w-full rounded-lg border py-2 text-sm"
              >
                Continue as Guest
              </button>

              <button
                onClick={() => setShowLogin(true)}
                className="w-full rounded-lg bg-black py-2 text-sm text-white"
              >
                Login
              </button>
            </>
          )}

          {/* Guest */}
          {authMode === "guest" && (
            <>
              <button
                onClick={() => setShowLogin(true)}
                className="w-full rounded-lg bg-black py-2 text-sm text-white"
              >
                Login
              </button>

              <button
                onClick={handleLogout}
                className="w-full rounded-lg border py-2 text-sm"
              >
                Exit Guest
              </button>
            </>
          )}

          {/* User */}
          {authMode === "user" && (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </aside>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      )}
    </>
  );
}

function Item({ icon, label, active = false }: ItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
        active ? "bg-orange-100 text-orange-600" : "text-gray-500"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
