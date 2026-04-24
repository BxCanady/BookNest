"use client";

import { useLazyQuery, useMutation } from "@apollo/client";
import {
  SEARCH_OPEN_LIBRARY,
  IMPORT_OPEN_LIBRARY_BOOK,
} from "@/graphql/operations";
import BookCard from "./BookCard";

interface OpenLibraryBook {
  key: string;
  title: string;
  authorName?: string[];
  coverId?: number | null;
}

interface SearchOpenLibraryData {
  searchOpenLibrary?: OpenLibraryBook[];
}

interface BookGridProps {
  authMode: "guest" | "user" | null;
}

export default function BookGrid({ authMode }: BookGridProps) {
  const [, { data }] = useLazyQuery<SearchOpenLibraryData, { query: string }>(
    SEARCH_OPEN_LIBRARY,
  );
  const [save] = useMutation(IMPORT_OPEN_LIBRARY_BOOK);

  const handleSave = (book: OpenLibraryBook) => {
    if (authMode !== "user") {
      alert("Login to save books");
      return;
    }

    save({
      variables: {
        title: book.title,
        author: book.authorName?.[0] || "Unknown",
      },
    });
  };

  return (
    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
      {data?.searchOpenLibrary?.map((book) => (
        <BookCard key={book.key} book={book} onSave={handleSave} />
      ))}
    </div>
  );
}
