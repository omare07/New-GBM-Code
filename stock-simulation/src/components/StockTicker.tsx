import React from 'react';

interface StockTickerProps {
  tickers: string[];
  prices: { [ticker: string]: number };
  previousPrices: { [ticker: string]: number };
}

const StockTicker: React.FC<StockTickerProps> = ({
  tickers,
  prices,
  previousPrices,
}) => {
  return (
    <div className="flex bg-gray-800 rounded-lg shadow-lg p-2 overflow-x-auto">
      {tickers.map((ticker) => {
        const price = prices[ticker];
        const prevPrice = previousPrices[ticker] || price * 0.98; // Fallback to 2% difference
        
        // Calculate percentage change based on the 5-minute reference price
        let pctChange = 0;
        if (prevPrice !== 0 && prevPrice !== undefined) {
          pctChange = ((price - prevPrice) / prevPrice) * 100;
        }
        
        // Round to 2 decimal places to avoid tiny floating point differences
        const roundedPctChange = Math.round(pctChange * 100) / 100;
        
        // Determine if price is up/down
        const isUp = roundedPctChange >= 0;

        return (
          <div
            key={ticker}
            className="flex-shrink-0 mx-4 py-1 border-r border-gray-700 last:border-r-0"
          >
            <div className="font-bold text-white">{ticker}</div>
            <div className={`text-sm ${isUp ? 'text-green-500' : 'text-red-500'}`}>
              ${price.toFixed(2)}{' '}
              <span className="ml-1">
                {isUp ? '▲' : '▼'} {Math.abs(roundedPctChange).toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StockTicker; 