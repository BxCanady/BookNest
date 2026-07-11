"use client";

import { useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { NYT_OVERVIEW, IMPORT_OPEN_LIBRARY_BOOK } from "@/graphql/operations";
import BookCard from "./BookCard";

interface NytBook {
  primaryIsbn13?: string | null;
  title: string;
  author: string;
  bookImage?: string | null;
}

interface NytCategory {
  listName: string;
  listNameEncoded: string;
  books: NytBook[];
}

interface NytOverviewData {
  nytOverview?: NytCategory[];
}

interface BookGridProps {
  authMode: "guest" | "user" | null;
}

export default function BookGrid({ authMode }: BookGridProps) {
  const { data, loading, error } = useQuery<NytOverviewData>(NYT_OVERVIEW);
  const [save] = useMutation(IMPORT_OPEN_LIBRARY_BOOK);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollCategory = (categoryId: string, direction: "left" | "right") => {
    const row = rowRefs.current[categoryId];
    if (!row) {
      return;
    }

    const amount = Math.max(220, row.clientWidth * 0.75);
    row.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const handleSave = (book: NytBook) => {
    if (authMode !== "user") {
      alert("Login to save books");
      return;
    }

    save({
      variables: {
        title: book.title,
        author: book.author || "Unknown",
      },
    });
  };

  if (loading) {
    return (
      <div className="mt-8 text-sm text-gray-500">
        Loading discover books...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 text-sm text-red-600">
        Could not load discover books.
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10 overflow-x-auto">
      {data?.nytOverview?.map((category) => (
        <section key={category.listNameEncoded}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-600">
              {category.listName}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCategory(category.listNameEncoded, "left")}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                aria-label={`Scroll ${category.listName} left`}
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() =>
                  scrollCategory(category.listNameEncoded, "right")
                }
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                aria-label={`Scroll ${category.listName} right`}
              >
                &gt;
              </button>
            </div>
          </div>
          <div
            className="category-scroll flex gap-6 overflow-x-auto overflow-y-hidden pb-2 scroll-smooth"
            ref={(element) => {
              rowRefs.current[category.listNameEncoded] = element;
            }}
          >
            {category.books.map((book) => (
              <div
                key={`${category.listNameEncoded}-${book.primaryIsbn13 || book.title}`}
                className="w-36 sm:w-40 md:w-44 shrink-0"
              >
                <BookCard
                  book={{
                    id:
                      book.primaryIsbn13 ||
                      `${category.listNameEncoded}-${book.title}`,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.bookImage || undefined,
                    bookUrl: book.primaryIsbn13
                      ? `https://openlibrary.org/isbn/${book.primaryIsbn13}`
                      : undefined,
                  }}
                  onSave={() => handleSave(book)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
