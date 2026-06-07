"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { ProductPattern, ResearchResult } from "@/types";
import { PATTERN_LABELS } from "@/lib/mock-data";

export default function DashboardPage() {
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePattern, setActivePattern] = useState<ProductPattern | "all">("all");

  async function handleSearch(keyword: string, patterns: ProductPattern[]) {
    setLoading(true);
    setSearched(false);
    setError(null);
    try {
      const res = await fetch(`/api/research?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "検索に失敗しました");
      const filtered = (data.results as ResearchResult[]).filter((r) => patterns.includes(r.product.pattern));
      setResults(filtered);
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
    "high-rotation": results.filter((r) => r.product.pattern === "high-rotation").length,
    standard: results.filter((r) => r.product.pattern === "standard").length,
    "high-value": results.filter((r) => r.product.pattern === "high-value").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">eBay リサーチツール</h1>
          <p className="text-xs text-gray-500 mt-0.5">日本発送 × 即決 × 売れ筋商品を自動抽出</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        <SearchBar onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {searched && results.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap">
              {(["all", "high-rotation", "standard", "high-value"] as const).map((p) => (
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
            </div>
            <div className="flex flex-col gap-4">
              {displayed.map((result) => (
                <ProductCard key={result.product.id} result={result} />
              ))}
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
            <p className="text-sm mt-1">eBayの売れ筋商品と日本仕入れ先を同時に検索します</p>
          </div>
        )}
      </main>
    </div>
  );
}
