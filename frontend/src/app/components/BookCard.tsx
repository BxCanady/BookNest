interface DiscoverBook {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  bookUrl?: string;
}

import Image from "next/image";
import { Heart } from "lucide-react";

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

      <div className="mt-2 flex items-center gap-2">
        {book.bookUrl && (
          <a
            href={book.bookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-black text-white px-3 py-1 rounded text-xs"
          >
            View Book
          </a>
        )}

        {onSave && (
          <button
            onClick={onSave}
            aria-label={`Add ${book.title} to favorites`}
            className={
              book.bookUrl
                ? "cursor-pointer rounded border border-gray-300 p-1 text-gray-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                : "cursor-pointer bg-black text-white px-3 py-1 rounded text-xs transition-colors hover:bg-gray-800"
            }
          >
            {book.bookUrl ? <Heart size={16} /> : "Save"}
          </button>
        )}
      </div>
    </div>
  );
}
