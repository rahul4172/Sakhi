import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard';

function App() {
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId'));

  const handleLogout = () => {
    localStorage.removeItem('sessionId');
    setSessionId(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-surface-50 font-sans">
        {!sessionId ? (
          <ProfileForm onComplete={(id) => {
            localStorage.setItem('sessionId', id);
            setSessionId(id);
          }} />
        ) : (
          <Dashboard sessionId={sessionId} onLogout={handleLogout} />
        )}
      </div>
    </Router>
  );
}

export default App;
