import type { ItemInput, ResearchResult } from "@/types";

export interface ProfitSettings {
  fxRate: number; // 円/ドル
  feeRate: number; // eBay手数料率 %（カテゴリ別。自分のカテゴリの値を入れる）
  fixedFeeUSD: number; // 1注文あたりの固定手数料
  refundRate: number; // 消費税還付率 %（仕入れ税込に対して。10/110 ≒ 9.09）
  shippingJPYPerKg: number; // 送料の目安（円/kg）。実際のFedEx料金表の値に置き換える
  dutyRate: number; // DDPで負担する関税率 %（DDUなら0）
  minRate: number; // 合格とみなす最低利益率 %
  stockSoldMin: number; // 有在庫にしてよい90日販売数
}

export const DEFAULT_SETTINGS: ProfitSettings = {
  fxRate: 150,
  feeRate: 13.25,
  fixedFeeUSD: 0.3,
  refundRate: 9.09,
  shippingJPYPerKg: 1270,
  dutyRate: 0,
  minRate: 30,
  stockSoldMin: 4,
};

export interface ProfitCalculation {
  revenueUSD: number;
  sourceUSD: number;
  feeUSD: number;
  shippingUSD: number;
  dutyUSD: number;
  refundUSD: number;
  profitUSD: number;
  profitRate: number; // %
}

export function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// 容積重量 = 縦×横×高 ÷ 5000（cm→kg）
export function volumetricKg(l: number, w: number, h: number): number {
  return (l * w * h) / 5000;
}

// 運賃の適用重量 = 実重量と容積重量の重い方
export function chargeableKg(input: ItemInput): number | null {
  const actual = num(input.weightKg);
  const l = num(input.lengthCm);
  const w = num(input.widthCm);
  const h = num(input.heightCm);
  const vol = l !== null && w !== null && h !== null ? volumetricKg(l, w, h) : null;
  if (actual === null && vol === null) return null;
  return Math.max(actual ?? 0, vol ?? 0);
}

export function shippingJPY(input: ItemInput, s: ProfitSettings): number | null {
  const manual = num(input.shippingJPY);
  if (manual !== null) return manual;
  const kg = chargeableKg(input);
  return kg === null ? null : Math.round(kg * s.shippingJPYPerKg);
}

export function calcProfit(
  s: ProfitSettings,
  priceUSD: number,
  sourceJPY: number,
  shipJPY: number
): ProfitCalculation {
  const sourceUSD = sourceJPY / s.fxRate;
  const feeUSD = (priceUSD * s.feeRate) / 100 + s.fixedFeeUSD;
  const shippingUSD = shipJPY / s.fxRate;
  const dutyUSD = (priceUSD * s.dutyRate) / 100;
  const refundUSD = (sourceUSD * s.refundRate) / 100;
  const profitUSD = priceUSD - sourceUSD - feeUSD - shippingUSD - dutyUSD + refundUSD;
  return {
    revenueUSD: priceUSD,
    sourceUSD,
    feeUSD,
    shippingUSD,
    dutyUSD,
    refundUSD,
    profitUSD,
    profitRate: (profitUSD / priceUSD) * 100,
  };
}

export type Verdict = "stock" | "dropship" | "skip" | "pending";

export interface Judgement {
  verdict: Verdict;
  reason: string;
}

// 判定ルール（takuro_ebay の動画で語られた基準を設定値にしたもの）
// - 利益率が最低ライン未満 → 見送り
// - 90日販売数が stockSoldMin 以上 → 有在庫OK / 1〜(min-1) → 無在庫でテスト / 0 → 見送り
// 閾値は動画の事例からの読み取り。商材に合わせて設定で調整する。
export function judge(s: ProfitSettings, calc: ProfitCalculation | null, sold90d: number | null): Judgement {
  if (!calc) return { verdict: "pending", reason: "仕入れ価格と送料（重量）を入力してください" };
  if (sold90d === null) return { verdict: "pending", reason: "90日販売数を入力してください" };
  if (calc.profitUSD <= 0) return { verdict: "skip", reason: "赤字です" };
  if (calc.profitRate < s.minRate) return { verdict: "skip", reason: `利益率が最低ライン${s.minRate}%未満です` };
  if (sold90d === 0) return { verdict: "skip", reason: "90日で売れていません" };
  if (sold90d >= s.stockSoldMin) return { verdict: "stock", reason: `90日${sold90d}個売れており、利益率も基準以上です` };
  return { verdict: "dropship", reason: `90日${sold90d}個とロングテールです。無在庫でテスト出品` };
}

export interface Evaluation {
  shippingJPY: number | null;
  calc: ProfitCalculation | null;
  judgement: Judgement;
}

export function evaluate(result: ResearchResult, input: ItemInput, s: ProfitSettings): Evaluation {
  const src = num(input.sourceJPY);
  const ship = shippingJPY(input, s);
  const calc = src !== null && ship !== null ? calcProfit(s, result.product.ebayPrice, src, ship) : null;
  return { shippingJPY: ship, calc, judgement: judge(s, calc, num(input.sold90d)) };
}
