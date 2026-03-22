# Trading Portfolio

A personal stock trading portfolio app built with React + Vite.

## Features

- **Dashboard** — Portfolio value, day change, total P&L, allocation breakdown, and top movers
- **Positions** — View, add, and remove stock positions with live price data and sortable columns
- **Recommendations** — Buy/sell/hold trade ideas with target prices and rationale
- **Live Prices** — Connects to Finnhub API for real-time stock quotes

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## API Setup

1. Get a free API key from [finnhub.io](https://finnhub.io/register)
2. Go to the Settings page in the app
3. Enter your API key and click Save

The free tier allows 60 calls/minute — plenty for personal use. Your key is stored in your browser's localStorage.

## Tech Stack

- React 18
- Vite
- React Router
- Finnhub API (free tier)
