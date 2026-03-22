import { useState } from 'react'
import { getApiKey, setApiKey, getDataSource, setDataSource } from '../utils/helpers'
import './Settings.css'

export default function Settings() {
  const [key, setKey] = useState(getApiKey())
  const [saved, setSaved] = useState(false)
  const [source, setSource] = useState(getDataSource())

  function handleSave(e) {
    e.preventDefault()
    setApiKey(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleSourceChange(value) {
    setSource(value)
    setDataSource(value)
  }

  return (
    <div className="settings-page">
      <h1 className="page-title">Settings</h1>

      <div className="settings-section">
        <h2 className="section-title">Quote Data Source</h2>
        <p className="settings-description">
          Choose where to pull live price quotes from. Both sources provide current price,
          day change, and open/high/low data. Yahoo Finance requires no API key.
          Finnhub provides real-time data but requires a free API key.
        </p>

        <div className="source-toggle">
          <button
            className={`source-btn ${source === 'yahoo' ? 'active' : ''}`}
            onClick={() => handleSourceChange('yahoo')}
          >
            <span className="source-name">Yahoo Finance</span>
            <span className="source-detail">No API key needed</span>
          </button>
          <button
            className={`source-btn ${source === 'finnhub' ? 'active' : ''}`}
            onClick={() => handleSourceChange('finnhub')}
          >
            <span className="source-name">Finnhub</span>
            <span className="source-detail">Real-time, needs API key</span>
          </button>
        </div>

        {source === 'finnhub' && !key && (
          <p className="source-warning">
            Finnhub selected but no API key set. Quotes will fall back to Yahoo Finance until a key is added.
          </p>
        )}

        <p className="help-note" style={{ marginTop: 12 }}>
          Note: Analyst targets and recommendations are always from Finnhub (when API key is available).
          Historical data for technical analysis is always from Yahoo Finance.
        </p>
      </div>

      <div className="settings-section" style={{ marginTop: 20 }}>
        <h2 className="section-title">Finnhub API Key</h2>
        <p className="settings-description">
          Required for Finnhub quotes, analyst price targets, and recommendation data.
          Sign up at <a href="https://finnhub.io" target="_blank" rel="noreferrer">Finnhub</a> for a free key.
        </p>

        <form className="api-form" onSubmit={handleSave}>
          <div className="input-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="password"
              placeholder="Enter your Finnhub API key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            {saved ? 'Saved!' : 'Save Key'}
          </button>
        </form>

        <div className="settings-help">
          <h3>How to get a free API key:</h3>
          <ol>
            <li>Go to <a href="https://finnhub.io/register" target="_blank" rel="noreferrer">finnhub.io/register</a></li>
            <li>Create a free account</li>
            <li>Copy your API key from the dashboard</li>
            <li>Paste it above and click Save</li>
          </ol>
          <p className="help-note">
            The free tier allows 60 API calls/minute, which is plenty for personal use.
            Your key is stored locally in your browser only.
          </p>
        </div>
      </div>
    </div>
  )
}
