"use client";

import { useState } from "react";
import Image from "next/image";
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  SEARCH_OPEN_LIBRARY,
  IMPORT_OPEN_LIBRARY_BOOK,
  GET_BOOKS,
} from "@/graphql/operations";

type SearchResult = {
  key: string;
  title: string;
  authorName: string[];
  firstPublishYear?: number;
  coverId?: number;
};

type BookSearchProps = {
  canSave: boolean;
};

export default function BookSearch({ canSave }: BookSearchProps) {
  const [searchText, setSearchText] = useState("");

  const [runSearch, { data, loading, error }] =
    useLazyQuery(SEARCH_OPEN_LIBRARY);
  const [importBook, { loading: importing }] = useMutation(
    IMPORT_OPEN_LIBRARY_BOOK,
    {
      refetchQueries: [{ query: GET_BOOKS }],
    },
  );

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    await runSearch({
      variables: { query: searchText },
    });
  };

  const handleImport = async (book: SearchResult) => {
    if (!canSave) {
      alert("Log in to save books.");
      return;
    }

    const coverUrl = book.coverId
      ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
      : null;
    const bookUrl = book.key ? `https://openlibrary.org${book.key}` : null;

    await importBook({
      variables: {
        title: book.title,
        author: book.authorName?.[0] || "Unknown Author",
        coverUrl,
        bookUrl,
      },
    });
  };

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">
        Search For A Book
      </h2>

      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 p-3"
          placeholder="Search for books..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {!canSave && (
        <p className="mb-4 text-sm text-slate-500">
          Browse as guest. Log in to save books.
        </p>
      )}

      {loading && <p>Searching...</p>}
      {error && <p>Something went wrong while searching.</p>}

      <div className="space-y-4">
        {data?.searchOpenLibrary?.map((book: SearchResult) => {
          const coverUrl = book.coverId
            ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`
            : null;
          const bookUrl = book.key
            ? `https://openlibrary.org${book.key}`
            : null;

          return (
            <div
              key={book.key}
              className="flex gap-4 rounded-lg border border-slate-200 p-4"
            >
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={book.title}
                  width={64}
                  height={96}
                  className="rounded object-cover"
                />
              ) : (
                <div className="flex h-24 w-16 items-center justify-center rounded bg-slate-200 text-xs text-slate-500">
                  No Cover
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {book.title}
                </h3>
                <p className="text-slate-700">
                  {book.authorName?.join(", ") || "Unknown Author"}
                </p>
                <p className="text-sm text-slate-500">
                  {book.firstPublishYear || "Unknown year"}
                </p>
              </div>

              {bookUrl ? (
                <a
                  href={bookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  View Book
                </a>
              ) : (
                <button
                  onClick={() => handleImport(book)}
                  disabled={importing}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Save
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
