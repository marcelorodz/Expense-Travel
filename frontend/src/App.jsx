import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [user, setUser] = useState(null)

  // Persistência simples: Se der F5, tenta recuperar a sessão
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const id = localStorage.getItem('userId');
    if (token && role) {
      setUser({ token, role, email, id });
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) {
    return <Auth onLoginSuccess={(data) => {
      // Salva no localStorage para não perder no refresh
      localStorage.setItem('userId', data.id);
      localStorage.setItem('email', data.email);
      setUser(data);
    }} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App