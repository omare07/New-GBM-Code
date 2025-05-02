import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  stocks,
  shockEvents,
  volatilityEvents,
  updatePrice,
  calculatePnL,
  User,
  StockData,
  CandlestickData,
  createUser,
  buyStock,
  sellStock
} from '../services/simulation';

interface SimulationContextType {
  isRunning: boolean;
  isPaused: boolean;
  currentMinute: number;
  stocksData: { [ticker: string]: StockData[] };
  candlestickData: { [ticker: string]: CandlestickData[] };
  currentPrices: { [ticker: string]: number };
  users: User[];
  addUser: (name: string, initialCash?: number) => void;
  removeUser: (id: string) => void;
  executeBuy: (userId: string, ticker: string, shares: number) => void;
  executeSell: (userId: string, ticker: string, shares: number) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

// Helper type for stock parameters
interface StockParams {
  S0: number;
  mu: number;
  sigma: number;
}

// Define the shape of our stock parameters
type StocksType = {
  [ticker: string]: StockParams;
};

// Define the shape of our events
type VolatilityEventsType = {
  [minute: number]: number;
};

type ShockEventsType = {
  [minute: number]: {
    [ticker: string]: number;
  };
};

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [stocksData, setStocksData] = useState<{ [ticker: string]: StockData[] }>({});
  const [candlestickData, setCandlestickData] = useState<{ [ticker: string]: CandlestickData[] }>({});
  const [currentPrices, setCurrentPrices] = useState<{ [ticker: string]: number }>({});
  const [users, setUsers] = useState<User[]>([]);
  
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const currentStockParams = useRef<StocksType>({ ...stocks as StocksType });
  
  // Initialize stock data
  useEffect(() => {
    const initialStocksData: { [ticker: string]: StockData[] } = {};
    const initialCandlestickData: { [ticker: string]: CandlestickData[] } = {};
    const initialPrices: { [ticker: string]: number } = {};
    
    Object.entries(stocks).forEach(([ticker, params]) => {
      const initialPrice = params.S0;
      initialPrices[ticker] = initialPrice;
      
      const initialStockData: StockData = {
        ticker,
        price: initialPrice,
        open: initialPrice,
        high: initialPrice,
        low: initialPrice,
        close: initialPrice,
        timestamp: 0,
      };
      
      initialStocksData[ticker] = [initialStockData];
      
      // Create some initial synthetic candles for better visualization on startup
      const syntheticCandles: CandlestickData[] = [];
      
      // Add 5 synthetic candles with realistic trend-based historical patterns
      let prevPrice = initialPrice;
      // Choose a trend direction for this historical series
      const trendDirection = Math.random() > 0.5 ? 1 : -1;
      // Create a trend strength (stronger trends for more volatile stocks)
      const trendStrength = params.sigma * 1.5;
      // Initial trend bias - starts strong and may weaken
      let currentTrend = trendDirection * trendStrength;
      
      for (let i = -5; i < 0; i++) {
        // Each minute has its own distinct x-axis value to prevent overlap
        const xValue = i;
        
        // Gradually reduce trend strength to simulate reversion
        currentTrend *= 0.9;
        
        // Add trend bias to create directional movement (not just random)
        // Plus small random component to create natural variations
        const trendBias = currentTrend * prevPrice;
        const randomComponent = prevPrice * params.sigma * (Math.random() - 0.5);
        const priceChange = trendBias + randomComponent;
        
        // Calculate close price with trend bias
        const close = prevPrice + priceChange;
        
        // Use the previous close as the new open (realistic candle sequence)
        const open = prevPrice;
        
        // Generate high and low with proper ranges
        // Higher volatility = wider ranges
        const highLowRange = prevPrice * params.sigma;
        // For uptrend candles, emphasize upper wick; for downtrend, emphasize lower
        const highExtraRange = (close > open) ? highLowRange * 1.2 : highLowRange * 0.8;
        const lowExtraRange = (close < open) ? highLowRange * 1.2 : highLowRange * 0.8;
        
        const high = Math.max(open, close) + (Math.random() * highExtraRange);
        const low = Math.min(open, close) - (Math.random() * lowExtraRange);
        
        // Format to 2 decimal places to avoid floating point issues
        const formattedOpen = Number(open.toFixed(2));
        const formattedHigh = Number(high.toFixed(2));
        const formattedLow = Number(low.toFixed(2));
        const formattedClose = Number(close.toFixed(2));
        
        syntheticCandles.push({
          x: xValue, // Ensure unique x values per candle
          y: [
            formattedOpen,
            formattedHigh, 
            formattedLow,
            formattedClose
          ] as [number, number, number, number],
          volume: Math.round(initialPrice * (20 + Math.random() * 20 + (Math.abs(priceChange) / open * 300))) // Volume correlates with movement
        });
        
        // Use this close as the next candle's open
        prevPrice = close;
      }
      
      // Add the initial candle
      initialCandlestickData[ticker] = [
        ...syntheticCandles,
        {
          x: 0, // Current minute is always 0
          y: [prevPrice, prevPrice * 1.005, prevPrice * 0.995, prevPrice * 1.002] as [number, number, number, number],
          volume: Math.round(initialPrice * 30)
        }
      ];
    });
    
    setStocksData(initialStocksData);
    setCandlestickData(initialCandlestickData);
    setCurrentPrices(initialPrices);
  }, []);
  
