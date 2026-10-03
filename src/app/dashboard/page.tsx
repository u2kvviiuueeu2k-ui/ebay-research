"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import SettingsPanel from "@/components/SettingsPanel";
import ImportPanel from "@/components/ImportPanel";
import type { SoldImport } from "@/lib/import";
import { EMPTY_INPUT, ItemInput, ProductPattern, ResearchResult } from "@/types";
import { PATTERN_LABELS } from "@/lib/mock-data";
import { DEFAULT_SETTINGS, ProfitSettings, evaluate, num } from "@/lib/profit";

const SETTINGS_KEY = "ebay-research:settings";
const INPUTS_KEY = "ebay-research:inputs";

function load<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 保存できなくても動作は続ける
  }
}

function csvCell(v: string | number): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

export default function DashboardPage() {
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePattern, setActivePattern] = useState<ProductPattern | "all">("all");
  const [settings, setSettings] = useState<ProfitSettings>(DEFAULT_SETTINGS);
  const [inputs, setInputs] = useState<Record<string, ItemInput>>({});

  // 静的エクスポートのため、localStorage はハイドレーション後に読む（初期値で描画→復元）
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSettings(load(SETTINGS_KEY, DEFAULT_SETTINGS));
    setInputs(load<Record<string, ItemInput>>(INPUTS_KEY, {}));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function updateSettings(next: ProfitSettings) {
    setSettings(next);
    save(SETTINGS_KEY, next);
  }

  function updateInput(id: string, next: ItemInput) {
    const all = { ...inputs, [id]: next };
    setInputs(all);
    save(INPUTS_KEY, all);
  }

  function handleImport(data: SoldImport) {
    // 入力済みの値は残し、未入力の商品だけ取り込んだ販売数で初期化する
    const merged = { ...data.inputs, ...inputs };
    setInputs(merged);
    save(INPUTS_KEY, merged);
    setResults(data.results);
    setError(null);
    setSearched(true);
    setActivePattern("all");
  }

  async function handleSearch(keyword: string) {
    setLoading(true);
    setSearched(false);
    setError(null);
    try {
      const res = await fetch(`/api/research?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "検索に失敗しました");
      setResults(data.results as ResearchResult[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
      setActivePattern("all");
    }
  }

  const displayed = activePattern === "all"
    ? results
    : results.filter((r) => r.product.pattern === activePattern);

  const counts = {
    all: results.length,
    standard: results.filter((r) => r.product.pattern === "standard").length,
    "high-value": results.filter((r) => r.product.pattern === "high-value").length,
  };

  function exportCsv() {
    const header = ["タイトル", "eBay URL", "売値USD", "仕入れ円", "送料円", "90日販売数", "セラー数", "利益USD", "利益率%", "判定", "理由"];
    const rows = displayed.map((r) => {
      const input = inputs[r.product.id] ?? EMPTY_INPUT;
      const ev = evaluate(r, input, settings);
      return [
        r.product.title,
        r.product.ebayUrl,
        r.product.ebayPrice,
        num(input.sourceJPY) ?? "",
        ev.shippingJPY ?? "",
        num(input.sold90d) ?? "",
        num(input.sellers) ?? "",
        ev.calc ? ev.calc.profitUSD.toFixed(2) : "",
        ev.calc ? ev.calc.profitRate.toFixed(1) : "",
        ev.judgement.verdict,
        ev.judgement.reason,
      ].map(csvCell).join(",");
    });
    const body = [header.map(csvCell).join(","), ...rows].join("\r\n");
    const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ebay-research.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">eBay リサーチツール</h1>
          <p className="text-xs text-gray-500 mt-0.5">日本発送の出品を探し、仕入れ価格と販売実績を入れて利益・判定を出す</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        <SearchBar onSearch={handleSearch} loading={loading} />
        <ImportPanel onImport={handleImport} />
        <SettingsPanel settings={settings} onChange={updateSettings} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {searched && results.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap items-center">
              {(["all", "standard", "high-value"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePattern(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activePattern === p
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {p === "all" ? "すべて" : PATTERN_LABELS[p].label}
                  <span className="ml-1.5 text-xs opacity-70">({counts[p]})</span>
                </button>
              ))}
              <button onClick={exportCsv} className="ml-auto text-sm text-gray-600 underline">
                CSVで書き出す
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {displayed.map((result) => {
                const input = inputs[result.product.id] ?? EMPTY_INPUT;
                return (
                  <ProductCard
                    key={result.product.id}
                    result={result}
                    input={input}
                    evaluation={evaluate(result, input, settings)}
                    onChange={(next) => updateInput(result.product.id, next)}
                  />
                );
              })}
            </div>
          </>
        )}

        {searched && results.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">該当する商品が見つかりませんでした</p>
            <p className="text-sm mt-1">別のキーワードや条件を試してください</p>
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">キーワードを入力してリサーチ開始</p>
            <p className="text-sm mt-1">eBayの出品とヤフオク・メルカリの検索リンクを並べて表示します</p>
          </div>
        )}
      </main>
    </div>
  );
}
