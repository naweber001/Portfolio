import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/positions', label: 'Positions', icon: '💼' },
  { to: '/recommendations', label: 'Recommendations', icon: '🎯' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect width="32" height="32" rx="6" fill="var(--accent)" />
              <polyline
                points="6,22 12,14 18,18 26,8"
                fill="none"
                stroke="#0f0f1a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="brand-text">TradeView</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
