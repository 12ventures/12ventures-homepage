export type StyleId =
  | 'organic_modern'
  | 'modern'
  | 'scandinavian'
  | 'traditional'
  | 'luxury'
  | 'eclectic';

export type HavenStep = 'upload' | 'style' | 'generating' | 'revealing' | 'result';

export interface StylePersonality {
  id: StyleId;
  label: string;
  blurb: string;
  /** Internal only — not primary UI */
  inspiredBy: string[];
}

export interface DesignNote {
  id: string;
  text: string;
}

export interface HavenProduct {
  id: string;
  name: string;
  merchant: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  category: 'sofa' | 'rug' | 'table' | 'lighting' | 'decor' | 'chair';
}

export interface RoomJob {
  id: string;
  styleId: StyleId;
  originalImageUrl: string;
  styledImageUrl: string;
  notes: DesignNote[];
  products: HavenProduct[];
  status: 'ready' | 'failed';
}

export interface HavenHotspot {
  id: string;
  productId: string;
  /** Percent of image width/height */
  x: number;
  y: number;
  label: string;
}
