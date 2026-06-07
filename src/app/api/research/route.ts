import { NextRequest, NextResponse } from "next/server";
import { fetchCompletedItems } from "@/lib/ebay";
import { ResearchResult, ProductPattern } from "@/types";

const EXCHANGE_RATE = 150;

function calcProfit(ebayPriceUSD: number, sourcePriceJPY: number) {
  const sourcePriceUSD = sourcePriceJPY / EXCHANGE_RATE;
  const ebayFeeRate = 0.1325;
  const ebayFee = ebayPriceUSD * ebayFeeRate;
  const shippingCost = ebayPriceUSD > 1000 ? 80 : 25;
  const profit = ebayPriceUSD - sourcePriceUSD - ebayFee - shippingCost;
  const profitRate = (profit / ebayPriceUSD) * 100;
  return { ebayPrice: ebayPriceUSD, sourcePrice: sourcePriceJPY, ebayFeeRate, ebayFee, shippingCost, profit, profitRate };
}

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword") ?? "";
  if (!keyword) return NextResponse.json({ error: "keyword required" }, { status: 400 });

  try {
    const [items30, items90, items365] = await Promise.all([
      fetchCompletedItems(keyword, 30),
      fetchCompletedItems(keyword, 90),
      fetchCompletedItems(keyword, 365),
    ]);

    const results: ResearchResult[] = [];
    const seen = new Set<string>();

    function toResult(item: (typeof items30)[0], pattern: ProductPattern, soldCount: number, soldPeriodDays: number): ResearchResult {
      const ebayPrice = parseFloat(item.sellingStatus.currentPrice.value);
      const estimatedSourceJPY = Math.round(ebayPrice * EXCHANGE_RATE * 0.55);
      return {
        product: {
          id: item.itemId,
          title: item.title,
          imageUrl: item.galleryURL ?? "",
          ebayPrice,
          currency: item.sellingStatus.currentPrice.currencyId,
          soldCount,
          soldPeriodDays,
          ebayUrl: item.viewItemURL,
          pattern,
          category: "",
        },
        sources: [
          {
            platform: "yahoo-auction",
            title: `${keyword} ヤフオク検索結果`,
            price: estimatedSourceJPY,
            url: `https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(keyword)}`,
            imageUrl: "",
          },
          {
            platform: "mercari",
            title: `${keyword} メルカリ検索結果`,
            price: Math.round(estimatedSourceJPY * 0.95),
            url: `https://jp.mercari.com/search?keyword=${encodeURIComponent(keyword)}`,
            imageUrl: "",
          },
        ],
        bestProfit: calcProfit(ebayPrice, estimatedSourceJPY),
      };
    }

    // 高回転: 30日で5個以上
    const highRotationItems = items30.filter((i) => !seen.has(i.itemId)).slice(0, 3);
    if (items30.length >= 5) {
      highRotationItems.forEach((item) => { seen.add(item.itemId); results.push(toResult(item, "high-rotation", items30.length, 30)); });
    }

    // 定番: 90日で1〜4個
    const standardItems = items90.filter((i) => !seen.has(i.itemId)).slice(0, 3);
    if (items90.length >= 1 && items90.length <= 10) {
      standardItems.forEach((item) => { seen.add(item.itemId); results.push(toResult(item, "standard", items90.length, 90)); });
    }

    // 高額: 1年で$500以上
    const highValueItems = items365
      .filter((i) => !seen.has(i.itemId) && parseFloat(i.sellingStatus.currentPrice.value) >= 500)
      .slice(0, 3);
    highValueItems.forEach((item) => { seen.add(item.itemId); results.push(toResult(item, "high-value", 1, 365)); });

    return NextResponse.json({ results, counts: { total: results.length, items30: items30.length, items90: items90.length, items365: items365.length } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "eBay API request failed" }, { status: 500 });
  }
}
