import { useState } from 'react';
import api from '../services/api';
import { Lock, Mail, User, CheckCircle2, ChevronRight, Loader2, Sparkles } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await api.post('/auth/register', form);
        alert("Success! Please sign in with your new account.");
        setIsRegister(false);
      } else {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        onLoginSuccess(data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Something went wrong. Please try again.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased text-slate-900">
      {/* Container Principal com Efeito de Vidro Sutil */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        
        <div className="p-8">
          {/* Logo / Brand Area */}
          <div className="flex items-center gap-2 mb-8 text-indigo-600">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">ConcurLite</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {isRegister ? 'Join the platform' : 'Welcome back'}
            </h1>
            <p className="text-slate-500 mt-2">
              {isRegister ? 'Start managing your expenses smarter today.' : 'Please enter your details to sign in.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="e.g. Marcelo Santos" 
                    onChange={e => setForm({...form, name: e.target.value})} 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  required
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="name@company.com" 
                  onChange={e => setForm({...form, email: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  required
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••" 
                  onChange={e => setForm({...form, password: e.target.value})} 
                />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 ml-1">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setForm({...form, role: 'EMPLOYEE'})}
                    className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${form.role === 'EMPLOYEE' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    Employee
                  </button>
                  <button 
                    type="button"
                    onClick={() => setForm({...form, role: 'MANAGER'})}
                    className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${form.role === 'MANAGER' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    Manager
                  </button>
                </div>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isRegister ? 'Create Workspace' : 'Sign in'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button" 
              onClick={() => setIsRegister(!isRegister)} 
              className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors inline-flex items-center gap-1"
            >
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              <span className="text-indigo-600 underline underline-offset-4 font-bold">
                {isRegister ? 'Log in' : 'Sign up for free'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer sutil */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">© 2024 ConcurLite. Enterprise Security Standard.</p>
        </div>
      </div>
    </div>
  );
}