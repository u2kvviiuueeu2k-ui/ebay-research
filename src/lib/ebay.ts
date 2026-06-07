const EBAY_API_URL = "https://svcs.ebay.com/services/search/FindingService/v1";

export interface EbaySearchParams {
  keyword: string;
  minSoldCount?: number;
  daysBack?: number;
}

export interface EbayCompletedItem {
  itemId: string;
  title: string;
  galleryURL?: string;
  viewItemURL: string;
  sellingStatus: {
    currentPrice: { value: string; currencyId: string };
    sellingState: string;
  };
  listingInfo: {
    endTime: string;
    listingType: string;
    buyItNowAvailable?: string;
  };
  condition?: { conditionDisplayName: string };
}

export async function fetchCompletedItems(keyword: string, daysBack: number): Promise<EbayCompletedItem[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const params = new URLSearchParams({
    "OPERATION-NAME": "findCompletedItems",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": process.env.EBAY_APP_ID!,
    "RESPONSE-DATA-FORMAT": "JSON",
    "keywords": keyword,
    "itemFilter(0).name": "Seller",
    "itemFilter(0).value(0)": "JP",
    "itemFilter(1).name": "ListingType",
    "itemFilter(1).value(0)": "FixedPrice",
    "itemFilter(2).name": "SoldItemsOnly",
    "itemFilter(2).value": "true",
    "itemFilter(3).name": "EndTimeFrom",
    "itemFilter(3).value": startDate.toISOString(),
    "itemFilter(4).name": "EndTimeTo",
    "itemFilter(4).value": endDate.toISOString(),
    "itemFilter(5).name": "LocatedIn",
    "itemFilter(5).value": "JP",
    "paginationInput.entriesPerPage": "100",
    "sortOrder": "EndTimeSoonest",
  });

  const res = await fetch(`${EBAY_API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`eBay API error: ${res.status}`);

  const data = await res.json();
  const searchResult = data?.findCompletedItemsResponse?.[0];
  const ack = searchResult?.ack?.[0];

  if (ack !== "Success" && ack !== "Warning") return [];

  return searchResult?.searchResult?.[0]?.item ?? [];
}

export function classifyItems(items: EbayCompletedItem[]) {
  const now = new Date();

  const sold30 = items.filter((item) => {
    const end = new Date(item.listingInfo.endTime);
    return (now.getTime() - end.getTime()) <= 30 * 24 * 60 * 60 * 1000;
  });

  const sold90 = items.filter((item) => {
    const end = new Date(item.listingInfo.endTime);
    const diff = now.getTime() - end.getTime();
    return diff <= 90 * 24 * 60 * 60 * 1000;
  });

  const highRotation = sold30.length >= 5 ? items.slice(0, 1) : [];
  const standard = sold90.length >= 1 && sold90.length <= 3 ? items.slice(0, 1) : [];
  const highValue = items
    .filter((item) => parseFloat(item.sellingStatus.currentPrice.value) >= 500)
    .slice(0, 1);

  return { highRotation, standard, highValue, sold30Count: sold30.length, sold90Count: sold90.length };
}
