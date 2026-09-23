import { Artist } from "@/types";

export const artists: Artist[] = [
  {
    id: "artist-1",
    slug: "elena-vasquez",
    name: "Elena Vasquez",
    bio: "Elena Vasquez is a contemporary painter based in Mexico City whose large-scale canvases explore the tension between urban landscapes and organic forms. Her work has been exhibited at the Museo de Arte Moderno and featured in Artforum. She works primarily in oil and mixed media, layering colour and texture to create immersive compositions that blur the line between abstraction and figuration.",
    photoUrl: "https://picsum.photos/seed/elena-vasquez/600/600",
    speciality: "Painting & Mixed Media",
  },
  {
    id: "artist-2",
    slug: "james-whitfield",
    name: "James Whitfield",
    bio: "James Whitfield is a London-born photographer whose documentary-style work captures quiet, contemplative moments in everyday life. His series on urban solitude has been acquired by the Tate Modern and the Victoria & Albert Museum. Whitfield shoots exclusively on medium-format film, lending his images a luminous, tactile quality that feels both timeless and deeply personal.",
    photoUrl: "https://picsum.photos/seed/james-whitfield/600/600",
    speciality: "Photography",
  },
  {
    id: "artist-3",
    slug: "mika-tanaka",
    name: "Mika Tanaka",
    bio: "Mika Tanaka is a printmaker and sculptor working from her studio in Kyoto. Her practice draws on traditional Japanese woodblock techniques and reimagines them through a contemporary lens — geometric, meditative, and deceptively simple. Her limited-edition prints sell out within hours of release, and her sculptural work has been shown at Art Basel and the Echigo-Tsumari Triennale.",
    photoUrl: "https://picsum.photos/seed/mika-tanaka/600/600",
    speciality: "Printmaking & Sculpture",
  },
  {
    id: "artist-4",
    slug: "omar-hassan",
    name: "Omar Hassan",
    bio: "Omar Hassan is a multidisciplinary artist from Cairo whose vibrant abstract paintings and bold graphic prints explore themes of memory, migration, and belonging. His palette is rich and unapologetic — deep indigos, burnt oranges, electric teals — and his compositions pulse with rhythm and movement. Hassan's work is held in private collections across the Middle East, Europe, and North America.",
    photoUrl: "https://picsum.photos/seed/omar-hassan/600/600",
    speciality: "Abstract Painting & Prints",
  },
];

export function getArtistById(id: string): Artist | undefined {
  return artists.find((a) => a.id === id);
}

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((a) => a.slug === slug);
}
