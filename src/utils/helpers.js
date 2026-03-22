export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '$0.00'
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `-${formatted}` : formatted
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0.00%'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0'
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCompact(value) {
  if (value == null || isNaN(value)) return '$0'
  const abs = Math.abs(value)
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return formatCurrency(value)
}

export function getPnLClass(value) {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const API_KEY_STORAGE = 'finnhub_api_key'

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || ''
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key)
}

export async function fetchQuote(symbol, apiKey) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`
  )
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  if (data.c === 0 && data.h === 0) throw new Error(`No data for ${symbol}`)
  return {
    current: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
  }
}

export async function fetchQuotes(symbols, apiKey) {
  const results = {}
  const promises = symbols.map(async (sym) => {
    try {
      results[sym] = await fetchQuote(sym, apiKey)
    } catch {
      results[sym] = null
    }
  })
  await Promise.all(promises)
  return results
}

const POSITIONS_STORAGE = 'portfolio_positions'

export function loadPositions() {
  const saved = localStorage.getItem(POSITIONS_STORAGE)
  return saved ? JSON.parse(saved) : null
}

export function savePositions(positions) {
  localStorage.setItem(POSITIONS_STORAGE, JSON.stringify(positions))
}
