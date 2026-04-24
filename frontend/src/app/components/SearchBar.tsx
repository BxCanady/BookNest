"use client";

import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { SEARCH_OPEN_LIBRARY } from "@/graphql/operations";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [runSearch] = useLazyQuery(SEARCH_OPEN_LIBRARY);

  return (
    <div className="mt-6 flex bg-white p-2 rounded shadow">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 p-2"
        placeholder="Search books..."
      />
      <button
        onClick={() => runSearch({ variables: { query } })}
        className="bg-black text-white px-4 rounded"
      >
        Search
      </button>
    </div>
  );
}
