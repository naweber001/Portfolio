import { useState, useEffect } from 'react'
import { starterPicks } from '../data/starterPicks'
import { fetchQuotes, getApiKey, formatCurrency } from '../utils/helpers'
import { fetchAllHistorical } from '../utils/marketData'
import { generateSignal } from '../utils/technicals'
import './StarterPicks.css'

const BUDGET = 1000

export default function StarterPicks() {
  const [picks, setPicks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSymbol, setExpandedSymbol] = useState(null)

  useEffect(() => {
    async function loadData() {
      const symbols = starterPicks.map((p) => p.symbol)
      const apiKey = getApiKey()

      try {
        const historical = await fetchAllHistorical(symbols, '6mo')

        let quotes = {}
        if (apiKey) {
          quotes = await fetchQuotes(symbols, apiKey)
        }

        const results = starterPicks.map((pick) => {
          const prices = historical[pick.symbol]
          const quote = quotes[pick.symbol]
          const currentPrice = quote?.current || (prices ? prices[prices.length - 1] : null)

          let technical = null
          if (prices && prices.length >= 50) {
            technical = generateSignal(prices)
          }

          const sharesAffordable = currentPrice ? Math.floor(BUDGET / currentPrice) : 0
          const totalCost = sharesAffordable * (currentPrice || 0)

          return {
            ...pick,
            currentPrice,
            technical,
            sharesAffordable,
            totalCost,
            changePercent: quote?.changePercent || 0,
          }
        })

        setPicks(results)
      } catch (err) {
        setError('Failed to fetch market data. ' + (err.message || ''))
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const filtered = filter === 'all'
    ? picks
    : picks.filter((p) => p.category.toLowerCase() === filter)

  return (
    <div className="starter-page">
      <h1 className="page-title">Starter Picks</h1>
      <p className="page-subtitle">
        Blue chip stocks and ETFs for building a portfolio with ${BUDGET.toLocaleString()}. Technical signals based on 6 months of price data.
      </p>

      {error && <div className="alert">{error}</div>}

      <div className="filter-bar">
        {['all', 'etf', 'stock'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'etf' ? 'ETFs' : 'Stocks'}
            {f !== 'all' && (
              <span className="filter-count">
                {picks.filter((p) => p.category.toLowerCase() === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
          Analyzing blue chip picks...
        </div>
      ) : (
        <div className="starter-grid">
          {filtered.map((pick) => {
            const action = pick.technical?.action || 'hold'
            const isExpanded = expandedSymbol === pick.symbol

            return (
              <div
                key={pick.symbol}
                className={`starter-card action-${action} ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedSymbol(isExpanded ? null : pick.symbol)}
              >
                <div className="starter-header">
                  <div className="starter-symbol-group">
                    <div className="starter-symbol-row">
                      <span className="starter-symbol">{pick.symbol}</span>
                      <span className="starter-category">{pick.category}</span>
                    </div>
                    <span className="starter-name">{pick.name}</span>
                  </div>
                  <div className="starter-header-right">
                    {pick.technical && (
                      <span className={`score-badge ${pick.technical.score > 0 ? 'positive' : pick.technical.score < 0 ? 'negative' : 'neutral'}`}>
                        {pick.technical.score > 0 ? '+' : ''}{pick.technical.score}
                      </span>
                    )}
                    <span className={`rec-badge action-${action}`}>
                      {action}
                    </span>
                  </div>
                </div>

                <p className="starter-desc">{pick.description}</p>

                <div className="starter-prices">
                  <div className="starter-price-item">
                    <span className="starter-label">Price</span>
                    <span className="starter-value">
                      {pick.currentPrice ? formatCurrency(pick.currentPrice) : '--'}
                    </span>
                  </div>
                  <div className="starter-price-item">
                    <span className="starter-label">Shares for ${BUDGET.toLocaleString()}</span>
                    <span className="starter-value">{pick.sharesAffordable}</span>
                  </div>
                  <div className="starter-price-item">
                    <span className="starter-label">Cost</span>
                    <span className="starter-value">
                      {pick.totalCost ? formatCurrency(pick.totalCost) : '--'}
                    </span>
                  </div>
                </div>

                {isExpanded && pick.technical && (
                  <div className="signals-detail">
                    <span className="starter-label">Technical Signals</span>
                    <div className="signals-list">
                      {pick.technical.signals.map((sig) => (
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
                  </div>
                )}

                {pick.technical && (
                  <div className="expand-hint">
                    {isExpanded ? 'Click to collapse' : 'Click for details'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
