/**
 * scripts/seed.ts
 *
 * Generates a seed SQL file with realistic demo data for the Canvas app.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * This outputs a file at scripts/seed.sql that you can paste directly
 * into the Supabase SQL Editor (Dashboard → SQL Editor → New Query → paste → Run).
 *
 * The SQL Editor runs as the database owner, so it bypasses Row Level Security.
 * This is the simplest and safest way to seed data — no service role key needed.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// 1. Seed Data
// ---------------------------------------------------------------------------

const artists = [
  {
    id: "artist-1",
    slug: "elena-vasquez",
    name: "Elena Vasquez",
    bio: "Elena Vasquez is a contemporary painter known for her bold use of colour and sweeping abstract landscapes. Born in Buenos Aires, she moved to Montreal to study fine arts and never left. Her work explores the tension between memory and place.",
    photo_url: "https://picsum.photos/seed/artist-elena/400/400",
    speciality: "Abstract Painting",
  },
  {
    id: "artist-2",
    slug: "james-okafor",
    name: "James Okafor",
    bio: "James Okafor is a Nigerian-Canadian photographer whose documentary-style portraits capture everyday resilience in urban communities. His work has been featured in galleries across Toronto and Lagos.",
    photo_url: "https://picsum.photos/seed/artist-james/400/400",
    speciality: "Documentary Photography",
  },
  {
    id: "artist-3",
    slug: "mei-lin-chen",
    name: "Mei-Lin Chen",
    bio: "Mei-Lin Chen creates intricate woodblock prints that blend traditional East Asian techniques with modern surrealist imagery. Based in Vancouver, her limited-edition prints sell out within hours of release.",
    photo_url: "https://picsum.photos/seed/artist-mei/400/400",
    speciality: "Printmaking",
  },
  {
    id: "artist-4",
    slug: "david-thornton",
    name: "David Thornton",
    bio: "David Thornton is a sculptor working in reclaimed metal and found objects. His large-scale installations comment on consumer culture and environmental decay. He maintains a studio in Calgary's Inglewood district.",
    photo_url: "https://picsum.photos/seed/artist-david/400/400",
    speciality: "Metal Sculpture",
  },
  {
    id: "artist-5",
    slug: "sofia-andersson",
    name: "Sofia Andersson",
    bio: "Sofia Andersson's oil paintings are luminous studies of light on water. Originally from Stockholm, she draws inspiration from the Alberta foothills where she now lives, translating Nordic minimalism into Western Canadian landscapes.",
    photo_url: "https://picsum.photos/seed/artist-sofia/400/400",
    speciality: "Landscape Painting",
  },
  {
    id: "artist-6",
    slug: "marcus-reid",
    name: "Marcus Reid",
    bio: "Marcus Reid is a fine-art photographer specializing in long-exposure night photography. His haunting images of empty urban spaces have earned him a devoted collector base and multiple national awards.",
    photo_url: "https://picsum.photos/seed/artist-marcus/400/400",
    speciality: "Fine Art Photography",
  },
  {
    id: "artist-7",
    slug: "priya-sharma",
    name: "Priya Sharma",
    bio: "Priya Sharma creates vibrant mixed-media paintings that weave together South Asian textile patterns with Western pop art sensibilities. Her work is a celebration of cultural hybridity and belonging.",
    photo_url: "https://picsum.photos/seed/artist-priya/400/400",
    speciality: "Mixed Media",
  },
  {
    id: "artist-8",
    slug: "lucas-fontaine",
    name: "Lucas Fontaine",
    bio: "Lucas Fontaine is a Québécois printmaker and illustrator whose risograph prints explore themes of solitude, nature, and digital disconnection. He runs a small press out of his Montréal studio.",
    photo_url: "https://picsum.photos/seed/artist-lucas/400/400",
    speciality: "Risograph & Illustration",
  },
];

// Helper: generate artworks with realistic variety
function generateArtworks() {
  const collectionPool = [
    "new",
    "abstract",
    "photography",
    "landscape",
    "contemporary",
    "minimalist",
    "featured",
    "staff-picks",
  ];

  const paintingTitles = [
    "Sunset Over the Foothills",
    "Blue Atlas",
    "Fragment No. 12",
    "Morning Haze",
    "Crimson Divide",
    "Still Life with Lemons",
    "The Weight of Silence",
    "Urban Glow",
    "Prairie Wind",
    "Gold Horizon",
    "Vermillion Dreams",
    "Coastal Drift",
    "Passing Storm",
    "Ember & Ash",
    "The Garden Wall",
    "Dusk in the Valley",
    "Northern Lights Study",
    "Tangled Roots",
  ];

  const photographyTitles = [
    "Platform 9, 11:47 PM",
    "Market Day",
    "The Last Shift",
    "Reflection Pool",
    "Crosswalk",
    "Fog on the Bow",
    "After Hours",
    "Corner Store",
    "Rush Hour Blur",
    "Window Light",
    "Overpass",
    "First Snow",
    "The Commute",
    "Neon & Rain",
  ];

  const printTitles = [
    "Lunar Cycle I",
    "Lunar Cycle II",
    "Forest Canopy",
    "Migration Pattern",
    "Tidal Map",
    "Solstice",
    "Layered Terrain",
    "Ink Garden",
    "Seasonal Shift",
    "Parallel Lines",
    "Quiet Hours",
    "Bloom Series No. 3",
  ];

  const sculptureTitles = [
    "Remnant #4",
    "Signal Tower",
    "Coil",
    "Broken Orbit",
    "Threshold",
    "Rust & Grace",
    "Assembly Required",
    "Tension Point",
    "Hollow Form",
    "Stacked",
  ];

  const titlesByMedium: Record<string, string[]> = {
    painting: paintingTitles,
    photography: photographyTitles,
    print: printTitles,
    sculpture: sculptureTitles,
  };

  // Artist-medium affinities: some artists produce more in their specialty
  const artistMediumWeights: Record<string, Record<string, number>> = {
    "artist-1": { painting: 8, photography: 0, print: 1, sculpture: 0 },
    "artist-2": { painting: 0, photography: 9, print: 0, sculpture: 0 },
    "artist-3": { painting: 0, photography: 0, print: 8, sculpture: 0 },
    "artist-4": { painting: 0, photography: 0, print: 0, sculpture: 8 },
    "artist-5": { painting: 7, photography: 1, print: 1, sculpture: 0 },
    "artist-6": { painting: 0, photography: 8, print: 1, sculpture: 0 },
    "artist-7": { painting: 5, photography: 0, print: 3, sculpture: 1 },
    "artist-8": { painting: 0, photography: 0, print: 7, sculpture: 0 },
  };

  const artworks: Array<{
    id: string;
    slug: string;
    title: string;
    artist_id: string;
    medium: string;
    dimensions: string;
    price: number;
    year: number;
    description: string;
    image_url: string;
    collections: string[];
  }> = [];

  let artworkIndex = 1;
  const usedTitles: Record<string, number> = {};

  for (const [artistId, weights] of Object.entries(artistMediumWeights)) {
    for (const [medium, count] of Object.entries(weights)) {
      const titles = titlesByMedium[medium];
      for (let i = 0; i < count; i++) {
        const titleIndex = (usedTitles[medium] ?? 0) % titles.length;
        usedTitles[medium] = (usedTitles[medium] ?? 0) + 1;
        const title = titles[titleIndex];

        const id = `art-${artworkIndex}`;
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${artworkIndex}`;

        const priceRanges: Record<string, [number, number]> = {
          painting: [800, 18000],
          photography: [400, 5000],
          print: [200, 2500],
          sculpture: [1500, 25000],
        };
        const [minPrice, maxPrice] = priceRanges[medium];
        const price =
          Math.round(
            (minPrice + Math.random() * (maxPrice - minPrice)) / 50
          ) * 50;

        const dimensionOptions: Record<string, string[]> = {
          painting: ['24" × 36"', '30" × 40"', '36" × 48"', '18" × 24"', '48" × 60"', '16" × 20"'],
          photography: ['16" × 20"', '20" × 30"', '24" × 36"', '11" × 14"', '30" × 40"'],
          print: ['11" × 14"', '18" × 24"', '8" × 10"', '13" × 19"', '16" × 20"'],
          sculpture: ['12" × 8" × 8"', '24" × 18" × 14"', '36" × 12" × 12"', '48" × 24" × 24"', '6" × 6" × 10"'],
        };
        const dims = dimensionOptions[medium];
        const dimensions = dims[Math.floor(Math.random() * dims.length)];

        const year = 2018 + Math.floor(Math.random() * 9);

        const numCollections = 1 + Math.floor(Math.random() * 3);
        const shuffled = [...collectionPool].sort(() => Math.random() - 0.5);
        const collections = shuffled.slice(0, numCollections);

        if (year >= 2025 && !collections.includes("new")) {
          collections.push("new");
        }

        artworks.push({
          id,
          slug,
          title,
          artist_id: artistId,
          medium,
          dimensions,
          price,
          year,
          description: `A striking ${medium} work by the artist, created in ${year}. This piece explores themes of form, colour, and space through the lens of contemporary practice.`,
          image_url: `https://picsum.photos/seed/${slug}/800/600`,
          collections,
        });

        artworkIndex++;
      }
    }
  }

  return artworks;
}

const artworks = generateArtworks();

const editorials = [
  {
    slug: "colour-as-memory",
    title: "Colour as Memory",
    subtitle: "How Elena Vasquez translates the landscapes of her childhood into abstract form.",
    author: "Canvas Editorial",
    date: "2026-10-15",
    hero_image_url: "https://picsum.photos/seed/editorial-1/1600/700",
    content: [
      "Elena Vasquez doesn't paint what she sees. She paints what she remembers feeling. Standing in her sun-drenched Montreal studio, surrounded by canvases in various stages of completion, she explains her process with characteristic directness.",
      "\"I grew up watching the pampas change colour with the seasons. That palette — those ochres, those deep greens — they're in my muscle memory. When I pick up a brush, my hand already knows what colour it wants.\"",
      "Her latest series, shown here on Canvas, pushes this idea further than ever. The landscapes are barely recognizable as landscapes at all. What remains is emotion: the warmth of a late-summer afternoon, the melancholy of an overcast morning.",
    ],
    pull_quote: "When I pick up a brush, my hand already knows what colour it wants.",
    related_artist_id: "artist-1",
  },
  {
    slug: "the-quiet-city",
    title: "The Quiet City",
    subtitle: "Marcus Reid photographs urban spaces after everyone has gone home.",
    author: "Canvas Editorial",
    date: "2026-09-28",
    hero_image_url: "https://picsum.photos/seed/editorial-2/1600/700",
    content: [
      "There's a version of every city that only exists between 2 and 5 AM. Marcus Reid has spent the last decade documenting it.",
      "His long-exposure photographs transform familiar streets into something otherworldly. Traffic lights bleed colour across wet asphalt. Empty storefronts glow with the residual warmth of fluorescent tubes.",
      "\"I'm interested in the city as a stage after the performance is over,\" Reid says. \"The set is still lit, but the actors have gone home. That's when the space gets to be itself.\"",
    ],
    pull_quote: "The set is still lit, but the actors have gone home. That's when the space gets to be itself.",
    related_artist_id: "artist-6",
  },
  {
    slug: "from-block-to-paper",
    title: "From Block to Paper",
    subtitle: "Inside Mei-Lin Chen's meticulous printmaking process.",
    author: "Canvas Editorial",
    date: "2026-09-10",
    hero_image_url: "https://picsum.photos/seed/editorial-3/1600/700",
    content: [
      "Mei-Lin Chen's studio smells like ink and cedar. Woodblocks in various stages of carving cover every surface.",
      "Each print begins with a drawing — always by hand, never digital. Chen transfers the image to the block and carves for days, sometimes weeks.",
      "\"People assume prints are reproductions,\" she says. \"But every impression is unique. The pressure of my hand, the moisture in the paper — they all leave their mark.\"",
    ],
    pull_quote: "Every impression is unique. The pressure of my hand, the moisture in the paper — they all leave their mark.",
    related_artist_id: "artist-3",
  },
  {
    slug: "metal-and-meaning",
    title: "Metal and Meaning",
    subtitle: "David Thornton turns scrap into sculpture — and commentary.",
    author: "Canvas Editorial",
    date: "2026-08-20",
    hero_image_url: "https://picsum.photos/seed/editorial-4/1600/700",
    content: [
      "David Thornton's sculptures begin their lives as something else. Car parts. Kitchen appliances. Industrial piping.",
      "\"Everything we throw away tells a story about what we valued and then stopped valuing,\" Thornton explains, welding torch in hand.",
      "His latest series of wall-mounted works hangs in the gallery like a collection of mechanical butterflies pinned to a board.",
    ],
    pull_quote: "Everything we throw away tells a story about what we valued and then stopped valuing.",
    related_artist_id: "artist-4",
  },
  {
    slug: "between-two-worlds",
    title: "Between Two Worlds",
    subtitle: "Priya Sharma's paintings live at the intersection of heritage and pop culture.",
    author: "Canvas Editorial",
    date: "2026-08-01",
    hero_image_url: "https://picsum.photos/seed/editorial-5/1600/700",
    content: [
      "Priya Sharma's canvases are busy in the best way. They layer paisley patterns over comic-book panels, Bollywood palette over Warhol repetition.",
      "\"I grew up code-switching,\" Sharma says. \"At home it was one culture, at school another. My work is what happens when you stop switching and let everything exist at once.\"",
      "Her pieces resist the pressure to be one thing. Collectors respond to their energy — Sharma's last show sold out on opening night.",
    ],
    pull_quote: "My work is what happens when you stop switching and let everything exist at once.",
    related_artist_id: "artist-7",
  },
];

// Generate ratings for ~40 artworks (not all — some intentionally unrated)
function generateRatings(artworkList: typeof artworks) {
  const ratings: Array<{
    artwork_id: string;
    average_rating: number;
    total_ratings: number;
  }> = [];

  const shuffled = [...artworkList].sort(() => Math.random() - 0.5);
  const ratedCount = Math.min(40, shuffled.length);

  for (let i = 0; i < ratedCount; i++) {
    ratings.push({
      artwork_id: shuffled[i].id,
      average_rating: Math.round((2.5 + Math.random() * 2.3) * 10) / 10,
      total_ratings: 3 + Math.floor(Math.random() * 148),
    });
  }

  return ratings;
}

const ratings = generateRatings(artworks);

// ---------------------------------------------------------------------------
// 2. Generate SQL
// ---------------------------------------------------------------------------

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function pgArray(arr: string[]): string {
  return `'{${arr.map((s) => `"${escapeSQL(s)}"`).join(",")}}'`;
}

function generateSQL(): string {
  const lines: string[] = [];

  lines.push("-- ============================================================");
  lines.push("-- Canvas Seed Data");
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push("--");
  lines.push("-- Paste this into Supabase Dashboard → SQL Editor → Run");
  lines.push("-- The SQL Editor bypasses Row Level Security automatically.");
  lines.push("-- ============================================================");
  lines.push("");

  // Clear existing data (child tables first for FK safety)
  lines.push("-- Clear existing data");
  lines.push('DELETE FROM artwork_ratings WHERE artwork_id IS NOT NULL;');
  lines.push('DELETE FROM ratings WHERE artwork_id IS NOT NULL;');
  lines.push('DELETE FROM artworks WHERE id IS NOT NULL;');
  lines.push('DELETE FROM editorials WHERE slug IS NOT NULL;');
  lines.push('DELETE FROM artists WHERE id IS NOT NULL;');
  lines.push("");

  // Artists
  lines.push("-- ========================  ARTISTS  ========================");
  lines.push("INSERT INTO artists (id, slug, name, bio, photo_url, speciality) VALUES");
  const artistValues = artists.map(
    (a) =>
      `  ('${escapeSQL(a.id)}', '${escapeSQL(a.slug)}', '${escapeSQL(a.name)}', '${escapeSQL(a.bio)}', '${escapeSQL(a.photo_url)}', '${escapeSQL(a.speciality)}')`
  );
  lines.push(artistValues.join(",\n") + ";");
  lines.push("");

  // Artworks
  lines.push("-- ========================  ARTWORKS  =======================");
  lines.push(
    "INSERT INTO artworks (id, slug, title, artist_id, medium, dimensions, price, year, description, image_url, collections) VALUES"
  );
  const artworkValues = artworks.map(
    (a) =>
      `  ('${escapeSQL(a.id)}', '${escapeSQL(a.slug)}', '${escapeSQL(a.title)}', '${escapeSQL(a.artist_id)}', '${escapeSQL(a.medium)}', '${escapeSQL(a.dimensions)}', ${a.price}, ${a.year}, '${escapeSQL(a.description)}', '${escapeSQL(a.image_url)}', ${pgArray(a.collections)})`
  );
  lines.push(artworkValues.join(",\n") + ";");
  lines.push("");

  // Editorials
  lines.push("-- ========================  EDITORIALS  =====================");
  lines.push(
    "INSERT INTO editorials (slug, title, subtitle, author, date, hero_image_url, content, pull_quote, related_artist_id) VALUES"
  );
  const editorialValues = editorials.map(
    (e) =>
      `  ('${escapeSQL(e.slug)}', '${escapeSQL(e.title)}', '${escapeSQL(e.subtitle)}', '${escapeSQL(e.author)}', '${escapeSQL(e.date)}', '${escapeSQL(e.hero_image_url)}', ${pgArray(e.content)}, '${escapeSQL(e.pull_quote)}', '${escapeSQL(e.related_artist_id)}')`
  );
  lines.push(editorialValues.join(",\n") + ";");
  lines.push("");

  // Ratings
  lines.push("-- ========================  RATINGS  ========================");
  lines.push(
    "INSERT INTO artwork_ratings (artwork_id, average_rating, total_ratings) VALUES"
  );
  const ratingValues = ratings.map(
    (r) =>
      `  ('${escapeSQL(r.artwork_id)}', ${r.average_rating}, ${r.total_ratings})`
  );
  lines.push(ratingValues.join(",\n") + ";");
  lines.push("");

  // Summary
  lines.push("-- ============================================================");
  lines.push(`-- Summary: ${artists.length} artists, ${artworks.length} artworks, ${editorials.length} editorials, ${ratings.length} ratings`);
  lines.push(`-- ${artworks.length - ratings.length} artworks intentionally left unrated (edge case)`);
  lines.push("-- ============================================================");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 3. Write to file
// ---------------------------------------------------------------------------

const sql = generateSQL();
const outputPath = resolve(process.cwd(), "scripts", "seed.sql");
writeFileSync(outputPath, sql, "utf-8");

console.log("✅  Seed SQL generated!\n");
console.log(`   📄 File: scripts/seed.sql`);
console.log(`   • ${artists.length} artists`);
console.log(`   • ${artworks.length} artworks`);
console.log(`   • ${editorials.length} editorials`);
console.log(`   • ${ratings.length} artwork ratings`);
console.log(`   • ${artworks.length - ratings.length} artworks intentionally unrated\n`);
console.log("   Next step: paste the contents of seed.sql into");
console.log("   Supabase Dashboard → SQL Editor → Run");
