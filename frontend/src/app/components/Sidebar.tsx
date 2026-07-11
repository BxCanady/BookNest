"use client";

import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { Home, Grid2X2, Library, Download, Heart, LogOut } from "lucide-react";
import LoginModal from "./LoginModal";

interface SidebarProps {
  authMode: "guest" | "user" | null;
  setAuthMode: Dispatch<SetStateAction<"guest" | "user" | null>>;
  onSelectItem?: (item: NavItem) => void;
}

type NavItem = "discover" | "category" | "library" | "download" | "favorite";

interface ItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function Sidebar({
  authMode,
  setAuthMode,
  onSelectItem,
}: SidebarProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [activeItem, setActiveItem] = useState<NavItem>("discover");

  const handleNavClick = (item: NavItem) => {
    setActiveItem(item);
    onSelectItem?.(item);
  };

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
            <Item
              icon={<Home size={16} />}
              label="Discover"
              active={activeItem === "discover"}
              onClick={() => handleNavClick("discover")}
            />
            <Item
              icon={<Grid2X2 size={16} />}
              label="Search"
              active={activeItem === "category"}
              onClick={() => handleNavClick("category")}
            />
            <Item
              icon={<Library size={16} />}
              label="Library"
              active={activeItem === "library"}
              onClick={() => handleNavClick("library")}
            />
            <Item
              icon={<Download size={16} />}
              label="Download"
              active={activeItem === "download"}
              onClick={() => handleNavClick("download")}
            />
            <Item
              icon={<Heart size={16} />}
              label="Favorite"
              active={activeItem === "favorite"}
              onClick={() => handleNavClick("favorite")}
            />
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
                type="button"
                onClick={handleGuest}
                className="w-full rounded-lg border py-2 text-sm"
              >
                Continue as Guest
              </button>

              <button
                type="button"
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
                type="button"
                onClick={() => setShowLogin(true)}
                className="w-full rounded-lg bg-black py-2 text-sm text-white"
              >
                Login
              </button>

              <button
                type="button"
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
              type="button"
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

function Item({ icon, label, active = false, onClick }: ItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-150 ${
        active
          ? "bg-orange-100 text-orange-600"
          : "text-gray-500 hover:bg-slate-100"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
