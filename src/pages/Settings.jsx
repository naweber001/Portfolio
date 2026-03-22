import { useState } from 'react'
import { getApiKey, setApiKey } from '../utils/helpers'
import './Settings.css'

export default function Settings() {
  const [key, setKey] = useState(getApiKey())
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    setApiKey(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="settings-page">
      <h1 className="page-title">Settings</h1>

      <div className="settings-section">
        <h2 className="section-title">Market Data API</h2>
        <p className="settings-description">
          This app uses <a href="https://finnhub.io" target="_blank" rel="noreferrer">Finnhub</a> for
          live stock prices. Sign up for a free API key to enable real-time data.
        </p>

        <form className="api-form" onSubmit={handleSave}>
          <div className="input-group">
            <label htmlFor="apiKey">Finnhub API Key</label>
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
