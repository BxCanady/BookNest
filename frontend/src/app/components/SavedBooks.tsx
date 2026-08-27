"use client";

import { useQuery } from "@apollo/client";
import { GET_BOOKS } from "@/graphql/operations";
import BookCard from "./BookCard";

interface SavedBooksProps {
  authMode: "guest" | "user" | null;
}

interface BookData {
  id: string;
  title: string;
  author: string;
  status: string;
  coverUrl?: string | null;
  bookUrl?: string | null;
}

interface GetBooksData {
  books?: BookData[];
}

export default function SavedBooks({ authMode }: SavedBooksProps) {
  const { data } = useQuery<GetBooksData>(GET_BOOKS);

  if (authMode !== "user") {
    return (
      <div className="mt-10 p-6 bg-white rounded shadow">
        Login to see saved books
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold mb-4">Saved Books</h3>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data?.books?.map((b) => (
          <BookCard
            key={b.id}
            book={{
              id: b.id,
              title: b.title,
              author: b.author,
              coverUrl: b.coverUrl || undefined,
              bookUrl: b.bookUrl || undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
