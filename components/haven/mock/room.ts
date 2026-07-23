import type { DesignNote, HavenHotspot, HavenProduct, StyleId } from '../types';

/** Unsplash room photography for frontend-only demo */
export const MOCK_ORIGINAL_ROOM =
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80';

export const MOCK_STYLED_BY_STYLE: Record<StyleId, string> = {
  organic_modern:
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80',
  modern:
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80',
  scandinavian:
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
  traditional:
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80',
  luxury:
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',
  eclectic:
    'https://images.unsplash.com/photo-1615874959471-d45adb4673c4?auto=format&fit=crop&w=1600&q=80',
};

export const MOCK_NOTES_BY_STYLE: Record<StyleId, DesignNote[]> = {
  organic_modern: [
    {
      id: 'n1',
      text: 'Replaced the dark leather sofa with a low-profile linen sofa to lighten visual weight.',
    },
    {
      id: 'n2',
      text: 'Added an oversized jute rug to anchor the seating area and warm the floor plane.',
    },
    {
      id: 'n3',
      text: 'Swapped the black coffee table for white oak to echo California Organic Modern cues.',
    },
  ],
  modern: [
    {
      id: 'n1',
      text: 'Introduced a low modular sofa with crisp geometry and quiet upholstery.',
    },
    {
      id: 'n2',
      text: 'Simplified the media wall so artwork and lighting carry the room.',
    },
    {
      id: 'n3',
      text: 'Chose a slim metal coffee table to keep sightlines open.',
    },
  ],
  scandinavian: [
    {
      id: 'n1',
      text: 'Brought in pale ash seating and airy textiles for a calmer daylight read.',
    },
    {
      id: 'n2',
      text: 'Lightened the rug so the floor feels continuous with the walls.',
    },
    {
      id: 'n3',
      text: 'Added a paper pendant for soft, diffuse overhead light.',
    },
  ],
  traditional: [
    {
      id: 'n1',
      text: 'Grounded the seating with a rolled-arm sofa in a warm neutral.',
    },
    {
      id: 'n2',
      text: 'Layered a wool rug with subtle pattern for depth without noise.',
    },
    {
      id: 'n3',
      text: 'Chose a substantial wood cocktail table to balance the sofa mass.',
    },
  ],
  luxury: [
    {
      id: 'n1',
      text: 'Selected a tailored lounge sofa with refined proportions and deep seat.',
    },
    {
      id: 'n2',
      text: 'Introduced a stone-top table for a quieter, more architectural center.',
    },
    {
      id: 'n3',
      text: 'Kept accessories sparse so material quality stays the focus.',
    },
  ],
  eclectic: [
    {
      id: 'n1',
      text: 'Mixed a sculptural sofa with a patterned rug for collected energy.',
    },
    {
      id: 'n2',
      text: 'Added a statement lamp as a playful focal without crowding the room.',
    },
    {
      id: 'n3',
      text: 'Balanced bold pieces with one calm wall color so the mix feels intentional.',
    },
  ],
};

export const MOCK_PRODUCTS: HavenProduct[] = [
  {
    id: 'p-sofa',
    name: 'Low-Profile Linen Sofa',
    merchant: 'Lulu & Georgia',
    price: 2498,
    imageUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    affiliateUrl: 'https://example.com/affiliate/sofa',
    category: 'sofa',
  },
  {
    id: 'p-rug',
    name: 'Oversized Jute Area Rug',
    merchant: 'Amber Interiors',
    price: 890,
    imageUrl:
      'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=800&q=80',
    affiliateUrl: 'https://example.com/affiliate/rug',
    category: 'rug',
  },
  {
    id: 'p-table',
    name: 'White Oak Coffee Table',
    merchant: 'Jenni Kayne',
    price: 1295,
    imageUrl:
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80',
    affiliateUrl: 'https://example.com/affiliate/table',
    category: 'table',
  },
  {
    id: 'p-lamp',
    name: 'Brass Arc Floor Lamp',
    merchant: 'West Elm',
    price: 428,
    imageUrl:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    affiliateUrl: 'https://example.com/affiliate/lamp',
    category: 'lighting',
  },
  {
    id: 'p-chair',
    name: 'Leather Lounge Chair',
    merchant: 'Article',
    price: 799,
    imageUrl:
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
    affiliateUrl: 'https://example.com/affiliate/chair',
    category: 'chair',
  },
];

