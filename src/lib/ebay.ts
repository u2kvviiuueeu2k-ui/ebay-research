const OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";

let cachedToken: { token: string; expiry: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiry) return cachedToken.token;

  const appId = process.env.EBAY_APP_ID!;
  const certId = process.env.EBAY_CERT_ID!;
  const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth error: ${res.status} - ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export interface EbayCompletedItem {
  itemId: string;
  title: string;
  image?: { imageUrl: string };
  itemWebUrl: string;
  price: { value: string; currency: string };
  itemLocation?: { country: string };
  buyingOptions?: string[];
}

export async function fetchItemsByKeyword(keyword: string): Promise<EbayCompletedItem[]> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: keyword,
    filter: "itemLocationCountry:JP,buyingOptions:{FIXED_PRICE|AUCTION}",
    limit: "100",
    sort: "endingSoonest",
  });

  const res = await fetch(`${BROWSE_URL}?${params.toString()}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Browse API error: ${res.status} - ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.itemSummaries ?? [];
}
