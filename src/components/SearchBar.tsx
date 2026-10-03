"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [keyword, setKeyword] = useState("");
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (keyword.trim()) onSearch(keyword.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="キーワードを入力（例: Nintendo Switch, Sony headphones）"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !keyword.trim()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "検索中..." : "リサーチ"}
        </button>
      </div>
    </form>
  );
}
