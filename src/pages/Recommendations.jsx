import { useState, useEffect } from 'react'
import { recommendations } from '../data/recommendations'
import { fetchQuotes, getApiKey, formatCurrency } from '../utils/helpers'
import './Recommendations.css'

const ACTION_CONFIG = {
  buy:  { label: 'Buy',  className: 'action-buy' },
  sell: { label: 'Sell', className: 'action-sell' },
  hold: { label: 'Hold', className: 'action-hold' },
}

export default function Recommendations() {
  const [quotes, setQuotes] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const apiKey = getApiKey()
    if (!apiKey) return
    fetchQuotes(recommendations.map((r) => r.symbol), apiKey)
      .then(setQuotes)
      .catch(() => {})
  }, [])

  const filtered = filter === 'all'
    ? recommendations
    : recommendations.filter((r) => r.action === filter)

  return (
    <div className="recs-page">
      <h1 className="page-title">Recommendations</h1>

      <div className="filter-bar">
        {['all', 'buy', 'sell', 'hold'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''} ${f !== 'all' ? `filter-${f}` : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="recs-grid">
        {filtered.map((rec) => {
          const config = ACTION_CONFIG[rec.action]
          const q = quotes[rec.symbol]
          const currentPrice = q?.current
          const upside = currentPrice
            ? ((rec.targetPrice - currentPrice) / currentPrice) * 100
            : null

          return (
            <div key={rec.symbol} className={`rec-card ${config.className}`}>
              <div className="rec-header">
                <div className="rec-symbol-group">
                  <span className="rec-symbol">{rec.symbol}</span>
                  <span className="rec-name">{rec.name}</span>
                </div>
                <span className={`rec-badge ${config.className}`}>
                  {config.label}
                </span>
              </div>

              <div className="rec-prices">
                <div className="rec-price-item">
                  <span className="rec-price-label">Current</span>
                  <span className="rec-price-value">
                    {currentPrice ? formatCurrency(currentPrice) : '—'}
                  </span>
                </div>
                <div className="rec-price-item">
                  <span className="rec-price-label">Target</span>
                  <span className="rec-price-value">
                    {formatCurrency(rec.targetPrice)}
                  </span>
                </div>
                {upside != null && (
                  <div className="rec-price-item">
                    <span className="rec-price-label">Upside</span>
                    <span
                      className={`rec-price-value ${upside >= 0 ? 'positive' : 'negative'}`}
                    >
                      {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <p className="rec-rationale">{rec.rationale}</p>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="empty">No recommendations match this filter.</p>
      )}
    </div>
  )
}
