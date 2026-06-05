"use client";

import { ResearchResult } from "@/types";
import { PLATFORM_LABELS } from "@/lib/mock-data";
import { formatUSD, formatJPY, jpyToUsd } from "@/lib/utils";
import PatternBadge from "./PatternBadge";

export default function ProductCard({ result }: { result: ResearchResult }) {
  const { product, sources, bestProfit } = result;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
      {/* eBay商品 */}
      <div className="flex gap-4 items-start">
        <img src={product.imageUrl} alt={product.title} className="w-20 h-20 object-cover rounded-lg bg-gray-100" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <a href={product.ebayUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-800 hover:text-blue-600 line-clamp-2">
              {product.title}
            </a>
            <PatternBadge pattern={product.pattern} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span className="text-lg font-bold text-gray-900">{formatUSD(product.ebayPrice)}</span>
            <span>{product.soldCount}個 / {product.soldPeriodDays}日</span>
            <span className="text-xs bg-gray-100 rounded px-1">{product.category}</span>
          </div>
        </div>
      </div>

      {/* 仕入れ先 */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">仕入れ候補</p>
        <div className="flex flex-col gap-2">
          {sources.map((source, i) => {
            const pl = PLATFORM_LABELS[source.platform];
            return (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${pl.color}`}>{pl.label}</span>
                <a href={source.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-gray-700 hover:text-blue-600 flex-1 truncate">
                  {source.title}
                </a>
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{formatJPY(source.price)}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">≈ {formatUSD(jpyToUsd(source.price))}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 利益計算 */}
      {bestProfit && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span>売値 {formatUSD(bestProfit.ebayPrice)}</span>
            <span className="mx-1 text-gray-400">−</span>
            <span>仕入 {formatUSD(jpyToUsd(bestProfit.sourcePrice))}</span>
            <span className="mx-1 text-gray-400">−</span>
            <span>eBay手数料 {formatUSD(bestProfit.ebayFee)}</span>
            <span className="mx-1 text-gray-400">−</span>
            <span>送料 {formatUSD(bestProfit.shippingCost)}</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-700">{formatUSD(bestProfit.profit)}</div>
            <div className="text-xs text-green-600">利益率 {bestProfit.profitRate.toFixed(1)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
