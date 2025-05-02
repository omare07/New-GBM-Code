import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useSimulation } from '../contexts/SimulationContext';
import StockChart from './StockChart';
import StockTicker from './StockTicker';
import UserPortfolio from './UserPortfolio';
import UserList from './UserList';
import UserForm from './UserForm';
import SimulationControls from './SimulationControls';

const Dashboard: React.FC = () => {
  const {
    isRunning,
    isPaused,
    currentMinute,
    stocksData,
    candlestickData,
    currentPrices,
    users,
    addUser,
    removeUser,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
  } = useSimulation();

  const [previousPrices, setPreviousPrices] = useState<{ [ticker: string]: number }>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Update previous prices for the ticker display
  useEffect(() => {
    if (Object.keys(currentPrices).length > 0) {
      // Initialize previous prices with current prices on first load
      setPreviousPrices(prev => {
        const initialPrices: { [ticker: string]: number } = {};
        
        // Check if we need to initialize previous prices
        if (Object.keys(prev).length === 0) {
          // Set initial previous price to 98% of current for a small initial positive change
          Object.keys(currentPrices).forEach(ticker => {
            initialPrices[ticker] = currentPrices[ticker] * 0.98; // Start with 2% difference
          });
          return initialPrices;
        }
        
        return prev;
      });
    }
  }, []);
  
  // Update previous prices on a regular basis to show trend direction properly
  useEffect(() => {
    // Update previous prices every 5 minutes to properly capture longer-term trends
    if (currentMinute > 0 && Object.keys(currentPrices).length > 0) {
      if (currentMinute % 5 === 0) { // Update every 5 minutes for better trend capture
        setPreviousPrices({...currentPrices});
      }
    }
  }, [currentMinute, currentPrices]);
  
  // Auto-select the first user when available
  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    } else if (users.length === 0) {
      setSelectedUserId(null);
    } else if (selectedUserId && !users.find(u => u.id === selectedUserId)) {
      setSelectedUserId(users[0]?.id || null);
    }
  }, [users, selectedUserId]);

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#F3F4F6',
          },
        }}
      />
      
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Stock Market Simulation</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="mb-6">
          <SimulationControls
            isRunning={isRunning}
            isPaused={isPaused}
            currentMinute={currentMinute}
            onStart={startSimulation}
            onPause={pauseSimulation}
            onResume={resumeSimulation}
            onReset={resetSimulation}
          />
        </div>
        
        <div className="mb-6">
          <StockTicker
            tickers={Object.keys(currentPrices)}
            prices={currentPrices}
            previousPrices={previousPrices}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {Object.keys(candlestickData).map(ticker => (
            <div key={ticker} style={{ height: '400px' }}>
              <StockChart
                ticker={ticker}
                candlestickData={candlestickData[ticker] || []}
              />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {selectedUser && (
              <UserPortfolio user={selectedUser} />
            )}
          </div>
          
          <div className="space-y-6">
            <UserForm onAddUser={addUser} />
            <UserList
              users={users}
              currentPrices={currentPrices}
              onRemoveUser={removeUser}
              onSelectUser={setSelectedUserId}
              selectedUserId={selectedUserId}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 