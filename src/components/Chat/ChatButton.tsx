import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import UsersList from './UsersList';
import './Chat.css';

const ChatButton: React.FC = () => {
  const [isUsersListVisible, setIsUsersListVisible] = useState<boolean>(false);

  const toggleUsersList = (): void => {
    setIsUsersListVisible(!isUsersListVisible);
  };

  return (
    <div className="chat-container">
      <button className="dashboard-chat-button" onClick={toggleUsersList}>
        <FontAwesomeIcon icon={faComments} />
        Messages
      </button>
      {isUsersListVisible && <UsersList />}
    </div>
  );
};

export default ChatButton; 