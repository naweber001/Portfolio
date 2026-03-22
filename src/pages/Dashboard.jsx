import { useState, useEffect } from 'react'
import PortfolioSummary from '../components/PortfolioSummary'
import {
  loadPositions,
  fetchQuotes,
  getApiKey,
  getDataSource,
  formatCurrency,
  formatPercent,
  getPnLClass,
} from '../utils/helpers'
import { fetchYahooQuotes } from '../utils/marketData'
import './Dashboard.css'

export default function Dashboard() {
  const [positions, setPositions] = useState([])
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = loadPositions()
    const pos = saved || []
    setPositions(pos)

    if (pos.length === 0) {
      setLoading(false)
      return
    }

    const symbols = pos.map((p) => p.symbol)
    const source = getDataSource()
    const apiKey = getApiKey()

    const fetchFn = source === 'finnhub' && apiKey
      ? fetchQuotes(symbols, apiKey)
      : fetchYahooQuotes(symbols)

    fetchFn
      .then((q) => {
        setQuotes(q)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setError('Failed to fetch quotes.')
      })
  }, [])

  const topMovers = positions
    .map((pos) => {
      const q = quotes[pos.symbol]
      return {
        ...pos,
        change: q?.change || 0,
        changePct: q?.changePercent || 0,
        current: q?.current || pos.avgCost,
      }
    })
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 5)

  const topByValue = positions
    .map((pos) => {
      const q = quotes[pos.symbol]
      const current = q?.current || pos.avgCost
      return { ...pos, marketValue: current * pos.shares }
    })
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 5)

  const totalValue = topByValue.reduce(
    (sum, p) => sum + p.marketValue,
    0
  )

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      {error && <div className="alert">{error}</div>}
      {loading ? (
        <div className="loading">Loading quotes...</div>
      ) : positions.length === 0 ? (
        <div className="empty-state">
          <h2>Welcome to TradeView</h2>
          <p>You don't have any positions yet. Head to the <a href="positions">Positions</a> page to add your first stock, or check out <a href="starter-picks">Starter Picks</a> for blue chip recommendations.</p>
        </div>
      ) : (
        <>
          <PortfolioSummary positions={positions} quotes={quotes} />

          <div className="dashboard-grid">
            <div className="dash-section">
              <h2 className="section-title">Top Movers Today</h2>
              <div className="movers-list">
                {topMovers.map((m) => (
                  <div key={m.symbol} className="mover-row">
                    <div className="mover-info">
                      <span className="mover-symbol">{m.symbol}</span>
                      <span className="mover-price">
                        {formatCurrency(m.current)}
                      </span>
                    </div>
                    <div className={`mover-change ${getPnLClass(m.change)}`}>
                      <span>{formatCurrency(m.change)}</span>
                      <span>{formatPercent(m.changePct)}</span>
                    </div>
                  </div>
                ))}
                {topMovers.length === 0 && (
                  <p className="empty">No data available</p>
                )}
              </div>
            </div>

            <div className="dash-section">
              <h2 className="section-title">Allocation</h2>
              <div className="allocation-list">
                {topByValue.map((p) => {
                  const pct =
                    totalValue > 0 ? (p.marketValue / totalValue) * 100 : 0
                  return (
                    <div key={p.symbol} className="alloc-row">
                      <div className="alloc-info">
                        <span className="alloc-symbol">{p.symbol}</span>
                        <span className="alloc-value">
                          {formatCurrency(p.marketValue)}
                        </span>
                      </div>
                      <div className="alloc-bar-container">
                        <div
                          className="alloc-bar"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="alloc-pct">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
