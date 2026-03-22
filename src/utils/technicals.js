/**
 * Technical indicator calculations for stock analysis.
 * All functions expect an array of closing prices (oldest first).
 */

export function calcSMA(prices, period) {
  if (prices.length < period) return []
  const result = []
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += prices[j]
    result.push(sum / period)
  }
  return result
}

export function calcEMA(prices, period) {
  if (prices.length < period) return []
  const k = 2 / (period + 1)
  // Seed with SMA of first `period` values
  let ema = 0
  for (let i = 0; i < period; i++) ema += prices[i]
  ema /= period
  const result = [ema]
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k)
    result.push(ema)
  }
  return result
}

export function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return null
  let gainSum = 0
  let lossSum = 0
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff >= 0) gainSum += diff
    else lossSum += Math.abs(diff)
  }
  let avgGain = gainSum / period
  let avgLoss = lossSum / period
  // Smooth through remaining prices
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export function calcMACD(prices) {
  const ema12 = calcEMA(prices, 12)
  const ema26 = calcEMA(prices, 26)
  if (ema26.length === 0) return null
  // Align: ema12 starts at index 11, ema26 at index 25 → offset = 14
  const offset = 26 - 12 // = 14
  const macdLine = []
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i])
  }
  const signalLine = calcEMA(macdLine, 9)
  if (signalLine.length === 0) return null
  const macd = macdLine[macdLine.length - 1]
  const signal = signalLine[signalLine.length - 1]
  const histogram = macd - signal
  return { macd, signal, histogram }
}

export function calcSMACrossover(prices) {
  const sma20 = calcSMA(prices, 20)
  const sma50 = calcSMA(prices, 50)
  if (sma50.length < 2) return null
  // Align: sma20 starts at index 19, sma50 at index 49 → offset = 30
  const offset = 50 - 20 // = 30
  const len50 = sma50.length
  const current20 = sma20[offset + len50 - 1]
  const current50 = sma50[len50 - 1]
  const prev20 = sma20[offset + len50 - 2]
  const prev50 = sma50[len50 - 2]
  const bullishCross = prev20 <= prev50 && current20 > current50
  const bearishCross = prev20 >= prev50 && current20 < current50
  return {
    sma20: current20,
    sma50: current50,
    bullishCross,
    bearishCross,
    aboveSMA50: current20 > current50,
  }
}

/**
 * Generate a composite signal from technical indicators.
 * Returns { action, score, signals } where score is -100 to +100.
 */
export function generateSignal(prices) {
  const signals = []
  let totalScore = 0
  let weightSum = 0

  // RSI (weight 30)
  const rsi = calcRSI(prices)
  if (rsi != null) {
    let rsiScore = 0
    let rsiNote = ''
    if (rsi < 30) { rsiScore = 80; rsiNote = `RSI ${rsi.toFixed(0)} — Oversold` }
    else if (rsi < 40) { rsiScore = 40; rsiNote = `RSI ${rsi.toFixed(0)} — Approaching oversold` }
    else if (rsi > 70) { rsiScore = -80; rsiNote = `RSI ${rsi.toFixed(0)} — Overbought` }
    else if (rsi > 60) { rsiScore = -30; rsiNote = `RSI ${rsi.toFixed(0)} — Approaching overbought` }
    else { rsiScore = 0; rsiNote = `RSI ${rsi.toFixed(0)} — Neutral` }
    signals.push({ name: 'RSI', value: rsi.toFixed(1), score: rsiScore, note: rsiNote })
    totalScore += rsiScore * 30
    weightSum += 30
  }

  // MACD (weight 30)
  const macd = calcMACD(prices)
  if (macd) {
    let macdScore = 0
    let macdNote = ''
    if (macd.histogram > 0 && macd.macd > 0) {
      macdScore = 60; macdNote = 'MACD bullish — above signal line'
    } else if (macd.histogram > 0) {
      macdScore = 30; macdNote = 'MACD crossing up'
    } else if (macd.histogram < 0 && macd.macd < 0) {
      macdScore = -60; macdNote = 'MACD bearish — below signal line'
    } else if (macd.histogram < 0) {
      macdScore = -30; macdNote = 'MACD crossing down'
    } else {
      macdNote = 'MACD neutral'
    }
    signals.push({ name: 'MACD', value: macd.macd.toFixed(2), score: macdScore, note: macdNote })
    totalScore += macdScore * 30
    weightSum += 30
  }

  // SMA Crossover (weight 25)
  const cross = calcSMACrossover(prices)
  if (cross) {
    let crossScore = 0
    let crossNote = ''
    if (cross.bullishCross) {
      crossScore = 90; crossNote = 'Golden cross — SMA20 crossed above SMA50'
    } else if (cross.bearishCross) {
      crossScore = -90; crossNote = 'Death cross — SMA20 crossed below SMA50'
    } else if (cross.aboveSMA50) {
      crossScore = 30; crossNote = 'Price trend bullish — SMA20 > SMA50'
    } else {
      crossScore = -30; crossNote = 'Price trend bearish — SMA20 < SMA50'
    }
    signals.push({ name: 'SMA Cross', value: `20: ${cross.sma20.toFixed(1)} / 50: ${cross.sma50.toFixed(1)}`, score: crossScore, note: crossNote })
    totalScore += crossScore * 25
    weightSum += 25
  }

  // Price vs SMA50 (weight 15)
  if (cross && prices.length > 0) {
    const lastPrice = prices[prices.length - 1]
    const pctFromSMA = ((lastPrice - cross.sma50) / cross.sma50) * 100
    let momScore = 0
    let momNote = ''
    if (pctFromSMA > 10) {
      momScore = -40; momNote = `${pctFromSMA.toFixed(1)}% above SMA50 — extended`
    } else if (pctFromSMA > 0) {
      momScore = 30; momNote = `${pctFromSMA.toFixed(1)}% above SMA50`
    } else if (pctFromSMA > -10) {
      momScore = -20; momNote = `${Math.abs(pctFromSMA).toFixed(1)}% below SMA50`
    } else {
      momScore = -50; momNote = `${Math.abs(pctFromSMA).toFixed(1)}% below SMA50 — deeply oversold`
    }
    signals.push({ name: 'Momentum', value: `${pctFromSMA >= 0 ? '+' : ''}${pctFromSMA.toFixed(1)}%`, score: momScore, note: momNote })
    totalScore += momScore * 15
    weightSum += 15
  }

  const compositeScore = weightSum > 0 ? totalScore / weightSum : 0
  let action = 'hold'
  if (compositeScore > 25) action = 'buy'
  else if (compositeScore < -25) action = 'sell'

  return { action, score: Math.round(compositeScore), signals }
}
