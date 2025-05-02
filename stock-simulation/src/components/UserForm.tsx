import React, { useState } from 'react';

interface UserFormProps {
  onAddUser: (name: string, initialCash: number) => void;
}

const UserForm: React.FC<UserFormProps> = ({ onAddUser }) => {
  const [name, setName] = useState('');
  const [initialCash, setInitialCash] = useState(10000);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && initialCash > 0) {
      onAddUser(name.trim(), initialCash);
      setName('');
      setInitialCash(10000);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold text-white mb-4">Add New User</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-400 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
            placeholder="Enter name"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="initialCash" className="block text-gray-400 mb-1">
            Initial Cash
          </label>
          <input
            type="number"
            id="initialCash"
            value={initialCash}
            onChange={(e) => setInitialCash(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
            min="1000"
            step="1000"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add User
        </button>
      </form>
    </div>
  );
};

export default UserForm; 