import React from 'react';
import { SimulationProvider } from './contexts/SimulationContext';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <SimulationProvider>
      <Dashboard />
    </SimulationProvider>
  );
}

export default App;
