"use client";

interface FilterBarProps {
  selectedMediums: string[];
  onMediumChange: (mediums: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

const MEDIUMS = [
  { value: "painting", label: "Painting" },
  { value: "photography", label: "Photography" },
  { value: "print", label: "Print" },
  { value: "sculpture", label: "Sculpture" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
];

export default function FilterBar({
  selectedMediums,
  onMediumChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
}: FilterBarProps) {
  const toggleMedium = (medium: string) => {
    if (selectedMediums.includes(medium)) {
      onMediumChange(selectedMediums.filter((m) => m !== medium));
    } else {
      onMediumChange([...selectedMediums, medium]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Medium Filter */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-3">
          Medium
        </h3>
        <div className="flex flex-wrap gap-2">
          {MEDIUMS.map((medium) => (
            <button
              key={medium.value}
              onClick={() => toggleMedium(medium.value)}
              className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                selectedMediums.includes(medium.value)
                  ? "bg-gallery-text text-white border-gallery-text"
                  : "bg-transparent text-gallery-muted border-gallery-border hover:border-gallery-text hover:text-gallery-text"
              }`}
            >
              {medium.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-3">
          Price Range
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gallery-muted">$</span>
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) =>
                onPriceRangeChange([Number(e.target.value), priceRange[1]])
              }
              placeholder="Min"
              className="w-28 pl-7 pr-3 py-2 text-sm border border-gallery-border rounded-sm bg-transparent text-gallery-text focus:outline-none focus:border-gallery-text"
            />
          </div>
          <span className="text-gallery-muted text-sm">—</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gallery-muted">$</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) =>
                onPriceRangeChange([priceRange[0], Number(e.target.value)])
              }
              placeholder="Max"
              className="w-28 pl-7 pr-3 py-2 text-sm border border-gallery-border rounded-sm bg-transparent text-gallery-text focus:outline-none focus:border-gallery-text"
            />
          </div>
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-gallery-muted mb-3">
          Sort By
        </h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-sm border border-gallery-border rounded-sm bg-transparent text-gallery-text focus:outline-none focus:border-gallery-text appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%236B6B6B' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
