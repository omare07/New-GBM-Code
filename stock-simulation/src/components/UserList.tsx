import React from 'react';
import { User, calculatePnL } from '../services/simulation';

interface UserListProps {
  users: User[];
  currentPrices: { [ticker: string]: number };
  onRemoveUser: (id: string) => void;
  onSelectUser: (id: string | null) => void;
  selectedUserId: string | null;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  currentPrices, 
  onRemoveUser, 
  onSelectUser,
  selectedUserId
}) => {
  // Sort users by P&L percentage
  const sortedUsers = [...users].sort((a, b) => {
    const pnlA = calculatePnL(a, currentPrices);
    const pnlB = calculatePnL(b, currentPrices);
    const pnlPctA = (pnlA / a.initialInvestment) * 100;
    const pnlPctB = (pnlB / b.initialInvestment) * 100;
    return pnlPctB - pnlPctA;
  });

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold text-white mb-4">Leaderboard</h2>
      
      {users.length === 0 ? (
        <p className="text-gray-400">No users yet. Add a user to start.</p>
      ) : (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="py-3 px-4 text-left text-gray-400">Rank</th>
                <th className="py-3 px-4 text-left text-gray-400">Name</th>
                <th className="py-3 px-4 text-right text-gray-400">P&L</th>
                <th className="py-3 px-4 text-right text-gray-400">Return %</th>
                <th className="py-3 px-4 text-right text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, index) => {
                const pnl = calculatePnL(user, currentPrices);
                const pnlPercent = (pnl / user.initialInvestment) * 100;
                const isSelected = user.id === selectedUserId;
                
                return (
                  <tr 
                    key={user.id} 
                    className={`border-t border-gray-800 ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'} cursor-pointer`}
                    onClick={() => onSelectUser(user.id)}
                  >
                    <td className="py-3 px-4 text-white">{index + 1}</td>
                    <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                    <td className={`py-3 px-4 text-right ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${pnl.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 text-right ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pnlPercent.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          onRemoveUser(user.id);
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserList; 