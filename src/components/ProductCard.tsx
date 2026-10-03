"use client";

import { ItemInput, ResearchResult } from "@/types";
import { PLATFORM_LABELS } from "@/lib/mock-data";
import { formatUSD, formatJPY } from "@/lib/utils";
import { Evaluation, Verdict, chargeableKg } from "@/lib/profit";
import PatternBadge from "./PatternBadge";

const VERDICT_STYLE: Record<Verdict, { label: string; cls: string }> = {
  stock: { label: "有在庫OK", cls: "bg-green-600 text-white" },
  dropship: { label: "無在庫でテスト", cls: "bg-blue-600 text-white" },
  skip: { label: "見送り", cls: "bg-gray-500 text-white" },
  pending: { label: "入力待ち", cls: "bg-amber-100 text-amber-800" },
};

const INPUTS: { key: keyof ItemInput; label: string; unit: string }[] = [
  { key: "sourceJPY", label: "仕入れ価格", unit: "円" },
  { key: "sold90d", label: "90日販売数", unit: "個" },
  { key: "sellers", label: "日本人セラー数", unit: "人" },
  { key: "weightKg", label: "重量", unit: "kg" },
  { key: "lengthCm", label: "縦", unit: "cm" },
  { key: "widthCm", label: "横", unit: "cm" },
  { key: "heightCm", label: "高さ", unit: "cm" },
  { key: "shippingJPY", label: "送料（直接入力）", unit: "円" },
];

export default function ProductCard({
  result,
  input,
  evaluation,
  onChange,
}: {
  result: ResearchResult;
  input: ItemInput;
  evaluation: Evaluation;
  onChange: (next: ItemInput) => void;
}) {
  const { product, sources } = result;
  const { calc, judgement, shippingJPY } = evaluation;
  const vs = VERDICT_STYLE[judgement.verdict];
  const kg = chargeableKg(input);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
      {/* eBay商品 */}
      <div className="flex gap-4 items-start">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.title} className="w-20 h-20 object-cover rounded-lg bg-gray-100" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-100" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <a href={product.ebayUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-800 hover:text-blue-600 line-clamp-2">
              {product.title}
            </a>
            <PatternBadge pattern={product.pattern} />
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900">{formatUSD(product.ebayPrice)}</div>
          <p className="text-[11px] text-gray-400">現在の出品価格（売れた価格ではありません）</p>
        </div>
      </div>

      {/* 仕入れ先リンク */}
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
            </div>
          );
        })}
      </div>

      {/* 入力 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {INPUTS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-[11px] text-gray-500">
            {f.label}（{f.unit}）
            <input
              type="number"
              min="0"
              step="any"
              value={input[f.key]}
              onChange={(e) => onChange({ ...input, [f.key]: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
        ))}
      </div>
      {kg !== null && (
        <p className="text-[11px] text-gray-400">
          適用重量 {kg.toFixed(2)}kg（実重量と容積重量の重い方）
          {shippingJPY !== null && ` → 送料 ${formatJPY(shippingJPY)}`}
        </p>
      )}

      {/* 利益と判定 */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
        <div className="text-xs text-gray-600 flex flex-col gap-0.5">
          {calc ? (
            <>
              <span>
                売値 {formatUSD(calc.revenueUSD)} − 仕入 {formatUSD(calc.sourceUSD)} − 手数料 {formatUSD(calc.feeUSD)}
                − 送料 {formatUSD(calc.shippingUSD)}
                {calc.dutyUSD > 0 && ` − 関税 ${formatUSD(calc.dutyUSD)}`} + 還付 {formatUSD(calc.refundUSD)}
              </span>
              <span className="font-semibold text-sm text-gray-900">
                利益 {formatUSD(calc.profitUSD)}（利益率 {calc.profitRate.toFixed(1)}%）
              </span>
            </>
          ) : (
            <span>仕入れ価格と送料（重量）を入れると利益を計算します</span>
          )}
          <span className="text-gray-500">{judgement.reason}</span>
        </div>
        <span className={`text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap ${vs.cls}`}>{vs.label}</span>
      </div>
    </div>
  );
}
