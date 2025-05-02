import React from 'react';

interface SimulationControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  currentMinute: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  isPaused,
  currentMinute,
  onStart,
  onPause,
  onResume,
  onReset,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col md:flex-row justify-between items-center">
      <div className="text-xl font-bold text-white mb-4 md:mb-0">
        Simulation Time: {currentMinute} min
      </div>
      
      <div className="flex space-x-2">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Start
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Resume
          </button>
        ) : (
          <button
            onClick={onPause}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            Pause
          </button>
        )}
        
        <button
          onClick={onReset}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          disabled={!isRunning && currentMinute === 0}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default SimulationControls; 