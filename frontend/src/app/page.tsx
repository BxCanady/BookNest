"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import BookSearch from "./components/BookSearch";
import SavedBooks from "./components/SavedBooks";
import BookGrid from "./components/BookGrid";

type NavItem = "discover" | "category" | "download" | "favorite";

export default function HomePage() {
  const [authMode, setAuthMode] = useState<"guest" | "user" | null>(null);
  const [activeItem, setActiveItem] = useState<NavItem>("discover");

  useEffect(() => {
    const mode = document.cookie.includes("authMode=user")
      ? "user"
      : document.cookie.includes("authMode=guest")
        ? "guest"
        : null;

    const frame = window.requestAnimationFrame(() => setAuthMode(mode));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="min-h-screen bg-[#ebe8dc] p-6">
      <div className="mx-auto flex max-w-7xl overflow-visible rounded-3xl bg-white shadow-2xl">
        <Sidebar
          authMode={authMode}
          setAuthMode={setAuthMode}
          onSelectItem={setActiveItem}
        />

        <div className="min-w-0 flex-1 overflow-x-auto bg-[#f7f5ed] p-8">
          <h2 className="text-3xl font-bold capitalize">{activeItem}</h2>

          {activeItem === "discover" && <BookGrid authMode={authMode} />}

          <BookSearch canSave={authMode === "user"} />
          <SavedBooks authMode={authMode} />
        </div>
      </div>
    </main>
  );
}
