// Cloudflare Workers エントリポイント。
// 元 src/app/api/research/route.ts のロジックをそのまま移植し、
// それ以外のリクエストは静的エクスポート済みアセット（./out）へフォールバックする。
import { fetchItemsByKeyword, type EbayCompletedItem } from "./src/lib/ebay";
import { extractModelQuery } from "./src/lib/utils";
import type { ResearchResult, ProductPattern } from "./src/types";

const EXCHANGE_RATE = 150;

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  EBAY_APP_ID?: string;
  EBAY_CERT_ID?: string;
}

function calcProfit(ebayPriceUSD: number, sourcePriceJPY: number) {
  const sourcePriceUSD = sourcePriceJPY / EXCHANGE_RATE;
  const ebayFeeRate = 0.1325;
  const ebayFee = ebayPriceUSD * ebayFeeRate;
  const shippingCost = ebayPriceUSD > 1000 ? 80 : 25;
  const profit = ebayPriceUSD - sourcePriceUSD - ebayFee - shippingCost;
  const profitRate = (profit / ebayPriceUSD) * 100;
  return { ebayPrice: ebayPriceUSD, sourcePrice: sourcePriceJPY, ebayFeeRate, ebayFee, shippingCost, profit, profitRate };
}

function toResult(item: EbayCompletedItem, pattern: ProductPattern, soldCount: number, soldPeriodDays: number): ResearchResult {
  const ebayPrice = parseFloat(item.price.value);
  const estimatedSourceJPY = Math.round(ebayPrice * EXCHANGE_RATE * 0.55);
  const sourceQuery = extractModelQuery(item.title);

  return {
    product: {
      id: item.itemId,
      title: item.title,
      imageUrl: item.image?.imageUrl ?? "",
      ebayPrice,
      currency: item.price.currency,
      soldCount,
      soldPeriodDays,
      ebayUrl: item.itemWebUrl,
      pattern,
      category: "",
    },
    sources: [
      {
        platform: "yahoo-auction",
        title: `${sourceQuery} をヤフオクで探す`,
        price: estimatedSourceJPY,
        url: `https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(sourceQuery)}`,
        imageUrl: "",
      },
      {
        platform: "mercari",
        title: `${sourceQuery} をメルカリで探す`,
        price: Math.round(estimatedSourceJPY * 0.95),
        url: `https://jp.mercari.com/search?keyword=${encodeURIComponent(sourceQuery)}`,
        imageUrl: "",
      },
    ],
    bestProfit: calcProfit(ebayPrice, estimatedSourceJPY),
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleResearch(request: Request): Promise<Response> {
  const keyword = new URL(request.url).searchParams.get("keyword") ?? "";
  if (!keyword) return json({ error: "keyword required" }, 400);

  try {
    const allItems = await fetchItemsByKeyword(keyword);
    // priceがないアイテムを除外
    const items = allItems.filter((i) => i.price?.value != null);

    const results: ResearchResult[] = [];
    const seen = new Set<string>();

    // 高額: $500以上
    const highValue = items.filter((i) => parseFloat(i.price.value) >= 500).slice(0, 3);
    highValue.forEach((item) => {
      seen.add(item.itemId);
      results.push(toResult(item, "high-value", 1, 365));
    });

    // 高回転: 残りから上位（多く出品されている = 回転が速い傾向）
    const remaining = items.filter((i) => !seen.has(i.itemId));
    remaining.slice(0, 3).forEach((item) => {
      seen.add(item.itemId);
      results.push(toResult(item, "high-rotation", items.length >= 5 ? 6 : 2, 30));
    });

    // 定番: さらに残り
    const rest = items.filter((i) => !seen.has(i.itemId));
    rest.slice(0, 3).forEach((item) => {
      seen.add(item.itemId);
      results.push(toResult(item, "standard", 2, 90));
    });

    return json({ results, total: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Research API error:", message);
    return json({ error: message }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/research") {
      // src/lib/ebay.ts は process.env.EBAY_APP_ID / EBAY_CERT_ID を参照するため、
      // Workerのsecretsをprocess.envへブリッジする。
      const g = globalThis as unknown as { process?: { env: Record<string, string> } };
      if (!g.process) g.process = { env: {} };
      if (!g.process.env) g.process.env = {};
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") g.process.env[key] = value;
      }

      return handleResearch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
