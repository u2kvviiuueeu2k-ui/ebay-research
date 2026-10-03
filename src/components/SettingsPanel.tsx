"use client";

import { ProfitSettings, DEFAULT_SETTINGS } from "@/lib/profit";

const FIELDS: { key: keyof ProfitSettings; label: string; hint: string }[] = [
  { key: "fxRate", label: "為替（円/$）", hint: "実勢レートを入力" },
  { key: "feeRate", label: "eBay手数料（%）", hint: "自分のカテゴリの率" },
  { key: "fixedFeeUSD", label: "固定手数料（$）", hint: "1注文あたり" },
  { key: "refundRate", label: "消費税還付（%）", hint: "仕入れ税込に対して。10/110≒9.09" },
  { key: "shippingJPYPerKg", label: "送料目安（円/kg）", hint: "FedEx料金表で置き換える" },
  { key: "dutyRate", label: "関税（%）", hint: "DDP時のみ。DDUは0" },
  { key: "minRate", label: "最低利益率（%）", hint: "未満は見送り" },
  { key: "stockSoldMin", label: "有在庫の90日販売数", hint: "以上で有在庫OK" },
];

export default function SettingsPanel({
  settings,
  onChange,
}: {
  settings: ProfitSettings;
  onChange: (s: ProfitSettings) => void;
}) {
  return (
    <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <summary className="text-sm font-semibold text-gray-700 cursor-pointer">計算の設定</summary>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-xs text-gray-500">
            {f.label}
            <input
              type="number"
              step="any"
              min="0"
              value={settings[f.key]}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onChange({ ...settings, [f.key]: Number.isFinite(v) ? v : 0 });
              }}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900"
            />
            <span className="text-[10px] text-gray-400">{f.hint}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange(DEFAULT_SETTINGS)}
        className="mt-3 text-xs text-gray-500 underline"
      >
        初期値に戻す
      </button>
    </details>
  );
}
