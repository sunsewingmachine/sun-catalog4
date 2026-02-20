"use client";

/**
 * Vertical list of category buttons. Active state highlight.
 */

interface CategoryListProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string) => void;
}

export default function CategoryList({
  categories,
  selected,
  onSelect,
}: CategoryListProps) {
  return (
    <div id="divCategoryList" className="flex flex-col gap-1">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={`rounded px-3 py-2 text-left text-sm font-medium transition-colors ${
            selected === cat
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