  const addUser = (name: string, initialCash: number = 10000) => {
    const newUser = createUser(name, initialCash);
    setUsers((prevUsers) => [...prevUsers, newUser]);
    toast.success(`Added user: ${name}`);
  };
  
  const removeUser = (id: string) => {
    setUsers((prevUsers) => prevUsers.filter(user => user.id !== id));
    toast.success('User removed');
  };
  
  const executeBuy = (userId: string, ticker: string, shares: number) => {
    try {
      setUsers((prevUsers) => {
        return prevUsers.map(user => {
          if (user.id === userId) {
            return buyStock(user, ticker, shares, currentPrices[ticker]);
          }
          return user;
        });
      });
      toast.success(`Bought ${shares} shares of ${ticker}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };
  
  const executeSell = (userId: string, ticker: string, shares: number) => {
    try {
      setUsers((prevUsers) => {
        return prevUsers.map(user => {
          if (user.id === userId) {
            return sellStock(user, ticker, shares, currentPrices[ticker]);
          }
          return user;
        });
      });
      toast.success(`Sold ${shares} shares of ${ticker}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };
  
  const updateStockData = () => {
    setCurrentMinute((prevMinute) => {
      const nextMinute = prevMinute + 1;
      
      // Check for volatility events
      const volatilityEvent = (volatilityEvents as VolatilityEventsType)[nextMinute];
      if (volatilityEvent) {
        const newSigma = volatilityEvent;
        Object.keys(currentStockParams.current).forEach((ticker) => {
          if (currentStockParams.current[ticker]) {
            currentStockParams.current[ticker] = {
              ...currentStockParams.current[ticker],
              sigma: newSigma,
            };
          }
        });
        toast.success(`Volatility changed to ${newSigma}`);
      }
      
      // Apply shock events
      const shocks = (shockEvents as ShockEventsType)[nextMinute];
      if (shocks) {
        Object.entries(shocks).forEach(([ticker, pctChange]) => {
          setCurrentPrices((prev) => ({
            ...prev,
            [ticker]: prev[ticker] * (1 + pctChange),
          }));
          toast.success(`${ticker} price changed by ${(pctChange * 100).toFixed(1)}%`);
        });
      }
      
      // Update prices using GBM
      setCurrentPrices((prevPrices) => {
        const newPrices = { ...prevPrices };
        
        Object.entries(currentStockParams.current).forEach(([ticker, params]) => {
          // Apply shocks first if there are any for this minute and ticker
          if (shocks && shocks[ticker]) {
            newPrices[ticker] = prevPrices[ticker] * (1 + shocks[ticker]);
          }
          
          // Then apply GBM
          newPrices[ticker] = updatePrice(
            newPrices[ticker],
            params.mu,
            params.sigma
          );
          
          // Update the high and low of the most recent candle in real-time
          setCandlestickData(prevCandleData => {
            const tickerCandles = prevCandleData[ticker];
            if (tickerCandles && tickerCandles.length > 0) {
              const latestCandle = tickerCandles[tickerCandles.length - 1];
              
              // Create more meaningful high and low that properly reflect price movement
              // Use dynamic noise based on volatility for more realistic wicks
              const volatilityNoise = newPrices[ticker] * params.sigma * 0.5;
              
              // Apply dynamic variation for more realistic candlestick movement
              // Use random multipliers to create varying candle appearances
              const highVariation = Math.random() * volatilityNoise;
              const lowVariation = Math.random() * volatilityNoise;
              
              // Base high and low variations on the current price, not at static positions
              const potentialHigh = newPrices[ticker] + highVariation;
              const potentialLow = newPrices[ticker] - lowVariation;
              
              // Track the highest high and lowest low, with occasional spikes
              // Add occasional 'spike' to simulate market movements
              const spikeChance = Math.random();
              let newHigh = Math.max(latestCandle.y[1], potentialHigh);
              let newLow = Math.min(latestCandle.y[2], potentialLow);
              
              // 5% chance of a high spike, 5% chance of a low spike
              if (spikeChance > 0.95) {
                // High spike - add up to 0.5% extra
                newHigh = Math.max(newHigh, newHigh * (1 + Math.random() * 0.005));
              } else if (spikeChance < 0.05) {
                // Low spike - remove up to 0.5% extra
                newLow = Math.min(newLow, newLow * (1 - Math.random() * 0.005));
              }
              
              // Get the open value (remains fixed during candle period)
              const open = latestCandle.y[0];
              
              // Create more dynamic close price movement
              let adjustedClose = newPrices[ticker];
              
              // 30% chance to amplify the price move for more visible candles
              if (Math.random() < 0.3) {
                // Amplify the move by adding a small random adjustment
                const amplification = open * 0.003 * (Math.random() > 0.5 ? 1 : -1);
                adjustedClose += amplification;
              }
              
              // Ensure minimum difference between open and close for visible body
              const minDifference = open * 0.004; // 0.4% minimum difference
              
              if (Math.abs(adjustedClose - open) < minDifference) {
                // If difference is too small, adjust close to ensure minimum difference
                const direction = Math.random() > 0.5 ? 1 : -1; // Random direction if needed
                adjustedClose = open + (minDifference * direction);
              }

              // Calculate volume based on price volatility with more variation
              const priceChange = Math.abs(adjustedClose - open);
              const priceChangePct = priceChange / open;
              
              // More volatility = more volume with random variations
              const baseVolume = Math.max(500, params.S0 * 40 * (0.8 + Math.random() * 0.4)); 
              const volumeMultiplier = 1 + (priceChangePct * 200) * (0.9 + Math.random() * 0.2);
              const updatedVolume = Math.round(baseVolume * volumeMultiplier);
              
              // Format prices for consistency
              const formattedHigh = Number(newHigh.toFixed(2));
              const formattedLow = Number(newLow.toFixed(2));
              const formattedClose = Number(adjustedClose.toFixed(2));
              
              // Only update if values changed
              if (formattedHigh !== latestCandle.y[1] || formattedLow !== latestCandle.y[2] || formattedClose !== latestCandle.y[3]) {
                const updatedCandles = [...tickerCandles];
                updatedCandles[updatedCandles.length - 1] = {
                  ...latestCandle,
                  y: [
                    open, // open remains unchanged
                    formattedHigh, // update high
                    formattedLow, // update low
                    formattedClose // continuously update close price
                  ] as [number, number, number, number],
                  volume: updatedVolume
                };
                
                return {
                  ...prevCandleData,
                  [ticker]: updatedCandles
                };
              }
            }
            return prevCandleData;
          });
        });
        
        return newPrices;
      });
      
      // Update stock data history
      setStocksData((prevData) => {
        const newData = { ...prevData };
        
        Object.entries(newData).forEach(([ticker, data]) => {
          if (data.length > 0) {
            const lastData = data[data.length - 1];
            const currentPrice = currentPrices[ticker];
            
            // Create new data point
            const newStockData: StockData = {
              ticker,
              price: currentPrice,
              open: lastData.close, // Previous close is the new open
              high: Math.max(lastData.close, currentPrice),
              low: Math.min(lastData.close, currentPrice),
              close: currentPrice,
              timestamp: nextMinute,
            };
            
            newData[ticker] = [...data, newStockData];
          }
        });
        
        return newData;
      });
      
      // Close the previous minute's candle and create a new one
      if (nextMinute > 0 && nextMinute % 1 === 0) { // Every minute (adjust % value for longer candles)
        setCandlestickData((prevData) => {
          const newData = { ...prevData };
          
          Object.entries(newData).forEach(([ticker, candles]) => {
            if (candles.length > 0) {
              const lastCandle = candles[candles.length - 1];
              
              // Get parameters for this stock
              const params = currentStockParams.current[ticker];
              const currentPrice = currentPrices[ticker];
              
              // Calculate a more conservative price range for this candle based on volatility
              const volatilityFactor = params.sigma * 3;
              const priceRange = currentPrice * volatilityFactor;
              
              // Generate realistic high and low that always include the open and close prices
              const open = lastCandle.y[0];
              const close = currentPrice;
              
              // Add more dynamism to the closing price
              // Every so often, make a bigger move between candles
              let adjustedClose = close;
              
              // Randomly (20% chance) create a more significant move (simulating market events)
              if (Math.random() < 0.2) {
                // Generate a larger move (up to 2x standard volatility)
                const bigMoveFactor = (Math.random() - 0.5) * params.sigma * currentPrice * 4;
                adjustedClose = close + bigMoveFactor;
                // Ensure a minimum difference for better visuals
                const minDifference = open * 0.008; // 0.8% minimum for significant candles
                if (Math.abs(adjustedClose - open) < minDifference) {
                  adjustedClose = open + (Math.sign(adjustedClose - open) || (Math.random() > 0.5 ? 1 : -1)) * minDifference;
                }
              } else {
                // Regular candle - ensure enough difference for visible body
                const minDifference = open * 0.005; // 0.5% minimum difference
                if (Math.abs(close - open) < minDifference) {
                  // If difference is too small, adjust close to ensure minimum difference
                  adjustedClose = open > close 
                    ? open - minDifference * (1 + Math.random())
                    : open + minDifference * (1 + Math.random());
                }
              }
              
              // Determine high and low based on open and close with more realistic ranges
              let high, low;
              if (adjustedClose > open) {
                // Upward candle - high should be above close, low below open
                // Use more varied wick lengths to create realistic candles
                high = adjustedClose + (priceRange * (0.05 + Math.random() * 0.15));
                low = open - (priceRange * (0.05 + Math.random() * 0.15));
              } else {
                // Downward candle - high should be above open, low below close
                high = open + (priceRange * (0.05 + Math.random() * 0.15));
                low = adjustedClose - (priceRange * (0.05 + Math.random() * 0.15));
              }
              
              // Ensure high is always highest, low is always lowest
              high = Math.max(high, open, adjustedClose);
              low = Math.min(low, open, adjustedClose);
              
              // Format to 2 decimal places to avoid floating point issues
              const formattedOpen = Number(open.toFixed(2));
              const formattedHigh = Number(high.toFixed(2));
              const formattedLow = Number(low.toFixed(2));
              const formattedClose = Number(adjustedClose.toFixed(2));
              
              // Close the previous candle with updated values
              const updatedLastCandle = {
                ...lastCandle,
                y: [
                  formattedOpen,
                  formattedHigh,
                  formattedLow,
                  formattedClose
                ] as [number, number, number, number]
              };
              
              // Calculate volume - more change = more volume
              const priceChange = Math.abs(formattedClose - formattedOpen);
              const priceChangePct = priceChange / formattedOpen;
              
              // Base volume proportional to stock price & actual volatility
              const baseVolume = Math.max(500, params.S0 * 50);
              const volatilityBoost = 1 + (priceChangePct * 300); // Exaggerate for visual effect
              const volume = Math.round(baseVolume * volatilityBoost);
              
              // Create a new candle for the next minute with a proper x value
              const newCandle: CandlestickData = {
                x: nextMinute, // Ensure unique x value for each candle
                y: [
                  formattedClose, // Open at current price (previous close)
                  formattedClose, // Initialize high/low/close all at the same price
                  formattedClose, // These will be updated during price movements
                  formattedClose
                ] as [number, number, number, number],
                volume: volume
              };
              
              // Update the candles array: preserve all existing candles
              // Important: Replace the last candle with the updated version and add the new one
              // DO NOT use slice(0, -1) as this removes the last candle
              newData[ticker] = [...candles];
              newData[ticker][newData[ticker].length - 1] = updatedLastCandle;
              newData[ticker].push(newCandle);
            }
          });
          
          return newData;
        });
      }
      
      return nextMinute;
    });
  };
  
  const startSimulation = () => {
    if (!isRunning && !isPaused) {
      setIsRunning(true);
      simulationInterval.current = setInterval(updateStockData, 800);
    }
  };
  
  const pauseSimulation = () => {
    if (isRunning && !isPaused && simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
      setIsPaused(true);
    }
  };
  
  const resumeSimulation = () => {
    if (isRunning && isPaused) {
      setIsPaused(false);
      simulationInterval.current = setInterval(updateStockData, 800);
    }
  };
  
  const resetSimulation = () => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    
    setIsRunning(false);
    setIsPaused(false);
    setCurrentMinute(0);
    
    // Reset stock parameters
    currentStockParams.current = { ...stocks as StocksType };
    
    // Reset stock data
    const initialStocksData: { [ticker: string]: StockData[] } = {};
    const initialCandlestickData: { [ticker: string]: CandlestickData[] } = {};
    const initialPrices: { [ticker: string]: number } = {};
    
    Object.entries(stocks).forEach(([ticker, params]) => {
      const initialPrice = params.S0;
      initialPrices[ticker] = initialPrice;
      
      const initialStockData: StockData = {
        ticker,
        price: initialPrice,
        open: initialPrice,
        high: initialPrice,
        low: initialPrice,
        close: initialPrice,
        timestamp: 0,
      };
      
      initialStocksData[ticker] = [initialStockData];
      
      // Create some initial synthetic candles for better visualization on startup
      const syntheticCandles: CandlestickData[] = [];
      
      // Add 5 synthetic candles with realistic trend-based historical patterns
      let prevPrice = initialPrice;
      // Choose a trend direction for this historical series
      const trendDirection = Math.random() > 0.5 ? 1 : -1;
      // Create a trend strength (stronger trends for more volatile stocks)
      const trendStrength = params.sigma * 1.5;
      // Initial trend bias - starts strong and may weaken
      let currentTrend = trendDirection * trendStrength;
      
      for (let i = -5; i < 0; i++) {
        // Each minute has its own distinct x-axis value to prevent overlap
        const xValue = i;
        
        // Gradually reduce trend strength to simulate reversion
        currentTrend *= 0.9;
        
        // Add trend bias to create directional movement (not just random)
        // Plus small random component to create natural variations
        const trendBias = currentTrend * prevPrice;
        const randomComponent = prevPrice * params.sigma * (Math.random() - 0.5);
        const priceChange = trendBias + randomComponent;
        
        // Calculate close price with trend bias
        const close = prevPrice + priceChange;
        
        // Use the previous close as the new open (realistic candle sequence)
        const open = prevPrice;
        
        // Generate high and low with proper ranges
        // Higher volatility = wider ranges
        const highLowRange = prevPrice * params.sigma;
        // For uptrend candles, emphasize upper wick; for downtrend, emphasize lower
        const highExtraRange = (close > open) ? highLowRange * 1.2 : highLowRange * 0.8;
        const lowExtraRange = (close < open) ? highLowRange * 1.2 : highLowRange * 0.8;
        
        const high = Math.max(open, close) + (Math.random() * highExtraRange);
        const low = Math.min(open, close) - (Math.random() * lowExtraRange);
        
        // Format to 2 decimal places to avoid floating point issues
        const formattedOpen = Number(open.toFixed(2));
        const formattedHigh = Number(high.toFixed(2));
        const formattedLow = Number(low.toFixed(2));
        const formattedClose = Number(close.toFixed(2));
        
        syntheticCandles.push({
          x: xValue, // Ensure unique x values per candle
          y: [
            formattedOpen,
            formattedHigh, 
            formattedLow,
            formattedClose
          ] as [number, number, number, number],
          volume: Math.round(initialPrice * (20 + Math.random() * 20 + (Math.abs(priceChange) / open * 300))) // Volume correlates with movement
        });
        
        // Use this close as the next candle's open
        prevPrice = close;
      }
      
      // Add the initial candle
      initialCandlestickData[ticker] = [
        ...syntheticCandles,
        {
          x: 0, // Current minute is always 0
          y: [prevPrice, prevPrice * 1.005, prevPrice * 0.995, prevPrice * 1.002] as [number, number, number, number],
          volume: Math.round(initialPrice * 30)
        }
      ];
    });
    
    setStocksData(initialStocksData);
    setCandlestickData(initialCandlestickData);
    setCurrentPrices(initialPrices);
    
    // Reset users' portfolios
    setUsers((prevUsers) => 
      prevUsers.map(user => ({
        ...user,
        portfolio: {},
        cash: user.initialInvestment,
      }))
    );
    
    toast.success('Simulation reset');
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);
  
  const value = {
    isRunning,
    isPaused,
    currentMinute,
    stocksData,
    candlestickData,
    currentPrices,
    users,
    addUser,
    removeUser,
    executeBuy,
    executeSell,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
  };
  
  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}; 