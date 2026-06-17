import img1 from "@/assets/prop-1.jpg?w=1600&quality=72&format=webp";
import img2 from "@/assets/prop-2.jpg?w=1600&quality=72&format=webp";
import img3 from "@/assets/prop-3.jpg?w=1600&quality=72&format=webp";
import img4 from "@/assets/prop-4.jpg?w=1600&quality=72&format=webp";
import img5 from "@/assets/prop-5.jpg?w=1600&quality=72&format=webp";
import img6 from "@/assets/prop-6.jpg?w=1600&quality=72&format=webp";
import img7 from "@/assets/prop-7.jpg?w=1600&quality=72&format=webp";

export type Category = "News" | "Blog";

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  tag: string;
  image: string;
  date: string;
  readTime: string;
  author: string;
  body: string[];
}

export const ARTICLES: Article[] = [
  {
    id: "lusail-skyline-2026",
    title: "Lusail skyline reaches new heights as four towers near completion",
    excerpt:
      "Qatar's flagship master-planned city welcomes four new mixed-use towers, expanding premium inventory in West Lusail.",
    category: "News",
    tag: "Market",
    image: img3,
    date: "Jun 14, 2026",
    readTime: "4 min read",
    author: "MaisonQatar Newsroom",
    body: [
      "Lusail's western waterfront is on the cusp of a major delivery cycle. Four mixed-use towers — spanning premium apartments, branded residences and street-level retail — are scheduled for handover before the end of the year, adding more than 1,200 units to the city's premium inventory.",
      "The new towers continue Lusail's deliberate shift toward dense, transit-connected living. Each project sits within walking distance of the Lusail Light Rail and the marina promenade, with rooftop amenities pitched squarely at the international buyer pool.",
      "For owners already invested in the district, the supply bump is expected to compress short-term rental yields slightly while supporting long-term capital values. MaisonQatar's research desk projects gross yields to settle between 5.6% and 6.1% across the new stock once leasing stabilises.",
      "Off-plan units in two of the four towers have already crossed the 70% sold mark — a strong signal that demand for premium Lusail addresses remains intact heading into 2027.",
    ],
  },
  {
    id: "buying-guide-pearl",
    title: "A buyer's guide to The Pearl: districts, freehold rules & value",
    excerpt:
      "From Porto Arabia to Qanat Quartier, here's how each district compares on lifestyle, yields and resale potential.",
    category: "Blog",
    tag: "Guide",
    image: img1,
    date: "Jun 10, 2026",
    readTime: "7 min read",
    author: "Yara Al-Mansoori",
    body: [
      "The Pearl-Qatar remains the country's most recognised freehold address — and for good reason. Eleven distinct districts, each with its own architectural language, give buyers an unusually wide spread of price points and lifestyles within a single master plan.",
      "Porto Arabia anchors the island with marina-front towers, the broadest rental pool, and the most liquid resale market. Qanat Quartier, with its Venetian-inspired townhouses and pastel facades, attracts long-term residents who prize quiet streets over skyline views.",
      "Freehold rules across The Pearl are unusually clear: any nationality may purchase, and ownership confers residency for the buyer and immediate family. Service charges vary meaningfully between districts — a detail many first-time buyers underweight.",
      "Our shortlist for value in 2026 leans toward the smaller marina-view units in Porto Arabia and the back-canal townhouses in Qanat Quartier — both segments where rental demand consistently outpaces supply.",
    ],
  },
  {
    id: "rental-yields-q2",
    title: "Q2 2026 rental yields: West Bay edges past Lusail",
    excerpt:
      "Our quarterly index shows West Bay apartments delivering 6.4% gross yields, outpacing Lusail for the first time since 2024.",
    category: "News",
    tag: "Data",
    image: img4,
    date: "Jun 6, 2026",
    readTime: "5 min read",
    author: "Research Desk",
    body: [
      "West Bay reclaimed the top spot in MaisonQatar's quarterly yield index this quarter, with average gross yields of 6.4% across one- and two-bedroom apartments — a 40 basis-point lead over Lusail.",
      "The shift is driven by two forces: corporate tenant demand near the diplomatic and financial cluster, and softer asking rents on a handful of newer Lusail towers still in lease-up.",
      "Investors evaluating the two markets should weigh more than yield. Capital values in Lusail are still appreciating faster on a 12-month basis, and the long-term pipeline of amenities favours the newer city.",
      "We expect the yield gap to narrow again in Q3 as Lusail occupancy ticks up — but for income-focused buyers, West Bay remains the more efficient entry point this summer.",
    ],
  },
  {
    id: "interior-trends-2026",
    title: "Five interior trends defining Doha's premium residences this year",
    excerpt:
      "Warm minimalism, travertine accents, and biophilic layouts are reshaping how Doha lives indoors.",
    category: "Blog",
    tag: "Design",
    image: img5,
    date: "May 30, 2026",
    readTime: "6 min read",
    author: "Studio MQ",
    body: [
      "After a decade of glossy white kitchens and chrome-heavy lobbies, Doha's premium interiors are settling into something quieter. Warm minimalism — driven by oak millwork, plaster walls, and muted earth palettes — leads the brief on most of our 2026 staging projects.",
      "Travertine is the material of the year. We're seeing it on bathroom slabs, fluted vanities, and even kitchen islands. Buyers respond to its softness against the harder Gulf light.",
      "Biophilic layouts — rooms organised around a central planted court or double-height window wall — are quietly reshaping floor plates in The Pearl and Lusail. The result reads less hotel, more home.",
      "Lighting is doing more work than ever. Layered warm-LED schemes (2700K and below) at multiple heights are now standard in the residences that show best at viewings.",
    ],
  },
  {
    id: "freehold-expansion",
    title: "Government expands freehold zones for foreign investors",
    excerpt:
      "Two new districts have been added to the list of areas where non-Qataris can purchase freehold residential property.",
    category: "News",
    tag: "Policy",
    image: img2,
    date: "May 22, 2026",
    readTime: "3 min read",
    author: "MaisonQatar Newsroom",
    body: [
      "A cabinet decision published this week adds two further districts to the country's freehold map for non-Qatari buyers, bringing the total to eleven designated zones.",
      "The newly opened districts are positioned around emerging mixed-use corridors and are expected to attract both end-users and yield-focused investors over the next 12-18 months.",
      "Existing freehold residency benefits — including renewable residency for the owner and dependents — extend to the new zones under the same conditions.",
      "We expect early pricing in the new districts to settle 8-12% below comparable stock in The Pearl, with room for compression as infrastructure matures.",
    ],
  },
  {
    id: "first-time-buyer",
    title: "First-time buyer in Doha? Here's what to budget beyond the price",
    excerpt:
      "Transfer fees, agency commissions, service charges and snagging — the real cost of ownership, unpacked.",
    category: "Blog",
    tag: "Advice",
    image: img6,
    date: "May 18, 2026",
    readTime: "5 min read",
    author: "Yara Al-Mansoori",
    body: [
      "The headline price on a property is rarely the all-in number. For first-time buyers in Doha, a realistic budget should add 4-6% on top of the asking price to cover transfer, legal, and onboarding costs.",
      "Service charges deserve more attention than they usually get. On premium towers, expect QAR 18-32 per square metre per year — a figure that materially affects net yield on rental units.",
      "Snagging is the most under-budgeted line for off-plan buyers. We recommend setting aside 0.5-1% of the unit price for a professional snagging pass and the remediation it surfaces.",
      "Finally: factor in furnishing. A move-in-ready three-bedroom in The Pearl typically takes QAR 250k-450k to outfit to a standard that matches the address.",
    ],
  },
  {
    id: "katara-hills-launch",
    title: "Katara Hills launches its second residential phase",
    excerpt:
      "Twelve hillside villas and a clubhouse arrive in Q4, with prices starting from QAR 9.5M.",
    category: "News",
    tag: "Launch",
    image: img7,
    date: "May 12, 2026",
    readTime: "4 min read",
    author: "MaisonQatar Newsroom",
    body: [
      "Katara Hills' second phase brings twelve hillside villas to market, alongside a private members' clubhouse and a landscaped wadi walk linking the development to the wider cultural quarter.",
      "Plot sizes range from 720 to 1,150 square metres, with five-bedroom configurations leading the launch. Prices begin at QAR 9.5M for the lower-tier villas and rise above QAR 16M for the wadi-facing plots.",
      "The developer has confirmed that the clubhouse will operate on a residents-only basis, with concierge, spa, and a 25-metre lap pool included in the service-charge package.",
      "Handover is targeted for Q4 2026. MaisonQatar holds preferred-broker status for the launch.",
    ],
  },
  {
    id: "staging-for-sale",
    title: "Staging your villa for sale: the small moves that lift offers 8%",
    excerpt:
      "Lighting, scent, and curated negative space — practical staging notes from our top-performing listings.",
    category: "Blog",
    tag: "Selling",
    image: img2,
    date: "May 4, 2026",
    readTime: "6 min read",
    author: "Studio MQ",
    body: [
      "Across our 2025-26 sale listings, professionally staged villas closed an average of 7.9% above comparable unstaged stock — and typically 18 days faster.",
      "The single biggest lever is light. Replacing cool-white bulbs with warm 2700K LEDs across the principal rooms transformed how buyers responded to the space at evening viewings.",
      "Scent matters more than most sellers admit. A single neutral diffuser per floor — cedar or fig, never floral — sets the tone without crossing into showroom territory.",
      "Finally: edit ruthlessly. Removing 30-40% of the furniture and personal items from the principal living spaces lets the architecture do the selling. The villa always shows bigger than the listing photos suggest.",
    ],
  },
];

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}
