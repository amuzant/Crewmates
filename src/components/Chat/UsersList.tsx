import React, { useState } from 'react';
import './Chat.css';

interface User {
  id: number;
  displayName: string;
  username: string;
  role: string;
}

const UsersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  // This is a placeholder - you'll need to implement actual user fetching
  const users: User[] = [
    { id: 1, displayName: 'John Doe', username: '@johndoe', role: 'User' },
    // Add more users as needed
  ];

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (userId: number): void => {
    // Implement chat window opening logic here
    console.log('Opening chat with user:', userId);
  };

  return (
    <div className="chat-dropdown">
      <div className="chat-search">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="users-list">
        {filteredUsers.map(user => (
          <div
            key={user.id}
            className="user-item"
            onClick={() => handleUserClick(user.id)}
          >
            <div className="user-info">
              <span className="display-name">{user.displayName}</span>
              <span className="username">{user.username}</span>
              <span className="role">{user.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList; 