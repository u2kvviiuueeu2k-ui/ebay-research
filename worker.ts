// Cloudflare Workers エントリポイント。
// 元 src/app/api/research/route.ts のロジックをそのまま移植し、
// それ以外のリクエストは静的エクスポート済みアセット（./out）へフォールバックする。
import { fetchItemsByKeyword, type EbayCompletedItem } from "./src/lib/ebay";
import { extractModelQuery } from "./src/lib/utils";
import type { ResearchResult, ProductPattern } from "./src/types";

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  EBAY_APP_ID?: string;
  EBAY_CERT_ID?: string;
}

function toResult(item: EbayCompletedItem): ResearchResult {
  const ebayPrice = parseFloat(item.price.value);
  const sourceQuery = extractModelQuery(item.title);
  const pattern: ProductPattern = ebayPrice >= 500 ? "high-value" : "standard";

  return {
    product: {
      id: item.itemId,
      title: item.title,
      imageUrl: item.image?.imageUrl ?? "",
      ebayPrice,
      currency: item.price.currency,
      ebayUrl: item.itemWebUrl,
      pattern,
      category: "",
    },
    // 仕入れ価格・販売実績はAPIでは取れないため、検索リンクだけ返す（数値はフロントで入力）
    sources: [
      {
        platform: "yahoo-auction",
        title: `${sourceQuery} をヤフオクで探す`,
        url: `https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(sourceQuery)}`,
      },
      {
        platform: "mercari",
        title: `${sourceQuery} をメルカリで探す`,
        url: `https://jp.mercari.com/search?keyword=${encodeURIComponent(sourceQuery)}`,
      },
    ],
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

    const results = items.slice(0, 30).map(toResult);

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
