const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STOCKS_URL =
  "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=marketdata&marketdata.columns=SECID,LAST,CHANGE,LASTTOPREVPRICE";

const CURRENCY_URL =
  "https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities.json?iss.meta=off&iss.only=marketdata&marketdata.columns=SECID,LAST,CHANGE,LASTTOPREVPRICE";

const GOLD_URL =
  "https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/GLDRUB_TOM.json?iss.meta=off&iss.only=marketdata&marketdata.columns=SECID,LAST,CHANGE,LASTTOPREVPRICE";

const SILVER_URL =
  "https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/SLVRUB_TOM.json?iss.meta=off&iss.only=marketdata&marketdata.columns=SECID,LAST,CHANGE,LASTTOPREVPRICE";

// Currency pair SECID mapping
const CURRENCY_MAP: Record<string, string> = {
  "USD000UTSTOM": "USD",
  "EUR_RUB__TOM": "EUR",
  "CNYRUB_TOM": "CNY",
  "GLDRUB_TOM": "XAU",
  "SLVRUB_TOM": "XAG",
};

function parseMarketdata(json: any): Record<string, { price: number; change: number; changePercent: number }> {
  const columns: string[] = json.marketdata.columns;
  const data: (string | number | null)[][] = json.marketdata.data;

  const secidIdx = columns.indexOf("SECID");
  const lastIdx = columns.indexOf("LAST");
  const changeIdx = columns.indexOf("CHANGE");
  const changePctIdx = columns.indexOf("LASTTOPREVPRICE");

  const result: Record<string, { price: number; change: number; changePercent: number }> = {};

  for (const row of data) {
    const secid = row[secidIdx] as string;
    const last = row[lastIdx] as number | null;
    const change = row[changeIdx] as number | null;
    const changePct = row[changePctIdx] as number | null;

    if (secid && last != null && last > 0) {
      result[secid] = {
        price: last,
        change: change ?? 0,
        changePercent: changePct ?? 0,
      };
    }
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Fetch stocks, currencies, and metals in parallel
    const [stocksRes, currencyRes, goldRes, silverRes] = await Promise.all([
      fetch(STOCKS_URL),
      fetch(CURRENCY_URL),
      fetch(GOLD_URL),
      fetch(SILVER_URL),
    ]);

    if (!stocksRes.ok) throw new Error(`MOEX stocks error: ${stocksRes.status}`);

    const stocksJson = await stocksRes.json();
    const prices = parseMarketdata(stocksJson);

    // Parse currencies
    const currencies: Record<string, { price: number; change: number; changePercent: number }> = {};

    if (currencyRes.ok) {
      const currJson = await currencyRes.json();
      const currData = parseMarketdata(currJson);
      for (const [secid, mapped] of Object.entries(CURRENCY_MAP)) {
        if (currData[secid]) {
          currencies[mapped] = currData[secid];
        }
      }
    }

    // Parse metals
    if (goldRes.ok) {
      const goldJson = await goldRes.json();
      const goldData = parseMarketdata(goldJson);
      if (goldData["GLDRUB_TOM"]) {
        currencies["XAU"] = goldData["GLDRUB_TOM"];
      }
    }

    if (silverRes.ok) {
      const silverJson = await silverRes.json();
      const silverData = parseMarketdata(silverJson);
      if (silverData["SLVRUB_TOM"]) {
        currencies["XAG"] = silverData["SLVRUB_TOM"];
      }
    }

    return new Response(JSON.stringify({
      prices,
      currencies,
      updated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("moex-prices error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
