import { formatCurrency, formatPercent, formatCompact } from '../utils/helpers'
import './PortfolioSummary.css'

export default function PortfolioSummary({ positions, quotes }) {
  let totalValue = 0
  let totalCost = 0
  let dayChange = 0

  positions.forEach((pos) => {
    const quote = quotes[pos.symbol]
    if (quote) {
      const mv = quote.current * pos.shares
      totalValue += mv
      totalCost += pos.avgCost * pos.shares
      dayChange += (quote.change || 0) * pos.shares
    } else {
      totalValue += pos.avgCost * pos.shares
      totalCost += pos.avgCost * pos.shares
    }
  })

  const totalPnL = totalValue - totalCost
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0
  const dayPct = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0

  const cards = [
    {
      label: 'Portfolio Value',
      value: formatCompact(totalValue),
      detail: `${positions.length} positions`,
      type: 'neutral',
    },
    {
      label: 'Day Change',
      value: formatCurrency(dayChange),
      detail: formatPercent(dayPct),
      type: dayChange >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Total P&L',
      value: formatCurrency(totalPnL),
      detail: formatPercent(totalPnLPct),
      type: totalPnL >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Total Cost Basis',
      value: formatCompact(totalCost),
      detail: 'Invested',
      type: 'neutral',
    },
  ]

  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <div key={card.label} className={`summary-card ${card.type}`}>
          <span className="summary-label">{card.label}</span>
          <span className="summary-value">{card.value}</span>
          <span className={`summary-detail ${card.type}`}>{card.detail}</span>
        </div>
      ))}
    </div>
  )
}
