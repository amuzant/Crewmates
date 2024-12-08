import Chat from '../Chat/Chat';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Chat />
      {children}
    </div>
  );
};

export default Layout; 