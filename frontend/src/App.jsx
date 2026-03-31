import { useState } from 'react'
import Auth from './components/Auth'

function App() {
  const [user, setUser] = useState(null)

  // Se não houver usuário logado, mostra a tela de Auth
  if (!user) {
    return <Auth onLoginSuccess={(data) => setUser(data)} />
  }

  // Se houver usuário, mostra o Dashboard (vamos criar em breve)
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold">Welcome, {user.email}!</h1>
      <p className="mt-4">Your role is: {user.role}</p>
      <button 
        onClick={() => { localStorage.clear(); setUser(null); }}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  )
}

export default App