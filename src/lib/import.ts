import type { ItemInput, ResearchResult } from "@/types";
import { EMPTY_INPUT } from "@/types";
import { extractModelQuery } from "./utils";

// 販売実績JSONの1件。取得元（Terapeak抽出スクリプト・CSV変換・将来のAPI）は問わず、この形に揃える。
export interface SoldRecord {
  title: string;
  url?: string;
  avgPrice: number | null;
  sold: number | null;
  avgShipping?: number | null;
}

export interface SoldImport {
  results: ResearchResult[];
  inputs: Record<string, ItemInput>;
}

function idOf(rec: SoldRecord, index: number): string {
  const m = rec.url?.match(/\/itm\/(\d+)/);
  return m ? `sold-${m[1]}` : `sold-${index}-${rec.title.slice(0, 24)}`;
}

export function parseSoldJson(text: string): SoldImport {
  const data = JSON.parse(text);
  const records: SoldRecord[] = Array.isArray(data) ? data : data.items;
  if (!Array.isArray(records)) throw new Error("items 配列が見つかりません");

  const results: ResearchResult[] = [];
  const inputs: Record<string, ItemInput> = {};

  records.forEach((rec, i) => {
    if (!rec?.title || rec.avgPrice == null) return;
    const id = idOf(rec, i);
    const q = extractModelQuery(rec.title);
    results.push({
      product: {
        id,
        title: rec.title,
        imageUrl: "",
        ebayPrice: rec.avgPrice,
        currency: "USD",
        ebayUrl: rec.url ?? "",
        pattern: rec.avgPrice >= 500 ? "high-value" : "standard",
        category: "",
      },
      sources: [
        {
          platform: "yahoo-auction",
          title: `${q} をヤフオクで探す`,
          url: `https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(q)}`,
        },
        {
          platform: "mercari",
          title: `${q} をメルカリで探す`,
          url: `https://jp.mercari.com/search?keyword=${encodeURIComponent(q)}`,
        },
      ],
    });
    inputs[id] = { ...EMPTY_INPUT, sold90d: rec.sold != null ? String(rec.sold) : "" };
  });

  return { results, inputs };
}
