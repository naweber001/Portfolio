import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Positions from './pages/Positions'
import Recommendations from './pages/Recommendations'
import StarterPicks from './pages/StarterPicks'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="positions" element={<Positions />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="starter-picks" element={<StarterPicks />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
