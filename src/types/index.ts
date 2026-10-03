export type ProductPattern = "standard" | "high-value";

export interface EbayProduct {
  id: string;
  title: string;
  imageUrl: string;
  ebayPrice: number;
  currency: string;
  ebayUrl: string;
  pattern: ProductPattern;
  category: string;
}

export interface SourceItem {
  platform: "mercari" | "yahoo-auction" | "amazon";
  title: string;
  url: string;
}

export interface ResearchResult {
  product: EbayProduct;
  sources: SourceItem[];
}

// 1商品ごとに人（または将来の取得元）が埋める入力。空文字＝未入力。
// 販売実績の出どころ（Terapeak・Marketplace Insights・CSV等）は問わず、この形に入れる。
export interface ItemInput {
  sourceJPY: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  shippingJPY: string; // 入力があれば重量計算より優先
  sold90d: string;
  sellers: string; // 日本発送の競合セラー数
}

export const EMPTY_INPUT: ItemInput = {
  sourceJPY: "",
  weightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  shippingJPY: "",
  sold90d: "",
  sellers: "",
};
