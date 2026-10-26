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

// ---------------------------------------------------------------------------
// Order types — mirror the `orders` and `order_items` database tables
// ---------------------------------------------------------------------------

export interface OrderItem {
  id: string;
  orderId: string;
  artworkId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  subtotal: number;
  // status is a union type — TypeScript will error if an invalid value is used
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
  items?: OrderItem[];  // populated when fetching a single order with its line items
}
