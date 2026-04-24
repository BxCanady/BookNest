interface OpenLibraryBook {
  key: string;
  title: string;
  authorName?: string[];
  coverId?: number | null;
}

import Image from "next/image";

interface BookCardProps {
  book: OpenLibraryBook;
  onSave: (book: OpenLibraryBook) => void;
}

export default function BookCard({ book, onSave }: BookCardProps) {
  const cover = book.coverId
    ? `https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`
    : "/placeholder.png";

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
      <p className="text-xs text-gray-500">{book.authorName?.[0]}</p>

      <button
        onClick={() => onSave(book)}
        className="mt-2 bg-black text-white px-3 py-1 rounded text-xs"
      >
        Save
      </button>
    </div>
  );
}
