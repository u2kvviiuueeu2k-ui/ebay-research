export type ProductPattern = "high-rotation" | "standard" | "high-value";

export interface EbayProduct {
  id: string;
  title: string;
  imageUrl: string;
  ebayPrice: number;
  currency: string;
  soldCount: number;
  soldPeriodDays: number;
  ebayUrl: string;
  pattern: ProductPattern;
  category: string;
}

export interface SourceItem {
  platform: "mercari" | "yahoo-auction" | "amazon";
  title: string;
  price: number;
  url: string;
  imageUrl: string;
}

export interface ProfitCalculation {
  ebayPrice: number;
  sourcePrice: number;
  ebayFeeRate: number;
  ebayFee: number;
  shippingCost: number;
  profit: number;
  profitRate: number;
}

export interface ResearchResult {
  product: EbayProduct;
  sources: SourceItem[];
  bestProfit: ProfitCalculation | null;
}
