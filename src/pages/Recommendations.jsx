import { useState, useEffect } from 'react'
import {
  loadPositions,
  fetchQuotes,
  getApiKey,
  getDataSource,
  formatCurrency,
} from '../utils/helpers'
import { fetchAllHistorical, fetchAllAnalystData, fetchYahooQuotes } from '../utils/marketData'
import { generateSignal } from '../utils/technicals'
import './Recommendations.css'

const ACTION_CONFIG = {
  buy:  { label: 'Buy',  className: 'action-buy' },
  sell: { label: 'Sell', className: 'action-sell' },
  hold: { label: 'Hold', className: 'action-hold' },
}

export default function Recommendations() {
  const [recs, setRecs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSymbol, setExpandedSymbol] = useState(null)

  useEffect(() => {
    async function loadData() {
      const saved = loadPositions()
      const positions = saved || []
      if (positions.length === 0) {
        setLoading(false)
        return
      }
      const symbols = positions.map((p) => p.symbol)
      const apiKey = getApiKey()
      const source = getDataSource()

      try {
        // Fetch historical prices from Yahoo (always, for technical analysis)
        const historical = await fetchAllHistorical(symbols, '6mo')

        // Fetch live quotes based on preferred source
        let quotes = {}
        let analystData = {}
        if (source === 'finnhub' && apiKey) {
          ;[quotes, analystData] = await Promise.all([
            fetchQuotes(symbols, apiKey),
            fetchAllAnalystData(symbols, apiKey),
          ])
        } else {
          quotes = await fetchYahooQuotes(symbols)
          // Still fetch analyst data from Finnhub if key available
          if (apiKey) {
            analystData = await fetchAllAnalystData(symbols, apiKey)
          }
        }

        // Build recommendations from combined data
        const results = positions.map((pos) => {
          const prices = historical[pos.symbol]
          const quote = quotes[pos.symbol]
          const analyst = analystData[pos.symbol]
          const currentPrice = quote?.current || (prices ? prices[prices.length - 1] : null)

          // Technical analysis
          let technical = null
          if (prices && prices.length >= 50) {
            technical = generateSignal(prices)
          }

          // Analyst data
          const target = analyst?.target || null
          const analystRec = analyst?.rec || null

          // Composite action: weight technical 50%, analyst 50%
          let finalAction = technical?.action || 'hold'
          let rationale = ''

          if (technical && target && currentPrice) {
            const analystUpside = ((target.targetMean - currentPrice) / currentPrice) * 100
            let analystAction = 'hold'
            if (analystUpside > 10) analystAction = 'buy'
            else if (analystUpside < -10) analystAction = 'sell'

            // Combine
            const actionScores = { buy: 0, hold: 0, sell: 0 }
            actionScores[technical.action] += 50
            actionScores[analystAction] += 50
            finalAction = Object.entries(actionScores).sort((a, b) => b[1] - a[1])[0][0]

            if (technical.action === analystAction) {
              rationale = `Technical and analyst signals agree: ${finalAction.toUpperCase()}.`
            } else {
              rationale = `Technical signal: ${technical.action.toUpperCase()} (score ${technical.score}). Analyst consensus: ${analystAction.toUpperCase()} (target ${formatCurrency(target.targetMean)}).`
            }
          } else if (technical) {
            rationale = `Based on technical analysis (score: ${technical.score}).`
            if (!apiKey) rationale += ' Add Finnhub API key for analyst targets.'
          } else {
            rationale = 'Insufficient historical data for analysis.'
          }

          // Determine conflict flag (only set when both data sources exist)
          const hasConflict = technical && target && currentPrice
            ? (() => {
                const au = ((target.targetMean - currentPrice) / currentPrice) * 100
                let aa = 'hold'
                if (au > 10) aa = 'buy'
                else if (au < -10) aa = 'sell'
                return technical.action !== aa && !(technical.action === 'hold' || aa === 'hold')
              })()
            : false

          return {
            symbol: pos.symbol,
            name: pos.name,
            action: finalAction,
            currentPrice,
            technical,
            target,
            analystRec,
            rationale,
            conflicting: hasConflict,
          }
        })

        setRecs(results)
      } catch (err) {
        setError('Failed to fetch market data. ' + (err.message || ''))
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const filtered = filter === 'all'
    ? recs
    : recs.filter((r) => r.action === filter)

  function toggleExpand(symbol) {
    setExpandedSymbol(expandedSymbol === symbol ? null : symbol)
  }

  return (
    <div className="recs-page">
      <h1 className="page-title">Recommendations</h1>
      <p className="page-subtitle">
        Data-driven signals combining technical analysis (RSI, MACD, SMA) with analyst price targets.
      </p>

      {error && <div className="alert">{error}</div>}

      <div className="filter-bar">
        {['all', 'buy', 'sell', 'hold'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''} ${f !== 'all' ? `filter-${f}` : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="filter-count">
                {recs.filter((r) => r.action === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
          Analyzing your positions...
        </div>
      ) : (
        <div className="recs-grid">
          {filtered.map((rec) => {
            const config = ACTION_CONFIG[rec.action]
            const isExpanded = expandedSymbol === rec.symbol
            const upside = rec.currentPrice && rec.target
              ? ((rec.target.targetMean - rec.currentPrice) / rec.currentPrice) * 100
              : null

            return (
              <div
                key={rec.symbol}
                className={`rec-card ${config.className} ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleExpand(rec.symbol)}
              >
                <div className="rec-header">
                  <div className="rec-symbol-group">
                    <span className="rec-symbol">{rec.symbol}</span>
                    <span className="rec-name">{rec.name}</span>
                  </div>
                  <div className="rec-header-right">
                    {rec.technical && (
                      <span className={`score-badge ${rec.technical.score > 0 ? 'positive' : rec.technical.score < 0 ? 'negative' : 'neutral'}`}>
                        {rec.technical.score > 0 ? '+' : ''}{rec.technical.score}
                      </span>
                    )}
                    <span className={`rec-badge ${config.className}`}>
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="rec-prices">
                  <div className="rec-price-item">
                    <span className="rec-price-label">Current</span>
                    <span className="rec-price-value">
                      {rec.currentPrice ? formatCurrency(rec.currentPrice) : '—'}
                    </span>
                  </div>
                  {rec.target && (
                    <>
                      <div className="rec-price-item">
                        <span className="rec-price-label">Target (Avg)</span>
                        <span className="rec-price-value">
                          {formatCurrency(rec.target.targetMean)}
                        </span>
                      </div>
                      {upside != null && (
                        <div className="rec-price-item">
                          <span className="rec-price-label">Upside</span>
                          <span className={`rec-price-value ${upside >= 0 ? 'positive' : 'negative'}`}>
                            {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <p className="rec-rationale">{rec.rationale}</p>

                {rec.conflicting && (
                  <div className="conflict-flag">
                    <span className="conflict-icon">&#x26A0;</span>
                    <span>Signals Diverge — Technical and analyst indicators point in opposite directions. Exercise caution.</span>
                  </div>
                )}

                {/* Analyst consensus bar */}
                {rec.analystRec && (
                  <div className="analyst-bar-section">
                    <span className="rec-price-label">Analyst Consensus</span>
                    <div className="analyst-bar">
                      {(() => {
                        const { strongBuy = 0, buy = 0, hold = 0, sell = 0, strongSell = 0 } = rec.analystRec
                        const total = strongBuy + buy + hold + sell + strongSell
                        if (total === 0) return null
                        return (
                          <>
                            {strongBuy > 0 && <div className="bar-seg strong-buy" style={{ width: `${(strongBuy / total) * 100}%` }} title={`Strong Buy: ${strongBuy}`} />}
                            {buy > 0 && <div className="bar-seg buy-seg" style={{ width: `${(buy / total) * 100}%` }} title={`Buy: ${buy}`} />}
                            {hold > 0 && <div className="bar-seg hold-seg" style={{ width: `${(hold / total) * 100}%` }} title={`Hold: ${hold}`} />}
                            {sell > 0 && <div className="bar-seg sell-seg" style={{ width: `${(sell / total) * 100}%` }} title={`Sell: ${sell}`} />}
                            {strongSell > 0 && <div className="bar-seg strong-sell" style={{ width: `${(strongSell / total) * 100}%` }} title={`Strong Sell: ${strongSell}`} />}
                          </>
                        )
                      })()}
                    </div>
                    <div className="analyst-legend">
                      <span className="legend-item"><span className="legend-dot strong-buy" />Strong Buy</span>
                      <span className="legend-item"><span className="legend-dot buy-seg" />Buy</span>
                      <span className="legend-item"><span className="legend-dot hold-seg" />Hold</span>
                      <span className="legend-item"><span className="legend-dot sell-seg" />Sell</span>
                    </div>
                  </div>
                )}

                {/* Expanded: technical signal details */}
                {isExpanded && rec.technical && (
                  <div className="signals-detail">
                    <span className="rec-price-label">Technical Signals</span>
                    <div className="signals-list">
                      {rec.technical.signals.map((sig) => (
                        <div key={sig.name} className="signal-row">
                          <div className="signal-info">
                            <span className="signal-name">{sig.name}</span>
                            <span className="signal-value">{sig.value}</span>
                          </div>
                          <div className="signal-bar-container">
                            <div className="signal-bar-track">
                              <div
                                className={`signal-bar-fill ${sig.score > 0 ? 'positive' : sig.score < 0 ? 'negative' : 'neutral'}`}
                                style={{
                                  width: `${Math.abs(sig.score)}%`,
                                  marginLeft: sig.score < 0 ? `${50 - Math.abs(sig.score) / 2}%` : '50%',
                                }}
                              />
                              <div className="signal-bar-center" />
                            </div>
                          </div>
                          <span className="signal-note">{sig.note}</span>
                        </div>
                      ))}
                    </div>
                    {rec.target && (
                      <div className="target-range">
                        <span className="rec-price-label">Analyst Target Range</span>
                        <div className="target-range-bar">
                          <span className="range-low">{formatCurrency(rec.target.targetLow)}</span>
                          <div className="range-track">
                            {rec.currentPrice && (
                              <div
                                className="range-current"
                                style={{
                                  left: `${Math.min(100, Math.max(0, ((rec.currentPrice - rec.target.targetLow) / (rec.target.targetHigh - rec.target.targetLow)) * 100))}%`,
                                }}
                                title={`Current: ${formatCurrency(rec.currentPrice)}`}
                              />
                            )}
                          </div>
                          <span className="range-high">{formatCurrency(rec.target.targetHigh)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {rec.technical && (
                  <div className="expand-hint">
                    {isExpanded ? 'Click to collapse' : 'Click for details'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && recs.length === 0 && (
        <p className="empty">Add positions on the Positions page to get recommendations for your portfolio.</p>
      )}
      {!loading && recs.length > 0 && filtered.length === 0 && (
        <p className="empty">No recommendations match this filter.</p>
      )}
    </div>
  )
}
