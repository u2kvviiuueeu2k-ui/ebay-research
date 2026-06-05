import { ResearchResult } from "@/types";

export const MOCK_RESULTS: ResearchResult[] = [
  {
    product: {
      id: "1",
      title: "Nintendo Switch OLED Console - White",
      imageUrl: "https://via.placeholder.com/120x120?text=Switch",
      ebayPrice: 320,
      currency: "USD",
      soldCount: 6,
      soldPeriodDays: 30,
      ebayUrl: "https://www.ebay.com",
      pattern: "high-rotation",
      category: "Video Games",
    },
    sources: [
      {
        platform: "yahoo-auction",
        title: "Nintendo Switch 有機EL ホワイト 美品",
        price: 28000,
        url: "https://auctions.yahoo.co.jp",
        imageUrl: "https://via.placeholder.com/80x80?text=YA",
      },
      {
        platform: "mercari",
        title: "ニンテンドースイッチ 有機EL 白 動作確認済",
        price: 27500,
        url: "https://www.mercari.com/jp",
        imageUrl: "https://via.placeholder.com/80x80?text=MC",
      },
    ],
    bestProfit: {
      ebayPrice: 320,
      sourcePrice: 27500,
      ebayFeeRate: 0.1325,
      ebayFee: 42.4,
      shippingCost: 25,
      profit: 64.1,
      profitRate: 20.0,
    },
  },
  {
    product: {
      id: "2",
      title: "Sony WH-1000XM5 Wireless Headphones Black",
      imageUrl: "https://via.placeholder.com/120x120?text=Sony",
      ebayPrice: 250,
      currency: "USD",
      soldCount: 2,
      soldPeriodDays: 90,
      ebayUrl: "https://www.ebay.com",
      pattern: "standard",
      category: "Electronics",
    },
    sources: [
      {
        platform: "amazon",
        title: "ソニー WH-1000XM5 ブラック",
        price: 22000,
        url: "https://www.amazon.co.jp",
        imageUrl: "https://via.placeholder.com/80x80?text=AMZ",
      },
    ],
    bestProfit: {
      ebayPrice: 250,
      sourcePrice: 22000,
      ebayFeeRate: 0.1325,
      ebayFee: 33.1,
      shippingCost: 20,
      profit: 48.6,
      profitRate: 19.4,
    },
  },
  {
    product: {
      id: "3",
      title: "Rolex Submariner Date 116610LN Box Papers",
      imageUrl: "https://via.placeholder.com/120x120?text=Rolex",
      ebayPrice: 12500,
      currency: "USD",
      soldCount: 1,
      soldPeriodDays: 365,
      ebayUrl: "https://www.ebay.com",
      pattern: "high-value",
      category: "Watches",
    },
    sources: [
      {
        platform: "yahoo-auction",
        title: "ロレックス サブマリーナー 116610LN 箱保付き",
        price: 980000,
        url: "https://auctions.yahoo.co.jp",
        imageUrl: "https://via.placeholder.com/80x80?text=YA",
      },
    ],
    bestProfit: {
      ebayPrice: 12500,
      sourcePrice: 980000,
      ebayFeeRate: 0.1325,
      ebayFee: 1656.3,
      shippingCost: 80,
      profit: 1527.7,
      profitRate: 12.2,
    },
  },
];

export const PATTERN_LABELS = {
  "high-rotation": { label: "高回転", color: "bg-blue-100 text-blue-700", desc: "30日で5〜7個売れ" },
  standard: { label: "定番", color: "bg-green-100 text-green-700", desc: "90日で1〜2個売れ" },
  "high-value": { label: "高額", color: "bg-purple-100 text-purple-700", desc: "1年で1個以上・高単価" },
};

export const PLATFORM_LABELS = {
  "yahoo-auction": { label: "ヤフオク", color: "bg-red-100 text-red-700" },
  mercari: { label: "メルカリ", color: "bg-orange-100 text-orange-700" },
  amazon: { label: "Amazon", color: "bg-yellow-100 text-yellow-700" },
};
