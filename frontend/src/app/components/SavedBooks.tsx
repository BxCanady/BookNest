"use client";

import { useQuery } from "@apollo/client";
import { GET_BOOKS } from "@/graphql/operations";

interface SavedBooksProps {
  authMode: "guest" | "user" | null;
}

interface BookData {
  id: string;
  title: string;
  author: string;
  status: string;
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

      {data?.books?.map((b) => (
        <div key={b.id} className="bg-white p-3 rounded mb-2">
          {b.title} — {b.author}
        </div>
      ))}
    </div>
  );
}
