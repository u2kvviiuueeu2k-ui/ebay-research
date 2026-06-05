"use client";

import { useState } from "react";
import { ProductPattern } from "@/types";

interface SearchBarProps {
  onSearch: (keyword: string, patterns: ProductPattern[]) => void;
  loading: boolean;
}

const PATTERNS: { value: ProductPattern; label: string }[] = [
  { value: "high-rotation", label: "高回転（30日5〜7個）" },
  { value: "standard", label: "定番（90日1〜2個）" },
  { value: "high-value", label: "高額（1年1個以上）" },
];

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<ProductPattern[]>(["high-rotation", "standard", "high-value"]);

  function togglePattern(p: ProductPattern) {
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (keyword.trim()) onSearch(keyword.trim(), selected);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="キーワードを入力（例: Nintendo Switch, Sony headphones）"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !keyword.trim()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "検索中..." : "リサーチ"}
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        {PATTERNS.map((p) => (
          <label key={p.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(p.value)}
              onChange={() => togglePattern(p.value)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-600">{p.label}</span>
          </label>
        ))}
      </div>
    </form>
  );
}
