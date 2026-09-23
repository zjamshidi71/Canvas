import { Artwork } from "@/types";
import ArtworkCard from "./ArtworkCard";

interface ArtworkGridProps {
  artworks: Artwork[];
  columns?: 2 | 3 | 4;
}

export default function ArtworkGrid({ artworks, columns = 3 }: ArtworkGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  if (artworks.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-xl text-gallery-muted">
          No artworks found
        </p>
        <p className="text-sm text-gallery-muted mt-2">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6 lg:gap-8`}>
      {artworks.map((artwork, index) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
