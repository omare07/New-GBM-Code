import React, { useState } from 'react';
import { User, calculatePnL, calculatePortfolioValue } from '../services/simulation';
import { useSimulation } from '../contexts/SimulationContext';

interface UserPortfolioProps {
  user: User;
}

const UserPortfolio: React.FC<UserPortfolioProps> = ({ user }) => {
  const { currentPrices, executeBuy, executeSell } = useSimulation();
  const [buyTicker, setBuyTicker] = useState<string>('ZOOM');
  const [buyShares, setBuyShares] = useState<number>(0);
  const [sellTicker, setSellTicker] = useState<string>('');
  const [sellShares, setSellShares] = useState<number>(0);
  
  const portfolioValue = calculatePortfolioValue(user.portfolio, currentPrices);
  const pnl = calculatePnL(user, currentPrices);
  const pnlPercent = (pnl / user.initialInvestment) * 100;
  
  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyShares > 0 && buyTicker) {
      executeBuy(user.id, buyTicker, buyShares);
      setBuyShares(0);
    }
  };
  
  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellShares > 0 && sellTicker) {
      executeSell(user.id, sellTicker, sellShares);
      setSellShares(0);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">{user.name}'s Portfolio</h2>
        <div className="text-white text-right">
          <div>Cash: ${user.cash.toFixed(2)}</div>
          <div>Portfolio: ${portfolioValue.toFixed(2)}</div>
          <div>Total: ${(user.cash + portfolioValue).toFixed(2)}</div>
        </div>
      </div>
      
      <div className={`text-lg font-semibold mb-4 ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        P&L: ${pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Holdings</h3>
        {Object.keys(user.portfolio).length === 0 ? (
          <p className="text-gray-400">No holdings yet</p>
        ) : (
          <div className="bg-gray-900 rounded p-2">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left text-gray-400 py-2">Ticker</th>
                  <th className="text-right text-gray-400 py-2">Shares</th>
                  <th className="text-right text-gray-400 py-2">Avg Price</th>
                  <th className="text-right text-gray-400 py-2">Current</th>
                  <th className="text-right text-gray-400 py-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(user.portfolio).map(([ticker, { shares, avgPrice }]) => {
                  const currentPrice = currentPrices[ticker] || 0;
                  const stockValue = shares * currentPrice;
                  const stockPnL = shares * (currentPrice - avgPrice);
                  const stockPnLPct = ((currentPrice - avgPrice) / avgPrice) * 100;
                  
                  return (
                    <tr key={ticker} className="border-b border-gray-800">
                      <td className="py-2 font-medium text-white">{ticker}</td>
                      <td className="py-2 text-right text-white">{shares}</td>
                      <td className="py-2 text-right text-white">${avgPrice.toFixed(2)}</td>
                      <td className="py-2 text-right text-white">${currentPrice.toFixed(2)}</td>
                      <td className={`py-2 text-right ${stockPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${stockPnL.toFixed(2)} ({stockPnLPct.toFixed(2)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Buy Stock</h3>
          <form onSubmit={handleBuy}>
            <div className="mb-2">
              <label className="block text-gray-400 mb-1">Ticker</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                value={buyTicker}
                onChange={(e) => setBuyTicker(e.target.value)}
              >
                {Object.keys(currentPrices).map((ticker) => (
                  <option key={ticker} value={ticker}>
                    {ticker} - ${currentPrices[ticker].toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-gray-400 mb-1">Shares</label>
              <input
                type="number"
                min="0"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                value={buyShares}
                onChange={(e) => setBuyShares(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="mb-2 text-gray-400">
              Cost: ${((buyShares || 0) * (currentPrices[buyTicker] || 0)).toFixed(2)}
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              disabled={buyShares <= 0}
            >
              Buy
            </button>
          </form>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Sell Stock</h3>
          <form onSubmit={handleSell}>
            <div className="mb-2">
              <label className="block text-gray-400 mb-1">Ticker</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                value={sellTicker}
                onChange={(e) => setSellTicker(e.target.value)}
              >
                <option value="">Select a stock</option>
                {Object.entries(user.portfolio).map(([ticker, { shares }]) => (
                  <option key={ticker} value={ticker}>
                    {ticker} - {shares} shares
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-gray-400 mb-1">Shares</label>
              <input
                type="number"
                min="0"
                max={sellTicker ? user.portfolio[sellTicker]?.shares || 0 : 0}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                value={sellShares}
                onChange={(e) => setSellShares(parseInt(e.target.value) || 0)}
                disabled={!sellTicker}
              />
            </div>
            <div className="mb-2 text-gray-400">
              Value: ${((sellShares || 0) * (currentPrices[sellTicker] || 0)).toFixed(2)}
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              disabled={sellShares <= 0 || !sellTicker}
            >
              Sell
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserPortfolio; 