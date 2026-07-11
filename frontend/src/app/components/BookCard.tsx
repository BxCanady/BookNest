interface DiscoverBook {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  bookUrl?: string;
}

import Image from "next/image";

interface BookCardProps {
  book: DiscoverBook;
  onSave?: () => void;
}

export default function BookCard({ book, onSave }: BookCardProps) {
  const cover = book.coverUrl || "/placeholder.png";

  return (
    <div>
      <div className="relative h-60 w-full overflow-hidden rounded">
        <Image
          src={cover}
          alt={`Cover of ${book.title}`}
          fill
          className="object-cover"
        />
      </div>
      <h4 className="mt-2 font-bold text-sm">{book.title}</h4>
      <p className="text-xs text-gray-500">{book.author || "Unknown"}</p>

      {book.bookUrl ? (
        <a
          href={book.bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block bg-black text-white px-3 py-1 rounded text-xs"
        >
          View Book
        </a>
      ) : onSave ? (
        <button
          onClick={onSave}
          className="mt-2 bg-black text-white px-3 py-1 rounded text-xs"
        >
          Save
        </button>
      ) : null}
    </div>
  );
}
