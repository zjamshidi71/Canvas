export interface Artist {
  id: string;
  slug: string;
  name: string;
  bio: string;
  photoUrl: string;
  speciality: string;
}

export interface Artwork {
  id: string;
  slug: string;
  title: string;
  artistId: string;
  medium: "painting" | "photography" | "print" | "sculpture";
  dimensions: string;
  price: number;
  year: number;
  description: string;
  imageUrl: string;
  collections: string[];
}

export interface CartItem {
  artwork: Artwork;
  quantity: number;
}

export interface EditorialArticle {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  heroImageUrl: string;
  content: string[];
  pullQuote?: string;
  relatedArtistId: string;
}
