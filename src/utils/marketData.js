const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

/**
 * Fetch historical daily closing prices from Yahoo Finance.
 * Returns an array of closing prices (oldest first) for the given period.
 */
export async function fetchHistoricalPrices(symbol, range = '6mo') {
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=${range}&interval=1d`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`)
  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`No Yahoo data for ${symbol}`)
  const closes = result.indicators?.quote?.[0]?.close || []
  // Filter out null values
  return closes.filter((c) => c != null)
}

/**
 * Fetch historical prices for multiple symbols.
 * Returns { [symbol]: number[] }
 */
export async function fetchAllHistorical(symbols, range = '6mo') {
  const results = {}
  const promises = symbols.map(async (sym) => {
    try {
      results[sym] = await fetchHistoricalPrices(sym, range)
    } catch {
      results[sym] = null
    }
  })
  await Promise.all(promises)
  return results
}

/**
 * Fetch analyst price target from Finnhub.
 * Returns { targetHigh, targetLow, targetMean, targetMedian }
 */
export async function fetchPriceTarget(symbol, apiKey) {
  const res = await fetch(
    `https://finnhub.io/api/v1/stock/price-target?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`
  )
  if (!res.ok) throw new Error(`Finnhub price target error: ${res.status}`)
  const data = await res.json()
  if (!data.targetMean) return null
  return {
    targetHigh: data.targetHigh,
    targetLow: data.targetLow,
    targetMean: data.targetMean,
    targetMedian: data.targetMedian,
  }
}

/**
 * Fetch analyst recommendation trends from Finnhub.
 * Returns the latest { buy, hold, sell, strongBuy, strongSell, period }
 */
export async function fetchAnalystRec(symbol, apiKey) {
  const res = await fetch(
    `https://finnhub.io/api/v1/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`
  )
  if (!res.ok) throw new Error(`Finnhub recommendation error: ${res.status}`)
  const data = await res.json()
  if (!data.length) return null
  return data[0] // most recent period
}

/**
 * Fetch price targets and analyst recommendations for multiple symbols.
 */
export async function fetchAllAnalystData(symbols, apiKey) {
  const results = {}
  const promises = symbols.map(async (sym) => {
    try {
      const [target, rec] = await Promise.all([
        fetchPriceTarget(sym, apiKey),
        fetchAnalystRec(sym, apiKey),
      ])
      results[sym] = { target, rec }
    } catch {
      results[sym] = null
    }
  })
  await Promise.all(promises)
  return results
}
