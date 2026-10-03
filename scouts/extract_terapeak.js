// Terapeak「製品の調査」(https://www.ebay.com/sh/research) の結果ページで実行して、表を JSON にする。
// ログイン済みの Chrome のページ上でそのまま評価する（Claude in Chrome の javascript_tool か、DevToolsのConsole）。
// 金額は画面上「￥」と表示されるが、数値はドル建て（販売数×平均価格≒商品売上で確認済み）。
(() => {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const num = (s) => {
    const m = clean(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  };
  const cell = (r, k) => r.querySelector(`td.research-table-row__${k}`);
  const items = [...document.querySelectorAll("tr")]
    .filter((r) => cell(r, "product-info"))
    .map((r) => {
      const a = cell(r, "product-info").querySelector("a");
      const ship = clean(cell(r, "avgShippingCost")?.innerText);
      return {
        title: clean(a?.innerText || cell(r, "product-info").querySelector("p")?.innerText),
        url: a?.href ?? "",
        avgPrice: num(cell(r, "avgSoldPrice")?.innerText),
        avgShipping: num(ship),
        freeShipPct: num((ship.match(/送料無料\s*([\d.]+)%/) || [])[1]),
        sold: num(cell(r, "totalSoldCount")?.innerText),
        sales: num(cell(r, "totalSalesValue")?.innerText),
        lastSold: clean(cell(r, "dateLastSold")?.innerText),
      };
    });
  const q = new URL(location.href).searchParams;
  return JSON.stringify({
    keyword: q.get("keywords"),
    dayRange: q.get("dayRange"),
    fetchedAt: new Date().toISOString(),
    items,
  });
})();
