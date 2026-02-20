"use client";

/**
 * Vertical list of category buttons. Active state highlight. Displays category with first letter capitalized.
 */

function capitalizeFirstLetter(s: string): string {
  if (!s.length) return s;
  const c = s[0];
  if (c >= "a" && c <= "z") return c.toUpperCase() + s.slice(1);
  return s;
}

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
          title={capitalizeFirstLetter(cat)}
          className={`w-full rounded px-1.5 py-1 text-center text-sm font-medium transition-colors truncate ${
            selected === cat
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-green-100 text-slate-700 hover:bg-green-200"
          }`}
        >
          {capitalizeFirstLetter(cat)}
        </button>
      ))}
    </div>
  );
}
