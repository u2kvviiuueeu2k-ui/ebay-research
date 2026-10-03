"use client";

import { useState } from "react";
import { parseSoldJson, SoldImport } from "@/lib/import";

export default function ImportPanel({ onImport }: { onImport: (data: SoldImport) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run() {
    try {
      const data = parseSoldJson(text);
      if (data.results.length === 0) throw new Error("取り込める行がありません");
      onImport(data);
      setError(null);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSONを読めませんでした");
    }
  }

  return (
    <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <summary className="text-sm font-semibold text-gray-700 cursor-pointer">販売実績JSONを取り込む</summary>
      <p className="text-xs text-gray-500 mt-3">
        Terapeakの結果ページで scouts/extract_terapeak.js を実行して出たJSONを貼ります。
        平均販売価格が売値、販売数が90日販売数の欄に入ります。
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="mt-3 w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono text-gray-900"
        placeholder='{"items":[{"title":"...","avgPrice":55,"sold":185,"url":"https://www.ebay.com/itm/..."}]}'
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={run}
          disabled={!text.trim()}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          取り込む
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </details>
  );
}
