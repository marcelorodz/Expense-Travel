import { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusCircle, CheckCircle, XCircle, AlertCircle, RefreshCw, LogOut, Wallet } from 'lucide-react';

export default function Dashboard({ user, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'TRAVEL' });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data);
    } catch (err) {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // O user.id vem da resposta do login que salvamos no estado pai
      await api.post('/expenses', { ...form, userId: user.id });
      setForm({ description: '', amount: '', category: 'TRAVEL' });
      fetchExpenses();
    } catch (err) { alert("Submission failed"); }
  };

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/expenses/${action}/${id}`);
      fetchExpenses();
    } catch (err) { alert("Unauthorized or failed action"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <Wallet size={28} /> <span>ExpenseLite</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right border-r pr-4 border-slate-200 hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{user.email}</p>
            <p className="text-[10px] uppercase tracking-widest font-black text-indigo-500">{user.role}</p>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={22} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lógica de Interface: Formulário apenas para quem pode criar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <PlusCircle size={20} className="text-indigo-600" /> New Report
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                     placeholder="Description" value={form.description} required
                     onChange={e => setForm({...form, description: e.target.value})} />
              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                     placeholder="Amount ($)" value={form.amount} required
                     onChange={e => setForm({...form, amount: e.target.value})} />
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="TRAVEL">Travel</option>
                <option value="FOOD">Food</option>
                <option value="ACCOMMODATION">Accommodation</option>
              </select>
              <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                Submit Expense
              </button>
            </form>
          </div>
        </div>

        {/* Listagem Global */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-700">Audit Trail</h2>
            <button onClick={fetchExpenses} className="p-2 hover:bg-white rounded-full transition-all">
              <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} text-slate-400`} />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Expense Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.map(exp => (
                  <tr key={exp.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">{exp.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-md">{exp.category}</span>
                        {exp.auditFlag && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 font-black animate-pulse">
                            <AlertCircle size={12} /> NEEDS AUDIT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        exp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                        exp.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-600">
                      ${parseFloat(exp.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'MANAGER' && exp.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleAction(exp.id, 'approve')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><CheckCircle size={18}/></button>
                          <button onClick={() => handleAction(exp.id, 'reject')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><XCircle size={18}/></button>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs italic">Read Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}