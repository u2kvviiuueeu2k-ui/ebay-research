export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatJPY(amount: number): string {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(amount);
}

export function jpyToUsd(jpy: number, rate = 150): number {
  return jpy / rate;
}

// タイトルから「ブランド + 型番」を抽出する
// 例: "BenQ TH671ST 3000lm DLP Projector" → "BenQ TH671ST"
// 例: "Sony WH-1000XM5 Wireless Headphones" → "Sony WH-1000XM5"
export function extractModelQuery(title: string): string {
  const words = title.split(/\s+/);

  // 型番パターン: 英字と数字が混在、またはハイフン区切り (例: TH671ST, WH-1000XM5, RTX4080)
  const modelPattern = /^[A-Za-z]{1,5}[-]?[0-9]{2,}[A-Za-z0-9-]*$|^[A-Za-z]{2,}[0-9]+[A-Za-z0-9-]*$/;

  const brand = words[0] ?? "";
  let modelWord = "";

  for (let i = 1; i < Math.min(5, words.length); i++) {
    if (modelPattern.test(words[i])) {
      modelWord = words[i];
      break;
    }
  }

  if (modelWord) return `${brand} ${modelWord}`.trim();

  // 型番が見つからなければ先頭3単語
  return words.slice(0, 3).join(" ");
}