/** Percent positions tuned per styled mock image (MVP approximations). */
export const MOCK_HOTSPOTS_BY_STYLE: Record<StyleId, HavenHotspot[]> = {
  organic_modern: [
    { id: 'h1', productId: 'p-sofa', x: 40, y: 54, label: 'Sofa' },
    { id: 'h2', productId: 'p-table', x: 46, y: 71, label: 'Coffee table' },
    { id: 'h3', productId: 'p-lamp', x: 71, y: 30, label: 'Floor lamp' },
    { id: 'h4', productId: 'p-chair', x: 84, y: 60, label: 'Lounge chair' },
    { id: 'h5', productId: 'p-rug', x: 54, y: 86, label: 'Rug' },
  ],
  modern: [
    { id: 'h1', productId: 'p-sofa', x: 42, y: 56, label: 'Sofa' },
    { id: 'h2', productId: 'p-table', x: 48, y: 72, label: 'Coffee table' },
    { id: 'h3', productId: 'p-lamp', x: 78, y: 38, label: 'Floor lamp' },
    { id: 'h4', productId: 'p-chair', x: 18, y: 62, label: 'Accent chair' },
    { id: 'h5', productId: 'p-rug', x: 50, y: 88, label: 'Rug' },
  ],
  scandinavian: [
    { id: 'h1', productId: 'p-sofa', x: 45, y: 55, label: 'Sofa' },
    { id: 'h2', productId: 'p-table', x: 50, y: 70, label: 'Coffee table' },
    { id: 'h3', productId: 'p-lamp', x: 72, y: 28, label: 'Pendant' },
    { id: 'h4', productId: 'p-chair', x: 78, y: 64, label: 'Accent chair' },
    { id: 'h5', productId: 'p-rug', x: 48, y: 86, label: 'Rug' },
  ],
  traditional: [
    { id: 'h1', productId: 'p-sofa', x: 48, y: 52, label: 'Sofa' },
    { id: 'h2', productId: 'p-table', x: 50, y: 68, label: 'Coffee table' },
    { id: 'h3', productId: 'p-lamp', x: 22, y: 40, label: 'Floor lamp' },
    { id: 'h4', productId: 'p-chair', x: 80, y: 58, label: 'Accent chair' },
    { id: 'h5', productId: 'p-rug', x: 52, y: 85, label: 'Rug' },
  ],
  luxury: [
    { id: 'h1', productId: 'p-sofa', x: 44, y: 54, label: 'Sofa' },
    { id: 'h2', productId: 'p-table', x: 48, y: 70, label: 'Coffee table' },
    { id: 'h3', productId: 'p-lamp', x: 76, y: 34, label: 'Floor lamp' },
    { id: 'h4', productId: 'p-chair', x: 16, y: 60, label: 'Accent chair' },
    { id: 'h5', productId: 'p-rug', x: 50, y: 87, label: 'Rug' },
  ],
  eclectic: [
    { id: 'h1', productId: 'p-sofa', x: 46, y: 56, label: 'Sofa' },
    { id: 'h2', productId: 'p-table', x: 50, y: 72, label: 'Coffee table' },
    { id: 'h3', productId: 'p-lamp', x: 74, y: 32, label: 'Floor lamp' },
    { id: 'h4', productId: 'p-chair', x: 20, y: 64, label: 'Accent chair' },
    { id: 'h5', productId: 'p-rug', x: 52, y: 88, label: 'Rug' },
  ],
};

