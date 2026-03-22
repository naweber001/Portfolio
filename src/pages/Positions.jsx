import { useState, useEffect, useCallback } from 'react'
import { samplePositions } from '../data/samplePositions'
import {
  loadPositions,
  savePositions,
  fetchQuotes,
  getApiKey,
  formatCurrency,
  formatPercent,
  formatNumber,
  getPnLClass,
} from '../utils/helpers'
import './Positions.css'

export default function Positions() {
  const [positions, setPositions] = useState([])
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ symbol: '', name: '', shares: '', avgCost: '' })
  const [sortKey, setSortKey] = useState('symbol')
  const [sortDir, setSortDir] = useState('asc')

  const refreshQuotes = useCallback((pos) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setLoading(false)
      return
    }
    fetchQuotes(pos.map((p) => p.symbol), apiKey)
      .then((q) => { setQuotes(q); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const saved = loadPositions()
    const pos = saved || samplePositions
    setPositions(pos)
    if (!saved) savePositions(samplePositions)
    refreshQuotes(pos)
  }, [refreshQuotes])

  function handleAdd(e) {
    e.preventDefault()
    const newPos = {
      symbol: form.symbol.toUpperCase().trim(),
      name: form.name.trim() || form.symbol.toUpperCase().trim(),
      shares: parseFloat(form.shares),
      avgCost: parseFloat(form.avgCost),
    }
    if (!newPos.symbol || isNaN(newPos.shares) || isNaN(newPos.avgCost)) return
    const updated = [...positions, newPos]
    setPositions(updated)
    savePositions(updated)
    setForm({ symbol: '', name: '', shares: '', avgCost: '' })
    setShowForm(false)
    refreshQuotes(updated)
  }

  function handleRemove(symbol) {
    const updated = positions.filter((p) => p.symbol !== symbol)
    setPositions(updated)
    savePositions(updated)
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const enriched = positions.map((pos) => {
    const q = quotes[pos.symbol]
    const current = q?.current || 0
    const marketValue = current * pos.shares
    const costBasis = pos.avgCost * pos.shares
    const pnl = current ? marketValue - costBasis : 0
    const pnlPct = costBasis > 0 && current ? (pnl / costBasis) * 100 : 0
    const dayChange = (q?.change || 0) * pos.shares
    return { ...pos, current, marketValue, costBasis, pnl, pnlPct, dayChange }
  })

  const sorted = [...enriched].sort((a, b) => {
    let aVal = a[sortKey]
    let bVal = b[sortKey]
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const sortArrow = (key) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Positions</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Position'}
        </button>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleAdd}>
          <input
            placeholder="Ticker (e.g. AAPL)"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            required
          />
          <input
            placeholder="Company Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            step="any"
            placeholder="Shares"
            value={form.shares}
            onChange={(e) => setForm({ ...form, shares: e.target.value })}
            required
          />
          <input
            type="number"
            step="any"
            placeholder="Avg Cost"
            value={form.avgCost}
            onChange={(e) => setForm({ ...form, avgCost: e.target.value })}
            required
          />
          <button type="submit" className="btn-primary">Add</button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading positions...</div>
      ) : (
        <div className="table-wrapper">
          <table className="positions-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('symbol')}>Symbol{sortArrow('symbol')}</th>
                <th onClick={() => handleSort('name')}>Name{sortArrow('name')}</th>
                <th onClick={() => handleSort('shares')}>Shares{sortArrow('shares')}</th>
                <th onClick={() => handleSort('avgCost')}>Avg Cost{sortArrow('avgCost')}</th>
                <th onClick={() => handleSort('current')}>Price{sortArrow('current')}</th>
                <th onClick={() => handleSort('marketValue')}>Mkt Value{sortArrow('marketValue')}</th>
                <th onClick={() => handleSort('pnl')}>P&L{sortArrow('pnl')}</th>
                <th onClick={() => handleSort('pnlPct')}>P&L %{sortArrow('pnlPct')}</th>
                <th>Day Chg</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.symbol}>
                  <td className="cell-symbol">{row.symbol}</td>
                  <td className="cell-name">{row.name}</td>
                  <td>{formatNumber(row.shares, 0)}</td>
                  <td>{formatCurrency(row.avgCost)}</td>
                  <td>{row.current ? formatCurrency(row.current) : '—'}</td>
                  <td>{row.current ? formatCurrency(row.marketValue) : '—'}</td>
                  <td className={getPnLClass(row.pnl)}>
                    {row.current ? formatCurrency(row.pnl) : '—'}
                  </td>
                  <td className={getPnLClass(row.pnlPct)}>
                    {row.current ? formatPercent(row.pnlPct) : '—'}
                  </td>
                  <td className={getPnLClass(row.dayChange)}>
                    {row.current ? formatCurrency(row.dayChange) : '—'}
                  </td>
                  <td>
                    <button
                      className="btn-remove"
                      onClick={() => handleRemove(row.symbol)}
                      title="Remove position"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan="10" className="empty">
                    No positions. Click &quot;+ Add Position&quot; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
