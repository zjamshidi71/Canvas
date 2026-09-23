import { EditorialArticle } from "@/types";

export const editorials: EditorialArticle[] = [
  {
    slug: "the-weight-of-lightness",
    title: "The Weight of Lightness",
    subtitle:
      "Printmaker and sculptor Mika Tanaka on patience, imperfection, and why she still carves every block by hand.",
    author: "Canvas Editorial",
    date: "September 2024",
    heroImageUrl: "https://picsum.photos/seed/editorial-mika/1600/900",
    pullQuote:
      "I am not trying to make something perfect. I am trying to make something true — and truth always has rough edges.",
    relatedArtistId: "artist-3",
    content: [
      "Mika Tanaka's studio sits at the end of a narrow lane in eastern Kyoto, behind a wooden gate that gives no hint of what lies inside. Step through, and you enter a world of extraordinary quiet — white walls, north-facing windows, and rows of woodblocks stacked like books on deep shelves. A single print, freshly pulled and still damp, hangs from a clip above the press.",
      "\"I need the silence,\" she says, pouring tea with the same unhurried precision she brings to her carving. \"The wood tells you things if you listen. Where it wants to be cut, where it wants to resist. You cannot hear that in a noisy place.\"",
      "Tanaka has been making prints for twenty-two years, since she apprenticed under master printer Yoshida Kenji at the age of nineteen. She learned the traditional ukiyo-e method — carving cherry wood, mixing pigments by hand, printing one colour at a time — but her work looks nothing like the floating-world images most people associate with Japanese woodblock. Her compositions are geometric, minimal, almost architectural. Grids, tessellations, and stacked forms in muted earth tones and deep indigos.",
      "\"Yoshida-sensei taught me the craft, but he also taught me that tradition is not a museum. It is alive. You honour it by pushing it forward, not by repeating it.\"",
      "Her recent sculptural work extends the same philosophy into three dimensions. Stacked ceramic forms, carved stone, assembled wood — each piece shares the printmaker's sensitivity to surface, edge, and the space between things. Her concept of 'ma,' the Japanese idea of meaningful emptiness, runs through everything she makes.",
      "\"In a print, the unprinted paper is as important as the ink. In a sculpture, the air around the form is as important as the clay. I am always working with what is not there as much as what is.\"",
      "When asked about the art market's appetite for speed — digital editions, AI-generated imagery, NFTs that appear overnight — Tanaka smiles gently. \"I understand the excitement. But I think people are also hungry for things that took time. When you hold one of my prints, you are holding three months of my attention. That means something. It is slow, and it is expensive, and I would not change it.\"",
      "Her latest series, 'Tessellation,' has been her most commercially successful to date. The five-colour woodblock prints sold out within hours of their release on Canvas, and secondary-market prices have already doubled. But Tanaka seems genuinely uninterested in the numbers.",
      "\"I made the edition small because I wanted each print to matter. Fifteen copies, fifteen people who will live with this image. That feels right to me. If I made five hundred, it would be a product, not a print.\"",
      "She returns to her workbench, picks up a gouge, and begins to carve. The room fills with the soft, rhythmic sound of steel on wood. Outside, the late-afternoon light slants through the garden. It is, by any measure, a beautiful way to spend a life.",
    ],
  },
];

export function getEditorialBySlug(
  slug: string
): EditorialArticle | undefined {
  return editorials.find((e) => e.slug === slug);
}
