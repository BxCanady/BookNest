"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  NYT_OVERVIEW,
  IMPORT_OPEN_LIBRARY_BOOK,
  GET_BOOKS,
} from "@/graphql/operations";
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

interface CategoryPagination {
  currentPage: number;
  totalPages: number;
}

export default function BookGrid({ authMode }: BookGridProps) {
  const { data, loading, error } = useQuery<NytOverviewData>(NYT_OVERVIEW);
  const [save] = useMutation(IMPORT_OPEN_LIBRARY_BOOK, {
    refetchQueries: [{ query: GET_BOOKS }],
  });
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pagination, setPagination] = useState<
    Record<string, CategoryPagination>
  >({});

  const updateCategoryPagination = (
    categoryId: string,
    row: HTMLDivElement,
  ) => {
    const totalPages = Math.max(
      1,
      Math.ceil(row.scrollWidth / row.clientWidth),
    );
    const currentPage = Math.min(
      totalPages - 1,
      Math.round(row.scrollLeft / row.clientWidth),
    );

    setPagination((prev) => {
      const current = prev[categoryId];
      if (
        current &&
        current.currentPage === currentPage &&
        current.totalPages === totalPages
      ) {
        return prev;
      }

      return {
        ...prev,
        [categoryId]: {
          currentPage,
          totalPages,
        },
      };
    });
  };

  useEffect(() => {
    const handleResize = () => {
      Object.entries(rowRefs.current).forEach(([categoryId, row]) => {
        if (row) {
          updateCategoryPagination(categoryId, row);
        }
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const scrollCategory = (categoryId: string, direction: "left" | "right") => {
    const row = rowRefs.current[categoryId];
    if (!row) {
      return;
    }

    const currentPage = Math.round(row.scrollLeft / row.clientWidth);
    const totalPages = Math.max(
      1,
      Math.ceil(row.scrollWidth / row.clientWidth),
    );
    const nextPage =
      direction === "left"
        ? Math.max(0, currentPage - 1)
        : Math.min(totalPages - 1, currentPage + 1);

    row.scrollTo({
      left: nextPage * row.clientWidth,
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
        coverUrl: book.bookImage || null,
        bookUrl: book.primaryIsbn13
          ? `https://openlibrary.org/isbn/${book.primaryIsbn13}`
          : null,
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
      {data?.nytOverview?.map((category) => {
        const categoryPagination = pagination[category.listNameEncoded] ?? {
          currentPage: 0,
          totalPages: 1,
        };

        return (
          <section key={category.listNameEncoded}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-600">
                  {category.listName}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Page {categoryPagination.currentPage + 1} of{" "}
                  {categoryPagination.totalPages}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    scrollCategory(category.listNameEncoded, "left")
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Scroll ${category.listName} left`}
                  disabled={categoryPagination.currentPage === 0}
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    scrollCategory(category.listNameEncoded, "right")
                  }
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Scroll ${category.listName} right`}
                  disabled={
                    categoryPagination.currentPage >=
                    categoryPagination.totalPages - 1
                  }
                >
                  &gt;
                </button>
              </div>
            </div>

            <div
              className="category-scroll flex gap-6 overflow-x-auto overflow-y-hidden pb-2 scroll-smooth snap-x snap-mandatory"
              ref={(element) => {
                rowRefs.current[category.listNameEncoded] = element;

                if (element) {
                  updateCategoryPagination(category.listNameEncoded, element);
                }
              }}
              onScroll={(event) =>
                updateCategoryPagination(
                  category.listNameEncoded,
                  event.currentTarget,
                )
              }
            >
              {category.books.map((book) => (
                <div
                  key={`${category.listNameEncoded}-${book.primaryIsbn13 || book.title}`}
                  className="w-36 shrink-0 snap-start sm:w-40 md:w-44"
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
        );
      })}
    </div>
  );
}
