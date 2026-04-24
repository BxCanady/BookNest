"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import BookGrid from "./components/BookGrid";
import SavedBooks from "./components/SavedBooks";

export default function HomePage() {
  const [authMode, setAuthMode] = useState<"guest" | "user" | null>(null);

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
      <div className="mx-auto flex max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <Sidebar authMode={authMode} setAuthMode={setAuthMode} />

        <div className="flex-1 bg-[#f7f5ed] p-8">
          <h2 className="text-3xl font-bold">Discover</h2>

          <SearchBar />
          <BookGrid authMode={authMode} />
          <SavedBooks authMode={authMode} />
        </div>
      </div>
    </main>
  );
}
