# Stock Market Simulation

A modern React application that simulates a stock market with real-time price updates using Geometric Brownian Motion (GBM) model.

## Features

- **Dark-themed UI** built with React, TypeScript, and Tailwind CSS
- **Real-time price updates** using the GBM simulation
- **Candlestick charts** for visualizing stock price movements
- **Multi-user support** with individual portfolios and cash management
- **Live P&L tracking** for all users with a leaderboard
- **Buy and sell stocks** with real-time pricing
- **Simulation controls** to start, pause, resume, and reset the simulation
- **Market events** including volatility changes and price shocks

## Stock Tickers

The simulation includes the following stocks:

- **ZOOM**: Initial price $100, μ = 0.0005, σ = 0.02
- **SLPH**: Initial price $60, μ = 0.0003, σ = 0.015
- **VIST**: Initial price $80, μ = 0.0004, σ = 0.025
- **GRWN**: Initial price $40, μ = 0.0006, σ = 0.03
- **SCAT**: Initial price $120, μ = 0.0004, σ = 0.02

## Market Events

The simulation includes the following pre-configured market events:

- **Minute 30**: SCAT earnings beat (+10%)
- **Minute 45**: ZOOM meme pump (+20%)
- **Minute 60**: VIST bad travel news (-15%)
- **Minute 90**: GRWN green energy subsidy (+18%)

Volatility changes also occur at minutes 30, 45, 60, 90, and 110.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## How to Use

1. **Add Users**: Create one or more users with initial cash amounts
2. **Start Simulation**: Click the "Start" button to begin the simulation
3. **Buy/Sell Stocks**: Select a user and use the buy/sell forms to trade stocks
4. **Track Performance**: Monitor P&L and portfolio value in real-time
5. **Pause/Resume**: Control the simulation using the control buttons
6. **Reset**: Start over with the same users but reset all portfolios

## Implementation Details

- The simulation uses Geometric Brownian Motion to model stock price movements
- Stock prices update once per second in the simulation (equivalent to one minute in the market)
- Candlestick charts show OHLC (Open, High, Low, Close) data for each time step
- User portfolios track cash, holdings, and P&L in real-time

## License

MIT
