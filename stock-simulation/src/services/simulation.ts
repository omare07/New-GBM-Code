import { v4 as uuidv4 } from 'uuid';

// Initial stock data
export const stocks = {
  "ZOOM": { S0: 100, mu: 0.0005, sigma: 0.02 },
  "SLPH": { S0: 60, mu: 0.0003, sigma: 0.015 },
  "VIST": { S0: 80, mu: 0.0004, sigma: 0.025 },
  "GRWN": { S0: 40, mu: 0.0006, sigma: 0.03 },
  "SCAT": { S0: 120, mu: 0.0004, sigma: 0.02 },
};

// Shock events: {minute: {ticker: shock_percentage}}
export const shockEvents = {
  30: { "SCAT": 0.10 },  // SCAT earnings beat +10%
  45: { "ZOOM": 0.20 },  // Meme pump +20%
  60: { "VIST": -0.15 }, // Bad travel news -15%
  90: { "GRWN": 0.18 },  // Green energy subsidy +18%
};

// Volatility adjustments: {minute: new_sigma}
export const volatilityEvents = {
  30: 0.04,
  45: 0.06,
  60: 0.05,
  90: 0.06,
  110: 0.07,
};

export type StockData = {
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
};

export type CandlestickData = {
  x: number; // timestamp
  y: [number, number, number, number]; // [open, high, low, close]
  volume?: number; // trading volume
};

export type User = {
  id: string;
  name: string;
  portfolio: {
    [ticker: string]: {
      shares: number;
      avgPrice: number;
    };
  };
  cash: number;
  initialInvestment: number;
};

// Update price using Geometric Brownian Motion with added mean reversion
export const updatePrice = (prevPrice: number, mu: number, sigma: number, dt: number = 1/488): number => {
  // Adjusted dt for 800ms updates
  
  // Add some mean reversion to prevent prices from drifting too far
  const meanReversionStrength = 0.001;
  
  // Determine the base price as the mean reversion target
  let basePrice = 100; // Default
  
  // Find which stock this price belongs to
  for (const [ticker, params] of Object.entries(stocks)) {
    // If the price is within range of the stock's initial price, use that as base
    if (Math.abs(prevPrice - params.S0) / params.S0 < 0.5) {
      basePrice = params.S0;
      break;
    }
  }
  
  const meanReversionEffect = (basePrice - prevPrice) * meanReversionStrength;
  
  // Calculate the maximum allowed price change to prevent unrealistic jumps
  const maxPriceChangePct = 0.015; // 1.5% max change per step 
  
  // Add the mean reversion effect to the drift term
  const adjustedMu = mu + meanReversionEffect;
  
  // Force minimum price movement to avoid stagnation
  const forcedMovementFactor = 0.002; // Minimum 0.2% change
  
  // Generate a more realistic price movement with trend persistence
  // Use a trend factor to create series of moves in the same direction
  const trendFactor = Math.random(); // Random value to determine trend
  
  let dW;
  if (trendFactor > 0.7) {
    // Strong positive move (30% chance)
    dW = (Math.random() * 0.5 + 0.5) * Math.sqrt(dt);
  } else if (trendFactor < 0.3) {
    // Strong negative move (30% chance)
    dW = -(Math.random() * 0.5 + 0.5) * Math.sqrt(dt);
  } else {
    // Random move with normal distribution (40% chance)
    dW = randomNormal() * Math.sqrt(dt);
  }
  
  // Calculate raw GBM result
  const rawGbm = prevPrice * Math.exp((adjustedMu - 0.5 * sigma**2) * dt + sigma * dW);
  
  // Calculate percentage change
  let pctChange = (rawGbm - prevPrice) / prevPrice;
  
  // Ensure minimum price movement in either direction
  if (Math.abs(pctChange) < forcedMovementFactor) {
    pctChange = Math.sign(pctChange || Math.random() - 0.5) * forcedMovementFactor;
  }
  
  // Limit percentage change to be realistic
  const dynamicMaxChange = maxPriceChangePct * 
    (prevPrice > 100 ? 0.8 : (prevPrice < 50 ? 1.2 : 1.0));
  
  const limitedPctChange = Math.max(
    -dynamicMaxChange, 
    Math.min(dynamicMaxChange, pctChange)
  );
  
  // Apply limited percentage change
  const newPrice = prevPrice * (1 + limitedPctChange);
  
  // Ensure price doesn't go below a minimum threshold
  return Math.max(newPrice, basePrice * 0.05);
};

// Standard normal distribution random variable
const randomNormal = (): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// Calculate portfolio value
export const calculatePortfolioValue = (
  portfolio: User['portfolio'], 
  currentPrices: { [ticker: string]: number }
): number => {
  return Object.entries(portfolio).reduce((total, [ticker, { shares }]) => {
    return total + (shares * (currentPrices[ticker] || 0));
  }, 0);
};

// Calculate P&L
export const calculatePnL = (
  user: User,
  currentPrices: { [ticker: string]: number }
): number => {
  const portfolioValue = calculatePortfolioValue(user.portfolio, currentPrices);
  return portfolioValue + user.cash - user.initialInvestment;
};

// Create a new user
export const createUser = (name: string, initialCash: number = 10000): User => {
  return {
    id: uuidv4(),
    name,
    portfolio: {},
    cash: initialCash,
    initialInvestment: initialCash,
  };
};

// Buy stocks
export const buyStock = (
  user: User,
  ticker: string,
  shares: number,
  currentPrice: number
): User => {
  const totalCost = shares * currentPrice;
  
  if (totalCost > user.cash) {
    throw new Error('Insufficient funds');
  }
  
  const userPortfolio = { ...user.portfolio };
  
  if (userPortfolio[ticker]) {
    const currentShares = userPortfolio[ticker].shares;
    const currentAvgPrice = userPortfolio[ticker].avgPrice;
    const newTotalShares = currentShares + shares;
    const newAvgPrice = (currentShares * currentAvgPrice + shares * currentPrice) / newTotalShares;
    
    userPortfolio[ticker] = {
      shares: newTotalShares,
      avgPrice: newAvgPrice,
    };
  } else {
    userPortfolio[ticker] = {
      shares,
      avgPrice: currentPrice,
    };
  }
  
  return {
    ...user,
    portfolio: userPortfolio,
    cash: user.cash - totalCost,
  };
};

// Sell stocks
export const sellStock = (
  user: User,
  ticker: string,
  shares: number,
  currentPrice: number
): User => {
  if (!user.portfolio[ticker] || user.portfolio[ticker].shares < shares) {
    throw new Error('Insufficient shares');
  }
  
  const userPortfolio = { ...user.portfolio };
  const remainingShares = userPortfolio[ticker].shares - shares;
  
  if (remainingShares === 0) {
    delete userPortfolio[ticker];
  } else {
    userPortfolio[ticker] = {
      ...userPortfolio[ticker],
      shares: remainingShares,
    };
  }
  
  return {
    ...user,
    portfolio: userPortfolio,
    cash: user.cash + (shares * currentPrice),
  };
}; 