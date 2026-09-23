import { Artwork } from "@/types";

export const artworks: Artwork[] = [
  {
    id: "art-1",
    slug: "dissolving-meridian",
    title: "Dissolving Meridian",
    artistId: "artist-1",
    medium: "painting",
    dimensions: '48 × 60 in (122 × 152 cm)',
    price: 8500,
    year: 2024,
    description:
      "A sweeping oil-on-canvas that captures the last moments of golden hour over a half-remembered cityscape. Vasquez layers translucent glazes over bold impasto strokes, creating depth that shifts as you move around the work. The painting sat unfinished in her studio for two years before she found the courage to complete it.",
    imageUrl: "https://picsum.photos/seed/dissolving-meridian/1200/1500",
    collections: ["new", "abstract"],
  },
  {
    id: "art-2",
    slug: "station-no-7",
    title: "Station No. 7",
    artistId: "artist-2",
    medium: "photography",
    dimensions: '24 × 36 in (61 × 91 cm)',
    price: 3200,
    year: 2024,
    description:
      "Part of Whitfield's acclaimed 'Commute' series, this medium-format photograph captures a lone figure on a rain-slicked platform at dusk. The tungsten light casts a warm amber glow that contrasts with the deep blue twilight beyond the station canopy. Printed on archival baryta paper in an edition of 15.",
    imageUrl: "https://picsum.photos/seed/station-no-7/1200/1500",
    collections: ["new", "photography"],
  },
  {
    id: "art-3",
    slug: "tessellation-iii",
    title: "Tessellation III",
    artistId: "artist-3",
    medium: "print",
    dimensions: '18 × 24 in (46 × 61 cm)',
    price: 1800,
    year: 2023,
    description:
      "A meticulous five-colour woodblock print that rewards close looking. Tanaka carved each block by hand over three months, layering geometric patterns inspired by traditional sashiko stitching. The subtle misregistrations between layers are intentional — a quiet reminder of the human hand behind the precision.",
    imageUrl: "https://picsum.photos/seed/tessellation-iii/1200/1500",
    collections: ["abstract"],
  },
  {
    id: "art-4",
    slug: "harbour-fragments",
    title: "Harbour Fragments",
    artistId: "artist-1",
    medium: "painting",
    dimensions: '36 × 48 in (91 × 122 cm)',
    price: 6200,
    year: 2023,
    description:
      "Vasquez's meditation on the port of Veracruz, where she spent childhood summers. Fractured planes of cerulean, ochre and rust overlap to suggest cargo cranes, water, and sky without ever resolving into a literal scene. The painting is both nostalgic and restless — a place remembered through sensation rather than detail.",
    imageUrl: "https://picsum.photos/seed/harbour-fragments/1200/1500",
    collections: ["abstract"],
  },
  {
    id: "art-5",
    slug: "quiet-hours",
    title: "Quiet Hours",
    artistId: "artist-2",
    medium: "photography",
    dimensions: '20 × 30 in (51 × 76 cm)',
    price: 2800,
    year: 2024,
    description:
      "An empty café interior photographed in the grey half-light before opening. Every surface — marble counter, bentwood chairs, fogged glass — is rendered with extraordinary clarity, yet the image feels dreamlike. Whitfield waited three mornings for exactly this quality of light. Edition of 10.",
    imageUrl: "https://picsum.photos/seed/quiet-hours/1200/1500",
    collections: ["new", "photography"],
  },
  {
    id: "art-6",
    slug: "monument-for-no-one",
    title: "Monument for No One",
    artistId: "artist-3",
    medium: "sculpture",
    dimensions: '14 × 8 × 8 in (36 × 20 × 20 cm)',
    price: 4500,
    year: 2023,
    description:
      "A stacked ceramic sculpture glazed in matte black and raw terracotta. Tanaka built and fired each element separately, then assembled them into a precarious tower that seems to defy gravity. The piece explores the Japanese concept of 'ma' — the beauty of negative space and the tension between presence and absence.",
    imageUrl: "https://picsum.photos/seed/monument-for-no-one/1200/1500",
    collections: ["new"],
  },
  {
    id: "art-7",
    slug: "blue-atlas",
    title: "Blue Atlas",
    artistId: "artist-4",
    medium: "painting",
    dimensions: '60 × 72 in (152 × 183 cm)',
    price: 12000,
    year: 2024,
    description:
      "Hassan's largest canvas to date is a map of everywhere and nowhere — deep indigo fields fractured by veins of gold leaf and raw canvas. Inspired by medieval Arabic cartography, the painting charts emotional rather than physical geography. It took six months of continuous work and is considered a pivotal piece in his practice.",
    imageUrl: "https://picsum.photos/seed/blue-atlas/1200/1500",
    collections: ["new", "abstract"],
  },
  {
    id: "art-8",
    slug: "parallel-45",
    title: "Parallel 45°",
    artistId: "artist-4",
    medium: "print",
    dimensions: '22 × 30 in (56 × 76 cm)',
    price: 950,
    year: 2023,
    description:
      "A bold two-colour screen print from Hassan's 'Latitude' series. Intersecting arcs in burnt orange and midnight blue create a moiré effect that vibrates on the wall. Signed and numbered, edition of 50. The affordability is deliberate — Hassan believes original art should be accessible.",
    imageUrl: "https://picsum.photos/seed/parallel-45/1200/1500",
    collections: ["abstract"],
  },
  {
    id: "art-9",
    slug: "the-clearing",
    title: "The Clearing",
    artistId: "artist-2",
    medium: "photography",
    dimensions: '30 × 40 in (76 × 102 cm)',
    price: 3800,
    year: 2022,
    description:
      "A forest interior shot on a misty morning in the Scottish Highlands. Shafts of pale light break through the canopy and illuminate a small clearing carpeted in moss. Whitfield describes this as the most patient photograph he has ever made — he returned to the same spot eleven times before conditions aligned. Edition of 8.",
    imageUrl: "https://picsum.photos/seed/the-clearing/1200/1500",
    collections: ["photography"],
  },
  {
    id: "art-10",
    slug: "erosion-study",
    title: "Erosion Study",
    artistId: "artist-3",
    medium: "sculpture",
    dimensions: '10 × 12 × 6 in (25 × 30 × 15 cm)',
    price: 3400,
    year: 2024,
    description:
      "A carved and polished stone form that sits in the palm of both hands. Tanaka sourced the basalt from a riverbed near her studio and spent weeks slowly grinding it into a shape that echoes water-worn rock — but perfected, idealized. The surface is impossibly smooth, inviting touch. Each piece in the series is unique.",
    imageUrl: "https://picsum.photos/seed/erosion-study/1200/1500",
    collections: ["new"],
  },
];

export function getArtworkBySlug(slug: string): Artwork | undefined {
  return artworks.find((a) => a.slug === slug);
}

export function getArtworksByArtist(artistId: string): Artwork[] {
  return artworks.filter((a) => a.artistId === artistId);
}

export function getArtworksByCollection(collection: string): Artwork[] {
  return artworks.filter((a) => a.collections.includes(collection));
}
